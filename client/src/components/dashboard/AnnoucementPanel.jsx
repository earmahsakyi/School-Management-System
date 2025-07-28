import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, PlusCircle, Trash2 } from 'lucide-react';
import {
  getAnnouncements,
  deleteAnnouncement,
} from '../../actions/announcementsAction';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { CreateAnnouncementForm } from './CreateAnnouncementForm';

export function AnnouncementsPanel() {
  const dispatch = useDispatch();
  const { announcements, loading } = useSelector((state) => state.announcement);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    dispatch(getAnnouncements());
    const interval = setInterval(() => {
      dispatch(getAnnouncements());
    }, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleDelete = (id) => {
    dispatch(deleteAnnouncement(id));
  };

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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              Latest Announcements
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Important updates and notifications
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <CreateAnnouncementForm setOpen={setOpen} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p>Loading...</p>
          ) : (
            announcements.map((announcement) => (
              <div
                key={announcement._id}
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDelete(announcement._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}