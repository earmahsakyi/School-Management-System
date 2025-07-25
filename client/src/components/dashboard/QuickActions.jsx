import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, UserPlus, BookPlus, CalendarPlus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AddStudentModal } from './AddStudentModal';
import { AddStaffModal } from '../staff/AddStaffModal';

const quickActions = [
  {
    title: 'Add Student',
    description: 'Register a new student',
    icon: UserPlus,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    action: 'add-student',
  },
  {
    title: 'Add Staff',
    description: 'Create a new Staff',
    icon: BookPlus,
    color: 'text-academic-success',
    bgColor: 'bg-academic-success/10',
    action: 'add-staff',
  },
  {
    title: 'Schedule Event',
    description: 'Add calendar event',
    icon: CalendarPlus,
    color: 'text-academic-warning',
    bgColor: 'bg-academic-warning/10',
    action: 'add-event',
  },
  {
    title: 'Generate Report',
    description: 'Create new report',
    icon: FileText,
    color: 'text-academic-danger',
    bgColor: 'bg-academic-danger/10',
    action: 'generate-report',
  },
];

export function QuickActions() {
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);

  const handleAction = (action) => {
    switch (action) {
      case 'add-student':
        setIsAddStudentOpen(true);
        break;
      case 'add-staff':
        setIsAddStaffOpen(true);
        break;
      
      default:
        console.log(`Action: ${action}`);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            <p className="text-sm text-muted-foreground">
              Frequently used actions and shortcuts
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="ghost"
                    className="h-auto p-4 w-full flex flex-col items-center gap-3 hover:bg-muted/50 border border-border/50 hover:border-border transition-all"
                    onClick={() => handleAction(action.action)}
                  >
                    <div className={`${action.bgColor} p-3 rounded-xl`}>
                      <action.icon className={`h-6 w-6 ${action.color}`} />
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-sm text-foreground">
                        {action.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <AddStudentModal 
        open={isAddStudentOpen} 
        onOpenChange={setIsAddStudentOpen} 
      />
      <AddStaffModal
      open={isAddStaffOpen}
      onOpenChange={setIsAddStaffOpen}
      />
    </>
  );
}