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
import { User, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import AdminLoginDialog from '@/components/AdminLoginDialog';

const BrandNav = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      setIsScrolled(currentScrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Determine navbar style based on scroll position
  const getNavbarStyle = () => {
    if (scrollY < window.innerHeight * 0.8) {
      // In hero section - transparent with white text
      return {
        background: 'transparent',
        textColor: 'text-white',
        logoColor: 'text-white',
        buttonStyle: 'text-white hover:bg-white/20',
        navBackground: 'bg-white/10 backdrop-blur-sm border-white/20',
        loginButton: 'bg-white text-green-600 hover:bg-gray-100'
      };
    } else {
      // Past hero section - white background with dark text
      return {
        background: 'bg-white/95 backdrop-blur-md shadow-lg',
        textColor: 'text-gray-900',
        logoColor: 'text-green-600',
        buttonStyle: 'text-gray-700 hover:bg-gray-100',
        navBackground: 'bg-gray-50/80 backdrop-blur-sm border-gray-200',
        loginButton: 'bg-green-600 text-white hover:bg-green-700'
      };
    }
  };

  const navStyle = getNavbarStyle();

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navStyle.background}`}>
      <nav className="container mx-auto flex items-center justify-between px-4 py-4">
        {/* Simple Logo */}
        <div className="px-6 py-3 flex items-center">
          <Link to="/" className={`text-xl font-bold tracking-tight transition-colors duration-300 ${navStyle.logoColor}`}>
            QuickCourt
          </Link>
        </div>
        
        {/* Navigation Options */}
        <div className={`rounded-full p-1 flex items-center gap-1 border transition-all duration-300 ${navStyle.navBackground}`}>
          <Button 
            variant="ghost" 
            className={`rounded-full px-6 transition-colors duration-300 ${navStyle.buttonStyle}`} 
            onClick={() => navigate('/play')}
          >
            Play
          </Button>
          <Button 
            variant="ghost" 
            className={`rounded-full px-6 transition-colors duration-300 ${navStyle.buttonStyle}`} 
            onClick={() => navigate('/book')}
          >
            Book
          </Button>
          <Button 
            variant="ghost" 
            className={`rounded-full px-6 transition-colors duration-300 ${navStyle.buttonStyle}`} 
            onClick={() => navigate('/train')}
          >
            Train
          </Button>
          
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`relative h-9 w-9 rounded-full ml-2 transition-colors duration-300 ${navStyle.buttonStyle}`}>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
                    <AvatarFallback className={`transition-colors duration-300 ${scrollY < window.innerHeight * 0.8 ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>
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
                    <DropdownMenuItem onClick={() => navigate('/owner/dashboard')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Owner Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              className={`ml-2 px-6 rounded-full font-medium transition-all duration-300 ${navStyle.loginButton}`} 
              onClick={() => navigate('/login')}
            >
              Login / Sign up
            </Button>
          )}
          <AdminLoginDialog />
        </div>
      </nav>
    </header>
  );
};

export default BrandNav;
