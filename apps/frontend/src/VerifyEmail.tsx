import { useEffect, useRef, useState } from 'react';
import { verifyEmailResponseSchema } from '@app/contracts';
import './VerifyEmail.css';

type State =
  | { status: 'pending' }
  | { status: 'done'; email: string }
  | { status: 'failed'; message: string };

const API_URL = 'http://localhost:3000';

async function verify(token: string): Promise<string> {
  const response = await fetch(`${API_URL}/auth/email/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body && typeof body === 'object' && 'message' in body
        ? String(body.message)
        : `Request failed with ${response.status}`;
    throw new Error(message);
  }

  return verifyEmailResponseSchema.parse(await response.json()).email;
}

const token = new URLSearchParams(window.location.search).get('token');

function VerifyEmail() {
  const [state, setState] = useState<State>(
    token
      ? { status: 'pending' }
      : { status: 'failed', message: 'The link carries no token.' },
  );
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;

    verify(token).then(
      (email) => setState({ status: 'done', email }),
      (error: unknown) =>
        setState({
          status: 'failed',
          message: error instanceof Error ? error.message : String(error),
        }),
    );
  }, []);

  return (
    <main className="verify">
      <h1>Email verification</h1>
      {state.status === 'pending' && <p>Checking your link…</p>}
      {state.status === 'done' && (
        <>
          <p className="verify-ok">
            <code>{state.email}</code> is confirmed.
          </p>
          <a className="verify-link" href="/">
            Continue
          </a>
        </>
      )}
      {state.status === 'failed' && (
        <>
          <p className="verify-error">{state.message}</p>
          <p>Request a new link and open the newest email.</p>
        </>
      )}
    </main>
  );
}

export default VerifyEmail;
