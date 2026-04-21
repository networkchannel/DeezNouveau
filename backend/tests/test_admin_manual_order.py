"""
Tests for admin manual order creation + existing admin link endpoints.
Iteration 12: covers POST /api/admin/orders/manual-create plus regression for
/api/admin/links/add, /api/admin/links/import, GET /api/admin/orders, /api/admin/links.
"""
import os
import uuid
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@deezlink.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "DeezLink2024!")


# ---------- Fixtures ----------
@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=20,
    )
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    body = r.json()
    assert body.get("role") == "admin", f"Expected admin role, got {body}"
    # Cookie is set; some envs strip cookies on cross-site -> fall back to header.
    token = None
    if "access_token" not in s.cookies:
        # extract from set-cookie if requests didn't keep it
        sc = r.headers.get("set-cookie", "")
        if "access_token=" in sc:
            token = sc.split("access_token=")[1].split(";")[0]
            s.headers.update({"Authorization": f"Bearer {token}"})
    return s


# ---------- Auth gate ----------
class TestAdminAuthGate:
    def test_manual_order_requires_admin(self):
        r = requests.post(
            f"{BASE_URL}/api/admin/orders/manual-create",
            json={"email": "x@y.com", "pack_id": "single"},
            timeout=15,
        )
        assert r.status_code in (401, 403), f"Got {r.status_code}: {r.text}"


# ---------- Validation ----------
class TestManualOrderValidation:
    def test_missing_email_rejected(self, admin_session):
        r = admin_session.post(
            f"{BASE_URL}/api/admin/orders/manual-create",
            json={"pack_id": "single", "status": "pending"},
            timeout=15,
        )
        # FastAPI/pydantic returns 422 for missing required, our code returns 400 if present-but-empty
        assert r.status_code in (400, 422), f"Expected 400/422, got {r.status_code}: {r.text}"

    def test_bad_pack_id_rejected(self, admin_session):
        r = admin_session.post(
            f"{BASE_URL}/api/admin/orders/manual-create",
            json={"email": "TEST_bad_pack@example.com", "pack_id": "does_not_exist"},
            timeout=15,
        )
        assert r.status_code == 400, f"Expected 400, got {r.status_code}: {r.text}"
        assert "Unknown pack_id" in r.text

    def test_quantity_required_when_no_pack(self, admin_session):
        r = admin_session.post(
            f"{BASE_URL}/api/admin/orders/manual-create",
            json={"email": "TEST_no_qty@example.com", "status": "pending"},
            timeout=15,
        )
        assert r.status_code == 400, f"Expected 400, got {r.status_code}: {r.text}"
        assert "quantity" in r.text.lower()


# ---------- Happy paths ----------
class TestManualOrderHappyPaths:
    def test_pack_single_pending(self, admin_session):
        r = admin_session.post(
            f"{BASE_URL}/api/admin/orders/manual-create",
            json={
                "email": "TEST_manual_single_pending@example.com",
                "pack_id": "single",
                "status": "pending",
                "send_email": False,
                "assign_links": False,
            },
            timeout=20,
        )
        assert r.status_code == 200, f"{r.status_code}: {r.text}"
        body = r.json()
        assert body["ok"] is True
        assert body["status"] == "pending"
        assert body["quantity"] == 1
        assert body["price"] == 5
        assert body["links_assigned"] == 0
        # GET admin orders to verify persistence
        order_id = body["order_id"]
        r2 = admin_session.get(f"{BASE_URL}/api/admin/orders?limit=200", timeout=20)
        assert r2.status_code == 200
        ids = [o.get("order_id") for o in r2.json().get("orders", [])]
        assert order_id in ids, "Order not returned by /api/admin/orders"

    def test_custom_quantity_pending_uses_calculate_price(self, admin_session):
        # qty=15 -> tier "10..24" -> 3.50/u -> 52.50
        r = admin_session.post(
            f"{BASE_URL}/api/admin/orders/manual-create",
            json={
                "email": "TEST_manual_custom_15@example.com",
                "quantity": 15,
                "status": "pending",
                "send_email": False,
                "assign_links": False,
            },
            timeout=20,
        )
        assert r.status_code == 200, f"{r.status_code}: {r.text}"
        body = r.json()
        assert body["status"] == "pending"
        assert body["quantity"] == 15
        assert body["price"] == 52.5, f"Expected 52.5, got {body['price']}"

    def test_explicit_links_completed_bypass_stock(self, admin_session):
        # Using pack=single (qty=1) with one explicit link
        unique_link = f"https://www.deezer.com/premium/activate/TEST_{uuid.uuid4().hex[:8]}"
        r = admin_session.post(
            f"{BASE_URL}/api/admin/orders/manual-create",
            json={
                "email": "TEST_manual_explicit@example.com",
                "pack_id": "single",
                "status": "completed",
                "assign_links": True,  # ignored when explicit links provided
                "send_email": False,
                "links": [unique_link],
            },
            timeout=20,
        )
        assert r.status_code == 200, f"{r.status_code}: {r.text}"
        body = r.json()
        assert body["status"] == "completed"
        assert body["links_assigned"] == 1
        order_id = body["order_id"]
        # Verify via /api/admin/links?status_filter=sold contains the link bound to order_id
        r2 = admin_session.get(
            f"{BASE_URL}/api/admin/links?status_filter=sold&limit=500",
            timeout=20,
        )
        assert r2.status_code == 200
        sold = r2.json().get("links", [])
        match = [l for l in sold if l.get("url") == unique_link]
        assert match, f"Explicit link {unique_link} not found in sold list"
        assert match[0].get("order_id") == order_id

    def test_pack_3_completed_stock_resolution(self, admin_session):
        """Either 200 with assigned links OR 409 stock-shortage. Both valid."""
        r = admin_session.post(
            f"{BASE_URL}/api/admin/orders/manual-create",
            json={
                "email": "TEST_manual_pack3_stock@example.com",
                "pack_id": "pack_3",
                "status": "completed",
                "assign_links": True,
                "send_email": False,
            },
            timeout=20,
        )
        assert r.status_code in (200, 409), f"Unexpected {r.status_code}: {r.text}"
        if r.status_code == 200:
            body = r.json()
            # qty for pack_3 should be 3
            assert body["quantity"] == 3
            assert body["status"] in ("completed", "partial")
        else:
            assert "Not enough" in r.text or "stock" in r.text.lower()


# ---------- Existing admin endpoints regression ----------
class TestExistingAdminEndpoints:
    def test_list_orders(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/orders?limit=10", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "orders" in data
        assert isinstance(data["orders"], list)

    def test_list_links(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/links?limit=10", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "links" in data

    def test_add_link(self, admin_session):
        unique_link = f"https://www.deezer.com/premium/activate/TEST_ADD_{uuid.uuid4().hex[:8]}"
        r = admin_session.post(
            f"{BASE_URL}/api/admin/links/add",
            json={"link": unique_link},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert "total_available" in body

    def test_import_links(self, admin_session):
        links = [
            f"https://www.deezer.com/premium/activate/TEST_IMP_{uuid.uuid4().hex[:8]}",
            f"https://www.deezer.com/premium/activate/TEST_IMP_{uuid.uuid4().hex[:8]}",
        ]
        r = admin_session.post(
            f"{BASE_URL}/api/admin/links/import",
            json={"links": links},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("imported") == 2
