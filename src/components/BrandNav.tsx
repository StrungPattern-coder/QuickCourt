import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, User, Settings, LogOut, Moon, Sun, Monitor } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const BrandNav = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const ThemeIcon = theme === 'dark' ? Sun : theme === 'light' ? Moon : Monitor;

  return (
    <header className="sticky top-6 z-50">
      <nav className="container mx-auto flex items-center justify-between px-4">
        <div className="glass-panel rounded-full px-4 py-2 flex items-center gap-2 shadow-[var(--shadow-elegant)]">
          <div className="h-8 w-8 rounded-full bg-gradient-primary" aria-hidden />
          <Link to="/" className="font-bold tracking-tight">QuickCourt</Link>
        </div>
        
        <div className="glass-panel rounded-full p-1 flex items-center gap-2 shadow-[var(--shadow-elegant)]">
          <Button variant="ghost" className="rounded-full" onClick={() => navigate('/venues')}>
            Venues
          </Button>
          <Button variant="ghost" className="rounded-full" onClick={() => navigate('/venues')}>
            Explore
          </Button>
          
          {/* Theme Toggle Button */}
          <Button
            variant="ghost"
            className="rounded-full h-9 w-9 p-0"
            onClick={() => {
              const themes = ['light', 'dark', 'system'] as const;
              const currentIndex = themes.indexOf(theme);
              const nextTheme = themes[(currentIndex + 1) % themes.length];
              setTheme(nextTheme);
            }}
          >
            <ThemeIcon className="h-4 w-4" />
          </Button>
          
          {isAuthenticated ? (
            <>
              <Button variant="pill" className="pl-3 pr-4" onClick={() => navigate('/venues')}>
                <Search className="mr-1" />
                Find courts
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
                      <AvatarFallback>
                        {user?.fullName ? getInitials(user.fullName) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.fullName || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-bookings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>My Bookings</span>
                  </DropdownMenuItem>
                  {user?.role === 'ADMIN' && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {user?.role === 'OWNER' && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/owner/listing')}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>My Listings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      const themes = ['light', 'dark', 'system'] as const;
                      const currentIndex = themes.indexOf(theme);
                      const nextTheme = themes[(currentIndex + 1) % themes.length];
                      setTheme(nextTheme);
                    }}
                  >
                    <ThemeIcon className="mr-2 h-4 w-4" />
                    <span>Theme: {theme}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" className="rounded-full" onClick={() => navigate('/login')}>
                Sign in
              </Button>
              <Button variant="pill" className="pl-3 pr-4" onClick={() => navigate('/signup')}>
                <Search className="mr-1" />
                Get started
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default BrandNav;
