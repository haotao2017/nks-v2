import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Logg inn · NKS Admin',
};

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-gradient-to-b from-muted/40 to-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-xl">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">NKS Admin</h1>
          <p className="text-muted-foreground text-sm">Byggekontroll administrasjon</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Logg inn</CardTitle>
            <CardDescription>Bruk din NKS-konto for å fortsette</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
