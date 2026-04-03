#!/usr/bin/env python3
"""
Check available routes
"""

import requests

BASE_URL = "https://deez-preview-1.preview.emergentagent.com"

def check_routes():
    """Check what routes are available"""
    print("🔍 Checking available routes...")
    
    # Try to access OpenAPI docs
    response = requests.get(f"{BASE_URL}/openapi.json")
    if response.status_code == 200:
        try:
            data = response.json()
            paths = data.get('paths', {})
            print(f"Found {len(paths)} routes:")
            for path in sorted(paths.keys()):
                methods = list(paths[path].keys())
                print(f"  {path} - {methods}")
        except:
            print(f"OpenAPI docs not parseable")
    else:
        print(f"OpenAPI docs not available: {response.status_code}")
    
    # Test some known endpoints
    test_endpoints = [
        "/api/packs",
        "/api/stats/public", 
        "/api/gift-cards/purchase",
        "/api/orders/create"
    ]
    
    print("\n🧪 Testing specific endpoints:")
    for endpoint in test_endpoints:
        response = requests.get(f"{BASE_URL}{endpoint}")
        print(f"  {endpoint}: {response.status_code}")

if __name__ == "__main__":
    check_routes()