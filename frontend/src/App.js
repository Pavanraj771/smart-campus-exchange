import './App.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import {
  acceptBorrowRequest,
  cancelBorrowRequest,
  changePassword,
  clearTokens,
  completeBorrowRequest,
  createBorrowRequest,
  createResource,
  deleteResource,
  fetchBorrowRequests,
  fetchCurrentUser,
  fetchIncomingBorrowRequests,
  fetchNotifications,
  fetchResources,
  forgotPassword,
  hasAccessToken,
  loginUser,
  markAllNotificationsRead,
  markNotificationRead,
  normalizeBorrowRequest,
  normalizeNotification,
  normalizeResource,
  normalizeUser,
  persistTokens,
  rejectBorrowRequest,
  registerUser,
  resetPassword,
  updateCurrentUser,
  updateResource
} from './api';
import AppShell from './components/AppShell';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import EditResourcePage from './pages/EditResourcePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HomePage from './pages/HomePage';
import IncomingRequestsPage from './pages/IncomingRequestsPage';
import MyResourcesPage from './pages/MyResourcesPage';
import NotFoundPage from './pages/NotFoundPage';
import NotificationsPage from './pages/NotificationsPage';
import PostResourcePage from './pages/PostResourcePage';
import ProfilePage from './pages/ProfilePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RequestsPage from './pages/RequestsPage';
import ResourceDetailPage from './pages/ResourceDetailPage';
import ResourcesPage from './pages/ResourcesPage';

const THEME_KEY = 'scx_theme';

