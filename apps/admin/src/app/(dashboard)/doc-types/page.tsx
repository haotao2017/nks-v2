'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DocTypesTable } from '@/features/doc-types/doc-types-table';

export default function DocTypesPage() {
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Dokumenttyper</h2>
          <p className="text-muted-foreground">Administrer dokumenttyper.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Ny dokumenttype
        </Button>
      </div>

      <DocTypesTable createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
    </div>
  );
}
