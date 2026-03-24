import axios from 'axios';

export const ACCESS_TOKEN_KEY = 'scx_access_token';
export const REFRESH_TOKEN_KEY = 'scx_refresh_token';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (error.response?.status !== 401 || !refreshToken || originalRequest?._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise =
        refreshPromise ||
        axios.post('/api/auth/token/refresh/', {
          refresh: refreshToken
        });

      const response = await refreshPromise;
      localStorage.setItem(ACCESS_TOKEN_KEY, response.data.access);
      refreshPromise = null;
      originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
      return api(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      return Promise.reject(refreshError);
    }
  }
);

function toDisplayName(text) {
  return (
    text
      ?.replace(/[_-]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'Campus Member'
  );
}

export function normalizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.display_name || toDisplayName(user.email?.split('@')[0] || user.username)
  };
}

export function normalizeResource(resource) {
  const ownerLabel =
    typeof resource.owner === 'string'
      ? resource.owner
      : resource.owner?.display_name || toDisplayName(resource.owner?.email?.split('@')[0] || '');

  return {
    id: resource.id,
    title: resource.title,
    category: resource.category,
    owner: ownerLabel,
    ownerEmail: resource.owner_email || resource.owner?.email || '',
    department: resource.department,
    condition: resource.condition,
    availability: resource.availability || (resource.available ? 'Available' : 'Borrowed'),
    location: resource.location,
    rating: Number(resource.rating),
    description: resource.description,
    image: resource.image || '',
    createdAt: resource.created_at,
    updatedAt: resource.updated_at
  };
}

export function normalizeBorrowRequest(request) {
  const statusMap = {
    accepted: 'Approved',
    rejected: 'Rejected',
    returned: 'Returned',
    pending: 'Pending'
  };

  return {
    id: `RQ-${request.id}`,
    resourceId: request.resource,
    item: request.resource_title,
    requester:
      request.requester?.display_name || toDisplayName(request.requester_email?.split('@')[0] || 'campus.member'),
    requesterEmail: request.requester_email || request.requester?.email || '',
    duration: `${request.duration_days} day${request.duration_days === 1 ? '' : 's'}`,
    durationDays: request.duration_days,
    message: request.message || '',
    status: statusMap[request.status] || 'Pending',
    createdAt: request.request_date,
    completedAt: request.completed_at,
    rawId: request.id
  };
}

export function normalizeNotification(notification) {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    link: notification.link || '',
    isRead: notification.is_read,
    createdAt: notification.created_at
  };
}

export async function registerUser(payload) {
  const response = await api.post('/auth/register/', payload);
  return response.data;
}

export async function loginUser(payload) {
  const response = await api.post('/auth/login/', payload);
  return response.data;
}

export async function forgotPassword(payload) {
  const response = await api.post('/auth/forgot-password/', payload);
  return response.data;
}

export async function resetPassword(payload) {
  const response = await api.post('/auth/reset-password/', payload);
  return response.data;
}

export async function fetchCurrentUser() {
  const response = await api.get('/auth/me/');
  return response.data;
}

export async function updateCurrentUser(payload) {
  const response = await api.patch('/auth/me/', payload);
  return response.data;
}

export async function changePassword(payload) {
  const response = await api.post('/auth/change-password/', payload);
  return response.data;
}

export async function fetchResources() {
  const response = await api.get('/resources/');
  return response.data;
}

export async function createResource(payload) {
  const response = await api.post('/resources/', payload);
  return response.data;
}

export async function updateResource(resourceId, payload) {
  const response = await api.patch(`/resources/${resourceId}/`, payload);
  return response.data;
}

export async function deleteResource(resourceId) {
  await api.delete(`/resources/${resourceId}/`);
}

export async function fetchBorrowRequests() {
  const response = await api.get('/borrow/');
  return response.data;
}

export async function createBorrowRequest(payload) {
  const response = await api.post('/borrow/', payload);
  return response.data;
}

export async function cancelBorrowRequest(requestId) {
  await api.delete(`/borrow/${requestId}/`);
}

export async function fetchIncomingBorrowRequests() {
  const response = await api.get('/borrow/incoming/');
  return response.data;
}

export async function acceptBorrowRequest(requestId) {
  const response = await api.post(`/borrow/${requestId}/accept/`);
  return response.data;
}

export async function rejectBorrowRequest(requestId) {
  const response = await api.post(`/borrow/${requestId}/reject/`);
  return response.data;
}

export async function completeBorrowRequest(requestId) {
  const response = await api.post(`/borrow/${requestId}/complete/`);
  return response.data;
}

export async function fetchNotifications() {
  const response = await api.get('/notifications/');
  return response.data;
}

export async function markNotificationRead(notificationId) {
  const response = await api.post(`/notifications/${notificationId}/read/`);
  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await api.post('/notifications/mark-all-read/');
  return response.data;
}

export function persistTokens(tokens) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function hasAccessToken() {
  return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
}
