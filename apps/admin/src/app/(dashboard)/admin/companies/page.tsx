'use client';

import { CompaniesPanel } from '@/features/companies/companies-panel';

export default function AdminCompaniesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Selskaper</h2>
        <p className="text-muted-foreground">Administrer alle selskaper i systemet.</p>
      </div>

      <CompaniesPanel />
    </div>
  );
}
