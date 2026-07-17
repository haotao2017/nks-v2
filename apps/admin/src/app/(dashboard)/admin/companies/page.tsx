'use client';

import { useTranslation } from 'react-i18next';

import { CompaniesPanel } from '@/features/companies/companies-panel';

export default function AdminCompaniesPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{t('companies.title')}</h2>
        <p className="text-muted-foreground">{t('companies.subtitle')}</p>
      </div>

      <CompaniesPanel />
    </div>
  );
}
