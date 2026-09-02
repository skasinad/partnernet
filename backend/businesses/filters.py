import django_filters as filters

from .models import Business


class BusinessFilter(filters.FilterSet):
    category = filters.CharFilter(field_name="category__slug", lookup_expr="iexact")
    audience_tag = filters.CharFilter(method="filter_audience_tag")
    price_tier = filters.CharFilter(field_name="price_tier")
    city = filters.CharFilter(field_name="city", lookup_expr="icontains")
    region = filters.CharFilter(field_name="region", lookup_expr="icontains")
    open_to_partnerships = filters.BooleanFilter(field_name="open_to_partnerships")

    class Meta:
        model = Business
        fields = ["category", "audience_tag", "price_tier", "city", "region"]

    def filter_audience_tag(self, queryset, name, value):
        slugs = [s.strip() for s in value.split(",") if s.strip()]
        for slug in slugs:
            queryset = queryset.filter(audience_tags__slug=slug)
        return queryset.distinct()
