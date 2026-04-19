"""
Backend API Tests for DeezLink - Public Endpoints
Tests the public-facing APIs after the crystality design refonte
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://nouveau-boutique.preview.emergentagent.com')

class TestPublicStats:
    """Test /api/stats/public endpoint"""
    
    def test_stats_public_returns_200(self):
        """Stats endpoint should return 200"""
        response = requests.get(f"{BASE_URL}/api/stats/public")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ /api/stats/public returned 200")
    
    def test_stats_public_returns_orders_and_links(self):
        """Stats should contain orders and links counts"""
        response = requests.get(f"{BASE_URL}/api/stats/public")
        data = response.json()
        
        assert "orders" in data, "Response should contain 'orders'"
        assert "links" in data, "Response should contain 'links'"
        assert isinstance(data["orders"], int), "orders should be an integer"
        assert isinstance(data["links"], int), "links should be an integer"
        print(f"✓ Stats data: orders={data['orders']}, links={data['links']}")


class TestDeezerTrending:
    """Test /api/deezer/trending endpoint"""
    
    def test_deezer_trending_returns_200(self):
        """Deezer trending endpoint should return 200"""
        response = requests.get(f"{BASE_URL}/api/deezer/trending")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ /api/deezer/trending returned 200")
    
    def test_deezer_trending_returns_tracks_artists_albums(self):
        """Deezer trending should contain tracks, artists, albums"""
        response = requests.get(f"{BASE_URL}/api/deezer/trending")
        data = response.json()
        
        assert "tracks" in data, "Response should contain 'tracks'"
        assert "artists" in data, "Response should contain 'artists'"
        assert "albums" in data, "Response should contain 'albums'"
        
        assert isinstance(data["tracks"], list), "tracks should be a list"
        assert isinstance(data["artists"], list), "artists should be a list"
        assert isinstance(data["albums"], list), "albums should be a list"
        
        print(f"✓ Deezer data: {len(data['tracks'])} tracks, {len(data['artists'])} artists, {len(data['albums'])} albums")
    
    def test_deezer_trending_tracks_have_required_fields(self):
        """Each track should have required fields"""
        response = requests.get(f"{BASE_URL}/api/deezer/trending")
        data = response.json()
        
        if len(data["tracks"]) > 0:
            track = data["tracks"][0]
            required_fields = ["id", "title", "artist_name"]
            for field in required_fields:
                assert field in track, f"Track should have '{field}' field"
            print(f"✓ Track has required fields: {list(track.keys())[:5]}...")


class TestSecurityEndpoints:
    """Test security-related endpoints"""
    
    def test_security_token_init(self):
        """Security token init should return a token"""
        response = requests.post(
            f"{BASE_URL}/api/security/token/init",
            json={"fingerprint": "test_fingerprint_" + "a" * 32},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "token" in data, "Response should contain 'token'"
        print(f"✓ Security token init returned token")
    
    def test_security_score(self):
        """Security score endpoint should return score"""
        response = requests.get(f"{BASE_URL}/api/security/score")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "ip_score" in data, "Response should contain 'ip_score'"
        print(f"✓ Security score: {data.get('ip_score')}")


class TestCaptchaEndpoints:
    """Test captcha endpoints"""
    
    def test_captcha_click_start(self):
        """Captcha click start should return challenge"""
        response = requests.post(
            f"{BASE_URL}/api/captcha/click/start",
            json={"fingerprint": "test_fp_" + "b" * 32},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "challenge_id" in data, "Response should contain 'challenge_id'"
        print(f"✓ Captcha challenge started")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
