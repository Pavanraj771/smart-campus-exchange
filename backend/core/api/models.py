from django.contrib.auth.models import User
from django.db import models


class Resource(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=100)
    condition = models.CharField(max_length=100, default="")
    department = models.CharField(max_length=100, default="")
    location = models.CharField(max_length=200, default="")
    image_url = models.URLField(blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="resources")
    available = models.BooleanField(default=True)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=5.0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class BorrowRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name="borrow_requests")
    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name="borrow_requests")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    request_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.requester} -> {self.resource}"


class Rating(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ratings")
    score = models.IntegerField()
    review = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user} - {self.score}"
