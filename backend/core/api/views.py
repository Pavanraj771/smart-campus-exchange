from django.contrib.auth import authenticate
from django.db import transaction
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import BorrowRequest, Rating, Resource
from .serializers import (
    AuthResponseSerializer,
    BorrowRequestSerializer,
    ForgotPasswordSerializer,
    LoginSerializer,
    RatingSerializer,
    RegisterSerializer,
    ResourceSerializer,
    UserSerializer,
)


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user


class ResourceViewSet(viewsets.ModelViewSet):
    queryset = Resource.objects.select_related("owner").all()
    serializer_class = ResourceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class BorrowRequestViewSet(viewsets.ModelViewSet):
    queryset = BorrowRequest.objects.select_related("resource", "requester").all()
    serializer_class = BorrowRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(requester=self.request.user)

    def perform_create(self, serializer):
        serializer.save(requester=self.request.user)

    @action(detail=False, methods=["get"], url_path="incoming")
    def incoming(self, request):
        incoming_requests = self.queryset.filter(resource__owner=request.user)
        serializer = self.get_serializer(incoming_requests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="accept")
    def accept(self, request, pk=None):
        borrow_request = self.queryset.select_related("resource", "requester").filter(pk=pk).first()
        if borrow_request is None:
            return Response({"detail": "Borrow request not found."}, status=status.HTTP_404_NOT_FOUND)

        if borrow_request.resource.owner_id != request.user.id:
            return Response({"detail": "You can only accept requests for your own resources."}, status=status.HTTP_403_FORBIDDEN)

        if borrow_request.status != "pending":
            return Response({"detail": "Only pending requests can be accepted."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            borrow_request.status = "accepted"
            borrow_request.save(update_fields=["status"])

            resource = borrow_request.resource
            resource.available = False
            resource.save(update_fields=["available"])

            self.queryset.filter(resource=resource, status="pending").exclude(pk=borrow_request.pk).update(status="rejected")

        serializer = self.get_serializer(borrow_request)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RatingViewSet(viewsets.ModelViewSet):
    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response(AuthResponseSerializer.for_user(user), status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data["email"]
    password = serializer.validated_data["password"]
    user = authenticate(username=email, password=password)

    if user is None:
        return Response(
            {"detail": "Invalid email or password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(AuthResponseSerializer.for_user(user), status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def current_user_view(request):
    return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def forgot_password_view(request):
    serializer = ForgotPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(
        {"detail": "Password reset successful. You can now login with your new password."},
        status=status.HTTP_200_OK,
    )
