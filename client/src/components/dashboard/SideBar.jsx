import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  BookOpen, 
  GraduationCap,
  CreditCard,
  BarChart3,
  Settings,
  X,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin-dashboard' },
  { icon: Users, label: 'Students', href: '/students' },
  { icon: UserCheck, label: 'Staff', href: '/staff' },
   { icon: FileText, label: 'Grades', href: '/grade-section' }, 
  { icon: BookOpen, label: 'Transcript', href: '/transcript' },
  { icon: BookOpen, label: 'Master Grade Sheet', href: '/grade-sheet' },
  { icon: BarChart3, label: 'Roster Summary', href: '/roster-summary' },
  { icon: CreditCard, label: 'Academic Fees', href: '/payments' },
  { icon: CreditCard, label: 'Other Payments', href: '/other-payments' },
  { icon: CreditCard, label: 'TVETS', href: '/tvet-payments' },
  { icon: BarChart3, label: 'Reports', href: '/financial-report' },
  { icon: Settings, label: 'Promotion', href: '/promotion' },
];

export function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-border px-6 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-xl font-bold text-foreground">VMHS</div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {menuItems.map((item) => {
                    const isActive = currentPath === item.href;
                    return (
                      <li key={item.label}>
                        <Link
                          to={item.href}
                          className={cn(
                            'group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-medium transition-all duration-200',
                            isActive
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          )}
                        >
                          <item.icon 
                            className={cn(
                              'h-5 w-5 shrink-0',
                              isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                            )}
                          />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <motion.div
        className={cn(
          'fixed inset-y-0 z-50 flex w-64 flex-col lg:hidden',
          isOpen ? 'left-0' : '-left-64'
        )}
        initial={false}
        animate={{ x: isOpen ? 0 : -256 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r border-border">
          {/* Header */}
          <div className="flex h-16 shrink-0 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-xl font-bold text-foreground">VMHS</div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {menuItems.map((item) => {
                    const isActive = currentPath === item.href;
                    return (
                      <li key={item.label}>
                        <Link
                          to={item.href}
                          onClick={onClose}
                          className={cn(
                            'group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-medium transition-all duration-200',
                            isActive
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          )}
                        >
                          <item.icon 
                            className={cn(
                              'h-5 w-5 shrink-0',
                              isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                            )}
                          />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </motion.div>
    </>
  );
}
