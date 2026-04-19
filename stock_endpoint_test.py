#!/usr/bin/env python3
"""
DeezLink Stock Endpoint Test
Tests the new public stock endpoint and admin stats endpoint as requested.
"""

import requests
import json
import time
import sys
from datetime import datetime

# Use localhost as specified in the review request
BASE_URL = "http://localhost:8001/api"

class StockEndpointTester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'DeezLink-StockTest/1.0'
        })
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def run_test(self, name, test_func):
        """Run a single test and track results"""
        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            success = test_func()
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - PASSED")
            else:
                self.log(f"❌ {name} - FAILED")
            return success
        except Exception as e:
            self.log(f"❌ {name} - ERROR: {str(e)}")
            return False
    
    def test_public_stock_endpoint(self):
        """Test GET /api/stock returns 200 with available field as number"""
        try:
            response = self.session.get(f"{BASE_URL}/stock")
            
            # Check status code
            if response.status_code != 200:
                self.log(f"Expected 200, got {response.status_code}: {response.text}")
                return False
                
            # Check response is JSON
            try:
                data = response.json()
            except json.JSONDecodeError:
                self.log(f"Response is not valid JSON: {response.text}")
                return False
            
            # Check if it has 'available' key
            if 'available' not in data:
                self.log(f"Missing 'available' key in response. Got: {data}")
                return False
            
            available = data['available']
            
            # Check if 'available' is a number
            if not isinstance(available, (int, float)):
                self.log(f"Expected 'available' to be a number, got {type(available)}: {available}")
                return False
            
            # Check if it's a non-negative number
            if available < 0:
                self.log(f"Expected 'available' to be non-negative, got: {available}")
                return False
            
            self.log(f"Public stock endpoint working: available={available}")
            return True
            
        except Exception as e:
            self.log(f"Public stock endpoint test error: {e}")
            return False
    
    def test_admin_stats_protected(self):
        """Test GET /api/admin/stats is admin-protected (should return 401/403 for unauthenticated requests)"""
        try:
            # Make request without authentication
            response = self.session.get(f"{BASE_URL}/admin/stats")
            
            # Should return 401 (Unauthorized) or 403 (Forbidden)
            if response.status_code not in [401, 403]:
                self.log(f"Expected 401 or 403, got {response.status_code}: {response.text}")
                return False
            
            self.log(f"Admin stats endpoint properly protected: status={response.status_code}")
            return True
            
        except Exception as e:
            self.log(f"Admin stats protection test error: {e}")
            return False
    
    def test_stock_endpoint_no_auth_required(self):
        """Test that stock endpoint does NOT require authentication"""
        try:
            # Create a fresh session without any auth headers
            fresh_session = requests.Session()
            fresh_session.headers.update({
                'User-Agent': 'DeezLink-StockTest-NoAuth/1.0'
            })
            
            response = fresh_session.get(f"{BASE_URL}/stock")
            
            # Should return 200 (not 401/403)
            if response.status_code == 401 or response.status_code == 403:
                self.log(f"Stock endpoint requires authentication (status {response.status_code}), but it should be public")
                return False
            
            if response.status_code != 200:
                self.log(f"Expected 200, got {response.status_code}: {response.text}")
                return False
            
            # Verify response structure
            try:
                data = response.json()
                if 'available' not in data:
                    self.log(f"Missing 'available' key in response")
                    return False
            except json.JSONDecodeError:
                self.log(f"Response is not valid JSON")
                return False
            
            self.log("Stock endpoint correctly accessible without authentication")
            return True
            
        except Exception as e:
            self.log(f"Stock endpoint no-auth test error: {e}")
            return False
    
    def test_response_format(self):
        """Test that stock endpoint returns exactly the expected format"""
        try:
            response = self.session.get(f"{BASE_URL}/stock")
            
            if response.status_code != 200:
                self.log(f"Expected 200, got {response.status_code}")
                return False
                
            data = response.json()
            
            # Check exact format: {"available": <number>}
            expected_keys = {'available'}
            actual_keys = set(data.keys())
            
            if actual_keys != expected_keys:
                self.log(f"Expected keys {expected_keys}, got {actual_keys}")
                return False
            
            # Verify available is an integer (not float)
            available = data['available']
            if not isinstance(available, int):
                self.log(f"Expected 'available' to be an integer, got {type(available)}")
                return False
            
            self.log(f"Response format correct: {data}")
            return True
            
        except Exception as e:
            self.log(f"Response format test error: {e}")
            return False
    
    def run_all_tests(self):
        """Run all stock endpoint tests"""
        self.log("🚀 Starting DeezLink Stock Endpoint Tests")
        self.log(f"Testing against: {BASE_URL}")
        
        # Test the specific requirements from the review request
        self.run_test("GET /api/stock returns 200 with available field as number", self.test_public_stock_endpoint)
        self.run_test("GET /api/stock does NOT require authentication", self.test_stock_endpoint_no_auth_required)
        self.run_test("GET /api/stock returns correct format", self.test_response_format)
        self.run_test("GET /api/admin/stats is admin-protected (401/403 for unauthenticated)", self.test_admin_stats_protected)
        
        # Print summary
        self.log("\n" + "="*50)
        self.log(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            self.log("🎉 All stock endpoint tests passed!")
            return True
        else:
            self.log(f"❌ {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = StockEndpointTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())