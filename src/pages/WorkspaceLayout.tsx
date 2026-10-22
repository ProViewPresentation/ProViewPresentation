import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  Cloud,
  CloudOff,
  Command,
  Heart,
  Image,
  LayoutDashboard,
  Layers3,
  LogOut,
  Menu,
  Monitor,
  Music2,
  Palette,
  Search,
  Settings,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { IconButton, Logo, Modal, Spinner, useToast } from '../components/UI';
import { cn, errorMessage } from '../lib/utils';

const navigation = [
  { label: 'Overview', path: '/workspace', icon: LayoutDashboard, end: true },
  { label: 'Services', path: '/workspace/services', icon: Layers3 },
  { label: 'Song library', path: '/workspace/songs', icon: Music2 },
  { label: 'Scripture', path: '/workspace/scripture', icon: BookOpen },
  { label: 'Media library', path: '/workspace/media', icon: Image },
  { label: 'Slide themes', path: '/workspace/themes', icon: Palette },
];
export default function WorkspaceLayout() {
  const { logout } = useAuth();
  const { data, status, syncError, retrySync, flush } = useWorkspace();
  const { toast } = useToast();
  const [logoutWarning, setLogoutWarning] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const activeTitle =
    navigation.find((item) =>
      item.end ? location.pathname === item.path : location.pathname.startsWith(item.path),
    )?.label || 'Settings';
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  const results = [
    ...data.services.map((service) => ({
      id: service.id,
      title: service.title,
      subtitle: 'Service collection',
      path: `/workspace/services/${service.id}`,
      icon: Layers3,
    })),
    ...data.songs.map((song) => ({
      id: song.id,
      title: song.title,
      subtitle: `Song · ${song.author}`,
      path: `/workspace/songs?song=${song.id}`,
      icon: Music2,
    })),
    ...data.media.map((media) => ({
      id: media.id,
      title: media.name,
      subtitle: 'Media library',
      path: '/workspace/media',
      icon: Image,
    })),
  ]
    .filter((item) => item.title.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 9);
  return (
    <div
      className="workspace-shell"
      onClickCapture={(event) => {
        const link = (event.target as HTMLElement).closest('a');
        if (link?.hash !== '#/' || status === 'synced') return;
        event.preventDefault();
        void flush()
          .then(() => navigate('/'))
          .catch((error) => toast(errorMessage(error), 'error'));
      }}
    >
      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={cn('app-sidebar', mobileOpen && 'open')}>
        <div className="sidebar-logo">
          <Logo />
          <IconButton
            label="Close sidebar"
            icon={X}
            onClick={() => setMobileOpen(false)}
            className="mobile-sidebar-close"
          />
        </div>
        <Link className="church-picker" to="/workspace/settings">
          <span className="church-avatar">{data.settings.churchName.charAt(0).toUpperCase()}</span>
          <span>
            <strong>{data.settings.churchName}</strong>
            <small>Your church workspace</small>
          </span>
          <ChevronDown size={15} />
        </Link>
        <div className="workspace-mode">
          <span>
            <Layers3 size={14} /> Prepare
          </span>
          <Link to={data.services[0] ? `/operator/${data.services[0].id}` : '/workspace/services'}>
            <Monitor size={14} /> Present
          </Link>
        </div>
        <div className="sidebar-section-label">YOUR WORKSPACE</div>
        <nav className="app-nav" aria-label="Workspace navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => cn(isActive && 'active')}
            >
              <item.icon size={19} />
              <span>{item.label}</span>
              {item.label === 'Services' && <small>{data.services.length}</small>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-kindness">
            <Heart size={18} />
            <strong>Made for your ministry.</strong>
            <p>
              All the good stuff.
              <br />
              Always completely free.
            </p>
            <Link to="/">
              A little about ProView <ArrowUpRight size={13} />
            </Link>
          </div>
          <NavLink
            to="/workspace/settings"
            className={({ isActive }) => cn('sidebar-settings', isActive && 'active')}
          >
            <Settings size={18} /> Settings
          </NavLink>
          <div className="sidebar-user">
            <span className="user-avatar">{data.settings.name.slice(0, 2).toUpperCase()}</span>
            <span>
              <strong>{data.settings.name}</strong>
              <small>Workspace owner</small>
            </span>
            <IconButton
              label="Log out"
              icon={LogOut}
              onClick={async () => {
                try {
                  await flush();
                  await logout();
                } catch {
                  setLogoutWarning(true);
                }
              }}
            />
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="app-topbar">
          <div className="app-breadcrumb">
            <IconButton
              label="Open sidebar"
              icon={Menu}
              onClick={() => setMobileOpen(true)}
              className="mobile-sidebar-toggle"
            />
            <span>Workspace</span>
            <span>/</span>
            <strong>{activeTitle}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="search-trigger"
              onClick={() => {
                setSearch('');
                setSearchOpen(true);
              }}
            >
              <Search size={16} />
              <span>Find something</span>
              <kbd>
                <Command size={10} /> K
              </kbd>
            </button>
            <button
              className={cn('sync-status', status === 'error' && 'sync-error')}
              onClick={() => {
                if (status === 'error') retrySync();
              }}
              disabled={status !== 'error'}
              title={status === 'error' ? syncError : undefined}
            >
              {status === 'saving' ? (
                <Spinner label="Saving to cloud" />
              ) : (
                <>
                  {status === 'error' ? <CloudOff size={15} /> : <Cloud size={15} />}
                  <span>{status === 'error' ? 'Retry cloud save' : 'Saved to cloud'}</span>
                </>
              )}
            </button>
          </div>
        </header>
        {status === 'error' && (
          <div className="sync-banner" role="alert">
            <CloudOff size={17} />
            <span>{syncError}</span>
            <button onClick={retrySync}>Retry</button>
          </div>
        )}
        <div className="workspace-content">
          <Outlet />
        </div>
        <footer className="workspace-footer">
          <span>Made for the moment.</span>
          <span>
            PROVIEW <span>✦</span> FREE BY CHOICE
          </span>
        </footer>
      </div>
      {logoutWarning && (
        <Modal
          title="Some changes aren’t saved yet."
          subtitle="The backend hasn’t confirmed your latest edits."
          onClose={() => setLogoutWarning(false)}
        >
          <div className="modal-fields">
            <p className="muted">
              Keep this page open and retry the cloud save to preserve your work, or sign out and discard the
              unsaved changes.
            </p>
          </div>
          <div className="modal-footer">
            <button className="button button-outline" onClick={() => setLogoutWarning(false)}>
              Keep working
            </button>
            <button
              className="button button-danger"
              onClick={async () => {
                await logout();
              }}
            >
              Sign out anyway
            </button>
          </div>
        </Modal>
      )}
      {searchOpen && (
        <Modal
          title="A little help finding things."
          subtitle="Search your services, songs, and media."
          onClose={() => setSearchOpen(false)}
        >
          <div className="global-search">
            <div className="search-input">
              <Search size={19} />
              <input
                data-autofocus
                placeholder="Try “Amazing Grace”…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search workspace"
              />
            </div>
            <div className="search-results">
              {results.length ? (
                results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      navigate(result.path);
                      setSearchOpen(false);
                    }}
                  >
                    <span className="result-icon">
                      <result.icon size={18} />
                    </span>
                    <span>
                      <strong>{result.title}</strong>
                      <small>{result.subtitle}</small>
                    </span>
                    <ArrowUpRight size={16} />
                  </button>
                ))
              ) : (
                <p className="search-empty">Nothing here just yet. Try another word.</p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
