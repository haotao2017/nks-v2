import type { Metadata } from 'next';

import { LoginView } from './login-view';

export const metadata: Metadata = {
  title: 'Logg inn · NKS Admin',
};

export default function LoginPage() {
  return <LoginView />;
}
