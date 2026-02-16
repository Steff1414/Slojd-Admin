import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Building2,
  GraduationCap,
  UserCircle,
  LogOut,
  Menu,
  X,
  Search,
  History,
  Merge,
  FileText,
  Upload,
  Network,
  School,
  Landmark,
  Settings,
  ShieldCheck,
  Store,
  ChevronsLeft,
  ChevronsRight,
  Scissors,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlobalSearch } from '@/components/GlobalSearch';
import { useUserRole } from '@/hooks/useUserRole';
import type { LucideIcon } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: '',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'CRM',
    items: [
      { href: '/customers', label: 'Kunder', icon: Building2 },
      { href: '/contacts', label: 'Kontakter', icon: Users },
      { href: '/organisation-graph', label: 'Organisationer', icon: Network },
      { href: '/teachers', label: 'Lärare', icon: GraduationCap },
      { href: '/schools', label: 'Skolor', icon: School },
      { href: '/payers', label: 'Betalare', icon: Landmark },
      { href: '/relations', label: 'Relationer', icon: Search },
    ],
  },
  {
    label: 'Verktyg',
    items: [
      { href: '/import', label: 'Import', icon: Upload },
      { href: '/audit-log', label: 'Ändringslogg', icon: History },
      { href: '/merge-contacts', label: 'Slå samman', icon: Merge },
    ],
  },
  {
    label: 'Integrationer',
    items: [
      { href: '/api-docs', label: 'API Docs', icon: FileText },
      { href: '/norce', label: 'Norce Commerce', icon: Store },
    ],
  },
];

function NavLink({
  item,
  isActive,
  collapsed,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-md text-[13px] font-medium transition-colors duration-150',
        collapsed ? 'justify-center px-2 py-2' : 'px-2.5 py-1.5',
        isActive
          ? 'bg-sidebar-accent text-foreground'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-sidebar-primary" />
      )}
      <Icon className={cn('shrink-0', collapsed ? 'h-5 w-5' : 'h-4 w-4')} />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? 'w-16' : 'w-60';
  const mainMargin = collapsed ? 'lg:ml-16' : 'lg:ml-60';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const closeMobile = () => setSidebarOpen(false);

  const renderNav = () => (
    <>
      {navGroups.map((group, gi) => (
        <div key={gi} className={cn(gi > 0 && 'mt-5')}>
          {group.label && !collapsed && (
            <div className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.label}
            </div>
          )}
          {group.label && collapsed && gi > 0 && (
            <div className="mx-3 mb-2 border-t border-sidebar-border" />
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                isActive={location.pathname.startsWith(item.href)}
                collapsed={collapsed}
                onClick={closeMobile}
              />
            ))}
          </div>
        </div>
      ))}

      {isAdmin && (
        <div className="mt-5">
          {!collapsed && (
            <div className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Admin
            </div>
          )}
          {collapsed && (
            <div className="mx-3 mb-2 border-t border-sidebar-border" />
          )}
          <NavLink
            item={{ href: '/allowed-emails', label: 'Användare', icon: ShieldCheck }}
            isActive={location.pathname === '/allowed-emails'}
            collapsed={collapsed}
            onClick={closeMobile}
          />
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-foreground/60 p-2 rounded-md hover:bg-accent transition-colors"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="flex items-center gap-1.5">
          <img src="/logo.jpeg" alt="Slöjd-Detaljer" className="h-5 object-contain" />
          <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60">Admin</span>
        </div>
        <div className="w-9" />
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-200 lg:translate-x-0',
          sidebarWidth,
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={cn('h-14 flex items-center border-b border-sidebar-border', collapsed ? 'justify-center px-2' : 'px-4')}>
            <Link to="/dashboard" className="flex items-center gap-2">
              {collapsed ? (
                <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shrink-0">
                  <Scissors className="h-4 w-4 text-primary-foreground" />
                </div>
              ) : (
                <>
                  <img src="/logo.jpeg" alt="Slöjd-Detaljer" className="h-6 object-contain" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mt-0.5">Admin</span>
                </>
              )}
            </Link>
          </div>

          {/* Search */}
          {!collapsed && (
            <div className="px-3 py-2.5">
              <GlobalSearch />
            </div>
          )}

          {/* Navigation */}
          <nav className={cn('flex-1 overflow-y-auto py-3', collapsed ? 'px-2' : 'px-3')}>
            {renderNav()}
          </nav>

          {/* Collapse toggle — desktop only */}
          <div className="hidden lg:flex items-center justify-end px-3 py-2 border-t border-sidebar-border">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-muted-foreground/50 hover:text-muted-foreground p-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
              title={collapsed ? 'Expandera' : 'Komprimera'}
            >
              {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* User section */}
          <div className={cn('border-t border-sidebar-border', collapsed ? 'p-2' : 'p-3')}>
            {collapsed ? (
              <div className="flex flex-col items-center gap-2">
                <Link
                  to="/account"
                  className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center hover:bg-sidebar-accent/80 transition-colors"
                  title={user?.email ?? 'Mitt konto'}
                >
                  <UserCircle className="h-4 w-4 text-sidebar-accent-foreground" />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-muted-foreground/50 hover:text-muted-foreground p-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
                  title="Logga ut"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
                    <UserCircle className="h-4 w-4 text-sidebar-accent-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground truncate flex-1">
                    {user?.email}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Link
                    to="/account"
                    onClick={closeMobile}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Konto
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="h-auto px-2.5 py-1.5 text-xs text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <LogOut className="h-3.5 w-3.5 mr-1.5" />
                    Logga ut
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/10 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Main content */}
      <main className={cn(mainMargin, 'min-h-screen pt-14 lg:pt-0 transition-all duration-200')}>
        <div className="p-5 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
