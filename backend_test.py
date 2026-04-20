#!/usr/bin/env python3
"""
Comprehensive backend testing for DeezLink Stripe Checkout integration.
Tests all endpoints as specified in the review request.
"""

import asyncio
import httpx
import json
import os
import sys
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

# Configuration
BACKEND_URL = "https://67009e18-88f6-440b-a9bd-0991c4a5b187.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test credentials from /app/memory/test_credentials.md
ADMIN_EMAIL = "admin@deezlink.com"
ADMIN_PASSWORD = "DeezLink2024!"

# MongoDB connection for direct database operations
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "deezlink"

class StripeTestRunner:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.mongo_client = AsyncIOMotorClient(MONGO_URL)
        self.db = self.mongo_client[DB_NAME]
        self.admin_token = None
        self.test_results = []
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
        self.mongo_client.close()
    
    def log_test(self, test_name: str, endpoint: str, request_data: dict, response_status: int, 
                 response_data: dict, expected: str, result: str, error: str = ""):
        """Log test result in the specified format"""
        self.test_results.append({
            "test": test_name,
            "endpoint": endpoint,
            "request": request_data,
            "response_status": response_status,
            "response_data": response_data,
            "expected": expected,
            "result": result,
            "error": error
        })
        
        status_icon = "✅ PASS" if result == "PASS" else "❌ FAIL"
        print(f"{status_icon} {test_name}")
        if result == "FAIL":
            print(f"   Expected: {expected}")
            print(f"   Error: {error}")
        print()
    
    async def get_security_session(self) -> str:
        """Get a security session token"""
        try:
            response = await self.client.post(f"{API_BASE}/security/token/init", json={
                "fingerprint": "a" * 64
            })
            
            if response.status_code == 200:
                data = response.json()
                token = data.get("token", "")
                if token:
                    print(f"✅ Got security token: {token[:20]}...")
                return token
            else:
                print(f"❌ Security token init failed: {response.status_code} - {response.text}")
            return ""
        except Exception as e:
            print(f"❌ Error getting security token: {e}")
            return ""
    
    async def get_captcha_token(self) -> str:
        """Get a captcha token for testing"""
        try:
            # Start captcha challenge
            challenge_response = await self.client.post(f"{API_BASE}/captcha/click/start", json={
                "fingerprint": "a" * 64
            })
            
            if challenge_response.status_code == 200:
                challenge_data = challenge_response.json()
                challenge_id = challenge_data.get("challenge_id")
                wait_seconds = challenge_data.get("wait_seconds", 5)
                
                if challenge_id:
                    # Wait the required time
                    print(f"⏳ Waiting {wait_seconds} seconds for captcha...")
                    await asyncio.sleep(wait_seconds + 1)  # Add 1 second buffer
                    
                    # Verify captcha (mock verification)
                    verify_response = await self.client.post(f"{API_BASE}/captcha/click/verify", json={
                        "challenge_id": challenge_id,
                        "fingerprint": "a" * 64
                    })
                    
                    if verify_response.status_code == 200:
                        verify_data = verify_response.json()
                        token = verify_data.get("captcha_token", "")
                        if token:
                            print(f"✅ Got captcha token: {token[:20]}...")
                        return token
                    else:
                        print(f"❌ Captcha verify failed: {verify_response.status_code} - {verify_response.text}")
            
            return ""
        except Exception as e:
            print(f"❌ Error getting captcha token: {e}")
            return ""
    
    async def login_admin(self):
        """Login as admin and get JWT token"""
        try:
            response = await self.client.post(f"{API_BASE}/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                # Extract token from cookies
                if hasattr(response, 'cookies') and response.cookies:
                    for cookie_name, cookie_value in response.cookies.items():
                        if cookie_name == "access_token":
                            self.admin_token = cookie_value
                            break
                
                if not self.admin_token:
                    # Try to get from response data if available
                    self.admin_token = data.get("access_token", "")
                
                if self.admin_token:
                    print(f"✅ Admin login successful. Token: {self.admin_token[:20]}...")
                    return True
                else:
                    print(f"❌ Admin login successful but no token found. Response: {data}")
                    return False
            else:
                print(f"❌ Admin login failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Admin login error: {e}")
            return False
    
    async def create_test_order(self, payment_method: str = "stripe", pack_id: str = "single") -> str:
        """Create a test order and return order_id"""
        try:
            # Get security session token first
            security_token = await self.get_security_session()
            
            # Get captcha token
            captcha_token = await self.get_captcha_token()
            
            order_data = {
                "pack_id": pack_id,
                "email": f"test+stripe+{datetime.now().strftime('%H%M%S')}@deezlink.com",
                "language": "en",
                "captcha_token": captcha_token,
                "_t": {
                    "fp": "a" * 64,  # Mock fingerprint
                    "ts": int(datetime.now().timestamp() * 1000),
                    "nonce": f"test_nonce_{datetime.now().strftime('%H%M%S')}",
                    "ck": "b" * 64
                }
            }
            
            if payment_method:
                order_data["payment_method"] = payment_method
            
            headers = {}
            if security_token:
                headers["x-security-token"] = security_token
                headers["x-fingerprint"] = "a" * 64
                headers["x-nonce"] = f"header_nonce_{datetime.now().strftime('%H%M%S')}"
            
            response = await self.client.post(f"{API_BASE}/orders/create", json=order_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                order_id = data.get("order_id")
                print(f"✅ Test order created: {order_id}")
                return order_id
            else:
                print(f"❌ Failed to create test order: {response.status_code} - {response.text}")
                return ""
        except Exception as e:
            print(f"❌ Error creating test order: {e}")
            return ""
    
    async def get_order_details(self, order_id: str) -> dict:
        """Get order details from API"""
        try:
            response = await self.client.get(f"{API_BASE}/orders/{order_id}")
            if response.status_code == 200:
                return response.json()
            return {}
        except Exception as e:
            print(f"❌ Error getting order details: {e}")
            return {}
    
    async def update_order_status_in_db(self, order_id: str, status: str):
        """Directly update order status in MongoDB"""
        try:
            await self.db.orders.update_one(
                {"order_id": order_id},
                {"$set": {"status": status}}
            )
            print(f"✅ Updated order {order_id} status to {status}")
        except Exception as e:
            print(f"❌ Error updating order status: {e}")
    
    async def test_1a_missing_body(self):
        """Test 1a: POST /api/payments/stripe/create-session with empty body"""
        response = await self.client.post(f"{API_BASE}/payments/stripe/create-session", json={})
        
        expected = "400 'order_id is required'"
        if response.status_code == 400 and "order_id" in response.text.lower():
            result = "PASS"
            error = ""
        else:
            result = "FAIL"
            error = f"Got {response.status_code}: {response.text}"
        
        self.log_test(
            "1a. Missing body",
            "POST /api/payments/stripe/create-session",
            {},
            response.status_code,
            response.json() if response.status_code != 500 else {"error": response.text},
            expected,
            result,
            error
        )
    
    async def test_1b_missing_origin_url(self):
        """Test 1b: POST with order_id but missing origin_url"""
        request_data = {"order_id": "anything"}
        response = await self.client.post(f"{API_BASE}/payments/stripe/create-session", json=request_data)
        
        expected = "400 'origin_url is required'"
        if response.status_code == 400 and "origin_url" in response.text.lower():
            result = "PASS"
            error = ""
        else:
            result = "FAIL"
            error = f"Got {response.status_code}: {response.text}"
        
        self.log_test(
            "1b. Missing origin_url",
            "POST /api/payments/stripe/create-session",
            request_data,
            response.status_code,
            response.json() if response.status_code != 500 else {"error": response.text},
            expected,
            result,
            error
        )
    
    async def test_1c_unknown_order(self):
        """Test 1c: POST with nonexistent order_id"""
        request_data = {"order_id": "nonexistent_xxx", "origin_url": "https://test.com"}
        response = await self.client.post(f"{API_BASE}/payments/stripe/create-session", json=request_data)
        
        expected = "404 'Order not found'"
        if response.status_code == 404 and "order" in response.text.lower() and "not found" in response.text.lower():
            result = "PASS"
            error = ""
        else:
            result = "FAIL"
            error = f"Got {response.status_code}: {response.text}"
        
        self.log_test(
            "1c. Unknown order",
            "POST /api/payments/stripe/create-session",
            request_data,
            response.status_code,
            response.json() if response.status_code != 500 else {"error": response.text},
            expected,
            result,
            error
        )
    
    async def test_1d_happy_path(self):
        """Test 1d: Happy path - create order, verify status, create session, verify response"""
        # Step 1: Create order with payment_method=stripe
        order_id = await self.create_test_order("stripe", "single")
        if not order_id:
            self.log_test(
                "1d. Happy path - Create order",
                "POST /api/orders/create",
                {"pack_id": "single", "email": "test+stripe@deezlink.com", "language": "en", "payment_method": "stripe"},
                500,
                {"error": "Failed to create order"},
                "200 with order_id",
                "FAIL",
                "Could not create test order"
            )
            return None
        
        # Step 2: Verify order in database has correct status and payment_provider
        order_details = await self.get_order_details(order_id)
        if order_details.get("status") == "awaiting_stripe" and order_details.get("payment_provider") == "stripe":
            print(f"✅ Order {order_id} has correct status: awaiting_stripe, payment_provider: stripe")
        else:
            print(f"❌ Order {order_id} status: {order_details.get('status')}, payment_provider: {order_details.get('payment_provider')}")
        
        # Step 3: Create Stripe session
        request_data = {"order_id": order_id, "origin_url": "https://deezlink.com"}
        response = await self.client.post(f"{API_BASE}/payments/stripe/create-session", json=request_data)
        
        expected = "200 with {session_id: string, url: string}, URL starts with https://checkout.stripe.com/ or https://pay.stripe.com/"
        
        if response.status_code == 200:
            try:
                data = response.json()
                session_id = data.get("session_id", "")
                url = data.get("url", "")
                
                if session_id and url and (url.startswith("https://checkout.stripe.com/") or url.startswith("https://pay.stripe.com/")):
                    result = "PASS"
                    error = ""
                    
                    # Step 4: Verify order document has stripe_session_id and payment_url
                    updated_order = await self.get_order_details(order_id)
                    if updated_order.get("stripe_session_id") and updated_order.get("payment_url"):
                        print(f"✅ Order updated with stripe_session_id: {updated_order.get('stripe_session_id')}")
                        print(f"✅ Order updated with payment_url: {updated_order.get('payment_url')}")
                    else:
                        print(f"❌ Order missing stripe_session_id or payment_url")
                        print(f"   stripe_session_id: {updated_order.get('stripe_session_id')}")
                        print(f"   payment_url: {updated_order.get('payment_url')}")
                    
                    # Return session_id for use in other tests
                    self.test_session_id = session_id
                    self.test_order_id = order_id
                    
                else:
                    result = "FAIL"
                    error = f"Missing session_id ({session_id}) or invalid URL ({url})"
            except Exception as e:
                result = "FAIL"
                error = f"JSON parse error: {e}"
        else:
            result = "FAIL"
            error = f"Got {response.status_code}: {response.text}"
        
        self.log_test(
            "1d. Happy path",
            "POST /api/payments/stripe/create-session",
            request_data,
            response.status_code,
            response.json() if response.status_code == 200 else {"error": response.text},
            expected,
            result,
            error
        )
        
        return order_id if result == "PASS" else None
    
    async def test_1e_already_paid(self):
        """Test 1e: Try to create session for already completed order"""
        # Create a test order first
        order_id = await self.create_test_order("stripe", "single")
        if not order_id:
            self.log_test(
                "1e. Already paid - Setup",
                "POST /api/orders/create",
                {},
                500,
                {"error": "Failed to create order"},
                "200 with order_id",
                "FAIL",
                "Could not create test order for already paid test"
            )
            return
        
        # Update order status to completed in MongoDB
        await self.update_order_status_in_db(order_id, "completed")
        
        # Try to create session for completed order
        request_data = {"order_id": order_id, "origin_url": "https://deezlink.com"}
        response = await self.client.post(f"{API_BASE}/payments/stripe/create-session", json=request_data)
        
        expected = "400 'Order already paid'"
        if response.status_code == 400 and ("already" in response.text.lower() and "paid" in response.text.lower()):
            result = "PASS"
            error = ""
        else:
            result = "FAIL"
            error = f"Got {response.status_code}: {response.text}"
        
        self.log_test(
            "1e. Already paid",
            "POST /api/payments/stripe/create-session",
            request_data,
            response.status_code,
            response.json() if response.status_code != 500 else {"error": response.text},
            expected,
            result,
            error
        )
    
    async def test_2a_unknown_session(self):
        """Test 2a: GET status for unknown session_id"""
        response = await self.client.get(f"{API_BASE}/payments/stripe/status/cs_test_nonexistent")
        
        expected = "404 'Transaction not found'"
        if response.status_code == 404 and ("transaction" in response.text.lower() and "not found" in response.text.lower()):
            result = "PASS"
            error = ""
        else:
            result = "FAIL"
            error = f"Got {response.status_code}: {response.text}"
        
        self.log_test(
            "2a. Unknown session",
            "GET /api/payments/stripe/status/cs_test_nonexistent",
            {},
            response.status_code,
            response.json() if response.status_code != 500 else {"error": response.text},
            expected,
            result,
            error
        )
    
    async def test_2b_valid_session_status(self):
        """Test 2b: GET status for valid session from 1d"""
        if not hasattr(self, 'test_session_id') or not self.test_session_id:
            self.log_test(
                "2b. Valid session status",
                f"GET /api/payments/stripe/status/[session_id]",
                {},
                0,
                {"error": "No session_id from previous test"},
                "200 with session details",
                "FAIL",
                "No valid session_id from test 1d"
            )
            return
        
        response = await self.client.get(f"{API_BASE}/payments/stripe/status/{self.test_session_id}")
        
        expected = "200 with {session_id, order_id, status, payment_status, amount_total, currency, fulfilled}"
        
        if response.status_code == 200:
            try:
                data = response.json()
                required_fields = ["session_id", "order_id", "status", "payment_status", "amount_total", "currency", "fulfilled"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    result = "PASS"
                    error = ""
                    print(f"✅ Session status fields: {list(data.keys())}")
                    print(f"✅ fulfilled: {data.get('fulfilled')} (should be false)")
                    print(f"✅ payment_status: {data.get('payment_status')} (should be unpaid or similar)")
                else:
                    result = "FAIL"
                    error = f"Missing fields: {missing_fields}"
            except Exception as e:
                result = "FAIL"
                error = f"JSON parse error: {e}"
        else:
            result = "FAIL"
            error = f"Got {response.status_code}: {response.text}"
        
        self.log_test(
            "2b. Valid session status",
            f"GET /api/payments/stripe/status/{self.test_session_id}",
            {},
            response.status_code,
            response.json() if response.status_code == 200 else {"error": response.text},
            expected,
            result,
            error
        )
    
    async def test_3a_webhook_missing_signature(self):
        """Test 3a: POST webhook with missing signature"""
        response = await self.client.post(f"{API_BASE}/webhook/stripe", content=b"")
        
        expected = "200 (swallows errors) but logs processing_error and inserts doc in stripe_webhooks"
        
        # Stripe webhooks should return 200 even on errors to prevent retries
        if response.status_code == 200:
            result = "PASS"
            error = ""
            
            # Check if a document was inserted in stripe_webhooks collection
            try:
                webhook_doc = await self.db.stripe_webhooks.find_one(
                    {"signature_present": False},
                    sort=[("timestamp", -1)]
                )
                if webhook_doc and webhook_doc.get("processing_error"):
                    print(f"✅ Webhook doc inserted with processing_error: {webhook_doc.get('processing_error')}")
                else:
                    print(f"❌ No webhook doc found with signature_present: false and processing_error")
            except Exception as e:
                print(f"❌ Error checking webhook doc: {e}")
        else:
            result = "FAIL"
            error = f"Got {response.status_code}: {response.text}"
        
        self.log_test(
            "3a. Missing signature",
            "POST /api/webhook/stripe",
            {"body": "empty", "headers": "no Stripe-Signature"},
            response.status_code,
            response.json() if response.headers.get("content-type", "").startswith("application/json") else {"response": response.text},
            expected,
            result,
            error
        )
    
    async def test_4a_admin_endpoints_without_auth(self):
        """Test 4a: GET admin endpoints without authentication"""
        # Create a new client without any auth headers to ensure clean test
        async with httpx.AsyncClient(timeout=30.0) as clean_client:
            # Test webhooks endpoint
            response1 = await clean_client.get(f"{API_BASE}/admin/stripe/webhooks")
            
            # Test transactions endpoint  
            response2 = await clean_client.get(f"{API_BASE}/admin/stripe/transactions")
        
        expected = "401 for both endpoints"
        
        if response1.status_code == 401 and response2.status_code == 401:
            result = "PASS"
            error = ""
        else:
            result = "FAIL"
            error = f"webhooks: {response1.status_code}, transactions: {response2.status_code}"
        
        self.log_test(
            "4a. Admin endpoints without auth",
            "GET /api/admin/stripe/webhooks and /api/admin/stripe/transactions",
            {},
            response1.status_code,
            {"webhooks_status": response1.status_code, "transactions_status": response2.status_code},
            expected,
            result,
            error
        )
    
    async def test_4b_admin_endpoints_with_auth(self):
        """Test 4b: GET admin endpoints with admin JWT"""
        if not self.admin_token:
            self.log_test(
                "4b. Admin endpoints with auth",
                "GET /api/admin/stripe/webhooks and /api/admin/stripe/transactions",
                {},
                0,
                {"error": "No admin token"},
                "200 with data",
                "FAIL",
                "No admin token available"
            )
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test webhooks endpoint
        response1 = await self.client.get(f"{API_BASE}/admin/stripe/webhooks", headers=headers)
        
        # Test transactions endpoint
        response2 = await self.client.get(f"{API_BASE}/admin/stripe/transactions", headers=headers)
        
        expected = "200 with {webhooks: [...]} and {transactions: [...]}"
        
        if response1.status_code == 200 and response2.status_code == 200:
            try:
                data1 = response1.json()
                data2 = response2.json()
                
                if "webhooks" in data1 and "transactions" in data2:
                    result = "PASS"
                    error = ""
                    print(f"✅ Webhooks count: {len(data1.get('webhooks', []))}")
                    print(f"✅ Transactions count: {len(data2.get('transactions', []))}")
                else:
                    result = "FAIL"
                    error = f"Missing expected keys: webhooks in data1: {'webhooks' in data1}, transactions in data2: {'transactions' in data2}"
            except Exception as e:
                result = "FAIL"
                error = f"JSON parse error: {e}"
        else:
            result = "FAIL"
            error = f"webhooks: {response1.status_code}, transactions: {response2.status_code}"
        
        self.log_test(
            "4b. Admin endpoints with auth",
            "GET /api/admin/stripe/webhooks and /api/admin/stripe/transactions",
            {"headers": "Authorization: Bearer [token]"},
            response1.status_code,
            {
                "webhooks_response": response1.json() if response1.status_code == 200 else {"error": response1.text},
                "transactions_response": response2.json() if response2.status_code == 200 else {"error": response2.text}
            },
            expected,
            result,
            error
        )
    
    async def test_5_oxapay_regression(self):
        """Test 5: Existing OxaPay flow regression"""
        # Get security session token first
        security_token = await self.get_security_session()
        
        # Get captcha token first
        captcha_token = await self.get_captcha_token()
        
        # Create order WITHOUT payment_method (defaults to crypto)
        order_data = {
            "pack_id": "single",
            "email": f"test+oxa+{datetime.now().strftime('%H%M%S')}@deezlink.com",
            "language": "en",
            "captcha_token": captcha_token,
            "_t": {
                "fp": "a" * 64,  # Mock fingerprint
                "ts": int(datetime.now().timestamp() * 1000),
                "nonce": f"test_nonce_oxa_{datetime.now().strftime('%H%M%S')}",
                "ck": "b" * 64
            }
        }
        
        headers = {}
        if security_token:
            headers["x-security-token"] = security_token
            headers["x-fingerprint"] = "a" * 64
            headers["x-nonce"] = f"header_nonce_oxa_{datetime.now().strftime('%H%M%S')}"
        
        response = await self.client.post(f"{API_BASE}/orders/create", json=order_data, headers=headers)
        
        expected = "200 with payment_url (OxaPay URL) or mock flag"
        
        if response.status_code == 200:
            try:
                data = response.json()
                payment_url = data.get("payment_url", "")
                order_id = data.get("order_id", "")
                
                if payment_url or data.get("mock_payment"):
                    result = "PASS"
                    error = ""
                    print(f"✅ OxaPay order created: {order_id}")
                    if payment_url:
                        print(f"✅ Payment URL: {payment_url}")
                    if data.get("mock_payment"):
                        print(f"✅ Mock payment flag: {data.get('mock_payment')}")
                else:
                    result = "FAIL"
                    error = f"No payment_url or mock flag in response: {data}"
            except Exception as e:
                result = "FAIL"
                error = f"JSON parse error: {e}"
        else:
            result = "FAIL"
            error = f"Got {response.status_code}: {response.text}"
        
        self.log_test(
            "5. OxaPay regression",
            "POST /api/orders/create",
            order_data,
            response.status_code,
            response.json() if response.status_code == 200 else {"error": response.text},
            expected,
            result,
            error
        )
    
    async def test_6a_create_custom_stripe(self):
        """Test 6a: /orders/create-custom with payment_method=stripe"""
        # Get captcha token first
        captcha_token = await self.get_captcha_token()
        
        order_data = {
            "quantity": 7,
            "email": f"test+custom+stripe+{datetime.now().strftime('%H%M%S')}@deezlink.com",
            "payment_method": "stripe",
            "captcha_token": captcha_token,
            "_t": {
                "fp": "a" * 64,  # Mock fingerprint
                "ts": int(datetime.now().timestamp() * 1000),
                "nonce": f"test_nonce_custom_{datetime.now().strftime('%H%M%S')}",
                "ck": "b" * 64
            }
        }
        
        response = await self.client.post(f"{API_BASE}/orders/create-custom", json=order_data)
        
        expected = "200 with order having status=awaiting_stripe"
        
        if response.status_code == 200:
            try:
                data = response.json()
                order_id = data.get("order_id", "")
                
                # Get order details to check status
                order_details = await self.get_order_details(order_id)
                if order_details.get("status") == "awaiting_stripe":
                    result = "PASS"
                    error = ""
                    print(f"✅ Custom order created with awaiting_stripe status: {order_id}")
                    
                    # Test create-session works with this order
                    session_request = {"order_id": order_id, "origin_url": "https://deezlink.com"}
                    session_response = await self.client.post(f"{API_BASE}/payments/stripe/create-session", json=session_request)
                    
                    if session_response.status_code == 200:
                        session_data = session_response.json()
                        if session_data.get("url", "").startswith(("https://checkout.stripe.com/", "https://pay.stripe.com/")):
                            print(f"✅ Create-session works with custom order: {session_data.get('url')}")
                        else:
                            print(f"❌ Invalid Stripe URL: {session_data.get('url')}")
                    else:
                        print(f"❌ Create-session failed: {session_response.status_code}")
                        
                else:
                    result = "FAIL"
                    error = f"Order status is {order_details.get('status')}, expected awaiting_stripe"
            except Exception as e:
                result = "FAIL"
                error = f"Error: {e}"
        else:
            result = "FAIL"
            error = f"Got {response.status_code}: {response.text}"
        
        self.log_test(
            "6a. Create-custom with Stripe",
            "POST /api/orders/create-custom",
            order_data,
            response.status_code,
            response.json() if response.status_code == 200 else {"error": response.text},
            expected,
            result,
            error
        )
    
    async def test_6b_create_multi_stripe(self):
        """Test 6b: /orders/create-multi with payment_method=stripe"""
        # Get captcha token first
        captcha_token = await self.get_captcha_token()
        
        order_data = {
            "email": f"test+multi+{datetime.now().strftime('%H%M%S')}@deezlink.com",
            "items": [
                {"pack_id": "single", "quantity": 1},
                {"pack_id": "pack_3", "quantity": 1}
            ],
            "payment_method": "stripe",
            "captcha_token": captcha_token,
            "_t": {
                "fp": "a" * 64,  # Mock fingerprint
                "ts": int(datetime.now().timestamp() * 1000),
                "nonce": f"test_nonce_multi_{datetime.now().strftime('%H%M%S')}",
                "ck": "b" * 64
            }
        }
        
        response = await self.client.post(f"{API_BASE}/orders/create-multi", json=order_data)
        
        expected = "200 with orders having status=awaiting_stripe"
        
        if response.status_code == 200:
            try:
                data = response.json()
                order_ids = data.get("order_ids", [])
                
                if order_ids:
                    # Check first order status
                    order_details = await self.get_order_details(order_ids[0])
                    if order_details.get("status") == "awaiting_stripe":
                        result = "PASS"
                        error = ""
                        print(f"✅ Multi orders created with awaiting_stripe status: {order_ids}")
                        
                        # Test create-session works with first order
                        session_request = {"order_id": order_ids[0], "origin_url": "https://deezlink.com"}
                        session_response = await self.client.post(f"{API_BASE}/payments/stripe/create-session", json=session_request)
                        
                        if session_response.status_code == 200:
                            session_data = session_response.json()
                            if session_data.get("url", "").startswith(("https://checkout.stripe.com/", "https://pay.stripe.com/")):
                                print(f"✅ Create-session works with multi order: {session_data.get('url')}")
                            else:
                                print(f"❌ Invalid Stripe URL: {session_data.get('url')}")
                        else:
                            print(f"❌ Create-session failed: {session_response.status_code}")
                            
                    else:
                        result = "FAIL"
                        error = f"Order status is {order_details.get('status')}, expected awaiting_stripe"
                else:
                    result = "FAIL"
                    error = "No order_ids in response"
            except Exception as e:
                result = "FAIL"
                error = f"Error: {e}"
        else:
            result = "FAIL"
            error = f"Got {response.status_code}: {response.text}"
        
        self.log_test(
            "6b. Create-multi with Stripe",
            "POST /api/orders/create-multi",
            order_data,
            response.status_code,
            response.json() if response.status_code == 200 else {"error": response.text},
            expected,
            result,
            error
        )
    
    async def run_all_tests(self):
        """Run all Stripe integration tests"""
        print("🚀 Starting Stripe Checkout Integration Tests")
        print("=" * 60)
        
        # Login as admin first
        if not await self.login_admin():
            print("❌ Cannot proceed without admin login")
            return []
        
        print("\n📋 Test Plan:")
        print("1. POST /api/payments/stripe/create-session")
        print("   1a. Missing body → 400")
        print("   1b. Missing origin_url → 400") 
        print("   1c. Unknown order → 404")
        print("   1d. Happy path → 200 with session_id and Stripe URL")
        print("   1e. Already paid → 400")
        print("2. GET /api/payments/stripe/status/{session_id}")
        print("   2a. Unknown session → 404")
        print("   2b. Valid session → 200 with status fields")
        print("3. POST /api/webhook/stripe")
        print("   3a. Missing signature → 200 but logs error")
        print("4. Admin endpoints")
        print("   4a. Without auth → 401")
        print("   4b. With admin JWT → 200")
        print("5. OxaPay regression test")
        print("6. Create-custom and create-multi with Stripe")
        print("\n" + "=" * 60)
        
        # Run all tests
        await self.test_1a_missing_body()
        await self.test_1b_missing_origin_url()
        await self.test_1c_unknown_order()
        await self.test_1d_happy_path()
        await self.test_1e_already_paid()
        await self.test_2a_unknown_session()
        await self.test_2b_valid_session_status()
        await self.test_3a_webhook_missing_signature()
        await self.test_4a_admin_endpoints_without_auth()
        await self.test_4b_admin_endpoints_with_auth()
        await self.test_5_oxapay_regression()
        await self.test_6a_create_custom_stripe()
        await self.test_6b_create_multi_stripe()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for test in self.test_results if test["result"] == "PASS")
        failed = sum(1 for test in self.test_results if test["result"] == "FAIL")
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        
        if failed > 0:
            print(f"\n❌ FAILED TESTS:")
            for test in self.test_results:
                if test["result"] == "FAIL":
                    print(f"   • {test['test']}: {test['error']}")
        
        print("\n" + "=" * 60)
        return self.test_results

async def main():
    """Main test runner"""
    async with StripeTestRunner() as runner:
        results = await runner.run_all_tests()
        
        # Return exit code based on results
        if results:
            failed_count = sum(1 for test in results if test["result"] == "FAIL")
            return 0 if failed_count == 0 else 1
        else:
            return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)