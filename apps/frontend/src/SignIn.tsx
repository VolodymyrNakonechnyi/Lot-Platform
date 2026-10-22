import { useState, type FormEvent } from 'react';
import {
  loginSchema,
  publicUserSchema,
  signInResponseSchema,
  type PublicUser,
} from '@app/contracts';
import './SignIn.css';

const API_URL = 'http://localhost:3000';

const MESSAGES: Record<string, string> = {
  invalid_email: 'Enter a valid email address.',
  email_too_long: 'That email address is too long.',
  password_too_short: 'The password needs at least 8 characters.',
  password_too_long: 'The password may hold at most 128 characters.',
  password_needs_letter: 'The password needs a letter.',
  password_needs_digit: 'The password needs a digit.',
};

async function failure(response: Response): Promise<Error> {
  const body: unknown = await response.json().catch(() => null);
  const message =
    body && typeof body === 'object' && 'message' in body
      ? String(body.message)
      : `Request failed with ${response.status}`;
  return new Error(message);
}

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<PublicUser | null>(null);

  async function signIn(event: FormEvent) {
    event.preventDefault();

    const credentials = loginSchema.safeParse({ email, password });
    if (!credentials.success) {
      const issue = credentials.error.issues[0];
      setError(MESSAGES[issue.message] ?? issue.message);
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`${API_URL}/auth/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials.data),
      });
      if (!response.ok) throw await failure(response);

      const { mfaRequired } = signInResponseSchema.parse(await response.json());
      if (mfaRequired) {
        setNotice(
          'A second factor is pending; this page cannot finish it yet.',
        );
        return;
      }

      const me = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
      if (!me.ok) throw await failure(me);

      setUser(publicUserSchema.parse(await me.json()));
      setPassword('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    try {
      await fetch(`${API_URL}/auth/sign-out`, {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      setNotice(null);
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    return (
      <main className="auth">
        <h1>Signed in</h1>
        <p>
          <code>{user.email}</code> as <code>{user.username}</code>
        </p>
        <p>Email {user.confirmedEmail ? 'confirmed' : 'not confirmed yet'}.</p>
        <button className="auth-button" onClick={signOut} disabled={busy}>
          Sign out
        </button>
      </main>
    );
  }

  return (
    <main className="auth">
      <h1>Sign in</h1>
      <form className="auth-form" onSubmit={signIn} noValidate>
        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && <p className="auth-error">{error}</p>}
        {notice && <p>{notice}</p>}
        <button className="auth-button" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}

export default SignIn;
