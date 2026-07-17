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
  /** i18n key(如 `nav.overview`),渲染时用 `t(labelKey)`。 */
  labelKey: string;
  href: string;
  icon: LucideIcon;
  /** 仅超级管理员可见。 */
  adminOnly?: boolean;
}

/** 侧边导航 —— 标签走 i18n(默认挪威语),对应业务模块。 */
export const navItems: NavItem[] = [
  { labelKey: 'nav.overview', href: '/', icon: LayoutDashboard },
  { labelKey: 'nav.projects', href: '/projects', icon: FolderKanban },
  { labelKey: 'nav.contacts', href: '/contacts', icon: Contact },
  { labelKey: 'nav.services', href: '/services', icon: Boxes },
  { labelKey: 'nav.checklists', href: '/checklists', icon: ClipboardCheck },
  { labelKey: 'nav.partyTypes', href: '/party-types', icon: Tags },
  { labelKey: 'nav.buildingSuppliers', href: '/building-suppliers', icon: PackageSearch },
  { labelKey: 'nav.docTypes', href: '/doc-types', icon: FileText },
  { labelKey: 'nav.emailTemplates', href: '/email-templates', icon: Mail },
  { labelKey: 'nav.workflowCategories', href: '/workflow-categories', icon: Workflow },
  { labelKey: 'nav.team', href: '/team', icon: Users },
  { labelKey: 'nav.companies', href: '/admin/companies', icon: Building2, adminOnly: true },
];
