import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';

const announcements = [
  {
    id: 1,
    title: 'Parent-Teacher Conference',
    description: 'Annual parent-teacher meetings scheduled for all grades.',
    date: '2024-01-20',
    time: '9:00 AM',
    priority: 'High',
    category: 'Event',
  },
  {
    id: 2,
    title: 'Winter Break Schedule',
    description: 'School will be closed from December 23rd to January 3rd.',
    date: '2024-01-18',
    time: '8:00 AM',
    priority: 'Medium',
    category: 'Schedule',
  },
  {
    id: 3,
    title: 'New Library Books Arrival',
    description: 'Over 200 new books have been added to our library collection.',
    date: '2024-01-17',
    time: '2:30 PM',
    priority: 'Low',
    category: 'News',
  },
  {
    id: 4,
    title: 'Sports Day Registration',
    description: 'Registration open for annual sports day activities.',
    date: '2024-01-16',
    time: '11:00 AM',
    priority: 'High',
    category: 'Event',
  },
];

export function AnnouncementsPanel() {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-academic-danger/10 text-academic-danger border-academic-danger/20';
      case 'Medium':
        return 'bg-academic-warning/10 text-academic-warning border-academic-warning/20';
      case 'Low':
        return 'bg-academic-success/10 text-academic-success border-academic-success/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Event':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'Schedule':
        return 'bg-accent text-accent-foreground border-accent/20';
      case 'News':
        return 'bg-secondary text-secondary-foreground border-secondary/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="shadow-sm border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Latest Announcements</CardTitle>
          <p className="text-sm text-muted-foreground">
            Important updates and notifications
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-foreground text-sm">
                  {announcement.title}
                </h4>
                <div className="flex gap-2">
                  <Badge
                    variant="outline"
                    className={getPriorityColor(announcement.priority)}
                  >
                    {announcement.priority}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={getCategoryColor(announcement.category)}
                  >
                    {announcement.category}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {announcement.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(announcement.date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {announcement.time}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}