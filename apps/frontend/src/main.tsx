import { StrictMode, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import VerifyEmail from './VerifyEmail.tsx';
import SignIn from './SignIn.tsx';

const ROUTES: Record<string, ReactElement> = {
  '/verify-email': <VerifyEmail />,
  '/sign-in': <SignIn />,
};

const page = ROUTES[window.location.pathname] ?? <App />;

createRoot(document.getElementById('root')!).render(
  <StrictMode>{page}</StrictMode>,
);
