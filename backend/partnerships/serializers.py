from rest_framework import serializers

from businesses.models import Business
from businesses.serializers import BusinessListSerializer

from .models import Connection, PartnershipRequest


class PartnershipRequestSerializer(serializers.ModelSerializer):
    from_business = BusinessListSerializer(read_only=True)
    to_business = BusinessListSerializer(read_only=True)
    direction = serializers.SerializerMethodField()

    class Meta:
        model = PartnershipRequest
        fields = (
            "id", "from_business", "to_business", "message", "status",
            "direction", "created_at", "responded_at",
        )

    def get_direction(self, obj) -> str:
        mine = self.context.get("business_id")
        return "outgoing" if obj.from_business_id == mine else "incoming"


class PartnershipRequestCreateSerializer(serializers.ModelSerializer):
    to_business_slug = serializers.SlugField(write_only=True)

    class Meta:
        model = PartnershipRequest
        fields = ("id", "to_business_slug", "message")

    def validate(self, attrs):
        request = self.context["request"]
        mine = getattr(request.user, "business", None)
        if mine is None:
            raise serializers.ValidationError("Create a business profile first.")

        try:
            target = Business.objects.get(slug=attrs.pop("to_business_slug"))
        except Business.DoesNotExist:
            raise serializers.ValidationError({"to_business_slug": "Unknown business."})

        if target.id == mine.id:
            raise serializers.ValidationError("You can't partner with yourself.")
        if not target.open_to_partnerships:
            raise serializers.ValidationError("This business isn't open to partnerships.")
        if PartnershipRequest.objects.filter(
            from_business=mine, to_business=target, status="pending"
        ).exists():
            raise serializers.ValidationError("You already have a pending request here.")
        if Connection.between(mine.id, target.id):
            raise serializers.ValidationError("You're already connected.")

        attrs["from_business"] = mine
        attrs["to_business"] = target
        return attrs

    def create(self, validated_data):
        return PartnershipRequest.objects.create(**validated_data)

    def to_representation(self, instance):
        return PartnershipRequestSerializer(
            instance, context={**self.context, "business_id": instance.from_business_id}
        ).data


class ConnectionSerializer(serializers.ModelSerializer):
    partner = serializers.SerializerMethodField()

    class Meta:
        model = Connection
        fields = ("id", "partner", "created_at")

    def get_partner(self, obj):
        mine = self.context.get("business_id")
        partner = obj.other_than(mine)
        return BusinessListSerializer(partner, context=self.context).data
