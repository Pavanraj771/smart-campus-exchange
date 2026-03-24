import './App.css';
import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import {
  acceptBorrowRequest,
  cancelBorrowRequest,
  clearTokens,
  createBorrowRequest,
  createResource,
  deleteResource,
  fetchBorrowRequests,
  fetchCurrentUser,
  fetchIncomingBorrowRequests,
  fetchResources,
  forgotPassword,
  hasAccessToken,
  loginUser,
  normalizeBorrowRequest,
  normalizeResource,
  normalizeUser,
  persistTokens,
  rejectBorrowRequest,
  registerUser,
  resetPassword,
  updateResource
} from './api';
import AppShell from './components/AppShell';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import EditResourcePage from './pages/EditResourcePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HomePage from './pages/HomePage';
import IncomingRequestsPage from './pages/IncomingRequestsPage';
import NotFoundPage from './pages/NotFoundPage';
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
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [acceptingRequest, setAcceptingRequest] = useState(null);
  const [requestActionState, setRequestActionState] = useState({ id: null, type: null });
  const [authResolved, setAuthResolved] = useState(false);
  const [resourcesLoaded, setResourcesLoaded] = useState(false);
  const [resourcesError, setResourcesError] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

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

    async function loadBorrowRequests() {
      if (!currentUser) {
        if (isMounted) {
          setBorrowRequests([]);
          setIncomingRequests([]);
        }
        return;
      }

      try {
        const [requestData, incomingData] = await Promise.all([fetchBorrowRequests(), fetchIncomingBorrowRequests()]);
        if (isMounted) {
          setBorrowRequests(requestData.map(normalizeBorrowRequest));
          setIncomingRequests(incomingData.map(normalizeBorrowRequest));
        }
      } catch {
        if (isMounted) {
          setBorrowRequests([]);
          setIncomingRequests([]);
        }
      }
    }

    loadBorrowRequests();

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
    setIsLogoutModalOpen(false);
  };

  const cancelLogout = () => {
    setIsLogoutModalOpen(false);
  };

  const handleRegister = async ({ email, password, confirmPassword }) => {
    try {
      const data = await registerUser({ email, password, confirm_password: confirmPassword });
      persistTokens(data);
      setCurrentUser(normalizeUser(data.user));
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
      return { ok: true };
    } catch (error) {
      return { ok: false, message: getApiErrorMessage(error, 'Login failed. Please try again.') };
    }
  };

  const handleForgotPassword = async ({ email }) => {
    try {
      const data = await forgotPassword({ email });
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
      return { ok: true, message: data.detail };
    } catch (error) {
      return { ok: false, message: getApiErrorMessage(error, 'Unable to reset password right now.') };
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
      return { ok: true, resourceId: createdResource.id };
    } catch (error) {
      return { ok: false, message: getApiErrorMessage(error, 'Unable to create resource right now.') };
    }
  };

  const handleBorrowResource = async (resourceId) => {
    try {
      const createdRequest = await createBorrowRequest({ resource: resourceId });
      const normalizedRequest = normalizeBorrowRequest(createdRequest);
      setBorrowRequests((prev) => {
        const existingIds = new Set(prev.map((request) => request.id));
        return existingIds.has(normalizedRequest.id) ? prev : [normalizedRequest, ...prev];
      });
      return { ok: true, message: 'Borrow request sent successfully.' };
    } catch (error) {
      return { ok: false, message: getApiErrorMessage(error, 'Unable to send borrow request right now.') };
    }
  };

  const handleDeleteResource = async (resourceId) => {
    try {
      await deleteResource(resourceId);
      setResources((prev) => prev.filter((resource) => String(resource.id) !== String(resourceId)));
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

      const normalizedResource = normalizeResource(updatedResource);
      setResources((prev) => prev.map((resource) => (resource.id === normalizedResource.id ? normalizedResource : resource)));
      return { ok: true };
    } catch (error) {
      return { ok: false, message: getApiErrorMessage(error, 'Unable to update this resource right now.') };
    }
  };

  const handleCancelBorrowRequest = async (request) => {
    try {
      setRequestActionState({ id: request.id, type: 'cancel' });
      await cancelBorrowRequest(request.rawId);
      setBorrowRequests((prev) => prev.filter((entry) => entry.rawId !== request.rawId));
    } finally {
      setRequestActionState({ id: null, type: null });
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
            return { ...request, status: 'Approved' };
          }

          return request.status === 'Pending' ? { ...request, status: 'Rejected' } : request;
        })
      );
      setResources((prev) =>
        prev.map((resource) =>
          resource.id === acceptedRequest.resourceId ? { ...resource, availability: 'Borrowed' } : resource
        )
      );
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
        prev.map((entry) => (entry.rawId === rejectedRequest.rawId ? { ...entry, status: 'Rejected' } : entry))
      );
    } finally {
      setRequestActionState({ id: null, type: null });
    }
  };

  const appReady = authResolved && resourcesLoaded;

  return (
    <BrowserRouter>
      <>
        <AppShell
          currentUser={authContext.currentUser}
          onLogout={authContext.onLogout}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
        >
          {appReady ? (
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/dashboard"
                element={
                  <DashboardPage
                    resources={resources.filter((resource) => resource.ownerEmail === currentUser?.email)}
                    borrowRequests={borrowRequests}
                    incomingRequests={incomingRequests}
                  />
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
                  <RequestsPage
                    requests={borrowRequests}
                    currentUser={currentUser}
                    onCancelRequest={handleCancelBorrowRequest}
                    activeRequestId={requestActionState.type === 'cancel' ? requestActionState.id : null}
                  />
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
                      activeRequestId={requestActionState.id}
                      activeAction={requestActionState.type}
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
                  currentUser ? (
                    <Navigate to="/profile" replace />
                  ) : (
                    <ForgotPasswordPage onSubmit={handleForgotPassword} />
                  )
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
                  currentUser ? (
                    <Navigate to="/profile" replace />
                  ) : (
                    <ResetPasswordPage onSubmit={handleResetPassword} />
                  )
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
                Once accepted, this resource will disappear from the marketplace.
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
      </>
    </BrowserRouter>
  );
}

export default App;
