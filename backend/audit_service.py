from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel
import uuid

class LogEntry(BaseModel):
    id: str
    timestamp: str # ISO 8601
    severity: str # INFO, WARNING, CRITICAL
    eventType: str # REGISTRATION, ENROLL, VERIFY_SUCCESS, VERIFY_FAIL, ACCESS_DENIED, LIVENESS_FAIL
    username: Optional[str] = None
    sourceIp: str
    details: str

class AuditService:
    def __init__(self):
        self._logs: List[LogEntry] = []

    def log(self, event_type: str, severity: str, details: str, username: Optional[str] = None, source_ip: str = "SYSTEM"):
        """Record a new security event."""
        entry = LogEntry(
            id=str(uuid.uuid4()),
            timestamp=datetime.now().isoformat(),
            severity=severity,
            eventType=event_type,
            username=username,
            sourceIp=source_ip,
            details=details
        )
        self._logs.insert(0, entry) # Prepend for newest first
        # Limit log size for memory safety in this demo
        if len(self._logs) > 1000:
            self._logs.pop()
        
        print(f"[AUDIT] {entry.timestamp} | {severity} | {event_type} | {username} | {details}")
        return entry

    def get_logs(self, limit: int = 100) -> List[LogEntry]:
        """Retrieve recent logs."""
        return self._logs[:limit]

# Singleton instance
audit_logger = AuditService()
