import { useState, type FormEvent } from 'react';
import { resetPasswordSchema, signInResponseSchema } from '@app/contracts';
import './ResetPassword.css';

const API_URL = 'http://localhost:3000';

const MESSAGES: Record<string, string> = {
  token_required: 'The link carries no token.',
  password_too_short: 'Use at least 8 characters.',
  password_too_long: 'That password is too long.',
  password_needs_letter: 'Add at least one letter.',
  password_needs_digit: 'Add at least one digit.',
};

async function failure(response: Response): Promise<Error> {
  const body: unknown = await response.json().catch(() => null);
  const message =
    body && typeof body === 'object' && 'message' in body
      ? String(body.message)
      : `Request failed with ${response.status}`;
  return new Error(message);
}

const token = new URLSearchParams(window.location.search).get('token') ?? '';

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<'signed-in' | 'mfa' | null>(null);

  async function reset(event: FormEvent) {
    event.preventDefault();

    if (password !== repeat) {
      setError('Both passwords must match.');
      return;
    }

    const payload = resetPasswordSchema.safeParse({ token, password });
    if (!payload.success) {
      const issue = payload.error.issues[0];
      setError(MESSAGES[issue.message] ?? issue.message);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload.data),
      });
      if (!response.ok) throw await failure(response);

      const { mfaRequired } = signInResponseSchema.parse(await response.json());
      setPassword('');
      setRepeat('');
      setDone(mfaRequired ? 'mfa' : 'signed-in');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <main className="reset">
        <h1>Reset your password</h1>
        <p className="reset-error">{MESSAGES.token_required}</p>
        <p>Request a new link and open the newest email.</p>
      </main>
    );
  }

  if (done) {
    return (
      <main className="reset">
        <h1>Password updated</h1>
        {done === 'signed-in' ? (
          <p className="reset-ok">You are signed in on this device.</p>
        ) : (
          <p>A second factor is pending; this page cannot finish it yet.</p>
        )}
        <a className="reset-link" href="/">
          Continue
        </a>
      </main>
    );
  }

  return (
    <main className="reset">
      <h1>Reset your password</h1>
      <form className="reset-form" onSubmit={reset} noValidate>
        <label className="reset-field">
          <span>New password</span>
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label className="reset-field">
          <span>Repeat password</span>
          <input
            type="password"
            name="repeat-password"
            autoComplete="new-password"
            value={repeat}
            onChange={(event) => setRepeat(event.target.value)}
          />
        </label>
        {error && <p className="reset-error">{error}</p>}
        <button className="reset-button" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Set new password'}
        </button>
      </form>
    </main>
  );
}

export default ResetPassword;
