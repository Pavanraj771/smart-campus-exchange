from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BorrowRequestViewSet,
    RatingViewSet,
    ResourceViewSet,
    current_user_view,
    forgot_password_view,
    login_view,
    register_view,
)

router = DefaultRouter()
router.register('resources', ResourceViewSet)
router.register('borrow', BorrowRequestViewSet)
router.register('ratings', RatingViewSet)

urlpatterns = [
    path("auth/register/", register_view, name="register"),
    path("auth/login/", login_view, name="login"),
    path("auth/forgot-password/", forgot_password_view, name="forgot-password"),
    path("auth/me/", current_user_view, name="current-user"),
    path('', include(router.urls)),
]
