from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from businesses.matching import score_pair
from businesses.models import Business
from catalog.models import AudienceTag, Category

User = get_user_model()


def make_business(owner, category, *, tags=(), **kwargs):
    biz = Business.objects.create(
        owner=owner,
        name=kwargs.pop("name", "Test Co"),
        category=category,
        city=kwargs.pop("city", "Portland"),
        region=kwargs.pop("region", "Oregon"),
        **kwargs,
    )
    biz.audience_tags.set(tags)
    return biz


class MatchingTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.cafe = Category.objects.create(name="Coffee & Cafe")
        cls.books = Category.objects.create(name="Bookshop")
        cls.gym = Category.objects.create(name="Gym & Fitness")
        cls.t_design = AudienceTag.objects.create(facet="interest", name="Design-led")
        cls.t_remote = AudienceTag.objects.create(facet="lifestyle", name="Remote workers")
        cls.t_fit = AudienceTag.objects.create(facet="interest", name="Fitness")

        u = lambda n: User.objects.create_user(email=f"{n}@t.test", password="x")
        cls.a = make_business(u("a"), cls.cafe, tags=[cls.t_design, cls.t_remote],
                              name="Cafe A", price_tier="mid", latitude=45.52, longitude=-122.68)
        cls.b = make_business(u("b"), cls.books, tags=[cls.t_design, cls.t_remote],
                              name="Books B", price_tier="mid", latitude=45.53, longitude=-122.67)
        cls.c = make_business(u("c"), cls.gym, tags=[cls.t_fit],
                              name="Gym C", price_tier="premium", city="Austin", region="Texas")
        cls.d = make_business(u("d"), cls.cafe, tags=[cls.t_design, cls.t_remote],
                              name="Cafe D", price_tier="mid", city="Austin", region="Texas")

    def test_adjacent_industry_with_shared_audience_scores_high(self):
        result = score_pair(self.a, self.b)
        self.assertGreaterEqual(result.score, 75)
        self.assertIn("Design-led", result.shared_tags)

    def test_direct_competitor_far_away_scores_low(self):
        # Same category (cafe) but different city and no shared tags emphasis:
        # audience is identical here, so it should still not beat the adjacent pair.
        competitor = score_pair(self.a, self.d)
        adjacent = score_pair(self.a, self.b)
        self.assertLess(competitor.score, adjacent.score)

    def test_unrelated_business_scores_low(self):
        result = score_pair(self.a, self.c)
        self.assertLess(result.score, 35)

    def test_score_is_symmetric(self):
        self.assertEqual(score_pair(self.a, self.b).score, score_pair(self.b, self.a).score)

    def test_proximity_uses_coordinates_when_present(self):
        near = score_pair(self.a, self.b).proximity
        self.assertGreaterEqual(near, 90)


class BusinessApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.cat = Category.objects.create(name="Florist")
        cls.tag = AudienceTag.objects.create(facet="interest", name="Weddings")

    def setUp(self):
        self.client = APIClient()

    def _register_and_login(self, email="owner@t.test"):
        self.client.post("/api/auth/register/", {
            "email": email, "password": "sturdy-pass-9", "full_name": "Owner",
        }, format="json")
        res = self.client.post("/api/auth/login/", {
            "email": email, "password": "sturdy-pass-9",
        }, format="json")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
        return res.data["user"]

    def test_register_then_create_business(self):
        user = self._register_and_login()
        self.assertFalse(user["has_business"])

        res = self.client.post("/api/businesses/", {
            "name": "Bloom Room", "category_id": self.cat.id,
            "audience_tag_ids": [self.tag.id], "city": "Seattle",
            "price_tier": "mid", "size": "micro",
        }, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data["slug"], "bloom-room")

        me = self.client.get("/api/auth/me/")
        self.assertTrue(me.data["has_business"])

    def test_cannot_create_second_business(self):
        self._register_and_login()
        payload = {
            "name": "One", "category_id": self.cat.id,
            "audience_tag_ids": [self.tag.id], "city": "Seattle",
        }
        self.assertEqual(self.client.post("/api/businesses/", payload, format="json").status_code, 201)
        self.assertEqual(self.client.post("/api/businesses/", payload, format="json").status_code, 403)

    def test_discovery_is_public(self):
        self.assertEqual(APIClient().get("/api/businesses/").status_code, 200)

    def test_matches_requires_business(self):
        self._register_and_login()
        self.assertEqual(self.client.get("/api/businesses/matches/").status_code, 404)