function getApiErrorMessage(error, fallbackMessage) {
  const responseData = error?.response?.data;
  if (!responseData) {
    return fallbackMessage;
  }

  if (typeof responseData.detail === 'string') {
    return responseData.detail;
  }

  const firstValue = Object.values(responseData)[0];
  if (Array.isArray(firstValue) && firstValue[0]) {
    return firstValue[0];
  }

  if (typeof firstValue === 'string') {
    return firstValue;
  }

  return fallbackMessage;
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [resources, setResources] = useState([]);
  const [borrowRequests, setBorrowRequests] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [acceptingRequest, setAcceptingRequest] = useState(null);
  const [cancellingRequest, setCancellingRequest] = useState(null);
  const [completingRequest, setCompletingRequest] = useState(null);
  const [requestActionState, setRequestActionState] = useState({ id: null, type: null });
  const [notificationActionId, setNotificationActionId] = useState(null);
  const [toast, setToast] = useState(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [resourcesLoaded, setResourcesLoaded] = useState(false);
  const [userDataResolved, setUserDataResolved] = useState(false);
  const [resourcesError, setResourcesError] = useState('');
  const toastTimerRef = useRef(null);

  const unreadNotifications = notifications.filter((notification) => !notification.isRead).length;

  const showToast = (message, type = 'success') => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToast({ message, type });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 3200);
  };

  const refreshNotifications = async () => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const notificationData = await fetchNotifications();
    setNotifications(notificationData.map(normalizeNotification));
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => () => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const resourceData = await fetchResources();
        if (isMounted) {
          setResources(resourceData.map(normalizeResource));
          setResourcesError('');
        }
      } catch (error) {
        if (isMounted) {
          setResources([]);
          setResourcesError(getApiErrorMessage(error, 'Unable to load resources right now.'));
        }
      } finally {
        if (isMounted) {
          setResourcesLoaded(true);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      if (!hasAccessToken()) {
        if (isMounted) {
          setAuthResolved(true);
        }
        return;
      }

      try {
        const userData = await fetchCurrentUser();
        if (isMounted) {
          setCurrentUser(normalizeUser(userData));
        }
      } catch {
        clearTokens();
        if (isMounted) {
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthResolved(true);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadUserScopedData() {
      if (!currentUser) {
        if (isMounted) {
          setBorrowRequests([]);
          setIncomingRequests([]);
          setNotifications([]);
          setUserDataResolved(true);
        }
        return;
      }

      try {
        const [requestData, incomingData, notificationData] = await Promise.all([
          fetchBorrowRequests(),
          fetchIncomingBorrowRequests(),
          fetchNotifications()
        ]);

        if (isMounted) {
          setBorrowRequests(requestData.map(normalizeBorrowRequest));
          setIncomingRequests(incomingData.map(normalizeBorrowRequest));
          setNotifications(notificationData.map(normalizeNotification));
        }
      } catch {
        if (isMounted) {
          setBorrowRequests([]);
          setIncomingRequests([]);
          setNotifications([]);
        }
      } finally {
        if (isMounted) {
          setUserDataResolved(true);
        }
      }
    }

    setUserDataResolved(false);
    loadUserScopedData();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const authContext = useMemo(
    () => ({
      currentUser,
      onLogout: () => {
        setIsLogoutModalOpen(true);
      }
    }),
    [currentUser]
  );

  const confirmLogout = () => {
    clearTokens();
    setCurrentUser(null);
    setBorrowRequests([]);
    setIncomingRequests([]);
    setNotifications([]);
    setIsLogoutModalOpen(false);
    showToast('Logged out successfully.');
  };

  const cancelLogout = () => {
    setIsLogoutModalOpen(false);
  };

  const handleRegister = async ({ email, password, confirmPassword }) => {
    try {
      const data = await registerUser({ email, password, confirm_password: confirmPassword });
      persistTokens(data);
      setCurrentUser(normalizeUser(data.user));
      showToast('Account created successfully.');
      return { ok: true };
    } catch (error) {
      return { ok: false, message: getApiErrorMessage(error, 'Registration failed. Please try again.') };
    }
  };

  const handleLogin = async ({ email, password }) => {
    try {
      const data = await loginUser({ email, password });
      persistTokens(data);
      setCurrentUser(normalizeUser(data.user));
      showToast('Logged in successfully.');
      return { ok: true };
    } catch (error) {
      return { ok: false, message: getApiErrorMessage(error, 'Login failed. Please try again.') };
    }
  };

  const handleForgotPassword = async ({ email }) => {
    try {
      const data = await forgotPassword({ email });
      showToast(data.detail);
      return { ok: true, message: data.detail };
    } catch (error) {
      return { ok: false, message: getApiErrorMessage(error, 'Unable to reset password right now.') };
    }
  };

  const handleResetPassword = async ({ uid, token, newPassword, confirmPassword }) => {
    try {
      const data = await resetPassword({
        uid,
        token,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      showToast(data.detail);
      return { ok: true, message: data.detail };
    } catch (error) {
      return { ok: false, message: getApiErrorMessage(error, 'Unable to reset password right now.') };
    }
  };

  const handleUpdateProfile = async ({ displayName }) => {
    try {
      const updatedUser = await updateCurrentUser({ display_name: displayName });
      setCurrentUser(normalizeUser(updatedUser));
      await refreshNotifications();
      showToast('Profile updated successfully.');
      return { ok: true };
    } catch (error) {
      return { ok: false, message: getApiErrorMessage(error, 'Unable to update your profile right now.') };
    }
  };

  const handleChangePassword = async ({ currentPassword, newPassword, confirmPassword }) => {
    try {
      const data = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      await refreshNotifications();
      showToast(data.detail);
      return { ok: true, message: data.detail };
    } catch (error) {
      return { ok: false, message: getApiErrorMessage(error, 'Unable to change your password right now.') };
    }
  };

  const handleCreateResource = async (resourceData) => {
    try {
      const createdResource = await createResource({
        title: resourceData.title.trim(),
        category: resourceData.category,
        condition: resourceData.condition,
        department: resourceData.department.trim(),
        location: resourceData.location.trim(),
        image: resourceData.imageUrl.trim(),
        description: resourceData.description.trim()
      });

      setResources((prev) => [normalizeResource(createdResource), ...prev]);
      await refreshNotifications();
      showToast('Resource created successfully.');
      return { ok: true, resourceId: createdResource.id };
    } catch (error) {
      return { ok: false, message: getApiErrorMessage(error, 'Unable to create resource right now.') };
    }
  };

  const handleBorrowResource = async (resourceId, borrowData) => {
    try {
      const createdRequest = await createBorrowRequest({
        resource: resourceId,
        duration_days: borrowData.durationDays,
        message: borrowData.message.trim()
      });
      const normalizedRequest = normalizeBorrowRequest(createdRequest);
      setBorrowRequests((prev) => [normalizedRequest, ...prev]);
      await refreshNotifications();
      showToast('Borrow request sent successfully.');
      return { ok: true, message: 'Borrow request sent successfully.' };
    } catch (error) {
      return { ok: false, message: getApiErrorMessage(error, 'Unable to send borrow request right now.') };
    }
  };

  const handleDeleteResource = async (resourceId) => {
    try {
      await deleteResource(resourceId);
      setResources((prev) => prev.filter((resource) => String(resource.id) !== String(resourceId)));
      await refreshNotifications();
      showToast('Resource deleted successfully.');
      return { ok: true };
    } catch (error) {
      return { ok: false, message: getApiErrorMessage(error, 'Unable to delete this resource right now.') };
    }
  };

  const handleUpdateResource = async (resourceId, resourceData) => {
    try {
      const updatedResource = await updateResource(resourceId, {
        title: resourceData.title.trim(),
        category: resourceData.category,
        condition: resourceData.condition,
        department: resourceData.department.trim(),
        location: resourceData.location.trim(),
        image: resourceData.imageUrl.trim(),
        description: resourceData.description.trim()
      });

      const normalizedUpdatedResource = normalizeResource(updatedResource);
      setResources((prev) =>
        prev.map((resource) => (resource.id === normalizedUpdatedResource.id ? normalizedUpdatedResource : resource))
      );
      await refreshNotifications();
      showToast('Resource updated successfully.');
      return { ok: true };
    } catch (error) {
      return { ok: false, message: getApiErrorMessage(error, 'Unable to update this resource right now.') };
    }
  };

  const handleCancelBorrowRequest = (request) => {
    setCancellingRequest(request);
  };

  const confirmCancelBorrowRequest = async () => {
    if (!cancellingRequest) {
      return;
    }

    try {
      setRequestActionState({ id: cancellingRequest.id, type: 'cancel' });
      await cancelBorrowRequest(cancellingRequest.rawId);
      setBorrowRequests((prev) => prev.filter((entry) => entry.rawId !== cancellingRequest.rawId));
      await refreshNotifications();
      showToast('Borrow request cancelled.');
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Unable to cancel this request right now.'), 'error');
    } finally {
      setRequestActionState({ id: null, type: null });
      setCancellingRequest(null);
    }
  };

  const handleAcceptIncomingRequest = (request) => {
    setAcceptingRequest(request);
  };

  const confirmAcceptIncomingRequest = async () => {
    if (!acceptingRequest) {
      return;
    }

    try {
      setRequestActionState({ id: acceptingRequest.id, type: 'accept' });
      const acceptedRequest = normalizeBorrowRequest(await acceptBorrowRequest(acceptingRequest.rawId));
      setIncomingRequests((prev) =>
        prev.map((request) => {
          if (request.resourceId !== acceptedRequest.resourceId) {
            return request;
          }

          if (request.rawId === acceptedRequest.rawId) {
            return acceptedRequest;
          }

          return request.status === 'Pending' ? { ...request, status: 'Rejected' } : request;
        })
      );
      setResources((prev) =>
        prev.map((resource) =>
          resource.id === acceptedRequest.resourceId ? { ...resource, availability: 'Borrowed' } : resource
        )
      );
      await refreshNotifications();
      showToast('Borrow request accepted.');
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Unable to accept this request right now.'), 'error');
    } finally {
      setRequestActionState({ id: null, type: null });
      setAcceptingRequest(null);
    }
  };

  const handleRejectIncomingRequest = async (request) => {
    try {
      setRequestActionState({ id: request.id, type: 'reject' });
      const rejectedRequest = normalizeBorrowRequest(await rejectBorrowRequest(request.rawId));
      setIncomingRequests((prev) =>
        prev.map((entry) => (entry.rawId === rejectedRequest.rawId ? rejectedRequest : entry))
      );
      await refreshNotifications();
      showToast('Borrow request rejected.');
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Unable to reject this request right now.'), 'error');
    } finally {
      setRequestActionState({ id: null, type: null });
    }
  };

  const handleCompleteIncomingRequest = (request) => {
    setCompletingRequest(request);
  };

  const confirmCompleteIncomingRequest = async () => {
    if (!completingRequest) {
      return;
    }

    try {
      setRequestActionState({ id: completingRequest.id, type: 'complete' });
      const completedRequest = normalizeBorrowRequest(await completeBorrowRequest(completingRequest.rawId));
      setIncomingRequests((prev) =>
        prev.map((entry) => (entry.rawId === completedRequest.rawId ? completedRequest : entry))
      );
      setResources((prev) =>
        prev.map((resource) =>
          resource.id === completedRequest.resourceId ? { ...resource, availability: 'Available' } : resource
        )
      );
      await refreshNotifications();
      showToast('Resource marked as returned.');
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Unable to complete this borrow right now.'), 'error');
    } finally {
      setRequestActionState({ id: null, type: null });
      setCompletingRequest(null);
    }
  };

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      setNotificationActionId(notificationId);
      const updatedNotification = normalizeNotification(await markNotificationRead(notificationId));
      setNotifications((prev) => prev.map((item) => (item.id === updatedNotification.id ? updatedNotification : item)));
    } finally {
      setNotificationActionId(null);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      showToast('All notifications marked as read.');
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Unable to update notifications right now.'), 'error');
    }
  };

  const appReady = authResolved && resourcesLoaded && userDataResolved;
  const myResources = resources.filter((resource) => resource.ownerEmail === currentUser?.email);

  return (
    <BrowserRouter>
      <>
        <AppShell
          currentUser={authContext.currentUser}
          onLogout={authContext.onLogout}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
          unreadNotifications={unreadNotifications}
        >
          {toast ? (
            <div className={`toast toast-${toast.type}`} role="status" aria-live="polite">
              {toast.message}
            </div>
          ) : null}
          {appReady ? (
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/dashboard"
                element={
                  currentUser ? (
                    <DashboardPage
                      resources={myResources}
                      borrowRequests={borrowRequests}
                      incomingRequests={incomingRequests}
                      notifications={notifications}
                    />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route path="/resources" element={<ResourcesPage resources={resources} />} />
              <Route
                path="/resources/:id"
                element={
                  <ResourceDetailPage
                    resources={resources}
                    currentUser={currentUser}
                    onDeleteResource={handleDeleteResource}
                    onBorrowResource={handleBorrowResource}
                  />
                }
              />
              <Route
                path="/requests"
                element={
                  currentUser ? (
                    <RequestsPage
                      requests={borrowRequests}
                      currentUser={currentUser}
                      onCancelRequest={handleCancelBorrowRequest}
                      activeRequestId={requestActionState.type === 'cancel' ? requestActionState.id : null}
                    />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/incoming-requests"
                element={
                  currentUser ? (
                    <IncomingRequestsPage
                      requests={incomingRequests}
                      onAcceptRequest={handleAcceptIncomingRequest}
                      onRejectRequest={handleRejectIncomingRequest}
                      onCompleteRequest={handleCompleteIncomingRequest}
                      activeRequestId={requestActionState.id}
                      activeAction={requestActionState.type}
                    />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/my-resources"
                element={currentUser ? <MyResourcesPage resources={myResources} /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/notifications"
                element={
                  currentUser ? (
                    <NotificationsPage
                      notifications={notifications}
                      onMarkRead={handleMarkNotificationRead}
                      onMarkAllRead={handleMarkAllNotificationsRead}
                      activeNotificationId={notificationActionId}
                    />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/post-resource"
                element={
                  currentUser ? (
                    <PostResourcePage currentUser={currentUser} onSubmit={handleCreateResource} />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/resources/:id/edit"
                element={
                  currentUser ? (
                    <EditResourcePage currentUser={currentUser} resources={resources} onSubmit={handleUpdateResource} />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/profile"
                element={
                  currentUser ? (
                    <ProfilePage
                      currentUser={currentUser}
                      resources={resources}
                      borrowRequests={borrowRequests}
                      incomingRequests={incomingRequests}
                      onUpdateProfile={handleUpdateProfile}
                      onChangePassword={handleChangePassword}
                    />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/login"
                element={
                  currentUser ? (
                    <Navigate to="/profile" replace />
                  ) : (
                    <AuthPage
                      mode="login"
                      title="Sign In"
                      helperText="Login with your NITW email ending with nitw.ac.in."
                      buttonText="Login"
                      onSubmit={handleLogin}
                    />
                  )
                }
              />
              <Route
                path="/forgot-password"
                element={
                  currentUser ? <Navigate to="/profile" replace /> : <ForgotPasswordPage onSubmit={handleForgotPassword} />
                }
              />
              <Route
                path="/register"
                element={
                  currentUser ? (
                    <Navigate to="/profile" replace />
                  ) : (
                    <AuthPage
                      mode="register"
                      title="Create Account"
                      helperText="Signup using your NITW email ending with nitw.ac.in."
                      buttonText="Create Account"
                      onSubmit={handleRegister}
                    />
                  )
                }
              />
              <Route
                path="/reset-password"
                element={
                  currentUser ? <Navigate to="/profile" replace /> : <ResetPasswordPage onSubmit={handleResetPassword} />
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          ) : (
            <section className="empty-state">
              <h2>Loading campus exchange...</h2>
              <p>Fetching your session and live resources.</p>
            </section>
          )}
          {appReady && resourcesError ? (
            <section className="empty-state">
              <h2>Resource feed unavailable</h2>
              <p>{resourcesError}</p>
            </section>
          ) : null}
        </AppShell>
        {isLogoutModalOpen ? (
          <div className="modal-backdrop" role="presentation" onClick={cancelLogout}>
            <div
              className="confirm-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="eyebrow">Confirm action</p>
              <h2 id="logout-modal-title">Logout from your account?</h2>
              <p className="confirm-modal-text">You will need to login again to post, manage, or delete resources.</p>
              <div className="confirm-modal-actions">
                <button className="btn btn-secondary" type="button" onClick={cancelLogout}>
                  Cancel
                </button>
                <button className="btn btn-danger" type="button" onClick={confirmLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {acceptingRequest ? (
          <div className="modal-backdrop" role="presentation" onClick={() => setAcceptingRequest(null)}>
            <div
              className="confirm-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="accept-request-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="eyebrow">Confirm action</p>
              <h2 id="accept-request-modal-title">Accept this borrow request?</h2>
              <p className="confirm-modal-text">
                <strong>{acceptingRequest.requester}</strong> will receive <strong>{acceptingRequest.item}</strong>.
                Once accepted, this resource will disappear from the marketplace until it is marked returned.
              </p>
              <div className="confirm-modal-actions">
                <button className="btn btn-secondary" type="button" onClick={() => setAcceptingRequest(null)}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="button" onClick={confirmAcceptIncomingRequest}>
                  Accept Request
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {cancellingRequest ? (
          <div className="modal-backdrop" role="presentation" onClick={() => setCancellingRequest(null)}>
            <div
              className="confirm-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="cancel-request-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="eyebrow">Confirm action</p>
              <h2 id="cancel-request-modal-title">Cancel this borrow request?</h2>
              <p className="confirm-modal-text">
                Your pending request for <strong>{cancellingRequest.item}</strong> will be removed.
              </p>
              <div className="confirm-modal-actions">
                <button className="btn btn-secondary" type="button" onClick={() => setCancellingRequest(null)}>
                  Keep Request
                </button>
                <button className="btn btn-danger" type="button" onClick={confirmCancelBorrowRequest}>
                  Cancel Request
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {completingRequest ? (
          <div className="modal-backdrop" role="presentation" onClick={() => setCompletingRequest(null)}>
            <div
              className="confirm-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="complete-request-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="eyebrow">Confirm action</p>
              <h2 id="complete-request-modal-title">Mark this resource as returned?</h2>
              <p className="confirm-modal-text">
                <strong>{completingRequest.item}</strong> will become available in the marketplace again.
              </p>
              <div className="confirm-modal-actions">
                <button className="btn btn-secondary" type="button" onClick={() => setCompletingRequest(null)}>
                  Not Yet
                </button>
                <button className="btn btn-primary" type="button" onClick={confirmCompleteIncomingRequest}>
                  Mark Returned
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </>
    </BrowserRouter>
  );
}

export default App;
