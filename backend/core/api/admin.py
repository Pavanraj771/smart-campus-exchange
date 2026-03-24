from django.contrib import admin
from .models import Resource, BorrowRequest, Rating

admin.site.register(Resource)
admin.site.register(BorrowRequest)
admin.site.register(Rating)