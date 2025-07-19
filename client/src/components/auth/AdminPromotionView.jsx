import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudentById, updatePromotionStatus } from '../../actions/studentAction';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';

const AdminPromotionView = () => {
  const { studentId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { student, loading, error } = useSelector((state) => state.student);
  const [promotionStatus, setPromotionStatus] = useState('');

  useEffect(() => {
    dispatch(getStudentById(studentId));
  }, [dispatch, studentId]);

  useEffect(() => {
    if (student) {
      setPromotionStatus(student.promotionStatus);
    }
  }, [student]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(updatePromotionStatus(studentId, { promotionStatus }));
    toast.success('Promotion status updated successfully!');
    navigate('/students');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading student...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Update Promotion Status</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <p>
                <strong>Student:</strong> {student?.firstName} {student?.lastName}
              </p>
              <p>
                <strong>Admission Number:</strong> {student?.admissionNumber}
              </p>
            </div>
            <Select value={promotionStatus} onValueChange={setPromotionStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select promotion status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Promoted">Promoted</SelectItem>
                <SelectItem value="Not Promoted">Not Promoted</SelectItem>
                <SelectItem value="Conditional Promotion">Conditional Promotion</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" className="mt-4">
              Update Status
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPromotionView;
