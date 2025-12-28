import requests
import time

BASE_URL = "http://localhost:8000"

def test_threat_lock():
    print(f"--- Testing Threat Sim Lock Trigger at {BASE_URL} ---")
    
    # 1. Reset/Check Status (wait if locked from previous test)
    status = requests.get(f"{BASE_URL}/api/status").json()
    if status['locked']:
         print("System currently locked. Cannot start sim unless we wait or force reset.")
         # In a real test env we might have a force-unlock endpoint, but here we just wait or restart.
         # For auto-test, just return if locked.
         print("SKIP: System locked.")
         return

    # 2. Execute Threat Sim (Brute Force, High Security)
    print("Executing Brute Force Simulation (HIGH Security)...")
    payload = {
        "attackType": "BRUTE_FORCE",
        "targetUser": "test_user",
        "securityLevel": "HIGH"
    }
    
    res = requests.post(f"{BASE_URL}/api/threat-sim/execute", json=payload)
    print(f"Sim Response: {res.status_code} {res.json()}")

    # 3. Check Status - Should be LOCKED
    status = requests.get(f"{BASE_URL}/api/status").json()
    print(f"Post-Sim Status: {status}")

    if status.get("locked"):
        print("SUCCESS: Simulation triggered Global Lock.")
    else:
        print("FAILURE: Simulation did NOT trigger lock.")

if __name__ == "__main__":
    test_threat_lock()
