from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    BorrowRequestViewSet,
    RatingViewSet,
    ResourceViewSet,
    NotificationViewSet,
    change_password_view,
    current_user_view,
    forgot_password_view,
    login_view,
    reset_password_view,
    register_view,
)

router = DefaultRouter()
router.register('resources', ResourceViewSet)
router.register('borrow', BorrowRequestViewSet)
router.register('notifications', NotificationViewSet, basename='notifications')
router.register('ratings', RatingViewSet)

urlpatterns = [
    path("auth/register/", register_view, name="register"),
    path("auth/login/", login_view, name="login"),
    path("auth/forgot-password/", forgot_password_view, name="forgot-password"),
    path("auth/reset-password/", reset_password_view, name="reset-password"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("auth/me/", current_user_view, name="current-user"),
    path("auth/change-password/", change_password_view, name="change-password"),
    path('', include(router.urls)),
]
