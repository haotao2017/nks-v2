'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ContactsTable } from '@/features/contacts/contacts-table';

export default function ContactsPage() {
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Kontakter</h2>
          <p className="text-muted-foreground">Administrer kontaktpersoner.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Ny kontakt
        </Button>
      </div>

      <ContactsTable createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
    </div>
  );
}
