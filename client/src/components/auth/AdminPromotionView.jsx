import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getStudentById, updatePromotionStatus } from '@/actions/studentAction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const AdminPromotionModal = ({ studentId, open, onOpenChange }) => {
  const dispatch = useDispatch();
  const { student, loading, error: studentError } = useSelector((state) => state.student); // Renamed error to studentError to avoid conflict

  const [promotionStatus, setPromotionStatus] = useState('');
  const [promotedToGrade, setPromotedToGrade] = useState('');
  const [notes, setNote] = useState('');

  useEffect(() => {
    if (studentId && open) {
      dispatch(getStudentById(studentId));
    }
  }, [dispatch, studentId, open]);

  useEffect(() => {
    if (student) {
      setPromotionStatus(student.promotionStatus || '');
      setPromotedToGrade(student.promotedToGrade || '');
      
    }
  }, [student]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!promotionStatus) {
      toast.error('Please select a promotion status');
      return;
    }

   
    if (promotionStatus === 'Promoted' && !promotedToGrade) {
      toast.error('Please select a promoted grade');
      return;
    }


    try {
      await dispatch(updatePromotionStatus(studentId, promotionStatus, promotedToGrade, notes));
      toast.success('Promotion status updated successfully!');
      onOpenChange(false); // Close modal on success
    } catch (err) {
      toast.error(studentError || 'Failed to update promotion status.');
      console.error("Failed to update promotion status:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Promotion Status</DialogTitle>
          <DialogDescription>
            Adjust the promotion status for {student?.firstName} {student?.lastName}.
          </DialogDescription>
        </DialogHeader>
        {loading && !student ? ( // Show loader only when initially fetching student data
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Promotion Status</label>
              <Select value={promotionStatus} onValueChange={setPromotionStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Promoted">Promoted</SelectItem>
                  <SelectItem value="Conditional Promotion">Conditional Promotion</SelectItem>
                  <SelectItem value="Not Promoted">Not Promoted</SelectItem>
                  <SelectItem value="Asked Not to Enroll">Asked Not to Enroll</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {promotionStatus === 'Promoted' && (
              <div>
                <label className="text-sm font-medium">Promoted To Grade</label>
                <Select value={promotedToGrade} onValueChange={setPromotedToGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="9">9</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="11">11</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {promotionStatus === 'Conditional Promotion' && (
              <div>
                <label className="text-sm font-medium">Promoted To Grade</label>
                <Select value={promotedToGrade} onValueChange={setPromotedToGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="9">9</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="11">11</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
            )}
              <div className="space-y-2">
               <Label htmlFor="notes">Notes (Optional)</Label>
           <Input
             id="notes"
            type="text"
             value={notes}
              onChange={(e) => setNote(e.target.value)}
             placeholder="Add any comments or special notes"
           />
          </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full"
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Promotion'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminPromotionModal;