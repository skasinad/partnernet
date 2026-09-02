from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from businesses.models import Business
from catalog.models import AudienceTag, Category
from messaging.models import Thread
from partnerships.models import Connection

User = get_user_model()


class PartnershipFlowTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cat = Category.objects.create(name="Cafe")
        tag = AudienceTag.objects.create(facet="interest", name="Foodies")
        for key in ("a", "b"):
            user = User.objects.create_user(email=f"{key}@t.test", password="pw")
            biz = Business.objects.create(
                owner=user, name=f"Biz {key.upper()}", category=cat, city="Portland"
            )
            biz.audience_tags.set([tag])
            setattr(cls, f"user_{key}", user)
            setattr(cls, f"biz_{key}", biz)

    def _client(self, email):
        c = APIClient()
        res = c.post("/api/auth/login/", {"email": email, "password": "pw"}, format="json")
        c.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
        return c

    def test_request_accept_creates_connection_and_enables_messaging(self):
        a = self._client("a@t.test")
        b = self._client("b@t.test")

        res = a.post("/api/partnership-requests/", {
            "to_business_slug": self.biz_b.slug,
            "message": "Let's run a joint pop-up next month.",
        }, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        req_id = res.data["id"]

        # B cannot message A yet.
        self.assertEqual(
            b.post("/api/threads/open/", {"business_slug": self.biz_a.slug},
                   format="json").status_code, 403,
        )

        # A cannot accept their own outgoing request.
        self.assertEqual(a.post(f"/api/partnership-requests/{req_id}/accept/").status_code, 403)

        # B accepts.
        res = b.post(f"/api/partnership-requests/{req_id}/accept/")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(Connection.between(self.biz_a.id, self.biz_b.id))

        # Now messaging works both ways and lands in one shared thread.
        t1 = a.post("/api/threads/open/", {"business_slug": self.biz_b.slug}, format="json")
        t2 = b.post("/api/threads/open/", {"business_slug": self.biz_a.slug}, format="json")
        self.assertEqual(t1.data["id"], t2.data["id"])

        a.post(f"/api/threads/{t1.data['id']}/messages/", {"body": "Hi!"}, format="json")
        msgs = b.get(f"/api/threads/{t1.data['id']}/messages/")
        self.assertEqual(len(msgs.data), 1)
        self.assertFalse(msgs.data[0]["mine"])

    def test_duplicate_pending_request_rejected(self):
        a = self._client("a@t.test")
        payload = {"to_business_slug": self.biz_b.slug, "message": "First message here."}
        self.assertEqual(a.post("/api/partnership-requests/", payload, format="json").status_code, 201)
        self.assertEqual(a.post("/api/partnership-requests/", payload, format="json").status_code, 400)

    def test_cannot_partner_with_self(self):
        a = self._client("a@t.test")
        res = a.post("/api/partnership-requests/", {
            "to_business_slug": self.biz_a.slug, "message": "hello there friend",
        }, format="json")
        self.assertEqual(res.status_code, 400)

    def test_stranger_cannot_read_thread(self):
        # a<->b connected; c is a stranger.
        cat = Category.objects.get(name="Cafe")
        stranger = User.objects.create_user(email="c@t.test", password="pw")
        Business.objects.create(owner=stranger, name="Biz C", category=cat, city="Portland")
        Connection.create_for(self.biz_a, self.biz_b)
        thread, _ = Thread.get_or_create_between(self.biz_a, self.biz_b)

        c = self._client("c@t.test")
        self.assertEqual(c.get(f"/api/threads/{thread.id}/messages/").status_code, 403)
