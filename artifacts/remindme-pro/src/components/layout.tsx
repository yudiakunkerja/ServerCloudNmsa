import { Link, useLocation } from "wouter";
import { LayoutDashboard, CheckSquare, Clock, Users, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useFcm } from "@/hooks/use-fcm";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { logout } = useAuth();
  
  // Register FCM on layout mount (which means user is logged in)
  useFcm();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/reminders", label: "Reminders & Notes", icon: CheckSquare },
    { href: "/alarms", label: "Alarms", icon: Clock },
    { href: "/groups", label: "Groups", icon: Users },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row text-foreground">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-b md:border-r border-border flex flex-col">
        <div className="p-6 pb-2">
          <h1 className="text-xl font-serif text-primary font-bold">RemindMe Pro</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                <item.icon className="w-4 h-4" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-auto">
        <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
