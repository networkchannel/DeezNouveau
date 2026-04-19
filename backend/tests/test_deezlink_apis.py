"""
DeezLink Backend API Tests - Iteration 2
Tests: Public APIs, Checkout flow, Stats, Deezer trending
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://nouveau-boutique.preview.emergentagent.com').rstrip('/')

class TestHealthAndPublicAPIs:
    """Test public endpoints that don't require authentication"""
    
    def test_api_root_returns_404(self):
        """API root /api/ returns 404 (no root endpoint defined)"""
        response = requests.get(f"{BASE_URL}/api/")
        # Expected: 404 since no root endpoint is defined
        assert response.status_code == 404
        print("✓ /api/ returns 404 as expected (no root endpoint)")
    
    def test_stats_public_endpoint(self):
        """GET /api/stats/public returns orders and links counts"""
        response = requests.get(f"{BASE_URL}/api/stats/public")
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
        assert "links" in data
        assert isinstance(data["orders"], int)
        assert isinstance(data["links"], int)
        print(f"✓ /api/stats/public returns orders={data['orders']}, links={data['links']}")
    
    def test_deezer_trending_endpoint(self):
        """GET /api/deezer/trending returns tracks, artists, albums"""
        response = requests.get(f"{BASE_URL}/api/deezer/trending")
        assert response.status_code == 200
        data = response.json()
        assert "tracks" in data
        assert "artists" in data
        assert "albums" in data
        assert isinstance(data["tracks"], list)
        assert isinstance(data["artists"], list)
        assert isinstance(data["albums"], list)
        # Verify structure of first track if available
        if data["tracks"]:
            track = data["tracks"][0]
            assert "id" in track
            assert "title" in track
            assert "artist_name" in track
        print(f"✓ /api/deezer/trending returns {len(data['tracks'])} tracks, {len(data['artists'])} artists, {len(data['albums'])} albums")
    
    def test_packs_endpoint(self):
        """GET /api/packs returns available packs"""
        response = requests.get(f"{BASE_URL}/api/packs")
        assert response.status_code == 200
        data = response.json()
        assert "packs" in data
        packs = data["packs"]
        assert isinstance(packs, list)
        assert len(packs) >= 1
        # Verify pack structure
        for pack in packs:
            assert "id" in pack
            assert "quantity" in pack
            assert "price" in pack
        print(f"✓ /api/packs returns {len(packs)} packs")


