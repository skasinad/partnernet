from rest_framework import serializers

from businesses.serializers import BusinessListSerializer

from .models import Message, Thread


class MessageSerializer(serializers.ModelSerializer):
    mine = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ("id", "body", "created_at", "sender", "mine")
        read_only_fields = ("sender",)

    def get_mine(self, obj) -> bool:
        return obj.sender_id == self.context.get("business_id")


class ThreadSerializer(serializers.ModelSerializer):
    partner = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Thread
        fields = ("id", "partner", "last_message", "unread_count", "updated_at")

    def get_partner(self, obj):
        mine = self.context["business_id"]
        return BusinessListSerializer(obj.other_than(mine), context=self.context).data

    def get_last_message(self, obj):
        msg = obj.messages.all().last()
        if not msg:
            return None
        return {"body": msg.body, "created_at": msg.created_at,
                "mine": msg.sender_id == self.context["business_id"]}

    def get_unread_count(self, obj) -> int:
        mine = self.context["business_id"]
        cutoff = obj.last_read_for(mine)
        qs = obj.messages.exclude(sender_id=mine)
        if cutoff:
            qs = qs.filter(created_at__gt=cutoff)
        return qs.count()
