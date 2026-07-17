'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsersTable } from '@/features/team/users-table';
import { MyProfile } from '@/features/team/my-profile';
import { CompanySettings } from '@/features/team/company-settings';

export default function TeamPage() {
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Team</h2>
        <p className="text-muted-foreground">Administrer brukere, egen profil og selskap.</p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="users">Brukere</TabsTrigger>
            <TabsTrigger value="profile">Min profil</TabsTrigger>
            <TabsTrigger value="company">Selskap</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Ny bruker
            </Button>
          </div>
          <UsersTable createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
        </TabsContent>

        <TabsContent value="profile">
          <MyProfile />
        </TabsContent>

        <TabsContent value="company">
          <CompanySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
