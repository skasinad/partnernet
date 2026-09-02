from django.db import models
from django.db.models import Q

from businesses.models import Business


class Thread(models.Model):
    """A 1:1 conversation between two connected businesses."""

    business_a = models.ForeignKey(
        Business, on_delete=models.CASCADE, related_name="threads_as_a"
    )
    business_b = models.ForeignKey(
        Business, on_delete=models.CASCADE, related_name="threads_as_b"
    )
    last_read_a = models.DateTimeField(null=True, blank=True)
    last_read_b = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-updated_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["business_a", "business_b"], name="unique_thread_pair"
            ),
        ]

    @classmethod
    def get_or_create_between(cls, b1, b2):
        lo, hi = sorted([b1.id, b2.id])
        return cls.objects.get_or_create(business_a_id=lo, business_b_id=hi)

    def participant_ids(self) -> set[int]:
        return {self.business_a_id, self.business_b_id}

    def other_than(self, business_id: int) -> Business:
        return self.business_b if self.business_a_id == business_id else self.business_a

    def last_read_for(self, business_id: int):
        return self.last_read_a if business_id == self.business_a_id else self.last_read_b

    def mark_read(self, business_id, when):
        if business_id == self.business_a_id:
            self.last_read_a = when
            self.save(update_fields=["last_read_a"])
        else:
            self.last_read_b = when
            self.save(update_fields=["last_read_b"])

    def __str__(self):
        return f"Thread {self.business_a_id}<->{self.business_b_id}"


class Message(models.Model):
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(
        Business, on_delete=models.CASCADE, related_name="sent_messages"
    )
    body = models.TextField(max_length=4000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at",)

    def __str__(self):
        return f"{self.sender_id}: {self.body[:40]}"
