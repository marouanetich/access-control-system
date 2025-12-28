from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional, List
import uuid
import time
import numpy as np
from contextlib import asynccontextmanager

from face_service import FaceService, SIMILARITY_THRESHOLD
from audit_service import audit_logger, LogEntry, MetricSummary
from threat_service import threat_service

# --- Models ---
class UserRecord(BaseModel):
    id: str
    username: str
    role: str
    created_at: float
    embedding: Optional[List[float]] = None

class ChallengeResponse(BaseModel):
    nonce: str
    timestamp: float

class AuthResponse(BaseModel):
    authorized: bool
    similarity: float
    message: str
    user: Optional[Dict] = None

class SimulationRequest(BaseModel):
    attackType: str
    targetUser: str
    securityLevel: str

# --- Application State ---
users_db: Dict[str, UserRecord] = {}
nonces_db: Dict[str, float] = {} # nonce -> timestamp

# Initialize Service
face_service = FaceService()

# --- System State (In-Memory) ---
class SystemState:
    def __init__(self):
        self.locked: bool = False
        self.lock_expiry: float = 0
        self.failures: Dict[str, int] = {} # key (username/ip) -> consecutive_failures
        self.LOCK_DURATION = 60 # seconds
        self.FAILURE_THRESHOLD = 3

    def check_lock(self) -> Dict:
        now = time.time()
        if self.locked:
            if now > self.lock_expiry:
                self.reset_lock()
                return {"locked": False, "remaining": 0}
            return {"locked": True, "remaining": int(self.lock_expiry - now)}
        return {"locked": False, "remaining": 0}

    def trigger_lock(self, reason: str, source_ip: str):
        self.locked = True
        self.lock_expiry = time.time() + self.LOCK_DURATION
        audit_logger.log(
            event_type="SYSTEM_LOCKDOWN",
            severity="CRITICAL",
            details=f"GLOBAL SYSTEM LOCK TRIGGERED: {reason}",
            source_ip=source_ip
        )

    def reset_lock(self):
        self.locked = False
        self.lock_expiry = 0
        self.failures.clear()
        audit_logger.log(
            event_type="SYSTEM_UNLOCK",
            severity="INFO",
            details="System security lock expired. Operations resumed.",
            source_ip="SYSTEM"
        )

    def record_failure(self, key: str, source_ip: str):
        if not key: return
        self.failures[key] = self.failures.get(key, 0) + 1
        
        # Log the warning
        audit_logger.log(
            event_type="AUTH_FAILURE_COUNT",
            severity="WARNING",
            details=f"Consecutive failure #{self.failures[key]} for {key}",
            source_ip=source_ip
        )
        
        if self.failures[key] >= self.FAILURE_THRESHOLD:
            self.trigger_lock(
                reason=f"Threshold reached ({self.FAILURE_THRESHOLD} failures) for {key}",
                source_ip=source_ip
            )

    def reset_failure(self, key: str):
        if key in self.failures:
            del self.failures[key]

system_state = SystemState()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting Biometric Access Control Backend...")
    yield
    # Shutdown
    print("Shutting down...")

app = FastAPI(lifespan=lifespan)

# CORS (Allow frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Helpers ---
def cleanup_nonces():
    now = time.time()
    expired = [k for k, v in nonces_db.items() if now - v > 60] # 60s TTL
    for k in expired:
        del nonces_db[k]

def get_client_ip(request: Request) -> str:
    """
    Securely resolve client IP, trusting X-Forwarded-For if behind proxy.
    """
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        # Taking the first IP in the list (standard convention for the original client)
        return x_forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "Unknown"

def check_system_lock():
    status = system_state.check_lock()
    if status["locked"]:
        raise HTTPException(
            status_code=503, 
            detail=f"System Locked. Try again in {status['remaining']}s"
        )

# --- Endpoints ---

