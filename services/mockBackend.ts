import { User, BiometricTemplate, SecurityLog, AuthResponse, AttackType, BiometricMetrics } from '../types';

// --- SECURITY CONFIGURATION ---
const EMBEDDING_SIZE = 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 Minute Window
const MAX_ATTEMPTS_PER_WINDOW = 5; // Strict locking after 5 failures
const TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 Minutes (Short-lived Access Token)

// Anti-Impersonation Config
const IMPERSONATION_THRESHOLD = 3; // Block after 3 failed biometric attempts
const SYSTEM_LOCKDOWN_MS = 60 * 1000; // 60 Second Global System Lockout

// Mutable Global Threshold for Tuning (RBAC Protected)
let GLOBAL_THRESHOLD = 0.94;

// --- STATE ---
let stats = {
  trueAccepts: 0,
  falseRejects: 0,
  trueRejects: 0,
  falseAccepts: 0
};

// Global System Lock State
let globalLockdown = {
  active: false,
  expiresAt: 0,
  triggeredBy: ''
};

// Rate Limiting Store: Map<IP, timestamp[]>
const rateLimitStore = new Map<string, number[]>();

// Impersonation Tracker: Map<Username, { fails: number, blockedUntil: number }>
// Tracks consecutive biometric failures for a specific identity
const impersonationStore = new Map<string, { fails: number, blockedUntil: number }>();

// START EMPTY - Users must be created via the application
let users: User[] = [];

let logs: SecurityLog[] = [];
let capturedPackets: { userId: string, embedding: number[], timestamp: number, nonce: string }[] = [];
let activeSessions: Record<string, { userId: string, ip: string, expires: number, role: string }> = {};

// --- CRYPTOGRAPHIC HELPERS (Simulated) ---

function secureHash(data: number[] | string, salt: string): string {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  const combined = str + salt;

  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

const generateEmbedding = (): number[] => {
  return Array.from({ length: EMBEDDING_SIZE }, () => Math.random() * 2 - 1);
};

const calculateVariance = (vec: number[]): number => {
  const mean = vec.reduce((a, b) => a + b, 0) / vec.length;
  return Math.sqrt(vec.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / vec.length);
};

const calculateSimilarity = (vecA: number[], vecB: number[]): number => {
  if (vecA.length !== vecB.length) return 0;
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
};

// --- SECURITY MIDDLEWARE ---

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempts = rateLimitStore.get(ip) || [];
  const recentAttempts = attempts.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (recentAttempts.length >= MAX_ATTEMPTS_PER_WINDOW) {
    if (recentAttempts.length === MAX_ATTEMPTS_PER_WINDOW) {
      MockBackend.logEvent({
        eventType: 'RATE_LIMIT_EXCEEDED',
        severity: 'WARNING',
        details: `IP ${ip} throttled. Too many authentication attempts.`,
        sourceIp: ip
      });
    }
    rateLimitStore.set(ip, recentAttempts);
    return false;
  }

  recentAttempts.push(now);
  rateLimitStore.set(ip, recentAttempts);
  return true;
}

// Helper to check and enforce Global Lockdown
function checkSystemLock(): { locked: boolean, remaining: number } {
  if (globalLockdown.active) {
    if (Date.now() > globalLockdown.expiresAt) {
      // Auto-release lock
      globalLockdown.active = false;
      globalLockdown.triggeredBy = '';
      MockBackend.logEvent({
        eventType: 'SYSTEM_ALERT',
        severity: 'INFO',
        details: 'System Security Lockdown lifted. Operations resumed.',
        sourceIp: 'SYSTEM'
      });
      return { locked: false, remaining: 0 };
    }
    return { locked: true, remaining: Math.ceil((globalLockdown.expiresAt - Date.now()) / 1000) };
  }
  return { locked: false, remaining: 0 };
}

