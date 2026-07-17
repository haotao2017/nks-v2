'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ServicesTable } from '@/features/services/services-table';

export default function ServicesPage() {
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Tjenester</h2>
          <p className="text-muted-foreground">Administrer tjenester.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Ny tjeneste
        </Button>
      </div>

      <ServicesTable createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
    </div>
  );
}
