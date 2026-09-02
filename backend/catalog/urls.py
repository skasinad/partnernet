from rest_framework.routers import DefaultRouter

from .views import AudienceTagViewSet, CategoryViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("audience-tags", AudienceTagViewSet, basename="audience-tag")

urlpatterns = router.urls
