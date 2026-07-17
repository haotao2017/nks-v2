'use client';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ContactsTable } from '@/features/contacts/contacts-table';

export default function ContactsPage() {
  const { t } = useTranslation();
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t('contacts.title')}</h2>
          <p className="text-muted-foreground">{t('contacts.subtitle')}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          {t('contacts.newButton')}
        </Button>
      </div>

      <ContactsTable createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
    </div>
  );
}
