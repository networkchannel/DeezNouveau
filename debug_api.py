#!/usr/bin/env python3
"""
Debug specific API issues
"""

import requests
import json
import time
import hashlib
import secrets

BASE_URL = "https://deez-preview-1.preview.emergentagent.com/api"

def generate_telemetry():
    """Generate mock telemetry data"""
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

def debug_telemetry_validation():
    """Debug telemetry validation issues"""
    print("🔍 Debugging telemetry validation...")
    
    # Test 1: Order without telemetry
    print("\n1. Testing order creation WITHOUT telemetry:")
    response = requests.post(f"{BASE_URL}/orders/create", 
                           json={"pack_id": "solo", "email": "test@example.com"},
                           headers={'Content-Type': 'application/json'})
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text[:200]}")
    
    # Test 2: Order with telemetry
    print("\n2. Testing order creation WITH telemetry:")
    payload = {
        "pack_id": "solo", 
        "email": "test@example.com",
        "_t": generate_telemetry()
    }
    response = requests.post(f"{BASE_URL}/orders/create", 
                           json=payload,
                           headers={'Content-Type': 'application/json'})
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text[:200]}")

def debug_admin_login():
    """Debug admin login issues"""
    print("\n🔍 Debugging admin login...")
    
    # Test wrong password
    print("\n1. Testing admin login with wrong password:")
    payload = {
        "email": "admin@deezlink.com", 
        "password": "wrongpassword",
        "_t": generate_telemetry()
    }
    response = requests.post(f"{BASE_URL}/auth/login", 
                           json=payload,
                           headers={'Content-Type': 'application/json'})
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text[:200]}")

def debug_gift_cards():
    """Debug gift card issues"""
    print("\n🔍 Debugging gift cards...")
    
    payload = {
        "amount": 25,
        "purchaser_email": "buyer@example.com",
        "recipient_email": "recipient@example.com",
        "_t": generate_telemetry()
    }
    response = requests.post(f"{BASE_URL}/gift-cards/purchase", 
                           json=payload,
                           headers={'Content-Type': 'application/json'})
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text[:500]}")

if __name__ == "__main__":
    debug_telemetry_validation()
    debug_admin_login()
    debug_gift_cards()