from django.contrib import admin

from .models import Connection, PartnershipRequest


@admin.register(PartnershipRequest)
class PartnershipRequestAdmin(admin.ModelAdmin):
    list_display = ("from_business", "to_business", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("from_business__name", "to_business__name")


@admin.register(Connection)
class ConnectionAdmin(admin.ModelAdmin):
    list_display = ("business_a", "business_b", "created_at")
    search_fields = ("business_a__name", "business_b__name")
