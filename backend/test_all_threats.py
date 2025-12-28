import requests
import time

BASE_URL = "http://localhost:8000"

def check_status():
    try:
        return requests.get(f"{BASE_URL}/api/status").json()
    except:
        return {"locked": False}

def wait_for_unlock():
    status = check_status()
    if status['locked']:
        print(f"System locked. Waiting {status['remaining']}s...")
        time.sleep(status['remaining'] + 2)

def test_attack(attack_type):
    wait_for_unlock()
    print(f"\n--- Testing {attack_type} (High Security) ---")
    
    payload = {
        "attackType": attack_type,
        "targetUser": "sim_user",
        "securityLevel": "HIGH"
    }
    
    res = requests.post(f"{BASE_URL}/api/threat-sim/execute", json=payload)
    print(f"Sim Result: {res.json().get('message')}")
    
    status = check_status()
    if status['locked']:
        print(f"SUCCESS: {attack_type} triggered Global Lock.")
    else:
        print(f"FAILURE: {attack_type} did NOT lock system.")

def run_tests():
    print(f"--- Comprehensive Threat Lock Test at {BASE_URL} ---")
    
    # 1. REPLAY
    test_attack("REPLAY")
    
    # 2. SESSION_HIJACKING
    test_attack("SESSION_HIJACKING")
    
    # 3. INJECTION
    test_attack("INJECTION")

if __name__ == "__main__":
    run_tests()
