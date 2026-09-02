from rest_framework import serializers

from .models import AudienceTag, Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug")


class AudienceTagSerializer(serializers.ModelSerializer):
    facet_label = serializers.CharField(source="get_facet_display", read_only=True)

    class Meta:
        model = AudienceTag
        fields = ("id", "facet", "facet_label", "name", "slug")