export const MockBackend = {

  // --- SYSTEM STATUS ---
  getSystemStatus: () => {
    const status = checkSystemLock();
    return status;
  },

  setThreshold: (newThreshold: number) => {
    if (checkSystemLock().locked) return; // Block config changes during lockdown

    if (newThreshold < 0.5) {
      MockBackend.logEvent({
        eventType: 'SYSTEM_ALERT',
        severity: 'CRITICAL',
        details: `Unsafe configuration attempt detected. Threshold ${newThreshold} is too low.`,
        sourceIp: 'ADMIN_CONSOLE',
        username: 'admin_alice'
      });
    }

    GLOBAL_THRESHOLD = newThreshold;
    MockBackend.logEvent({
      eventType: 'CONFIG_CHANGE',
      severity: 'WARNING',
      details: `Biometric Matching Threshold adjusted to ${(newThreshold * 100).toFixed(1)}%`,
      sourceIp: 'ADMIN_CONSOLE',
      username: 'admin_alice'
    });
  },

  getMetrics: (): BiometricMetrics => {
    const validUserAttempts = stats.trueAccepts + stats.falseRejects;
    const imposterAttempts = stats.trueRejects + stats.falseAccepts;

    const frr = validUserAttempts > 0
      ? ((stats.falseRejects / validUserAttempts) * 100).toFixed(2)
      : "0.00";

    const far = imposterAttempts > 0
      ? ((stats.falseAccepts / imposterAttempts) * 100).toFixed(2)
      : "0.00";

    return {
      far,
      frr,
      threshold: GLOBAL_THRESHOLD,
      totalAttempts: validUserAttempts + imposterAttempts,
      falseAccepts: stats.falseAccepts,
      falseRejects: stats.falseRejects
    };
  },

  // --- IDENTITY MANAGEMENT ---

  registerUser: async (username: string, role: User['role']): Promise<User> => {
    if (checkSystemLock().locked) throw new Error("SYSTEM LOCKED: Registration Denied.");

    await new Promise(r => setTimeout(r, 600));
    if (users.find(u => u.username === username)) throw new Error(`Username '${username}' is already taken.`);

    const newUser: User = {
      id: `u_${Date.now()}`,
      username,
      role,
      enrolled: false
    };
    users.push(newUser);
    MockBackend.logEvent({
      eventType: 'SYSTEM_ALERT',
      severity: 'INFO',
      details: `New Identity Registered: ${username} [${role}]`,
      sourceIp: 'INTERNAL_REGISTRY',
      userId: newUser.id,
      username: newUser.username
    });
    return newUser;
  },

  enrollUser: async (userId: string, customEmbedding?: number[], algorithm: 'FaceID_v4' | 'Fingerprint_SHA256' = 'FaceID_v4'): Promise<BiometricTemplate> => {
    if (checkSystemLock().locked) throw new Error("SYSTEM LOCKED: Enrollment Denied.");

    await new Promise(r => setTimeout(r, 800));
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error("User not found");

    const embedding = customEmbedding || generateEmbedding();
    // Only check variance for FaceID, assume Fingerprint (mock) is always valid/handled by UI
    if (algorithm === 'FaceID_v4' && calculateVariance(embedding) < 0.05) throw new Error("Biometric Quality Low: Image too uniform.");

    const salt = Math.random().toString(36).substring(2);
    const hash = secureHash(embedding, salt);

    const template: BiometricTemplate = {
      id: `tmpl_${Date.now()}`,
      userId: user.id,
      algorithm: algorithm,
      embedding: embedding,
      encryptedData: `AES256::${hash.substring(0, 8)}...`,
      dataHash: hash,
      salt: salt,
      createdAt: new Date().toISOString()
    };

    user.biometricTemplate = template;
    user.enrolled = true;
    MockBackend.logEvent({
      eventType: algorithm === 'Fingerprint_SHA256' ? 'FINGERPRINT_ENROLL' : 'ENROLLMENT',
      severity: 'INFO',
      details: `User ${user.username} enrolled with ${algorithm}. Template Hashed & Salted.`,
      sourceIp: '192.168.1.10',
      userId: user.id,
      username: user.username
    });
    return template;
  },

  // --- WEBAUTHN HELPERS ---
  getWebAuthnChallenge: () => {
    return new Uint8Array(32).map(() => Math.floor(Math.random() * 256));
  },

  registerWebAuthnCredential: async (userId: string, credentialId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error("User not found");

    // We treat this as "enrolling" with a special flag
    await MockBackend.enrollUser(userId, [], 'Fingerprint_SHA256');
    if (user.biometricTemplate) {
      user.biometricTemplate.webAuthnCredentialId = credentialId;
    }
  },

  // --- AUTHENTICATION ENGINE ---

  logCameraFailure: (reason: string, username?: string) => {
    MockBackend.logEvent({
      eventType: 'CAMERA_QUALITY_FAILURE',
      severity: 'WARNING',
      details: `Biometric Capture Failed: ${reason}`,
      sourceIp: 'CLIENT_SENSOR',
      username: username
    });
  },

  verifyUser: async (userId: string, inputEmbedding?: number[], thresholdOverride?: number, contextIp = '192.168.1.10', isAttack = false, method: 'FACE' | 'FINGERPRINT' = 'FACE'): Promise<AuthResponse> => {

    // 0. GLOBAL SYSTEM LOCK CHECK
    const lockStatus = checkSystemLock();
    if (lockStatus.locked) {
      return {
        success: false,
        message: `SYSTEM LOCKED. Threat containment active. Retry in ${lockStatus.remaining}s.`,
        similarityScore: 0,
        isBlocked: true,
        retryAfter: lockStatus.remaining
      };
    }

    // 1. RATE LIMIT CHECK
    if (!checkRateLimit(contextIp)) {
      return {
        success: false,
        message: `Too many attempts. Access blocked for ${RATE_LIMIT_WINDOW_MS / 1000}s.`,
        similarityScore: 0
      };
    }

    await new Promise(r => setTimeout(r, 600));

    const user = users.find(u => u.id === userId);
    const threshold = thresholdOverride ?? GLOBAL_THRESHOLD;

    if (!user || !user.biometricTemplate) {
      MockBackend.logEvent({
        eventType: method === 'FINGERPRINT' ? 'FINGERPRINT_AUTH_FAILURE' : 'AUTH_FAILURE',
        severity: 'WARNING',
        details: `Identity Check Failed: ${userId}`,
        sourceIp: contextIp,
        userId: userId
      });
      return { success: false, message: 'Identity not found or not enrolled', similarityScore: 0 };
    }

    // CHECK ALGORITHM MATCH
    const expectedAlgo = method === 'FINGERPRINT' ? 'Fingerprint_SHA256' : 'FaceID_v4';
    if (user.biometricTemplate.algorithm !== expectedAlgo) {
      return { success: false, message: `Biometric Mismatch: User enrolled with ${user.biometricTemplate.algorithm}, tried ${method}`, similarityScore: 0 };
    }

    // WEBAUTHN CHECK
    if (method === 'FINGERPRINT' && user.biometricTemplate.webAuthnCredentialId) {
      // In a real app, we would verify the signature against the public key.
      // For this mock, if the client sends a matching credentialId (simulated by non-empty input), we assume success via browser.
      // We trust the client has successfully completed navigator.credentials.get() if they are calling this.
      if (!inputEmbedding || inputEmbedding.length === 0) {
        return { success: false, message: 'WebAuthn Verification Failed', similarityScore: 0 };
      }
      // Force high score for WebAuthn success
      return MockBackend.finalizeAuth(user, 0.99, contextIp, method, isAttack);
    }

    // 2. LIVENESS CHECK (Skip for Fingerprint in this simulation, or simplify)
    if (!inputEmbedding) return { success: false, message: 'No biometric data', similarityScore: 0 };
    if (method === 'FACE' && calculateVariance(inputEmbedding) < 0.02) {
      MockBackend.logEvent({
        eventType: 'AUTH_FAILURE',
        severity: 'WARNING',
        details: `Spoof Detected: Low variance`,
        sourceIp: contextIp,
        userId: user.id,
        username: user.username
      });
      return { success: false, message: 'Liveness Check Failed', similarityScore: 0 };
    }

    // 3. INTEGRITY CHECK
    const computedHash = secureHash(user.biometricTemplate.embedding, user.biometricTemplate.salt);
    if (computedHash !== user.biometricTemplate.dataHash) {
      MockBackend.logEvent({
        eventType: 'SYSTEM_ALERT',
        severity: 'CRITICAL',
        details: `DATA INTEGRITY VIOLATION: Template for ${user.username} modified externally.`,
        sourceIp: 'SYSTEM_INTERNAL',
        userId: user.id,
        username: user.username
      });
      return { success: false, message: 'CRITICAL: Data Integrity Violation. Account Locked.', similarityScore: 0 };
    }

    // 4. MATCHING ENGINE
    const score = calculateSimilarity(inputEmbedding, user.biometricTemplate.embedding);
    return MockBackend.finalizeAuth(user, score, contextIp, method, isAttack);
  },

  finalizeAuth: (user: User, score: number, contextIp: string, method: string, isAttack: boolean): AuthResponse => {
    const threshold = GLOBAL_THRESHOLD;
    const isMatch = score >= threshold;

    if (isMatch) {
      isAttack ? stats.falseAccepts++ : stats.trueAccepts++;
      impersonationStore.delete(user.username); // Reset fails
    } else {
      isAttack ? stats.trueRejects++ : stats.falseRejects++;

      const record = impersonationStore.get(user.username) || { fails: 0, blockedUntil: 0 };
      const newFails = record.fails + 1;

      impersonationStore.set(user.username, { fails: newFails, blockedUntil: 0 });

      // STRICT GLOBAL LOCKOUT TRIGGER
      if (newFails >= IMPERSONATION_THRESHOLD) {
        // ACTIVATE GLOBAL LOCKDOWN
        globalLockdown.active = true;
        globalLockdown.expiresAt = Date.now() + SYSTEM_LOCKDOWN_MS;
        globalLockdown.triggeredBy = user.username;

        MockBackend.logEvent({
          eventType: 'SYSTEM_SECURITY_LOCKDOWN',
          severity: 'CRITICAL',
          details: `GLOBAL LOCKDOWN TRIGGERED: Identity '${user.username}' failed ${newFails} consecutive checks (${method}). Suspected impersonation attack. System frozen for ${SYSTEM_LOCKDOWN_MS / 1000}s.`,
          sourceIp: contextIp,
          userId: user.id,
          username: user.username,
          metadata: { score, fails: newFails }
        });

        return {
          success: false,
          message: 'CRITICAL SECURITY ALERT: System Locked.',
          similarityScore: score,
          isBlocked: true,
          retryAfter: SYSTEM_LOCKDOWN_MS / 1000
        };
      }
    }

    if (isMatch) {
      const accessToken = `jwt_access_${Date.now()}_${Math.random().toString(36).substr(2)}`;
      const refreshToken = `jwt_refresh_${Date.now()}_${Math.random().toString(36).substr(2)}`;

      activeSessions[accessToken] = {
        userId: user.id,
        ip: contextIp,
        expires: Date.now() + TOKEN_EXPIRY_MS,
        role: user.role
      };

      MockBackend.logEvent({
        eventType: method === 'FINGERPRINT' ? 'FINGERPRINT_AUTH_SUCCESS' : 'AUTH_SUCCESS',
        severity: 'INFO',
        details: `Access Granted: ${user.username} [${method}] (Score: ${score.toFixed(4)})`,
        sourceIp: contextIp,
        userId: user.id,
        username: user.username
      });

      return {
        success: true,
        message: 'Identity Verified',
        similarityScore: score,
        accessToken,
        refreshToken,
        expiresIn: TOKEN_EXPIRY_MS / 1000
      };
    } else {
      MockBackend.logEvent({
        eventType: method === 'FINGERPRINT' ? 'FINGERPRINT_AUTH_FAILURE' : 'AUTH_FAILURE',
        severity: 'WARNING',
        details: `Biometric Mismatch [${method}]: ${user.username} (Score: ${score.toFixed(4)})`,
        sourceIp: contextIp,
        userId: user.id,
        username: user.username
      });
      return { success: false, message: 'Identity Verification Failed', similarityScore: score };
    }
  },

  // --- ATTACK & DEBUG TOOLS ---

  rotateToken: (refreshToken: string) => {
    return "new_access_token_" + Date.now();
  },

  captureTraffic: (userId: string, embedding: number[]) => {
    capturedPackets.push({
      userId,
      embedding,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(7)
    });
    return capturedPackets.length;
  },

  simulateAttack: async (type: AttackType, targetUserId: string, params: any = {}): Promise<any> => {
    // Check Global Lock
    if (checkSystemLock().locked) {
      return { success: false, message: "ATTACK BLOCKED: System in Lockdown." };
    }

    await new Promise(r => setTimeout(r, 1200));
    const user = users.find(u => u.id === targetUserId);
    const attackerIp = '10.0.66.6';

    switch (type) {
      case AttackType.REPLAY:
        if (capturedPackets.length === 0) return { success: false, message: "No packets captured." };
        const packet = capturedPackets[capturedPackets.length - 1];

        if (params.securityLevel === 'HIGH') {
          const age = Date.now() - packet.timestamp;
          if (age > 5000) {
            MockBackend.logEvent({
              eventType: 'ATTACK_DETECTED',
              severity: 'CRITICAL',
              details: `REPLAY BLOCKED: Stale Packet (Age: ${age}ms).`,
              sourceIp: attackerIp,
              userId: targetUserId,
              username: user?.username
            });
            return { success: false, message: "Replay Detected: Timestamp expired." };
          }
        }
        return await MockBackend.verifyUser(targetUserId, packet.embedding, undefined, attackerIp, true);

      case AttackType.TAMPERING:
        if (!user || !user.biometricTemplate) return { success: false, message: "No template." };
        const originalHash = user.biometricTemplate.dataHash;
        user.biometricTemplate.dataHash = "0xCORRUPTED_HASH";

        const res = await MockBackend.verifyUser(targetUserId, user.biometricTemplate.embedding, undefined, attackerIp, true);

        setTimeout(() => { if (user.biometricTemplate) user.biometricTemplate.dataHash = originalHash; }, 5000);
        return res;

      case AttackType.BRUTE_FORCE:
        let maxScore = 0;
        for (let i = 0; i < 20; i++) {
          const result = await MockBackend.verifyUser(targetUserId, generateEmbedding(), 0.98, attackerIp, true);
          if (result.isBlocked) return { success: false, message: "Brute Force Halted: System Lockdown." };

          if (!result.success && result.message.includes('Too many attempts')) {
            return { success: false, message: "Brute Force Throttled (Rate Limit Active)" };
          }

          if (result.success) return { success: true, message: "Brute Force SUCCESS" };
          if ((result.similarityScore || 0) > maxScore) maxScore = result.similarityScore || 0;
        }
        return { success: false, message: `Brute Force Failed. Best Score: ${maxScore.toFixed(4)}` };

      case AttackType.UNAUTHORIZED_ENROLLMENT:
        if (params.securityLevel === 'HIGH') {
          MockBackend.logEvent({
            eventType: 'ATTACK_DETECTED',
            severity: 'CRITICAL',
            details: `BOLA Exploitation Blocked: Enrollment checks failed.`,
            sourceIp: attackerIp,
            username: 'shadow_admin'
          });
          return { success: false, message: "Enrollment Rejected: Invalid Identity Reference." };
        }
        return { success: true, message: "Vulnerability Exploited: Shadow Admin Enrolled." };

      case AttackType.SESSION_HIJACKING:
        const victimAuth = await MockBackend.verifyUser(targetUserId, user?.biometricTemplate?.embedding);
        if (!victimAuth.accessToken) return { success: false, message: "Could not establish victim session." };

        const stolenToken = victimAuth.accessToken;
        const attackerContextIp = "203.0.113.55";

        if (params.securityLevel === 'HIGH') {
          const session = activeSessions[stolenToken];
          if (session && session.ip !== attackerContextIp) {
            MockBackend.logEvent({
              eventType: 'ATTACK_DETECTED',
              severity: 'CRITICAL',
              details: `Session Hijacking Blocked: Token bound to ${session.ip}, used by ${attackerContextIp}`,
              sourceIp: attackerContextIp,
              userId: targetUserId,
              username: user?.username
            });
            return { success: false, message: "Token Invalid: IP Mismatch (Geo-binding active)." };
          }
        }
        return { success: true, message: "Session Hijacked! Access granted." };

      case AttackType.THRESHOLD_MANIPULATION:
        if (params.securityLevel === 'HIGH') return { success: false, message: "Config Locked. Write access denied." };
        return await MockBackend.verifyUser(targetUserId, generateEmbedding(), 0.1, attackerIp, true);
    }
    return { success: false, message: "Unknown Attack" };
  },

  logEvent: (log: Omit<SecurityLog, 'id' | 'timestamp'>) => {
    const newLog: SecurityLog = {
      id: `log_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toISOString(),
      ...log
    };
    logs = [newLog, ...logs].slice(0, 100);
  },

  getLogs: () => logs,
  getUsers: () => users,
};