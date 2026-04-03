#!/usr/bin/env python3
"""
Simple test to verify the specific failing cases
"""

import requests
import json
import time
import hashlib
import secrets

BASE_URL = "https://deez-preview-1.preview.emergentagent.com/api"

def generate_telemetry():
    fingerprint = hashlib.sha256(f"test_browser_{time.time()}".encode()).hexdigest()
    nonce = secrets.token_hex(16)
    timestamp = int(time.time() * 1000)
    cookie = hashlib.sha256(f"test_cookie_{timestamp}".encode()).hexdigest()
    
    return {
        "fp": fingerprint,
        "ts": timestamp,
        "nonce": nonce,
        "ck": cookie
    }

def test_specific_cases():
    print("🔍 Testing specific failing cases...")
    
    # Test 1: Order without telemetry
    try:
        response = requests.post(f"{BASE_URL}/orders/create", 
                               json={"pack_id": "solo", "email": "test@example.com"},
                               headers={'Content-Type': 'application/json'},
                               timeout=10)
        print(f"1. Order without telemetry: {response.status_code} - {response.text[:100]}")
    except Exception as e:
        print(f"1. Order without telemetry: ERROR - {e}")
    
    # Test 2: Admin wrong password
    try:
        payload = {
            "email": "admin@deezlink.com", 
            "password": "wrongpassword",
            "_t": generate_telemetry()
        }
        response = requests.post(f"{BASE_URL}/auth/login", 
                               json=payload,
                               headers={'Content-Type': 'application/json'},
                               timeout=10)
        print(f"2. Admin wrong password: {response.status_code} - {response.text[:100]}")
    except Exception as e:
        print(f"2. Admin wrong password: ERROR - {e}")
    
    # Test 3: Custom order without telemetry
    try:
        response = requests.post(f"{BASE_URL}/orders/create-custom", 
                               json={"quantity": 10, "email": "test@example.com"},
                               headers={'Content-Type': 'application/json'},
                               timeout=10)
        print(f"3. Custom order without telemetry: {response.status_code} - {response.text[:100]}")
    except Exception as e:
        print(f"3. Custom order without telemetry: ERROR - {e}")

if __name__ == "__main__":
    test_specific_cases()