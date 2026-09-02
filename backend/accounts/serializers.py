from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ("id", "email", "full_name", "password")

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    has_business = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "email", "full_name", "has_business")

    def get_has_business(self, obj) -> bool:
        return hasattr(obj, "business")


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adds the serialized user to the token response for convenience."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
