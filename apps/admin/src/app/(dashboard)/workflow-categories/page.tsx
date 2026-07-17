'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { WorkflowCategoriesTable } from '@/features/workflow-categories/workflow-categories-table';

export default function WorkflowCategoriesPage() {
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Arbeidsflyt</h2>
          <p className="text-muted-foreground">Administrer arbeidsflyter og steg.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Ny arbeidsflyt
        </Button>
      </div>

      <WorkflowCategoriesTable createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
    </div>
  );
}