@app.get("/api/status")
def get_system_status():
    """Return current global lock status."""
    return system_state.check_lock()

@app.get("/api/logs", response_model=List[LogEntry])
def get_audit_logs():
    return audit_logger.get_logs()

@app.get("/api/users", response_model=List[UserRecord])
def get_users():
    """Fetch all registered users."""
    return list(users_db.values())

@app.post("/api/logs/external")
def log_external_event(entry: LogEntry, request: Request):
    """Allow trusted clients (frontend) to report events (e.g. WebAuthn)."""
    real_ip = get_client_ip(request)
    
    audit_logger.log(
        event_type=entry.eventType,
        severity=entry.severity,
        details=entry.details,
        username=entry.username,
        source_ip=real_ip 
    )
    return {"status": "logged"}

@app.get("/api/metrics", response_model=MetricSummary)
def get_dashboard_metrics():
    """Aggregate security metrics for the dashboard."""
    return audit_logger.get_metric_summary()

@app.post("/api/threat-sim/execute")
def execute_threat_simulation(sim: SimulationRequest, request: Request):
    """
    Execute a backend-driven threat simulation.
    """
    status = system_state.check_lock()
    if status["locked"]:
        return {
            "success": False, 
            "message": f"Simulation Blocked: System Locked ({status['remaining']}s)",
            "attackType": sim.attackType
        }

    client_ip = get_client_ip(request)
    result = threat_service.execute_simulation(
        attack_type=sim.attackType,
        target_user=sim.targetUser,
        security_level=sim.securityLevel,
        source_ip=client_ip
    )
    
    # Integration: Trigger actual system lock if ANY Critical Attack is blocked (High Security)
    # This makes the simulation "real" by imposing consequences.
    if not result['success'] and sim.securityLevel == "HIGH":
         system_state.trigger_lock(f"Adversary Emulation: {sim.attackType} Blocked", client_ip)
        
    return result

@app.get("/health")
def health_check():
    return {"status": "online", "models_loaded": face_service.recognizer_session is not None}

@app.post("/auth/challenge", response_model=ChallengeResponse)
def get_challenge():
    """Generate a cryptographic nonce to prevent replay attacks."""
    check_system_lock()
    
    nonce = str(uuid.uuid4())
    nonces_db[nonce] = time.time()
    cleanup_nonces()
    return {"nonce": nonce, "timestamp": time.time()}

@app.post("/auth/register")
def register_user(request: Request, username: str = Form(...), role: str = Form(...)):
    """Create a new user identity (without biometrics yet)."""
    check_system_lock()

    client_ip = get_client_ip(request)
    # Check duplicate
    for u in users_db.values():
        if u.username == username:
            raise HTTPException(status_code=400, detail="Username already exists")

    user_id = str(uuid.uuid4())
    new_user = UserRecord(id=user_id, username=username, role=role, created_at=time.time())
    users_db[user_id] = new_user
    
    audit_logger.log(
        event_type="REGISTRATION",
        severity="INFO",
        details=f"New identity created: {username} ({role})",
        username=username,
        source_ip=client_ip
    )
    return new_user

@app.post("/auth/enroll")
async def enroll_face(
    request: Request,
    username: str = Form(...), 
    image: UploadFile = File(...)
):
    """
    Enroll a user's face. 
    1. Detect Face
    2. Check Liveness/Quality
    3. Generate Embedding
    4. Store in DB
    """
    check_system_lock()

    user_record = next((u for u in users_db.values() if u.username == username), None)
    if not user_record:
        raise HTTPException(status_code=404, detail="User not found")

    content = await image.read()
    img = face_service.process_image(content)

    # 1. Quality / Liveness
    is_live, msg = face_service.check_liveness(img)
    if not is_live:
        audit_logger.log(
            event_type="LIVENESS_FAIL",
            severity="WARNING",
            details=f"Enrollment rejected: {msg}",
            username=username,
            source_ip=get_client_ip(request)
        )
        raise HTTPException(status_code=400, detail=f"Image Quality Check Failed: {msg}")

    # 2. Embedding
    embedding = face_service.get_embedding(img)
    if embedding is None:
        raise HTTPException(status_code=400, detail="No face detected or confidence too low. Please realign.")
    
    # 3. Storage
    user_record.embedding = embedding.tolist()
    
    audit_logger.log(
        event_type="ENROLL_FACE",
        severity="INFO",
        details="Biometric face template bound to identity",
        username=username,
        source_ip=get_client_ip(request)
    )
    return {"success": True, "message": f"User {username} enrolled successfully."}

