import { FolderKanban, Users, ClipboardCheck } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const stats = [
  { label: 'Aktive prosjekter', value: '—', icon: FolderKanban },
  { label: 'Kontakter', value: '—', icon: Users },
  { label: 'Sjekklister', value: '—', icon: ClipboardCheck },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Velkommen</h2>
        <p className="text-muted-foreground">Oversikt over NKS byggekontroll.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <CardDescription>Data kobles til i en senere fase</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
