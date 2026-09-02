from django.db import models
from django.db.models import Q

from businesses.models import Business


class PartnershipRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        DECLINED = "declined", "Declined"
        WITHDRAWN = "withdrawn", "Withdrawn"

    from_business = models.ForeignKey(
        Business, on_delete=models.CASCADE, related_name="sent_requests"
    )
    to_business = models.ForeignKey(
        Business, on_delete=models.CASCADE, related_name="received_requests"
    )
    message = models.TextField(max_length=1000)
    status = models.CharField(
        max_length=12, choices=Status.choices, default=Status.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)
        constraints = [
            models.CheckConstraint(
                condition=~Q(from_business=models.F("to_business")),
                name="partnership_request_not_self",
            ),
            models.UniqueConstraint(
                fields=["from_business", "to_business"],
                condition=Q(status="pending"),
                name="one_pending_request_per_pair",
            ),
        ]

    def __str__(self):
        return f"{self.from_business} -> {self.to_business} ({self.status})"


class Connection(models.Model):
    """A confirmed partnership. Created when a request is accepted."""

    business_a = models.ForeignKey(
        Business, on_delete=models.CASCADE, related_name="connections_as_a"
    )
    business_b = models.ForeignKey(
        Business, on_delete=models.CASCADE, related_name="connections_as_b"
    )
    source_request = models.OneToOneField(
        PartnershipRequest, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["business_a", "business_b"], name="unique_connection_pair"
            ),
        ]

    @classmethod
    def between(cls, b1_id: int, b2_id: int):
        lo, hi = sorted([b1_id, b2_id])
        return cls.objects.filter(business_a_id=lo, business_b_id=hi).first()

    @classmethod
    def create_for(cls, b1, b2, request=None):
        lo, hi = sorted([b1.id, b2.id])
        obj, _ = cls.objects.get_or_create(
            business_a_id=lo, business_b_id=hi,
            defaults={"source_request": request},
        )
        return obj

    def other_than(self, business_id: int):
        return self.business_b if self.business_a_id == business_id else self.business_a

    def __str__(self):
        return f"{self.business_a} <-> {self.business_b}"
