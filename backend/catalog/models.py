from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    """Broad industry a business operates in (e.g. Coffee & Cafe, Yoga Studio)."""

    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=90, unique=True, blank=True)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ("name",)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class AudienceTag(models.Model):
    """A trait of a business's typical customer, grouped into facets."""

    class Facet(models.TextChoices):
        AGE = "age", "Age band"
        INTEREST = "interest", "Interest"
        PRICE = "price", "Price tier"
        LIFESTYLE = "lifestyle", "Lifestyle"

    facet = models.CharField(max_length=20, choices=Facet.choices)
    name = models.CharField(max_length=80)
    slug = models.SlugField(max_length=100, unique=True, blank=True)

    class Meta:
        ordering = ("facet", "name")
        unique_together = ("facet", "name")

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.facet}-{self.name}")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.get_facet_display()}: {self.name}"
