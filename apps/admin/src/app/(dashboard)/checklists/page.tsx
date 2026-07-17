'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ChecklistTemplatesTable } from '@/features/checklists/checklist-templates-table';

export default function ChecklistsPage() {
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Sjekklister</h2>
          <p className="text-muted-foreground">Administrer sjekklister og sjekkpunkter.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Ny sjekkliste
        </Button>
      </div>

      <ChecklistTemplatesTable createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
    </div>
  );
}
