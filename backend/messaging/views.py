from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import decorators, permissions, response, status, viewsets
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from businesses.models import Business
from partnerships.models import Connection

from .models import Message, Thread
from .serializers import MessageSerializer, ThreadSerializer


def _require_business(request):
    business = getattr(request.user, "business", None)
    if business is None:
        raise NotFound("Create a business profile first.")
    return business


class ThreadViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ThreadSerializer
    pagination_class = None

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["business_id"] = _require_business(self.request).id
        return ctx

    def get_queryset(self):
        business = _require_business(self.request)
        return (
            Thread.objects.filter(Q(business_a=business) | Q(business_b=business))
            .select_related("business_a__category", "business_b__category")
            .prefetch_related("messages", "business_a__audience_tags", "business_b__audience_tags")
        )

    def _load_thread(self, pk, business):
        thread = get_object_or_404(Thread, pk=pk)
        if business.id not in thread.participant_ids():
            raise PermissionDenied("Not your conversation.")
        return thread

    @decorators.action(detail=False, methods=["post"])
    def open(self, request):
        """Open (or reuse) a thread with a connected business by slug."""
        mine = _require_business(request)
        slug = request.data.get("business_slug")
        if not slug:
            raise ValidationError({"business_slug": "This field is required."})
        partner = get_object_or_404(Business, slug=slug)
        if partner.id == mine.id:
            raise ValidationError("That's your own business.")
        if not Connection.between(mine.id, partner.id):
            raise PermissionDenied("You can only message confirmed partners.")
        thread, _ = Thread.get_or_create_between(mine, partner)
        return response.Response(
            ThreadSerializer(thread, context={"business_id": mine.id, "request": request}).data,
            status=status.HTTP_200_OK,
        )

    @decorators.action(detail=True, methods=["get", "post"])
    def messages(self, request, pk=None):
        business = _require_business(request)
        thread = self._load_thread(pk, business)

        if request.method == "POST":
            body = (request.data.get("body") or "").strip()
            if not body:
                raise ValidationError({"body": "Message can't be empty."})
            msg = Message.objects.create(thread=thread, sender=business, body=body[:4000])
            Thread.objects.filter(pk=thread.pk).update(updated_at=timezone.now())
            thread.mark_read(business.id, timezone.now())
            return response.Response(
                MessageSerializer(msg, context={"business_id": business.id}).data,
                status=status.HTTP_201_CREATED,
            )

        thread.mark_read(business.id, timezone.now())
        qs = thread.messages.select_related("sender").all()
        return response.Response(
            MessageSerializer(qs, many=True, context={"business_id": business.id}).data
        )

    @decorators.action(detail=False, methods=["get"])
    def unread(self, request):
        business = _require_business(request)
        threads = self.get_queryset()
        total = 0
        for thread in threads:
            cutoff = thread.last_read_for(business.id)
            qs = thread.messages.exclude(sender_id=business.id)
            if cutoff:
                qs = qs.filter(created_at__gt=cutoff)
            total += qs.count()
        return response.Response({"unread": total})
