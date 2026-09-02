from rest_framework import permissions, viewsets

from .models import AudienceTag, Category
from .serializers import AudienceTagSerializer, CategorySerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class AudienceTagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AudienceTag.objects.all()
    serializer_class = AudienceTagSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None
    filterset_fields = ("facet",)
