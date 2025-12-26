import React, { useState, useRef, useEffect } from 'react';
import BiometricVisualizer from '../components/BiometricVisualizer';
import FingerprintScanner from '../components/FingerprintScanner';
import SystemLockdown from '../components/SystemLockdown';
import { MockBackend } from '../services/mockBackend';
import { User } from '../types';
import { Camera, ScanFace, UserPlus, Fingerprint, ChevronRight, CheckCircle2, ShieldCheck, RefreshCcw, Ban, Timer, Eye, Zap, Scan } from 'lucide-react';

// Helper to decode WebAuthn Credential ID
const base64UrlToUint8Array = (base64Url: string): Uint8Array => {
    const padding = '='.repeat((4 - base64Url.length % 4) % 4);
    const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

const AccessControl: React.FC = () => {
    const [mode, setMode] = useState<'VERIFY' | 'ENROLL' | 'REGISTER'>('VERIFY');
    const [authMethod, setAuthMethod] = useState<'FACE' | 'FINGERPRINT'>('FACE');
    const [username, setUsername] = useState('');
    const [role, setRole] = useState<User['role']>('USER');
    const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'MATCH' | 'NO_MATCH' | 'ERROR'>('IDLE');
    const [message, setMessage] = useState('');
    const [similarity, setSimilarity] = useState<number | undefined>(undefined);
    const [cameraActive, setCameraActive] = useState(false);
    const [authResult, setAuthResult] = useState<{ authorized: boolean, user?: User } | null>(null);

    // Sensor Intelligence State
    const [sensorState, setSensorState] = useState({
        lighting: 'OK', // 'OK' | 'LOW' | 'HIGH'
        movement: 'STABLE', // 'STABLE' | 'HIGH'
        stabilityProgress: 0, // 0-100
        ready: false
    });

    // Impersonation Lockout State
    const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [scanCooldown, setScanCooldown] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
    const analysisIntervalRef = useRef<any>(null);

    // Timer Effect for Lockout
    useEffect(() => {
        let interval: any;
        if (lockoutEndTime) {
            interval = setInterval(() => {
                const remaining = Math.ceil((lockoutEndTime - Date.now()) / 1000);
                if (remaining <= 0) {
                    setLockoutEndTime(null);
                    setTimeRemaining(0);
                    setMessage("Lockout lifted. Verification allowed.");
                    setStatus('IDLE');
                } else {
                    setTimeRemaining(remaining);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [lockoutEndTime]);

    useEffect(() => {
        setAuthResult(null);
        setSimilarity(undefined);
        setStatus('IDLE');
        setMessage('');
        setUsername('');
        setSensorState({ lighting: 'OK', movement: 'STABLE', stabilityProgress: 0, ready: false });

        // Camera Logic only for FACE mode
        if (mode !== 'REGISTER' && authMethod === 'FACE') {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [mode, authMethod]);

    const startCamera = async () => {
        if (mode === 'REGISTER' || authMethod !== 'FACE') return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
            streamRef.current = stream;
            setCameraActive(true);
            startSensorAnalysis();
        } catch (err) {
            setCameraActive(false);
            setStatus('ERROR');
            setMessage("Camera Unavailable");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
        if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    };

    const startSensorAnalysis = () => {
        if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);

        analysisIntervalRef.current = setInterval(() => {
            if (!videoRef.current || !canvasRef.current || !cameraActive) return;

            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;

            const w = 32; // Low res for analysis
            const h = 24;

            ctx.drawImage(videoRef.current, 0, 0, w, h);
            const frame = ctx.getImageData(0, 0, w, h);
            const data = frame.data;

            // 1. Calculate Average Brightness
            let totalLum = 0;
            for (let i = 0; i < data.length; i += 4) {
                totalLum += (data[i] + data[i + 1] + data[i + 2]) / 3;
            }
            const avgLum = totalLum / (w * h);

            let lighting = 'OK';
            if (avgLum < 30) lighting = 'LOW';
            else if (avgLum > 230) lighting = 'HIGH';

            // 2. Calculate Motion (Diff from prev frame)
            let motion = 0;
            if (prevFrameRef.current) {
                for (let i = 0; i < data.length; i += 4) {
                    motion += Math.abs(data[i] - prevFrameRef.current[i]);
                }
                motion = motion / (w * h);
            }
            prevFrameRef.current = new Uint8ClampedArray(data);

            // 3. Update State logic
            setSensorState(prev => {
                let newProgress = prev.stabilityProgress;

                if (motion > 15) {
                    // High motion resets progress
                    newProgress = 0;
                } else if (lighting === 'OK') {
                    // Stable & Lit -> Charge
                    newProgress = Math.min(100, prev.stabilityProgress + 10);
                }

                const ready = newProgress >= 100;

                // Only update if changes are significant to avoid re-render blast
                if (ready !== prev.ready || lighting !== prev.lighting || Math.abs(newProgress - prev.stabilityProgress) > 5) {
                    return {
                        lighting,
                        movement: motion > 15 ? 'HIGH' : 'STABLE',
                        stabilityProgress: newProgress,
                        ready
                    };
                }
                return prev;
            });

        }, 100); // Check every 100ms
    };

    const captureBiometricSignature = (): number[] | null => {
        if (authMethod === 'FINGERPRINT') return null; // Handled by component callback
        if (!videoRef.current || !canvasRef.current || !cameraActive) return null;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return null;

        const video = videoRef.current;
        const outputW = 32;
        const outputH = 32;
        ctx.drawImage(video, video.videoWidth * 0.25, video.videoHeight * 0.25, video.videoWidth * 0.5, video.videoHeight * 0.5, 0, 0, outputW, outputH);
        const data = ctx.getImageData(0, 0, outputW, outputH).data;

        const embedding: number[] = [];
        let totalBrightness = 0;
        for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255.0;
            embedding.push(gray);
            totalBrightness += gray;
        }

        if ((totalBrightness / (outputW * outputH)) < 0.1) return null;
        return embedding;
    };

    const handleAction = async (fingerprintData?: number[]) => {
        if (lockoutEndTime || scanCooldown) return;
        if (!username.trim()) { setStatus('ERROR'); setMessage("Username Required"); return; }

        if (authMethod === 'FACE') {
            if (mode !== 'REGISTER' && !cameraActive) { setStatus('ERROR'); setMessage("Sensor Offline"); return; }
            // SENSOR QUALITY GATE
            if (mode !== 'REGISTER') {
                if (sensorState.lighting === 'LOW') {
                    setMessage("Image too dark. Improve lighting.");
                    MockBackend.logCameraFailure("Poor Lighting", username);
                    triggerCooldown();
                    return;
                }
                if (!sensorState.ready) {
                    setMessage("Subject moving. Hold still.");
                    MockBackend.logCameraFailure("Excessive Movement", username);
                    triggerCooldown();
                    return;
                }
            }
        }

        setStatus('SCANNING');
        setAuthResult(null);
        setMessage(mode === 'VERIFY' ? 'Authenticating...' : 'Processing...');

        try {
            await new Promise(r => setTimeout(r, 600));

            if (mode === 'REGISTER') {
                await MockBackend.registerUser(username, role);
                setStatus('IDLE');
                setMessage(`Identity '${username}' Created`);
            } else if (mode === 'ENROLL') {
                const users = MockBackend.getUsers();
                const user = users.find(u => u.username === username);
                if (!user) throw new Error("User not found");

                if (authMethod === 'FINGERPRINT') {
                    // WEBAUTHN ENROLLMENT
                    setStatus('SCANNING');
                    setMessage("Setup Windows Hello...");

                    try {
                        // Create random challenge buffer
                        const challenge = new Uint8Array(32);
                        window.crypto.getRandomValues(challenge);

                        const credential = await navigator.credentials.create({
                            publicKey: {
                                challenge: challenge,
                                rp: { name: "Access Control System" },
                                user: {
                                    id: new TextEncoder().encode(user.id),
                                    name: user.username,
                                    displayName: user.username
                                },
                                pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
                                authenticatorSelection: {
                                    authenticatorAttachment: "platform",
                                    userVerification: "required",
                                    residentKey: "required"
                                },
                                timeout: 60000,
                                attestation: "direct"
                            }
                        }) as PublicKeyCredential;

                        if (!credential) throw new Error("WebAuthn Setup Cancelled");
                        await MockBackend.registerWebAuthnCredential(user.id, credential.id);
                        setStatus('MATCH');
                        setMessage('Windows Hello Linked');
                    } catch (err: any) {
                        console.error(err);
                        throw new Error("Windows Hello Setup Failed: " + err.message);
                    }
                } else {
                    // FACE ENROLLMENT (Legacy Logic)
                    const sig = captureBiometricSignature();
                    if (!sig) throw new Error("Capture Failed: Sensor Glitch");
                    await MockBackend.enrollUser(user.id, sig, 'FaceID_v4');
                    setStatus('MATCH');
                    setMessage('Biometrics Bound Successfully');
                }
            } else {
                // VERIFICATION
                const users = MockBackend.getUsers();
                const user = users.find(u => u.username === username);
                if (!user) throw new Error("Unknown Identity");

                if (authMethod === 'FINGERPRINT') {
                    // WEBAUTHN AUTHENTICATION
                    if (!user.biometricTemplate?.webAuthnCredentialId) throw new Error("Windows Hello not set up for this user.");

                    setStatus('SCANNING');
                    setMessage("Verify with Windows Hello...");

                    try {
                        const challenge = new Uint8Array(32);
                        window.crypto.getRandomValues(challenge);

                        const assertion = await navigator.credentials.get({
                            publicKey: {
                                challenge: challenge,
                                allowCredentials: [{
                                    id: base64UrlToUint8Array(user.biometricTemplate.webAuthnCredentialId) as any,
                                    type: "public-key",
                                    transports: ["internal"] // Hint for platform authenticator
                                }],
                                userVerification: "required",
                                timeout: 60000
                            }
                        }) as PublicKeyCredential;

                        if (!assertion) throw new Error("Authentication Cancelled");

                        // Pass to backend for "verification"
                        const result = await MockBackend.verifyUser(user.id, [1], undefined, undefined, false, 'FINGERPRINT');
                        handleAuthResult(result, user);

                    } catch (err: any) {
                        console.error(err);
                        // Convert WebAuthn errors to auth failures
                        setStatus('ERROR');
                        setMessage("Windows Hello Error: " + err.message);
                        // Log failed attempt if it was a real mismatch (hard to distinguish in frontend without more logic, assuming cancel/timeout is not a security fail for now, but strict mode might count it)
                    }
                } else {
                    // FACE AUTH (Legacy)
                    const input = captureBiometricSignature() || Array.from({ length: 1024 }, () => Math.random());
                    const result = await MockBackend.verifyUser(user.id, input, undefined, undefined, false, 'FACE');
                    handleAuthResult(result, user);
                }
            }
        } catch (e: any) {
            setStatus('ERROR');
            setMessage(e.message);
        } finally {
            if (mode === 'REGISTER') setTimeout(() => setMessage(''), 3000);
            // Reset sensor readiness after scan
            setSensorState(p => ({ ...p, stabilityProgress: 0, ready: false }));
        }
    };

    const handleAuthResult = (result: any, user: User) => {
        setSimilarity(result.similarityScore);

        if (result.isBlocked && result.retryAfter) {
            setStatus('ERROR');
            setLockoutEndTime(Date.now() + (result.retryAfter * 1000));
            setTimeRemaining(result.retryAfter);
            setAuthResult({ authorized: false });
            setMessage(result.message);
        } else if (result.success) {
            setStatus('MATCH');
            setAuthResult({ authorized: true, user });
            setMessage("Access Granted");
        } else {
            setStatus('NO_MATCH');
            setAuthResult({ authorized: false });
            setMessage("Access Denied");
        }
    };

    const triggerCooldown = () => {
        setScanCooldown(true);
        setTimeout(() => setScanCooldown(false), 2000);
    };

    const getSteps = () => {
        if (mode === 'VERIFY') return ['Identification', 'Biometric Scan', 'Access Decision'];
        if (mode === 'ENROLL') return ['Identity Lookup', `Capture ${authMethod === 'FACE' ? 'Face' : 'Finger'}`, 'Template Binding'];
        return ['User Details', 'Role Assignment', 'Record Creation'];
    };

    const currentStep = () => {
        if (authResult || status === 'MATCH') return 3;
        if (status === 'SCANNING') return 2;
        if (username) return 1;
        return 0;
    };

    return (
        <div className="h-full flex flex-col relative">
            {lockoutEndTime && (
                <SystemLockdown
                    retryAfter={timeRemaining}
                    onUnlock={() => {
                        setLockoutEndTime(null);
                        setTimeRemaining(0);
                        setMessage("Lockout lifted. Verification allowed.");
                        setStatus('IDLE');
                    }}
                />
            )}
            <canvas ref={canvasRef} width="32" height="24" className="hidden" />

            {/* Top Controls */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white text-gray-900 tracking-tight">Access Control</h2>
                    <p className="text-zinc-500 text-sm mt-1">Manage identities and enforce physical security policies.</p>
                </div>

                <div className="dark:bg-zinc-900 bg-white p-1 rounded-lg border dark:border-zinc-800 border-gray-200 flex shadow-sm">
                    {(['VERIFY', 'ENROLL', 'REGISTER'] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`px-6 py-2 rounded-md text-xs font-bold transition-all duration-200 ${mode === m
                                ? 'dark:bg-zinc-100 bg-gray-900 dark:text-zinc-900 text-white shadow-sm'
                                : 'text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'
                                }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">

                {/* LEFT: CONTROL PLANE */}
                <div className="lg:col-span-4 flex flex-col space-y-4">

                    {/* Progress Stepper */}
                    <div className="flex justify-between items-center px-2">
                        {getSteps().map((label, idx) => {
                            const active = idx <= currentStep();
                            return (
                                <div key={label} className="flex flex-col items-center">
                                    <div className={`w-2 h-2 rounded-full mb-1 transition-colors duration-300 ${active ? 'bg-emerald-500' : 'dark:bg-zinc-800 bg-gray-300'}`}></div>
                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${active ? 'dark:text-zinc-300 text-gray-800' : 'text-zinc-500'}`}>{label}</span>
                                </div>
                            )
                        })}
                    </div>

                    {/* Input Card */}
                    <div className={`dark:bg-zinc-900/50 bg-white border ${lockoutEndTime ? 'border-red-500 dark:border-red-800' : 'dark:border-zinc-800 border-gray-200'} rounded-xl p-6 shadow-sm flex flex-col space-y-5 relative overflow-hidden transition-colors`}>

                        {/* Lockout Overlay Removed - Moved to Full Screen Component */}
                        {mode === 'VERIFY' && !lockoutEndTime && (
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600"></div>
                        )}

                        {/* Method Toggle */}
                        {mode !== 'REGISTER' && !lockoutEndTime && (
                            <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                <button
                                    onClick={() => setAuthMethod('FACE')}
                                    className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded text-xs font-bold transition-all ${authMethod === 'FACE' ? 'bg-white dark:bg-zinc-800 shadow-sm text-blue-600' : 'text-zinc-400 hover:text-zinc-600'}`}>
                                    <ScanFace size={14} />
                                    <span>FACE ID</span>
                                </button>
                                <button
                                    onClick={() => setAuthMethod('FINGERPRINT')}
                                    className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded text-xs font-bold transition-all ${authMethod === 'FINGERPRINT' ? 'bg-white dark:bg-zinc-800 shadow-sm text-emerald-600' : 'text-zinc-400 hover:text-zinc-600'}`}>
                                    <Fingerprint size={14} />
                                    <span>TOUCH ID</span>
                                </button>
                            </div>
                        )}

                        <div className={`flex items-center space-x-3 dark:text-zinc-100 text-gray-900 mb-2 ${lockoutEndTime ? 'mt-6' : ''}`}>
                            <div className="p-2 dark:bg-zinc-800 bg-gray-100 rounded-lg">
                                {mode === 'VERIFY' ? (authMethod === 'FACE' ? <ScanFace size={20} className="text-blue-500" /> : <Fingerprint size={20} className="text-emerald-500" />) : mode === 'REGISTER' ? <UserPlus size={20} className="text-indigo-500" /> : <Scan size={20} className="text-zinc-500" />}
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">{mode === 'VERIFY' ? 'Authentication' : mode === 'REGISTER' ? 'New Identity' : 'Enrollment'}</h3>
                                <p className="text-xs text-zinc-500">
                                    {mode === 'VERIFY' ? 'Security Level: Biometric (L1)' : mode === 'REGISTER' ? 'HR / Admin Mode' : 'Template Generation'}
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">Username / Identifier</label>
                            <input
                                value={username}
                                disabled={!!lockoutEndTime}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full dark:bg-zinc-950 bg-gray-50 border dark:border-zinc-700 border-gray-300 rounded-lg px-4 py-3 text-sm dark:text-white text-gray-900 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-400 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="e.g. j_doe"
                            />
                        </div>

                        {/* Sensor Status Indicators */}
                        {mode !== 'REGISTER' && !lockoutEndTime && authMethod === 'FACE' && (
                            <div className="flex space-x-2 text-[10px] uppercase font-bold tracking-wider">
                                <div className={`flex items-center space-x-1 ${sensorState.lighting === 'OK' ? 'text-emerald-500' : 'text-red-500 animate-pulse'}`}>
                                    <Zap size={10} />
                                    <span>{sensorState.lighting === 'OK' ? 'LIGHTING OK' : 'LOW LIGHT'}</span>
                                </div>
                                <div className={`flex items-center space-x-1 ${sensorState.movement === 'STABLE' ? 'text-emerald-500' : 'text-orange-500'}`}>
                                    <Eye size={10} />
                                    <span>{sensorState.movement === 'STABLE' ? 'STABLE' : 'MOVEMENT'}</span>
                                </div>
                            </div>
                        )}

                        {mode === 'REGISTER' && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">Security Clearance</label>
                                <div className="relative">
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as any)}
                                        className="w-full dark:bg-zinc-950 bg-gray-50 border dark:border-zinc-700 border-gray-300 rounded-lg px-4 py-3 text-sm dark:text-white text-gray-900 focus:border-emerald-500 outline-none appearance-none"
                                    >
                                        <option value="USER">Standard User (L1)</option>
                                        <option value="SECURITY_ENGINEER">Security Engineer (L2)</option>
                                        <option value="ADMIN">Administrator (L3)</option>
                                    </select>
                                    <ChevronRight className="absolute right-3 top-3.5 text-zinc-600 rotate-90" size={14} />
                                </div>
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                onClick={() => handleAction()}
                                disabled={status === 'SCANNING' || !!lockoutEndTime || (mode !== 'REGISTER' && authMethod === 'FACE' && !sensorState.ready) || scanCooldown}
                                className={`w-full py-3.5 rounded-lg font-bold text-sm shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center space-x-2 ${lockoutEndTime || scanCooldown ? 'bg-red-900/30 text-red-500 border border-red-900 cursor-not-allowed' :
                                    status === 'SCANNING' ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' :
                                        (mode !== 'REGISTER' && authMethod === 'FACE' && !sensorState.ready) ? 'bg-zinc-800 text-zinc-500 cursor-wait' :
                                            mode === 'VERIFY' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20' :
                                                mode === 'REGISTER' ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20' :
                                                    'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                                    }`}
                            >
                                {status === 'SCANNING' && <Camera className="animate-spin" size={16} />}
                                {lockoutEndTime && <Ban size={16} />}
                                <span>{
                                    lockoutEndTime ? 'LOCKED OUT' :
                                        status === 'SCANNING' ? 'Processing...' :
                                            scanCooldown ? 'COOLDOWN...' :
                                                (authMethod === 'FINGERPRINT' && mode !== 'REGISTER') ? 'USE SCANNER →' :
                                                    (mode !== 'REGISTER' && !sensorState.ready) ? 'ALIGNING SENSOR...' :
                                                        mode === 'VERIFY' ? 'Scan & Verify' :
                                                            mode === 'REGISTER' ? 'Create Record' : 'Capture Face'
                                }</span>
                            </button>
                            {message && (
                                <div className={`mt-3 p-2 rounded text-center text-xs font-mono border ${status === 'ERROR' || message.includes('Hold') || message.includes('dark') ? 'bg-red-900/20 border-red-900/50 text-red-400' : 'dark:bg-zinc-900 bg-gray-50 dark:border-zinc-800 border-gray-200 text-zinc-400'}`}>
                                    {message}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Enterprise Footer Info */}
                    <div className="text-center text-[10px] text-zinc-500 mt-auto">
                        <p>SECURE GATEWAY NODE ID: SG-084-ALPHA</p>
                        <p>ENFORCEMENT: STRICT • LOGGING: ACTIVE</p>
                    </div>
                </div>

                {/* RIGHT: DATA PLANE */}
                <div className="lg:col-span-8 flex flex-col relative h-full min-h-[400px]">

                    {/* Biometric Feed / Result Card */}
                    <div className="relative flex-1 bg-black rounded-xl overflow-hidden border dark:border-zinc-800 border-zinc-200 shadow-2xl">

                        {mode === 'REGISTER' ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 dark:bg-zinc-950 bg-gray-50 transition-colors">
                                <UserPlus size={64} className="mb-4 opacity-50" />
                                <h3 className="text-lg font-medium text-zinc-400">Registration Mode</h3>
                                <p className="text-sm text-zinc-500">Biometric sensors are currently disabled.</p>
                            </div>
                        ) : (
                            authMethod === 'FACE' ? (
                                <>
                                    <video ref={videoRef} autoPlay muted playsInline className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${cameraActive ? 'opacity-60' : 'opacity-0'}`} />
                                    <div className="absolute inset-0 z-10">
                                        <BiometricVisualizer
                                            state={status}
                                            score={similarity}
                                            transparent
                                            stability={sensorState.stabilityProgress}
                                            aligned={sensorState.ready}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 p-8 flex items-center justify-center dark:bg-zinc-950 bg-gray-50">
                                    <FingerprintScanner
                                        state={status}
                                        disabled={!!lockoutEndTime}
                                        onScanComplete={(data) => handleAction(data)}
                                    />
                                </div>
                            )
                        )}

                        {/* AUTHENTICATION RESULT OVERLAY */}
                        {authResult && (
                            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in zoom-in duration-300">
                                <div className={`w-96 dark:bg-zinc-900 bg-white rounded-xl overflow-hidden shadow-2xl border-2 transform transition-all duration-500 ${authResult.authorized ? 'border-emerald-500' : 'border-red-500'}`}>
                                    {/* Card Header */}
                                    <div className={`h-28 flex flex-col items-center justify-center ${authResult.authorized ? 'bg-emerald-600' : 'bg-red-600'}`}>
                                        {authResult.authorized ? <CheckCircle2 size={56} className="text-white drop-shadow-lg" /> : <ShieldCheck size={56} className="text-white drop-shadow-lg" />}
                                        <h3 className="text-2xl font-bold text-white mt-2 tracking-tight">
                                            {authResult.authorized ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                                        </h3>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-8 text-center space-y-4">
                                        {authResult.user ? (
                                            <div>
                                                <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Identity Verified</p>
                                                <p className="text-3xl dark:text-white text-gray-900 font-mono font-bold">{authResult.user.username}</p>
                                                <div className="flex justify-center mt-2">
                                                    <span className="px-3 py-1 dark:bg-zinc-800 bg-gray-100 rounded-full text-xs dark:text-zinc-300 text-gray-700 border dark:border-zinc-700 border-gray-300 font-mono">
                                                        ROLE: {authResult.user.role}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-sm dark:text-zinc-300 text-gray-700 font-bold">Biometric Verification Failed</p>
                                                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                                                    The presented biometric data does not match any enrolled identity with sufficient confidence.
                                                </p>
                                            </div>
                                        )}

                                        {!authResult.authorized && (
                                            <div className="bg-red-900/20 border border-red-900/50 rounded p-3 text-xs text-red-500 font-mono mt-4">
                                                Error Code: 0xBIO_MISMATCH
                                                <br />Confidence Score: {(similarity || 0).toFixed(4)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Action */}
                                    <div className="dark:bg-zinc-950 bg-gray-50 p-4 border-t dark:border-zinc-800 border-gray-200 flex justify-center">
                                        <button onClick={() => { setAuthResult(null); setStatus('IDLE'); }} className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-white flex items-center transition-colors">
                                            <RefreshCcw size={12} className="mr-2" />
                                            RETURN TO SCANNER
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AccessControl;