from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_bytes
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import BorrowRequest, Rating, Resource


class UserSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "display_name"]

    def get_display_name(self, obj):
        source = obj.get_full_name() or obj.email.split("@")[0]
        return " ".join(part.capitalize() for part in source.replace("-", " ").replace("_", " ").split())


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        normalized_email = value.strip().lower()
        domain = normalized_email.split("@")[-1]
        if "." not in normalized_email or not domain.endswith("nitw.ac.in"):
            raise serializers.ValidationError("Use a valid email ending with nitw.ac.in.")
        if User.objects.filter(email=normalized_email).exists():
            raise serializers.ValidationError("This email is already registered.")
        return normalized_email

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        user = User(username=attrs["email"], email=attrs["email"])
        validate_password(attrs["password"], user=user)
        return attrs

    def create(self, validated_data):
        email = validated_data["email"]
        password = validated_data["password"]
        return User.objects.create_user(username=email, email=email, password=password)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        return value.strip().lower()


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        normalized_email = value.strip().lower()
        domain = normalized_email.split("@")[-1]
        if "." not in normalized_email or not domain.endswith("nitw.ac.in"):
            raise serializers.ValidationError("Use a valid email ending with nitw.ac.in.")
        return normalized_email

    def save(self):
        email = self.validated_data["email"]
        user = User.objects.filter(email=email).first()
        if not user:
            return None

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
        send_mail(
            subject="Smart Campus Exchange password reset",
            message=f"Use this link to reset your password:\n{reset_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        return user


class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        try:
            user_id = force_str(urlsafe_base64_decode(attrs["uid"]))
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError) as exc:
            raise serializers.ValidationError({"detail": "Invalid or expired reset link."}) from exc

        if not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError({"detail": "Invalid or expired reset link."})

        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        validate_password(attrs["new_password"], user=user)
        attrs["user"] = user
        return attrs

    def save(self):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class ResourceSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    owner_email = serializers.EmailField(source="owner.email", read_only=True)
    image = serializers.URLField(source="image_url", allow_blank=True, required=False)
    availability = serializers.SerializerMethodField()

    class Meta:
        model = Resource
        fields = [
            "id",
            "title",
            "description",
            "category",
            "condition",
            "department",
            "location",
            "image",
            "owner",
            "owner_email",
            "availability",
            "available",
            "rating",
            "created_at",
        ]
        read_only_fields = ["id", "owner", "owner_email", "availability", "created_at"]

    def get_availability(self, obj):
        return "Available" if obj.available else "Borrowed"


class BorrowRequestSerializer(serializers.ModelSerializer):
    requester = UserSerializer(read_only=True)
    requester_email = serializers.EmailField(source="requester.email", read_only=True)
    resource_title = serializers.CharField(source="resource.title", read_only=True)

    class Meta:
        model = BorrowRequest
        fields = [
            "id",
            "resource",
            "resource_title",
            "requester",
            "requester_email",
            "status",
            "request_date",
        ]
        read_only_fields = ["request_date", "requester"]

    def validate(self, attrs):
        request = self.context.get("request")
        resource = attrs.get("resource")

        if request is None or request.user.is_anonymous:
            return attrs

        if resource.owner_id == request.user.id:
            raise serializers.ValidationError({"resource": "You cannot borrow your own resource."})

        if not resource.available:
            raise serializers.ValidationError({"resource": "This resource is not available right now."})

        existing_request = BorrowRequest.objects.filter(
            resource=resource,
            requester=request.user,
            status="pending",
        ).exists()
        if existing_request:
            raise serializers.ValidationError({"resource": "You already have a pending request for this resource."})

        return attrs


class RatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = "__all__"


class AuthResponseSerializer(serializers.Serializer):
    refresh = serializers.CharField()
    access = serializers.CharField()
    user = UserSerializer()

    @staticmethod
    def for_user(user):
        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UserSerializer(user).data,
        }
