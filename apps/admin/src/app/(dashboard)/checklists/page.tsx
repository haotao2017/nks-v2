'use client';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ChecklistTemplatesTable } from '@/features/checklists/checklist-templates-table';

export default function ChecklistsPage() {
  const { t } = useTranslation();
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t('checklists.title')}</h2>
          <p className="text-muted-foreground">{t('checklists.subtitle')}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          {t('checklists.newButton')}
        </Button>
      </div>

      <ChecklistTemplatesTable createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
    </div>
  );
}
