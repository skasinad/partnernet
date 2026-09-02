from rest_framework.routers import DefaultRouter

from .views import ConnectionViewSet, PartnershipRequestViewSet

router = DefaultRouter()
router.register("partnership-requests", PartnershipRequestViewSet, basename="partnership-request")
router.register("connections", ConnectionViewSet, basename="connection")

urlpatterns = router.urls
