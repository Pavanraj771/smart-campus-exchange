from django.contrib.auth import authenticate
from django.db import transaction
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response

from .models import BorrowRequest, Notification, Rating, Resource
from .serializers import (
    AuthResponseSerializer,
    BorrowRequestSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    LoginSerializer,
    NotificationSerializer,
    ProfileUpdateSerializer,
    RatingSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    ResourceSerializer,
    UserSerializer,
)


def create_notification(*, user, title, message, link=""):
    Notification.objects.create(user=user, title=title, message=message, link=link)


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
        resource = serializer.save(owner=self.request.user)
        create_notification(
            user=self.request.user,
            title="Resource listed",
            message=f"Your resource '{resource.title}' is now live in the marketplace.",
            link=f"/resources/{resource.id}",
        )

    def perform_update(self, serializer):
        resource = serializer.save()
        create_notification(
            user=self.request.user,
            title="Resource updated",
            message=f"Your resource '{resource.title}' was updated successfully.",
            link=f"/resources/{resource.id}",
        )

    def perform_destroy(self, instance):
        create_notification(
            user=self.request.user,
            title="Resource deleted",
            message=f"Your resource '{instance.title}' was removed from the marketplace.",
            link="/my-resources",
        )
        instance.delete()


class BorrowRequestViewSet(viewsets.ModelViewSet):
    queryset = BorrowRequest.objects.select_related("resource", "requester", "resource__owner").all()
    serializer_class = BorrowRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(requester=self.request.user)

    def perform_create(self, serializer):
        borrow_request = serializer.save(requester=self.request.user)
        create_notification(
            user=borrow_request.resource.owner,
            title="New borrow request",
            message=f"{borrow_request.requester.email} requested '{borrow_request.resource.title}'.",
            link="/incoming-requests",
        )
        create_notification(
            user=borrow_request.requester,
            title="Borrow request sent",
            message=f"Your request for '{borrow_request.resource.title}' was sent.",
            link="/requests",
        )

    def destroy(self, request, *args, **kwargs):
        borrow_request = self.get_object()

        if borrow_request.requester_id != request.user.id:
            return Response(
                {"detail": "You can only cancel your own borrow requests."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if borrow_request.status != "pending":
            return Response(
                {"detail": "Only pending requests can be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        resource_title = borrow_request.resource.title
        owner = borrow_request.resource.owner
        borrow_request.delete()
        create_notification(
            user=owner,
            title="Borrow request cancelled",
            message=f"A borrower cancelled the request for '{resource_title}'.",
            link="/incoming-requests",
        )
        create_notification(
            user=request.user,
            title="Borrow request cancelled",
            message=f"You cancelled your request for '{resource_title}'.",
            link="/requests",
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"], url_path="incoming")
    def incoming(self, request):
        incoming_requests = self.queryset.filter(resource__owner=request.user)
        serializer = self.get_serializer(incoming_requests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="accept")
    def accept(self, request, pk=None):
        borrow_request = self.queryset.filter(pk=pk).first()
        if borrow_request is None:
            return Response({"detail": "Borrow request not found."}, status=status.HTTP_404_NOT_FOUND)

        if borrow_request.resource.owner_id != request.user.id:
            return Response({"detail": "You can only accept requests for your own resources."}, status=status.HTTP_403_FORBIDDEN)

        if borrow_request.status != "pending":
            return Response({"detail": "Only pending requests can be accepted."}, status=status.HTTP_400_BAD_REQUEST)

        if not borrow_request.resource.available:
            return Response({"detail": "This resource is no longer available."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            borrow_request.status = "accepted"
            borrow_request.save(update_fields=["status"])

            resource = borrow_request.resource
            resource.available = False
            resource.save(update_fields=["available"])

            self.queryset.filter(resource=resource, status="pending").exclude(pk=borrow_request.pk).update(status="rejected")

        create_notification(
            user=borrow_request.requester,
            title="Borrow request accepted",
            message=f"Your request for '{borrow_request.resource.title}' was accepted.",
            link="/requests",
        )
        create_notification(
            user=request.user,
            title="Resource lent out",
            message=f"You accepted a request for '{borrow_request.resource.title}'.",
            link="/incoming-requests",
        )
        serializer = self.get_serializer(borrow_request)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        borrow_request = self.queryset.filter(pk=pk).first()
        if borrow_request is None:
            return Response({"detail": "Borrow request not found."}, status=status.HTTP_404_NOT_FOUND)

        if borrow_request.resource.owner_id != request.user.id:
            return Response({"detail": "You can only reject requests for your own resources."}, status=status.HTTP_403_FORBIDDEN)

        if borrow_request.status != "pending":
            return Response({"detail": "Only pending requests can be rejected."}, status=status.HTTP_400_BAD_REQUEST)

        borrow_request.status = "rejected"
        borrow_request.save(update_fields=["status"])
        create_notification(
            user=borrow_request.requester,
            title="Borrow request rejected",
            message=f"Your request for '{borrow_request.resource.title}' was rejected.",
            link="/requests",
        )
        serializer = self.get_serializer(borrow_request)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        borrow_request = self.queryset.filter(pk=pk).first()
        if borrow_request is None:
            return Response({"detail": "Borrow request not found."}, status=status.HTTP_404_NOT_FOUND)

        if borrow_request.resource.owner_id != request.user.id:
            return Response({"detail": "You can only complete requests for your own resources."}, status=status.HTTP_403_FORBIDDEN)

        if borrow_request.status != "accepted":
            return Response({"detail": "Only accepted requests can be completed."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            borrow_request.status = "returned"
            borrow_request.completed_at = timezone.now()
            borrow_request.save(update_fields=["status", "completed_at"])

            resource = borrow_request.resource
            resource.available = True
            resource.save(update_fields=["available"])

        create_notification(
            user=borrow_request.requester,
            title="Borrow completed",
            message=f"'{borrow_request.resource.title}' was marked as returned and is available again.",
            link="/requests",
        )
        create_notification(
            user=request.user,
            title="Resource returned",
            message=f"'{borrow_request.resource.title}' was marked as returned.",
            link="/incoming-requests",
        )
        serializer = self.get_serializer(borrow_request)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=["post"], url_path="read")
    def read(self, request, pk=None):
        notification = self.get_queryset().filter(pk=pk).first()
        if notification is None:
            return Response({"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response(self.get_serializer(notification).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"detail": "All notifications marked as read."}, status=status.HTTP_200_OK)


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


@api_view(["GET", "PATCH"])
@permission_classes([permissions.IsAuthenticated])
def current_user_view(request):
    if request.method == "GET":
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)

    serializer = ProfileUpdateSerializer(instance=request.user, data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    create_notification(
        user=user,
        title="Profile updated",
        message="Your profile information was updated.",
        link="/profile",
    )
    return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def change_password_view(request):
    serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    serializer.save()
    create_notification(
        user=request.user,
        title="Password changed",
        message="Your account password was updated successfully.",
        link="/profile",
    )
    return Response({"detail": "Password changed successfully."}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def forgot_password_view(request):
    serializer = ForgotPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(
        {"detail": "If an account exists for that email, a reset link has been sent."},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def reset_password_view(request):
    serializer = ResetPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(
        {"detail": "Password reset successful. You can now login with your new password."},
        status=status.HTTP_200_OK,
    )
