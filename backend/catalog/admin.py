from django.contrib import admin

from .models import AudienceTag, Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(AudienceTag)
class AudienceTagAdmin(admin.ModelAdmin):
    list_display = ("name", "facet", "slug")
    list_filter = ("facet",)