@app.post("/auth/verify")
async def verify_face(
    request: Request,
    image: UploadFile = File(...),
    nonce: str = Form(...)
):
    """
    Verify a face against the database.
    1. Validate Nonce (Anti-Replay)
    2. Detect & Embed
    3. 1:N Match (Search all users)
    4. Return result
    """
    # 0. Global Lock Check
    check_system_lock()

    client_ip = get_client_ip(request)

    # 1. Nonce Check
    if nonce not in nonces_db:
        # Replay Attack
        system_state.trigger_lock("Replay Attack Detected", client_ip)
        
        audit_logger.log(
            event_type="REPLAY_ATTACK",
            severity="CRITICAL",
            details="Invalid or expired nonce used",
            source_ip=client_ip
        )
        raise HTTPException(status_code=403, detail="Invalid or expired challenge (Replay Attack Protection)")
    del nonces_db[nonce] # Consume nonce

    content = await image.read()
    img = face_service.process_image(content)

    # 2. Quality Check
    is_live, msg = face_service.check_liveness(img)
    if not is_live:
       audit_logger.log(
           event_type="SPOOF_ATTEMPT",
           severity="WARNING",
           details=f"Liveness check failed during verify: {msg}",
           source_ip=client_ip
       )
       # Count spoof attempts against IP too
       system_state.record_failure(client_ip, client_ip)
       return {"authorized": False, "similarity": 0.0, "message": f"Liveness Check Failed: {msg}"}

    # 3. Embedding
    input_embedding = face_service.get_embedding(img)
    if input_embedding is None:
        return {"authorized": False, "similarity": 0.0, "message": "No face detected"}

    # 4. Matching (1:N)
    best_score = -1.0
    best_user = None

    for user in users_db.values():
        if user.embedding:
            db_embed = np.array(user.embedding)
            score = face_service.compute_similarity(input_embedding, db_embed)
            if score > best_score:
                best_score = score
                best_user = user

    # 5. Decision
    if best_score > SIMILARITY_THRESHOLD and best_user:
        system_state.reset_failure(client_ip) # Success resets the IP counter
        if best_user: system_state.reset_failure(best_user.username)
        
        audit_logger.log(
            event_type="VERIFY_SUCCESS",
            severity="INFO",
            details=f"Access Granted (Score: {best_score:.4f})",
            username=best_user.username,
            source_ip=client_ip
        )
        return {
            "authorized": True,
            "similarity": float(best_score),
            "message": f"Welcome, {best_user.username}",
            "user": {"username": best_user.username, "role": best_user.role}
        }
    else:
        # Match failed. 
        # Track failure against IP to enforce "3 failed attempts" rule strictly.
        system_state.record_failure(client_ip, client_ip)
        
        # Also track against username if we have a suspect (soft match)
        if best_user and best_score > 0.4:
             system_state.record_failure(best_user.username, client_ip)
             
        audit_logger.log(
            event_type="VERIFY_FAIL",
            severity="WARNING",
            details=f"Face mismatch. Best Score: {best_score:.4f} (User: {best_user.username if best_user else 'None'})",
            source_ip=client_ip
        )
        return {
            "authorized": False,
            "similarity": float(best_score),
            "message": "Access Denied: Face not recognized"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
