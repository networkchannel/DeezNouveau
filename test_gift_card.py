#!/usr/bin/env python3
"""
Test gift card endpoint correctly
"""

import requests
import json

BASE_URL = "https://deez-preview-1.preview.emergentagent.com/api"

def test_gift_card():
    """Test gift card purchase"""
    print("🎁 Testing gift card purchase...")
    
    payload = {
        "amount": 25,
        "purchaser_email": "buyer@example.com",
        "recipient_email": "recipient@example.com",
        "recipient_name": "Test Recipient",
        "message": "Happy birthday!"
    }
    
    response = requests.post(f"{BASE_URL}/gift-cards/purchase", 
                           json=payload,
                           headers={'Content-Type': 'application/json'})
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success') and 'gift_card' in data:
            print("✅ Gift card purchase successful")
            return True
        else:
            print("❌ Invalid response format")
            return False
    else:
        print(f"❌ Gift card purchase failed with status {response.status_code}")
        return False

if __name__ == "__main__":
    test_gift_card()