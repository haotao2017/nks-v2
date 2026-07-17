import type { LucideIcon } from 'lucide-react';
import {
  Boxes,
  Building2,
  ClipboardCheck,
  Contact,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Mail,
  PackageSearch,
  Tags,
  Users,
  Workflow,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** 仅超级管理员可见。 */
  adminOnly?: boolean;
}

/** 侧边导航 —— 挪威语标签,对应将来要建的业务模块。 */
export const navItems: NavItem[] = [
  { label: 'Oversikt', href: '/', icon: LayoutDashboard },
  { label: 'Prosjekter', href: '/projects', icon: FolderKanban },
  { label: 'Kontakter', href: '/contacts', icon: Contact },
  { label: 'Tjenester', href: '/services', icon: Boxes },
  { label: 'Sjekklister', href: '/checklists', icon: ClipboardCheck },
  { label: 'Parttyper', href: '/party-types', icon: Tags },
  { label: 'Byggevareleverandører', href: '/building-suppliers', icon: PackageSearch },
  { label: 'Dokumenttyper', href: '/doc-types', icon: FileText },
  { label: 'E-postmaler', href: '/email-templates', icon: Mail },
  { label: 'Arbeidsflyt', href: '/workflow-categories', icon: Workflow },
  { label: 'Team', href: '/team', icon: Users },
  { label: 'Selskaper', href: '/admin/companies', icon: Building2, adminOnly: true },
];
