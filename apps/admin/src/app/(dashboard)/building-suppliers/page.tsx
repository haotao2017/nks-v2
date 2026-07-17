'use client';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { BuildingSuppliersTable } from '@/features/building-suppliers/building-suppliers-table';

export default function BuildingSuppliersPage() {
  const { t } = useTranslation();
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('buildingSuppliers.title')}
          </h2>
          <p className="text-muted-foreground">{t('buildingSuppliers.subtitle')}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          {t('buildingSuppliers.newButton')}
        </Button>
      </div>

      <BuildingSuppliersTable createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
    </div>
  );
}
