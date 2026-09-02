"""
Compatibility scoring between two businesses.

The score (0-100) is a transparent weighted blend of three signals:

  * audience overlap  (55%) - Jaccard similarity of audience tags, with a small
                              bonus when the price tier matches.
  * category affinity (25%) - same category, or a curated "adjacent" pairing
                              (a cafe and a bookshop share customers without
                              competing).
  * proximity         (20%) - same city, same region, or a distance falloff when
                              both businesses have coordinates.

Everything here is pure functions so it is easy to unit test and reason about.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

WEIGHTS = {"audience": 0.55, "category": 0.25, "proximity": 0.20}

# Categories that draw a similar consumer base without directly competing.
# Stored as frozensets of category slugs; symmetric by construction.
ADJACENT_CATEGORIES = [
    frozenset({"coffee-cafe", "bookshop"}),
    frozenset({"coffee-cafe", "bakery"}),
    frozenset({"yoga-studio", "juice-bar"}),
    frozenset({"yoga-studio", "wellness-spa"}),
    frozenset({"gym-fitness", "juice-bar"}),
    frozenset({"gym-fitness", "sports-nutrition"}),
    frozenset({"hair-salon", "nail-salon"}),
    frozenset({"hair-salon", "boutique-clothing"}),
    frozenset({"boutique-clothing", "jewelry"}),
    frozenset({"florist", "event-planning"}),
    frozenset({"florist", "wedding-photography"}),
    frozenset({"pet-grooming", "pet-supplies"}),
    frozenset({"craft-brewery", "pizzeria"}),
    frozenset({"craft-brewery", "record-store"}),
    frozenset({"bookshop", "stationery"}),
    frozenset({"interior-design", "furniture-store"}),
    frozenset({"coworking-space", "coffee-cafe"}),
]


@dataclass(frozen=True)
class MatchBreakdown:
    score: int
    audience: int
    category: int
    proximity: int
    shared_tags: list[str]
    reason: str

    def as_dict(self) -> dict:
        return {
            "score": self.score,
            "components": {
                "audience": self.audience,
                "category": self.category,
                "proximity": self.proximity,
            },
            "shared_tags": self.shared_tags,
            "reason": self.reason,
        }


def _haversine_km(lat1, lon1, lat2, lon2) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _audience_score(a, b) -> tuple[float, list[str]]:
    tags_a = {t.slug: t.name for t in a.audience_tags.all()}
    tags_b = {t.slug: t.name for t in b.audience_tags.all()}
    if not tags_a or not tags_b:
        base = 0.0
        shared: list[str] = []
    else:
        shared_slugs = set(tags_a) & set(tags_b)
        union = set(tags_a) | set(tags_b)
        base = len(shared_slugs) / len(union)
        shared = sorted(tags_a[s] for s in shared_slugs)
    if a.price_tier == b.price_tier:
        base = min(1.0, base + 0.12)
    return base, shared


def _category_score(a, b) -> float:
    if a.category_id == b.category_id:
        return 1.0
    pair = frozenset({a.category.slug, b.category.slug})
    if pair in ADJACENT_CATEGORIES:
        return 0.7
    return 0.15


def _proximity_score(a, b) -> float:
    if None not in (a.latitude, a.longitude, b.latitude, b.longitude):
        dist = _haversine_km(a.latitude, a.longitude, b.latitude, b.longitude)
        if dist <= 3:
            return 1.0
        if dist >= 60:
            return 0.1
        return round(1.0 - (dist - 3) / 57 * 0.9, 3)
    if a.city and a.city.strip().lower() == b.city.strip().lower():
        return 0.85
    if a.region and a.region.strip().lower() == b.region.strip().lower():
        return 0.45
    return 0.1


def _describe(audience, category, proximity, shared_tags) -> str:
    bits = []
    if shared_tags:
        preview = ", ".join(shared_tags[:3])
        bits.append(f"shares customers who are {preview}")
    if category >= 1.0:
        bits.append("same industry")
    elif category >= 0.7:
        bits.append("complementary industry")
    if proximity >= 0.85:
        bits.append("in the same city")
    elif proximity >= 0.45:
        bits.append("in the same region")
    return "; ".join(bits).capitalize() if bits else "Limited overlap"


def score_pair(a, b) -> MatchBreakdown:
    """Return the compatibility breakdown for businesses ``a`` and ``b``."""
    audience, shared_tags = _audience_score(a, b)
    category = _category_score(a, b)
    proximity = _proximity_score(a, b)

    total = (
        audience * WEIGHTS["audience"]
        + category * WEIGHTS["category"]
        + proximity * WEIGHTS["proximity"]
    )
    return MatchBreakdown(
        score=round(total * 100),
        audience=round(audience * 100),
        category=round(category * 100),
        proximity=round(proximity * 100),
        shared_tags=shared_tags,
        reason=_describe(audience, category, proximity, shared_tags),
    )
