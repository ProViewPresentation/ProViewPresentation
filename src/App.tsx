import { Component, type ErrorInfo, type ReactNode } from 'react';
import { HashRouter, Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ArrowRight, Compass, RotateCcw } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { EmptyState, Logo, PageLoader, ToastProvider } from './components/UI';
import Landing from './pages/Landing';
import AuthPage from './pages/Auth';
import WorkspaceLayout from './pages/WorkspaceLayout';
import Overview from './pages/Overview';
import Services from './pages/Services';
import ServiceEditor from './pages/ServiceEditor';
import Songs from './pages/Songs';
import Scripture from './pages/Scripture';
import MediaLibrary from './pages/Media';
import Themes from './pages/Themes';
import Settings from './pages/Settings';
import Operator from './pages/Operator';
import Output from './pages/Output';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ProView encountered an unexpected error:', error, info.componentStack);
  }
  render() {
    if (this.state.error)
      return (
        <div className="error-page">
          <Logo />
          <EmptyState
            icon={RotateCcw}
            title="Let’s take a little breath."
            description="Something unexpected happened. Your saved workspace is still on this device. Reload to find your place again."
            action={
              <button className="button button-dark" onClick={() => window.location.reload()}>
                Reload ProView <RotateCcw size={16} />
              </button>
            }
          />
        </div>
      );
    return this.props.children;
  }
}
function WorkspaceReady() {
  const { status, available, syncError } = useWorkspace();
  if (status === 'loading') return <PageLoader />;
  if (!available)
    return (
      <div className="error-page">
        <Logo />
        <EmptyState
          icon={RotateCcw}
          title="Your workspace needs a little connection."
          description={syncError || 'Your cloud workspace could not be loaded. Nothing has been changed.'}
          action={
            <button className="button button-dark" onClick={() => window.location.reload()}>
              Try loading again <RotateCcw size={16} />
            </button>
          }
        />
        <Link className="text-link" to="/">
          Back to the homepage <ArrowRight size={16} />
        </Link>
      </div>
    );
  return <Outlet />;
}
function ProtectedWorkspace() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <WorkspaceProvider key={user.id}>
      <WorkspaceReady />
    </WorkspaceProvider>
  );
}
function RouteScroll() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}
export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AuthProvider>
          <ToastProvider>
            <RouteScroll />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/signup" element={<AuthPage key="signup" signup />} />
              <Route path="/login" element={<AuthPage key="login" />} />
              <Route element={<ProtectedWorkspace />}>
                <Route path="/workspace" element={<WorkspaceLayout />}>
                  <Route index element={<Overview />} />
                  <Route path="services" element={<Services />} />
                  <Route path="services/:serviceId" element={<ServiceEditor />} />
                  <Route path="songs" element={<Songs />} />
                  <Route path="scripture" element={<Scripture />} />
                  <Route path="media" element={<MediaLibrary />} />
                  <Route path="themes" element={<Themes />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                <Route path="/operator/:serviceId" element={<Operator />} />
              </Route>
              <Route path="/output/:channel" element={<Output />} />
              <Route path="/stage/:channel" element={<Output stage />} />
              <Route
                path="*"
                element={
                  <div className="error-page">
                    <Logo />
                    <EmptyState
                      icon={Compass}
                      title="A little off the beaten path."
                      description="This page doesn’t exist, but there’s a place for you back home."
                      action={
                        <Link className="button button-dark" to="/">
                          Find your way home <ArrowRight size={16} />
                        </Link>
                      }
                    />
                  </div>
                }
              />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
