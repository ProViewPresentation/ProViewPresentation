import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Check, Cloud, Eye, EyeOff, Heart, LockKeyhole } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ErrorNotice, FormField, Logo, Modal, Spinner } from '../components/UI';
import { asset, errorMessage } from '../lib/utils';

export default function AuthPage({ signup = false }: { signup?: boolean }) {
  const { user, loading, login, signup: createAccount, sessionError } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [policy, setPolicy] = useState(false);
  const [registered, setRegistered] = useState(false);
  if (user) return <Navigate to="/workspace" replace />;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email')).trim();
    const password = String(form.get('password'));
    if (signup && (!String(form.get('name')).trim() || !String(form.get('church')).trim())) {
      setError('Please add your name and your church or community name.');
      return;
    }
    if (signup && password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (signup)
        await createAccount(
          email,
          password,
          String(form.get('name')).trim(),
          String(form.get('church')).trim(),
        );
      else await login(email, password);
      navigate('/workspace');
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      if (message.startsWith('Your account was created')) setRegistered(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth-layout">
      <div className="auth-panel">
        <div className="auth-nav">
          <Logo />
          <Link to="/" className="text-link">
            <ArrowLeft size={15} /> Back home
          </Link>
        </div>
        <div className="auth-form-wrap">
          <span className="eyebrow">
            {signup ? 'A LITTLE LESS TECH. A LOT MORE TOGETHER.' : 'GOOD TO HAVE YOU HERE AGAIN.'}
          </span>
          <h1>
            {signup ? (
              <>
                A fresh start for
                <br />
                your <em>Sundays.</em>
              </>
            ) : (
              <>
                Welcome <em>home.</em>
              </>
            )}
          </h1>
          <p>
            {signup
              ? 'Make room for what matters. Your free workspace is waiting.'
              : 'Your next meaningful moment is right where you left it.'}
          </p>
          <form onSubmit={submit} className="auth-form">
            {signup && (
              <div className="form-row">
                <FormField label="Your name">
                  <input
                    name="name"
                    autoComplete="name"
                    placeholder="Alex Morgan"
                    required
                    maxLength={80}
                    disabled={busy}
                  />
                </FormField>
                <FormField label="Church or community">
                  <input
                    name="church"
                    autoComplete="organization"
                    placeholder="Grace Community"
                    required
                    maxLength={100}
                    disabled={busy}
                  />
                </FormField>
              </div>
            )}
            <FormField label="Email address">
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@yourchurch.org"
                required
                maxLength={254}
                disabled={busy}
              />
            </FormField>
            <FormField
              label="Password"
              hint={signup ? 'At least 8 characters. A few memorable words work well.' : undefined}
            >
              <span className="password-input">
                <input
                  type={visible ? 'text' : 'password'}
                  name="password"
                  autoComplete={signup ? 'new-password' : 'current-password'}
                  placeholder={signup ? 'Make it a good one' : 'Your password'}
                  minLength={signup ? 8 : 1}
                  required
                  maxLength={256}
                  disabled={busy}
                />
                <button
                  type="button"
                  aria-label={visible ? 'Hide password' : 'Show password'}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </FormField>
            {(error || (!signup && sessionError)) && (
              <ErrorNotice>
                {error || sessionError}
                {registered && (
                  <>
                    {' '}
                    <Link to="/login">Go to sign in</Link>
                  </>
                )}
              </ErrorNotice>
            )}
            <button
              className="button button-dark button-full"
              type="submit"
              disabled={busy || loading || registered}
            >
              {busy ? (
                <Spinner label={signup ? 'Creating your account…' : 'Signing you in…'} />
              ) : (
                <>
                  {signup ? 'Create my free account' : 'Step into your workspace'}
                  <ArrowUpRight size={18} />
                </>
              )}
            </button>
            {signup && (
              <p className="auth-policy">
                No credit card. No subscriptions. By joining, you acknowledge our{' '}
                <button type="button" onClick={() => setPolicy(true)}>
                  account & data notes
                </button>
                .
              </p>
            )}
          </form>
          <div className="auth-switch">
            {signup ? 'Already part of the family?' : 'New around here?'}{' '}
            <Link to={signup ? '/login' : '/signup'}>
              {signup ? 'Log in' : 'Create a free account'} <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="auth-cloud-note">
            <Cloud size={18} />
            <span>
              <strong>Your workspace goes with you.</strong>
              <small>Services, songs, and media saved online. Sign in from any device.</small>
            </span>
          </div>
        </div>
        <div className="auth-panel-footer">
          <LockKeyhole size={13} /> A thoughtful space for your ministry.
        </div>
      </div>
      <aside className="auth-art" style={{ backgroundImage: `url("${asset('images/mountain-dawn.jpg')}")` }}>
        <div className="auth-art-top">
          <Heart size={17} />
          <span>FREE FOR EVERY CHURCH. ALWAYS.</span>
        </div>
        <div className="auth-art-copy">
          <div className="auth-art-line" />
          <h2>
            Less behind
            <br />
            the scenes.
            <br />
            <em>More in the moment.</em>
          </h2>
          <p>
            Beautifully simple presentation software.
            <br />
            For your people. For your purpose.
          </p>
          <div className="auth-checks">
            <span>
              <Check size={15} /> Thoughtful by design
            </span>
            <span>
              <Check size={15} /> Free by choice
            </span>
          </div>
        </div>
        <div className="auth-art-bottom">
          <span>PROVIEW</span>
          <span>MADE FOR THE MOMENT.</span>
        </div>
      </aside>
      {policy && (
        <Modal title="A note about your account & data" onClose={() => setPolicy(false)}>
          <div className="prose">
            <p>
              ProView is free to use. Account creation and sign-in are handled by the supplied BreadBackend
              service at kaidaz18.duckdns.org. Your email and password are sent directly to that service over
              HTTPS; ProView does not store your password.
            </p>
            <p>
              Your services, songs, church settings, and media are saved to your account on that backend.
              Content is held in this browser only for the live presentation session. Uploaded media URLs may
              be publicly accessible. Don’t upload confidential pastoral information or private recordings.
            </p>
            <p>
              The website does not run a local-demo workspace. Your browser keeps your login session and
              temporary live-display state. Wait for “Saved to cloud” before closing a page. You can also
              export a backup in Settings.
            </p>
            <p>
              Your church is responsible for copyright permissions, licences, and reporting. Displaying a
              credit does not grant a licence.
            </p>
          </div>
          <div className="modal-footer">
            <button className="button button-dark" onClick={() => setPolicy(false)}>
              Got it <Check size={16} />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
