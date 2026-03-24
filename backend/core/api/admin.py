from django.contrib import admin

from .models import BorrowRequest, Notification, Rating, Resource


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "category", "department", "available", "created_at")
    list_filter = ("available", "category", "department", "condition")
    search_fields = ("title", "description", "owner__email", "department", "location")


@admin.register(BorrowRequest)
class BorrowRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "resource", "requester", "status", "duration_days", "request_date", "completed_at")
    list_filter = ("status", "duration_days")
    search_fields = ("resource__title", "requester__email", "message")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "is_read", "created_at")
    list_filter = ("is_read",)
    search_fields = ("title", "message", "user__email")


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ("user", "score")
    search_fields = ("user__email", "review")
