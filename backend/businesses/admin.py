from django.contrib import admin

from .models import Business


@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "city", "price_tier", "open_to_partnerships")
    list_filter = ("category", "price_tier", "size", "open_to_partnerships")
    search_fields = ("name", "city", "description")
    filter_horizontal = ("audience_tags",)
    prepopulated_fields = {"slug": ("name",)}
    autocomplete_fields = ("owner",)