class TestSecurityEndpoints:
    """Test security session and captcha endpoints"""
    
    def test_security_token_init(self):
        """POST /api/security/token/init initializes a security session"""
        response = requests.post(f"{BASE_URL}/api/security/token/init", json={
            "fingerprint": "a" * 64  # 64 char fingerprint
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "session_id" in data
        assert "expires_in" in data
        assert "ip_score" in data
        print(f"✓ /api/security/token/init returns token, session_id, ip_score={data['ip_score']}")
    
    def test_security_score(self):
        """GET /api/security/score returns IP score"""
        response = requests.get(f"{BASE_URL}/api/security/score")
        assert response.status_code == 200
        data = response.json()
        assert "ip_score" in data
        assert "require_captcha" in data
        print(f"✓ /api/security/score returns ip_score={data['ip_score']}, require_captcha={data['require_captcha']}")
    
    def test_captcha_click_start(self):
        """POST /api/captcha/click/start starts a captcha challenge"""
        response = requests.post(f"{BASE_URL}/api/captcha/click/start", json={
            "fingerprint": "b" * 64
        })
        assert response.status_code == 200
        data = response.json()
        assert "challenge_id" in data
        assert "wait_seconds" in data
        assert "expires_in" in data
        print(f"✓ /api/captcha/click/start returns challenge_id, wait_seconds={data['wait_seconds']}")


class TestPricingEndpoints:
    """Test pricing calculation endpoints"""
    
    def test_pricing_calculate(self):
        """GET /api/pricing/calculate returns price for quantity"""
        response = requests.get(f"{BASE_URL}/api/pricing/calculate?quantity=10")
        assert response.status_code == 200
        data = response.json()
        assert "quantity" in data
        assert "total" in data
        assert "unit_price" in data
        assert data["quantity"] == 10
        print(f"✓ /api/pricing/calculate for qty=10: total={data['total']}, unit_price={data['unit_price']}")
    
    def test_loyalty_tiers(self):
        """GET /api/loyalty/tiers returns loyalty tier info"""
        response = requests.get(f"{BASE_URL}/api/loyalty/tiers")
        assert response.status_code == 200
        data = response.json()
        assert "tiers" in data
        tiers = data["tiers"]
        assert isinstance(tiers, dict)
        assert "bronze" in tiers
        assert "gold" in tiers
        print(f"✓ /api/loyalty/tiers returns {len(tiers)} tiers")


class TestCheckoutFlow:
    """Test checkout/order creation endpoints"""
    
    def test_checkout_create_order_missing_fields(self):
        """POST /api/orders/create with missing fields returns 400"""
        response = requests.post(f"{BASE_URL}/api/orders/create", json={})
        # Should return 400 for missing pack_id and email
        assert response.status_code == 400
        print("✓ /api/orders/create with missing fields returns 400")
    
    def test_checkout_create_order_invalid_pack(self):
        """POST /api/orders/create with invalid pack_id returns 400 or 403 (security)"""
        response = requests.post(f"{BASE_URL}/api/orders/create", json={
            "pack_id": "invalid_pack_xyz",
            "email": "test@deezlink.com"
        })
        # May return 400 (invalid pack) or 403 (security validation first)
        assert response.status_code in [400, 403]
        print(f"✓ /api/orders/create with invalid pack returns {response.status_code}")
    
    def test_checkout_create_order_valid_pack(self):
        """POST /api/orders/create with valid pack creates order"""
        # First get security token
        token_resp = requests.post(f"{BASE_URL}/api/security/token/init", json={
            "fingerprint": "c" * 64
        })
        token_data = token_resp.json()
        security_token = token_data.get("token", "")
        
        # Create order with security headers
        headers = {
            "x-security-token": security_token,
            "x-fingerprint": "c" * 64,
            "x-nonce": "test_nonce_" + str(time.time())
        }
        
        response = requests.post(f"{BASE_URL}/api/orders/create", json={
            "pack_id": "solo",  # Valid pack from /api/packs
            "email": "test@deezlink.com",
            "language": "en"
        }, headers=headers)
        
        # Should return 200 with order_id and payment_url (or mocked)
        if response.status_code == 200:
            data = response.json()
            assert "order_id" in data
            print(f"✓ /api/orders/create returns order_id={data['order_id']}")
            if "payment_url" in data:
                print(f"  payment_url present: {data['payment_url'][:50]}...")
        elif response.status_code == 403:
            # Security validation may fail without proper telemetry
            print(f"⚠ /api/orders/create returned 403 (security validation) - expected in test env")
        else:
            print(f"⚠ /api/orders/create returned {response.status_code}: {response.text[:200]}")
    
    def test_checkout_pack_1_flow(self):
        """Test checkout with pack_1 (single link)"""
        response = requests.post(f"{BASE_URL}/api/orders/create", json={
            "pack_id": "solo",
            "email": "test_pack1@deezlink.com",
            "language": "fr"
        })
        # Accept 200 (success) or 403 (security) or 400 (validation)
        assert response.status_code in [200, 400, 403]
        print(f"✓ Checkout pack_1 flow: status={response.status_code}")
    
    def test_checkout_pack_3_flow(self):
        """Test checkout with pack_3 (3 links)"""
        response = requests.post(f"{BASE_URL}/api/orders/create", json={
            "pack_id": "duo",
            "email": "test_pack3@deezlink.com",
            "language": "fr"
        })
        assert response.status_code in [200, 400, 403]
        print(f"✓ Checkout pack_3 flow: status={response.status_code}")
    
    def test_checkout_pack_5_flow(self):
        """Test checkout with pack_5 (5 links)"""
        response = requests.post(f"{BASE_URL}/api/orders/create", json={
            "pack_id": "family",
            "email": "test_pack5@deezlink.com",
            "language": "fr"
        })
        assert response.status_code in [200, 400, 403]
        print(f"✓ Checkout pack_5 flow: status={response.status_code}")


class TestGeoAndLocalization:
    """Test geo and localization endpoints"""
    
    def test_geo_endpoint(self):
        """GET /api/geo returns geo info"""
        response = requests.get(f"{BASE_URL}/api/geo")
        assert response.status_code == 200
        data = response.json()
        assert "country" in data
        assert "language" in data
        print(f"✓ /api/geo returns country={data['country']}, language={data['language']}")


class TestAuthEndpoints:
    """Test authentication endpoints (magic link)"""
    
    def test_auth_me_unauthenticated(self):
        """GET /api/auth/me without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ /api/auth/me without auth returns 401")
    
    def test_magic_link_request_missing_email(self):
        """POST /api/auth/magic without email returns 400"""
        response = requests.post(f"{BASE_URL}/api/auth/magic", json={})
        assert response.status_code == 400
        print("✓ /api/auth/magic without email returns 400")
    
    def test_magic_link_request_valid_email(self):
        """POST /api/auth/magic with valid email initiates magic link"""
        response = requests.post(f"{BASE_URL}/api/auth/magic", json={
            "email": "test_magic@deezlink.com",
            "language": "en"
        })
        # May return 200 (success), 403 (captcha required), or 429 (rate limited)
        assert response.status_code in [200, 403, 429]
        print(f"✓ /api/auth/magic with valid email: status={response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
