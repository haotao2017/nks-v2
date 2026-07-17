'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { BuildingSuppliersTable } from '@/features/building-suppliers/building-suppliers-table';

export default function BuildingSuppliersPage() {
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Byggevareleverandører</h2>
          <p className="text-muted-foreground">Administrer byggevareleverandører.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Ny byggevareleverandør
        </Button>
      </div>

      <BuildingSuppliersTable createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
    </div>
  );
}
