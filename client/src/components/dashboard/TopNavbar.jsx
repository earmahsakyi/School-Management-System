import { useState, useEffect} from 'react';
import { Bell, Menu, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { logout } from '@/actions/authAction';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { getCurrentAdminProfile } from '@/actions/adminAction';

export function TopNavbar({ onMenuClick }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const API_BASE_URL = 'http://localhost:5000';
  const { profile, loading } = useSelector(state => state.admin);
  const { user } = useSelector(state => state.auth);
  const [notifications] = useState([
    { id: 1, title: 'New student registration', time: '5 min ago' },
    { id: 2, title: 'Fee payment received', time: '1 hour ago' },
    { id: 3, title: 'Staff meeting scheduled', time: '2 hours ago' },
  ]);
  useEffect(() => {
    dispatch(getCurrentAdminProfile());
  }, [dispatch]);


const onLogout = () => {
  dispatch(logout())
  navigate('/')

}

if (loading && !profile) {
    return (
      <div className="w-full max-w-md mx-auto bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-100 rounded-2xl shadow-lg px-6 py-8 text-center">
        Loading profile card...
      </div>
    );
  }

   let avatarSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.fullName || "Admin")}`;
  if (profile?.photo) {
    avatarSrc = `${API_BASE_URL}/uploads/admins/${profile.photo.split(/[\\/]/).pop()}`;
  }


  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Breadcrumb / Title */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-x-4 lg:gap-x-6">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-6 w-6" />
              {notifications.length > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  variant="destructive"
                >
                  {notifications.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="px-4 py-2 border-b">
              <h3 className="font-semibold">Notifications</h3>
            </div>
            {notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-xs text-muted-foreground">{notification.time}</p>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="px-4 py-2 text-center">
              <span className="text-sm text-primary cursor-pointer">View all notifications</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 bg-white rounded-full p-2 hover:bg-gray-200 transition duration-150">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  {/* <User className="h-4 w-4 text-primary-foreground" /> */}
                  <img
                  src={avatarSrc}
                  className='w-8 h-8 rounded-full shadow-md border-4 border-white dark:border-zinc-800 object-cover'
                  />
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">{profile?.fullName}</span>
                  <span className="text-xs text-muted-foreground">{profile?.position}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{profile?.fullName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
