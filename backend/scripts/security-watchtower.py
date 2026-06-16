import os
import sys
import requests
import subprocess
import json

def check_server(name, url):
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            print(f"[OK] {name} is ACTIVE ({url})")
            return True
        else:
            print(f"[WARN] {name} returned {response.status_code}")
            return False
    except Exception as e:
        print(f"[ERROR] {name} is DOWN: {e}")
        return False

def check_env_vars():
    print("\n--- Auditing Environment Variables ---")
    required = ["DATABASE_URL", "SESSION_SECRET", "PORT"]
    missing = []
    for var in required:
        if not os.environ.get(var):
            missing.append(var)
    
    if missing:
        print(f"[ERROR] MISSING CRITICAL VARS: {', '.join(missing)}")
        print("    Note: Deployment will FAIL without these.")
    else:
        print("[OK] All critical environment variables are detected.")

def check_vulnerabilities():
    print("\n--- Scanning Supply Lines (Dependencies) ---")
    try:
        # Using npx pnpm audit for deep scan
        result = subprocess.run(["npx", "pnpm", "audit", "--json"], capture_output=True, text=True, shell=True)
        if result.returncode == 0:
            print("[OK] No known vulnerabilities found in supply lines.")
        else:
            try:
                data = json.loads(result.stdout)
                vulnerabilities = data.get("metadata", {}).get("vulnerabilities", {})
                total = sum(vulnerabilities.values())
                print(f"[ALERT] FOUND {total} VULNERABILITIES!")
                for severity, count in vulnerabilities.items():
                    if count > 0:
                        print(f"    - {severity.upper()}: {count}")
            except:
                print("[WARN] Dependencies are compromised. Manual 'pnpm audit' recommended.")
    except Exception as e:
        print(f"[ERROR] Could not run audit: {e}")

if __name__ == "__main__":
    print("="*50)
    print("GARRISON 360: SECURITY WATCHTOWER")
    print("="*50)
    
    # Check Servers
    api_up = check_server("API Server", "http://localhost:8080/")
    frontend_up = check_server("Frontend", "http://localhost:3002/")
    
    # Check Config
    check_env_vars()
    
    # Check Dependencies
    check_vulnerabilities()
    
    print("\n" + "="*50)
    print("SURVEILLANCE COMPLETE")
    print("="*50)
