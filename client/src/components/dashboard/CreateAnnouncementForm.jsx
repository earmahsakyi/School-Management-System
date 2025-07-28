import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createAnnouncement } from '../../actions/announcementsAction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CreateAnnouncementForm({ setOpen }) {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    priority: 'Medium',
    category: 'News',
  });

  const { title, description, date, time, priority, category } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(createAnnouncement(formData));
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Announcement</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            name="title"
            value={title}
            onChange={onChange}
            placeholder="Title"
            required
          />
          <Textarea
            name="description"
            value={description}
            onChange={onChange}
            placeholder="Description"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              name="date"
              type="date"
              value={date}
              onChange={onChange}
              required
            />
            <Input
              name="time"
              type="time"
              value={time}
              onChange={onChange}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              name="priority"
              value={priority}
              onValueChange={(value) => onSelectChange('priority', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select
              name="category"
              value={category}
              onValueChange={(value) => onSelectChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Event">Event</SelectItem>
                <SelectItem value="Schedule">Schedule</SelectItem>
                <SelectItem value="News">News</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
