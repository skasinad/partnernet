from rest_framework import serializers

from catalog.models import AudienceTag, Category
from catalog.serializers import AudienceTagSerializer, CategorySerializer

from .models import Business


class BusinessListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    audience_tags = AudienceTagSerializer(many=True, read_only=True)
    location_label = serializers.CharField(read_only=True)

    class Meta:
        model = Business
        fields = (
            "id", "slug", "name", "tagline", "category", "audience_tags",
            "price_tier", "size", "city", "region", "country", "location_label",
            "website", "instagram", "logo", "open_to_partnerships",
        )


class BusinessDetailSerializer(BusinessListSerializer):
    is_owner = serializers.SerializerMethodField()

    class Meta(BusinessListSerializer.Meta):
        fields = BusinessListSerializer.Meta.fields + (
            "description", "partnership_pitch", "contact_email",
            "latitude", "longitude", "created_at", "is_owner",
        )

    def get_is_owner(self, obj) -> bool:
        request = self.context.get("request")
        return bool(request and request.user.is_authenticated and obj.owner_id == request.user.id)


class BusinessWriteSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        source="category", queryset=Category.objects.all()
    )
    audience_tag_ids = serializers.PrimaryKeyRelatedField(
        source="audience_tags", queryset=AudienceTag.objects.all(),
        many=True, required=False,
    )

    class Meta:
        model = Business
        fields = (
            "id", "name", "tagline", "description", "category_id",
            "audience_tag_ids", "price_tier", "size", "city", "region",
            "country", "latitude", "longitude", "website", "instagram",
            "contact_email", "logo", "open_to_partnerships", "partnership_pitch",
        )

    def validate_audience_tag_ids(self, value):
        if len(value) > 12:
            raise serializers.ValidationError("Pick at most 12 audience tags.")
        return value

    def create(self, validated_data):
        tags = validated_data.pop("audience_tags", [])
        business = Business.objects.create(
            owner=self.context["request"].user, **validated_data
        )
        business.audience_tags.set(tags)
        return business

    def update(self, instance, validated_data):
        tags = validated_data.pop("audience_tags", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        if tags is not None:
            instance.audience_tags.set(tags)
        return instance

    def to_representation(self, instance):
        return BusinessDetailSerializer(instance, context=self.context).data


class MatchSerializer(serializers.Serializer):
    """A candidate business plus its compatibility breakdown."""

    business = BusinessListSerializer()
    match = serializers.DictField()
