'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PartyTypesTable } from '@/features/party-types/party-types-table';

export default function PartyTypesPage() {
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Parttyper</h2>
          <p className="text-muted-foreground">Administrer parttyper.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Ny parttype
        </Button>
      </div>

      <PartyTypesTable createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
    </div>
  );
}
