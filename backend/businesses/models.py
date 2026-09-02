from django.conf import settings
from django.db import models
from django.utils.text import slugify

from catalog.models import AudienceTag, Category


class Business(models.Model):
    """A small business's public-facing profile."""

    class Size(models.TextChoices):
        SOLO = "solo", "Solo / founder-only"
        MICRO = "micro", "2-9 people"
        SMALL = "small", "10-49 people"
        MEDIUM = "medium", "50-249 people"

    class PriceTier(models.TextChoices):
        BUDGET = "budget", "Budget"
        MID = "mid", "Mid-range"
        PREMIUM = "premium", "Premium"

    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="business"
    )
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    tagline = models.CharField(max_length=160, blank=True)
    description = models.TextField(blank=True)

    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="businesses"
    )
    audience_tags = models.ManyToManyField(
        AudienceTag, related_name="businesses", blank=True
    )
    price_tier = models.CharField(
        max_length=10, choices=PriceTier.choices, default=PriceTier.MID
    )
    size = models.CharField(max_length=10, choices=Size.choices, default=Size.MICRO)

    # Location — city/region is required, coordinates optional for proximity.
    city = models.CharField(max_length=100)
    region = models.CharField(max_length=100, blank=True, help_text="State / province")
    country = models.CharField(max_length=100, default="United States")
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    website = models.URLField(blank=True)
    instagram = models.CharField(max_length=60, blank=True)
    contact_email = models.EmailField(blank=True)
    logo = models.ImageField(upload_to="logos/", null=True, blank=True)

    open_to_partnerships = models.BooleanField(default=True)
    partnership_pitch = models.TextField(
        blank=True, help_text="What kind of collaboration are you looking for?"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("name",)
        verbose_name_plural = "businesses"

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name) or "business"
            slug = base
            i = 2
            while Business.objects.exclude(pk=self.pk).filter(slug=slug).exists():
                slug = f"{base}-{i}"
                i += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    @property
    def location_label(self) -> str:
        parts = [p for p in (self.city, self.region) if p]
        return ", ".join(parts)
