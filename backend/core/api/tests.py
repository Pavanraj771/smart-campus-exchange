from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import BorrowRequest, Resource


class AuthApiTests(APITestCase):
    def test_register_creates_user_and_returns_tokens(self):
        response = self.client.post(
            reverse("register"),
            {
                "email": "student@nitw.ac.in",
                "password": "StrongPass123!",
                "confirm_password": "StrongPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertEqual(response.data["user"]["email"], "student@nitw.ac.in")
        self.assertTrue(User.objects.filter(email="student@nitw.ac.in").exists())

    def test_login_requires_valid_credentials(self):
        User.objects.create_user(
            username="student@nitw.ac.in",
            email="student@nitw.ac.in",
            password="StrongPass123!",
        )

        response = self.client.post(
            reverse("login"),
            {
                "email": "student@nitw.ac.in",
                "password": "StrongPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertEqual(response.data["user"]["email"], "student@nitw.ac.in")

    def test_forgot_password_resets_password(self):
        User.objects.create_user(
            username="student@nitw.ac.in",
            email="student@nitw.ac.in",
            password="OldStrongPass123!",
        )

        response = self.client.post(
            reverse("forgot-password"),
            {
                "email": "student@nitw.ac.in",
                "new_password": "NewStrongPass123!",
                "confirm_password": "NewStrongPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        login_response = self.client.post(
            reverse("login"),
            {
                "email": "student@nitw.ac.in",
                "password": "NewStrongPass123!",
            },
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)


class ResourceApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="owner@nitw.ac.in",
            email="owner@nitw.ac.in",
            password="StrongPass123!",
        )

    def test_resource_creation_requires_authentication(self):
        response = self.client.post(
            "/api/resources/",
            {
                "title": "Arduino Uno Kit",
                "description": "Starter board with cables.",
                "category": "Electronics",
                "condition": "Good",
                "department": "ECE",
                "location": "Library Block A",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_create_resource(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/resources/",
            {
                "title": "Arduino Uno Kit",
                "description": "Starter board with cables.",
                "category": "Electronics",
                "condition": "Good",
                "department": "ECE",
                "location": "Library Block A",
                "image": "https://example.com/image.jpg",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["owner_email"], "owner@nitw.ac.in")
        self.assertEqual(response.data["availability"], "Available")
        self.assertTrue(Resource.objects.filter(title="Arduino Uno Kit", owner=self.user).exists())


class BorrowRequestApiTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="owner@nitw.ac.in",
            email="owner@nitw.ac.in",
            password="StrongPass123!",
        )
        self.borrower = User.objects.create_user(
            username="borrower@nitw.ac.in",
            email="borrower@nitw.ac.in",
            password="StrongPass123!",
        )
        self.resource = Resource.objects.create(
            title="Digital Logic Notes",
            description="Semester notes.",
            category="Notes",
            condition="Good",
            department="ECE",
            location="Hostel H2",
            owner=self.owner,
        )

    def test_authenticated_user_can_create_borrow_request(self):
        self.client.force_authenticate(user=self.borrower)

        response = self.client.post(
            "/api/borrow/",
            {"resource": self.resource.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["requester_email"], "borrower@nitw.ac.in")
        self.assertEqual(response.data["resource_title"], "Digital Logic Notes")

    def test_borrow_request_list_is_limited_to_current_user(self):
        BorrowRequest.objects.create(resource=self.resource, requester=self.borrower)
        BorrowRequest.objects.create(resource=self.resource, requester=self.owner)
        self.client.force_authenticate(user=self.borrower)

        response = self.client.get("/api/borrow/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["requester_email"], "borrower@nitw.ac.in")

    def test_owner_can_view_incoming_requests(self):
        BorrowRequest.objects.create(resource=self.resource, requester=self.borrower)
        self.client.force_authenticate(user=self.owner)

        response = self.client.get("/api/borrow/incoming/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["requester_email"], "borrower@nitw.ac.in")

    def test_owner_can_accept_borrow_request_and_hide_resource(self):
        borrow_request = BorrowRequest.objects.create(resource=self.resource, requester=self.borrower)
        other_borrower = User.objects.create_user(
            username="other@nitw.ac.in",
            email="other@nitw.ac.in",
            password="StrongPass123!",
        )
        other_request = BorrowRequest.objects.create(resource=self.resource, requester=other_borrower)
        self.client.force_authenticate(user=self.owner)

        response = self.client.post(f"/api/borrow/{borrow_request.id}/accept/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        borrow_request.refresh_from_db()
        other_request.refresh_from_db()
        self.resource.refresh_from_db()
        self.assertEqual(borrow_request.status, "accepted")
        self.assertEqual(other_request.status, "rejected")
        self.assertFalse(self.resource.available)
