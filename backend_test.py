#!/usr/bin/env python3
"""
DeezLink Backend API Testing Suite
Tests security telemetry, authentication, orders, and all endpoints
"""

import requests
import json
import time
import hashlib
import secrets
from datetime import datetime
import sys

# Use the public endpoint from frontend .env
BASE_URL = "https://deez-preview-1.preview.emergentagent.com/api"

class DeezLinkTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None
        self.test_results = []
        
    def log_result(self, test_name, success, details="", expected_status=None, actual_status=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - {details}")
            if expected_status and actual_status:
                print(f"   Expected: {expected_status}, Got: {actual_status}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "expected_status": expected_status,
            "actual_status": actual_status
        })
        
    def generate_telemetry(self):
        """Generate mock telemetry data similar to frontend"""
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
    
    def make_request(self, method, endpoint, data=None, with_telemetry=True, expected_status=200):
        """Make HTTP request with optional telemetry"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'
        
        payload = data or {}
        if with_telemetry and method.upper() in ['POST', 'PUT', 'PATCH']:
            payload['_t'] = self.generate_telemetry()
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, headers=headers, timeout=10)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=payload, headers=headers, timeout=10)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=payload, headers=headers, timeout=10)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, headers=headers, timeout=10)
            else:
                return None, f"Unsupported method: {method}"
            
            return response, None
        except requests.exceptions.RequestException as e:
            return None, str(e)
    
    def test_public_endpoints(self):
        """Test public endpoints that don't require auth"""
        print("\n🔍 Testing Public Endpoints...")
        
        # Test stats endpoint
        response, error = self.make_request('GET', '/stats/public', with_telemetry=False)
        if response and response.status_code == 200:
            self.log_result("GET /stats/public", True)
        else:
            self.log_result("GET /stats/public", False, error or "Failed", 200, response.status_code if response else None)
        
        # Test packs endpoint
        response, error = self.make_request('GET', '/packs', with_telemetry=False)
        if response and response.status_code == 200:
            data = response.json()
            if 'packs' in data and len(data['packs']) > 0:
                self.log_result("GET /packs", True)
            else:
                self.log_result("GET /packs", False, "No packs found")
        else:
            self.log_result("GET /packs", False, error or "Failed", 200, response.status_code if response else None)
        
        # Test Deezer trending
        response, error = self.make_request('GET', '/deezer/trending', with_telemetry=False)
        if response and response.status_code == 200:
            self.log_result("GET /deezer/trending", True)
        else:
            self.log_result("GET /deezer/trending", False, error or "Failed", 200, response.status_code if response else None)
        
        # Test geo endpoint
        response, error = self.make_request('GET', '/geo', with_telemetry=False)
        if response and response.status_code == 200:
            self.log_result("GET /geo", True)
        else:
            self.log_result("GET /geo", False, error or "Failed", 200, response.status_code if response else None)
    
    def test_telemetry_validation(self):
        """Test telemetry validation on sensitive endpoints"""
        print("\n🔒 Testing Telemetry Validation...")
        
        # Test order creation WITHOUT telemetry (should fail with 403)
        response, error = self.make_request('POST', '/orders/create', 
                                          {"pack_id": "solo", "email": "test@example.com"}, 
                                          with_telemetry=False, expected_status=403)
        if response and response.status_code == 403:
            self.log_result("POST /orders/create WITHOUT telemetry returns 403", True)
        else:
            self.log_result("POST /orders/create WITHOUT telemetry returns 403", False, 
                          "Should return 403", 403, response.status_code if response else "No response")
        
        # Test order creation WITH telemetry (should work)
        response, error = self.make_request('POST', '/orders/create', 
                                          {"pack_id": "solo", "email": "test@example.com"}, 
                                          with_telemetry=True, expected_status=200)
        if response and response.status_code == 200:
            data = response.json()
            if 'order_id' in data:
                self.log_result("POST /orders/create WITH telemetry returns 200", True)
            else:
                self.log_result("POST /orders/create WITH telemetry returns 200", False, "No order_id in response")
        else:
            self.log_result("POST /orders/create WITH telemetry returns 200", False, 
                          error or "Failed", 200, response.status_code if response else None)
    
    def test_magic_link_auth(self):
        """Test magic link authentication system"""
        print("\n📧 Testing Magic Link Authentication...")
        
        test_email = f"test_{int(time.time())}@example.com"
        
        # Test magic link request WITH telemetry
        response, error = self.make_request('POST', '/auth/magic', 
                                          {"email": test_email, "language": "en"}, 
                                          with_telemetry=True)
        if response and response.status_code == 200:
            data = response.json()
            if 'session_id' in data and 'email_sent' in data:
                session_id = data['session_id']
                self.log_result("POST /auth/magic returns email_sent field and session_id", True)
                
                # Test resend endpoint
                response, error = self.make_request('POST', '/auth/magic/resend',
                                                  {"email": test_email, "session_id": session_id, "language": "en"},
                                                  with_telemetry=True)
                if response and response.status_code == 200:
                    self.log_result("POST /auth/magic/resend endpoint exists and works", True)
                else:
                    self.log_result("POST /auth/magic/resend endpoint exists and works", False,
                                  error or "Failed", 200, response.status_code if response else None)
            else:
                self.log_result("POST /auth/magic returns email_sent field and session_id", False, 
                              "Missing session_id or email_sent field")
        else:
            self.log_result("POST /auth/magic returns email_sent field and session_id", False, 
                          error or "Failed", 200, response.status_code if response else None)
    
    def test_admin_login(self):
        """Test admin login functionality"""
        print("\n👑 Testing Admin Login...")
        
        # Test admin login with correct credentials
        response, error = self.make_request('POST', '/auth/login',
                                          {"email": "admin@deezlink.com", "password": "DeezLink2024!"},
                                          with_telemetry=True)
        if response and response.status_code == 200:
            data = response.json()
            if 'role' in data and data['role'] == 'admin':
                self.log_result("Admin login with correct credentials", True)
                # Store cookies for future requests
                self.session.cookies.update(response.cookies)
            else:
                self.log_result("Admin login with correct credentials", False, "Not admin role")
        else:
            self.log_result("Admin login with correct credentials", False,
                          error or "Failed", 200, response.status_code if response else None)
        
        # Test admin login with wrong credentials
        response, error = self.make_request('POST', '/auth/login',
                                          {"email": "admin@deezlink.com", "password": "wrongpassword"},
                                          with_telemetry=True)
        if response and response.status_code == 401:
            self.log_result("Admin login with wrong credentials returns 401", True)
        else:
            self.log_result("Admin login with wrong credentials returns 401", False,
                          "Should return 401", 401, response.status_code if response else "No response")
    
    def test_custom_orders(self):
        """Test custom order creation"""
        print("\n🛒 Testing Custom Orders...")
        
        # Test custom order WITH telemetry
        response, error = self.make_request('POST', '/orders/create-custom',
                                          {"quantity": 10, "email": "test@example.com"},
                                          with_telemetry=True)
        if response and response.status_code == 200:
            data = response.json()
            if 'order_id' in data:
                self.log_result("POST /orders/create-custom WITH telemetry", True)
            else:
                self.log_result("POST /orders/create-custom WITH telemetry", False, "No order_id")
        else:
            self.log_result("POST /orders/create-custom WITH telemetry", False,
                          error or "Failed", 200, response.status_code if response else None)
        
        # Test custom order WITHOUT telemetry (should fail)
        response, error = self.make_request('POST', '/orders/create-custom',
                                          {"quantity": 10, "email": "test@example.com"},
                                          with_telemetry=False)
        if response and response.status_code == 403:
            self.log_result("POST /orders/create-custom WITHOUT telemetry returns 403", True)
        else:
            self.log_result("POST /orders/create-custom WITHOUT telemetry returns 403", False,
                          "Should return 403", 403, response.status_code if response else "No response")
    
    def test_pricing_calculation(self):
        """Test pricing calculation endpoint"""
        print("\n💰 Testing Pricing Calculation...")
        
        response, error = self.make_request('GET', '/pricing/calculate?quantity=5', with_telemetry=False)
        if response and response.status_code == 200:
            data = response.json()
            if 'total' in data and 'quantity' in data and data['quantity'] == 5:
                self.log_result("GET /pricing/calculate", True)
            else:
                self.log_result("GET /pricing/calculate", False, "Invalid response format")
        else:
            self.log_result("GET /pricing/calculate", False,
                          error or "Failed", 200, response.status_code if response else None)
    
    def test_gift_cards(self):
        """Test gift card functionality"""
        print("\n🎁 Testing Gift Cards...")
        
        # Test gift card purchase WITH telemetry
        response, error = self.make_request('POST', '/gift-cards/purchase',
                                          {
                                              "amount": 25,
                                              "purchaser_email": "buyer@example.com",
                                              "recipient_email": "recipient@example.com"
                                          },
                                          with_telemetry=True)
        if response:
            if response.status_code == 200:
                self.log_result("POST /gift-cards/purchase WITH telemetry", True)
            else:
                self.log_result("POST /gift-cards/purchase WITH telemetry", False,
                              f"Status: {response.status_code}", 200, response.status_code)
        else:
            self.log_result("POST /gift-cards/purchase WITH telemetry", False, error or "Failed")
    
    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting DeezLink Backend API Tests...")
        print(f"🌐 Testing against: {self.base_url}")
        
        start_time = time.time()
        
        # Run test suites
        self.test_public_endpoints()
        self.test_telemetry_validation()
        self.test_magic_link_auth()
        self.test_admin_login()
        self.test_custom_orders()
        self.test_pricing_calculation()
        self.test_gift_cards()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"   Tests run: {self.tests_run}")
        print(f"   Tests passed: {self.tests_passed}")
        print(f"   Tests failed: {self.tests_run - self.tests_passed}")
        print(f"   Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        print(f"   Duration: {duration:.2f}s")
        
        # Return success if all critical tests pass
        critical_failures = []
        for result in self.test_results:
            if not result['success'] and any(keyword in result['test'].lower() for keyword in ['telemetry', 'admin', 'magic']):
                critical_failures.append(result['test'])
        
        if critical_failures:
            print(f"\n❌ Critical test failures: {len(critical_failures)}")
            for failure in critical_failures:
                print(f"   - {failure}")
            return False
        
        return self.tests_passed == self.tests_run

def main():
    tester = DeezLinkTester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/test_reports/backend_test_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_tests': tester.tests_run,
            'passed_tests': tester.tests_passed,
            'success_rate': (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0,
            'results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())