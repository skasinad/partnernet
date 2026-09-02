from django.db.models import Q
from django.utils import timezone
from rest_framework import decorators, permissions, response, status, viewsets
from rest_framework.exceptions import NotFound, PermissionDenied

from .models import Connection, PartnershipRequest
from .serializers import (
    ConnectionSerializer,
    PartnershipRequestCreateSerializer,
    PartnershipRequestSerializer,
)


def _require_business(request):
    business = getattr(request.user, "business", None)
    if business is None:
        raise NotFound("Create a business profile first.")
    return business


class PartnershipRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_serializer_class(self):
        if self.action == "create":
            return PartnershipRequestCreateSerializer
        return PartnershipRequestSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        business = getattr(self.request.user, "business", None)
        ctx["business_id"] = business.id if business else None
        return ctx

    def get_queryset(self):
        business = _require_business(self.request)
        qs = PartnershipRequest.objects.select_related(
            "from_business__category", "to_business__category"
        ).prefetch_related("from_business__audience_tags", "to_business__audience_tags")
        qs = qs.filter(Q(from_business=business) | Q(to_business=business))

        box = self.request.query_params.get("box")
        if box == "incoming":
            qs = qs.filter(to_business=business)
        elif box == "outgoing":
            qs = qs.filter(from_business=business)
        state = self.request.query_params.get("status")
        if state:
            qs = qs.filter(status=state)
        return qs

    def _respond(self, request, pk, new_status):
        business = _require_business(request)
        try:
            obj = PartnershipRequest.objects.get(pk=pk)
        except PartnershipRequest.DoesNotExist:
            raise NotFound

        if new_status in {"accepted", "declined"} and obj.to_business_id != business.id:
            raise PermissionDenied("Only the recipient can respond to this request.")
        if new_status == "withdrawn" and obj.from_business_id != business.id:
            raise PermissionDenied("Only the sender can withdraw this request.")
        if obj.status != "pending":
            return response.Response(
                {"detail": f"Request is already {obj.status}."},
                status=status.HTTP_409_CONFLICT,
            )

        obj.status = new_status
        obj.responded_at = timezone.now()
        obj.save(update_fields=["status", "responded_at"])

        if new_status == "accepted":
            Connection.create_for(obj.from_business, obj.to_business, request=obj)

        return response.Response(
            PartnershipRequestSerializer(
                obj, context={"business_id": business.id, "request": request}
            ).data
        )

    @decorators.action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        return self._respond(request, pk, "accepted")

    @decorators.action(detail=True, methods=["post"])
    def decline(self, request, pk=None):
        return self._respond(request, pk, "declined")

    @decorators.action(detail=True, methods=["post"])
    def withdraw(self, request, pk=None):
        return self._respond(request, pk, "withdrawn")

    @decorators.action(detail=False, methods=["get"])
    def summary(self, request):
        business = _require_business(request)
        incoming_pending = PartnershipRequest.objects.filter(
            to_business=business, status="pending"
        ).count()
        outgoing_pending = PartnershipRequest.objects.filter(
            from_business=business, status="pending"
        ).count()
        connections = Connection.objects.filter(
            Q(business_a=business) | Q(business_b=business)
        ).count()
        return response.Response({
            "incoming_pending": incoming_pending,
            "outgoing_pending": outgoing_pending,
            "connections": connections,
        })


class ConnectionViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ConnectionSerializer
    pagination_class = None

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["business_id"] = _require_business(self.request).id
        return ctx

    def get_queryset(self):
        business = _require_business(self.request)
        return (
            Connection.objects.filter(Q(business_a=business) | Q(business_b=business))
            .select_related("business_a__category", "business_b__category")
            .prefetch_related("business_a__audience_tags", "business_b__audience_tags")
        )
