from django.db.models import Prefetch
from rest_framework import decorators, mixins, permissions, response, status, viewsets
from rest_framework.exceptions import NotFound, PermissionDenied

from .filters import BusinessFilter
from .matching import score_pair
from .models import Business
from .serializers import (
    BusinessDetailSerializer,
    BusinessListSerializer,
    BusinessWriteSerializer,
)


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner_id == request.user.id


def _base_queryset():
    return Business.objects.select_related("category", "owner").prefetch_related(
        "audience_tags"
    )


class BusinessViewSet(viewsets.ModelViewSet):
    lookup_field = "slug"
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filterset_class = BusinessFilter
    search_fields = ("name", "tagline", "description", "city")
    ordering_fields = ("created_at", "name")
    ordering = ("-created_at",)

    def get_queryset(self):
        return _base_queryset()

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return BusinessWriteSerializer
        if self.action == "retrieve":
            return BusinessDetailSerializer
        return BusinessListSerializer

    def perform_create(self, serializer):
        if hasattr(self.request.user, "business"):
            raise PermissionDenied("You already have a business profile.")
        serializer.save()

    @decorators.action(detail=False, methods=["get", "put", "patch"],
                       permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        business = getattr(request.user, "business", None)
        if request.method == "GET":
            if business is None:
                return response.Response(
                    {"detail": "No business profile yet."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            return response.Response(
                BusinessDetailSerializer(business, context={"request": request}).data
            )

        if business is None:
            raise NotFound("Create a business profile first.")
        serializer = BusinessWriteSerializer(
            business, data=request.data,
            partial=request.method == "PATCH", context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return response.Response(serializer.data)

    @decorators.action(detail=False, methods=["get"],
                       permission_classes=[permissions.IsAuthenticated])
    def matches(self, request):
        """Ranked partnership candidates for the caller's business."""
        mine = getattr(request.user, "business", None)
        if mine is None:
            raise NotFound("Create a business profile to see matches.")

        min_score = int(request.query_params.get("min_score", 0))
        candidates = (
            _base_queryset()
            .filter(open_to_partnerships=True)
            .exclude(pk=mine.pk)
        )

        scored = []
        for other in candidates:
            breakdown = score_pair(mine, other)
            if breakdown.score >= min_score:
                scored.append((breakdown.score, other, breakdown))
        scored.sort(key=lambda row: row[0], reverse=True)

        limit = min(int(request.query_params.get("limit", 24)), 60)
        payload = [
            {
                "business": BusinessListSerializer(other, context={"request": request}).data,
                "match": breakdown.as_dict(),
            }
            for _, other, breakdown in scored[:limit]
        ]
        return response.Response({"count": len(payload), "results": payload})

    @decorators.action(detail=True, methods=["get"],
                       permission_classes=[permissions.IsAuthenticated])
    def compatibility(self, request, slug=None):
        """Compatibility breakdown between the caller's business and this one."""
        mine = getattr(request.user, "business", None)
        if mine is None:
            raise NotFound("Create a business profile first.")
        other = self.get_object()
        if other.pk == mine.pk:
            return response.Response({"detail": "That's your own business."},
                                     status=status.HTTP_400_BAD_REQUEST)
        return response.Response(score_pair(mine, other).as_dict())
