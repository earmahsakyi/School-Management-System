import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Search, DollarSign, Receipt, Calendar, User, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getAllStudents } from '@/actions/studentAction';
import { toast } from 'react-hot-toast';

const OtherPaymentModal = ({ open, onOpenChange, onSuccess }) => {
  const dispatch = useDispatch();
  const students = useSelector((state) => state.student.students);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      studentId: '',
      amount: '',
      bankDepositNumber: '',
      academicYear: '',
      description: 'Other Payment',
      paymentOf:''
    }
  });

  // Filter students based on search input
  const filteredStudents = students.filter(student =>
    student.firstName.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.lastName.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.admissionNumber.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Handle student selection
  const handleStudentSelect = useCallback((student) => {
    setSelectedStudent(student);
    setValue('studentId', student._id);
  }, [setValue]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      if (!selectedStudent) {
        toast.error("Please select a student.");
        return;
      }

      if (!data.amount || parseFloat(data.amount) <= 0) {
        toast.error("Please enter a valid amount greater than 0.");
        return;
      }

      if (!data.academicYear) {
        toast.error("Please select an academic year.");
        return;
      }
      if (!data.paymentOf) {
        toast.error("Please enter the payment description.");
        return;
      }

      setIsSubmitting(true);

      const payload = {
        studentId: data.studentId,
        amount: parseFloat(data.amount),
        bankDepositNumber: data.bankDepositNumber.trim(),
        academicYear: data.academicYear,
        paymentOf: data.paymentOf,
        dateOfPayment: data.dateOfPayment,
        description: data.description.trim() || 'Other Payment'
      };

      // Make API call to create payment and generate receipt
      const response = await fetch('/api/other-payments/generate-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create payment');
      }

      // Handle PDF download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `receipt-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Payment recorded successfully and receipt downloaded!");
      onSuccess();
      onOpenChange(false);
      resetForm();

    } catch (error) {
      console.error('Payment creation error:', error);
      const errorMessage = error.message || "Failed to create payment record.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form function
  const resetForm = () => {
    reset({
      studentId: '',
      amount: '',
      bankDepositNumber: '',
      paymentOf: '',
      academicYear: '',
      description: 'Academic Payment'
    });
    setSelectedStudent(null);
    setStudentSearch('');
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, reset]);

  // Fetch students on mount
  useEffect(() => {
    dispatch(getAllStudents());
  }, [dispatch]);

  // Format currency display
  const formatCurrency = (amount) => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-LR', {
      style: 'currency',
      currency: 'LRD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const watchedAmount = watch('amount');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Create New Payment Record
          </DialogTitle>
          <DialogDescription>
            Record a new payment and generate an official receipt. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow min-h-0 pr-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Student Selection */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <Label htmlFor="student-search" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Select Student *
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="student-search"
                    placeholder="Search by name or admission number..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-10"
                    disabled={isSubmitting}
                  />
                </div>

                {selectedStudent ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 border rounded-lg bg-muted/50 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{selectedStudent.firstName} {selectedStudent.lastName} {selectedStudent.middleName || ''} </h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedStudent.admissionNumber} - Grade {selectedStudent.gradeLevel}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Department: {selectedStudent.department}
                        </p>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setSelectedStudent(null);
                          setValue('studentId', '');
                        }} 
                        disabled={isSubmitting}
                      >
                        Change
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="grid gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map(student => (
                        <motion.div
                          key={student._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleStudentSelect(student)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{student.firstName} {student.lastName}  {selectedStudent?.middleName || '' }</h4>
                              <p className="text-sm text-muted-foreground">{student.admissionNumber}</p>
                            </div>
                            <Badge variant="outline">
                              Grade {student.gradeLevel} - {student.department}
                            </Badge>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        {studentSearch ? 'No students found matching your search.' : 'Start typing to search for students.'}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Payment Amount (LRD) *
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  {...register("amount", {
                    required: "Payment amount is required",
                    min: { value: 0.01, message: "Amount must be greater than 0" },
                    valueAsNumber: true
                  })}
                  disabled={isSubmitting}
                  className="text-right"
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm">{errors.amount.message}</p>
                )}
                {watchedAmount && (
                  <p className="text-sm text-muted-foreground">
                    Amount: {formatCurrency(watchedAmount)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="academicYear" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Academic Year *
                </Label>
                <Select 
                  onValueChange={v => setValue('academicYear', v)} 
                  disabled={isSubmitting}
                  value={watch('academicYear')}
                >
                  <SelectTrigger id="academicYear">
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024/2025">2024/2025</SelectItem>
                    <SelectItem value="2025/2026">2025/2026</SelectItem>
                    <SelectItem value="2026/2027">2026/2027</SelectItem>
                    <SelectItem value="2027/2028">2027/2028</SelectItem>
                    <SelectItem value="2028/2029">2028/2029</SelectItem>
                    <SelectItem value="2029/2030">2029/2030</SelectItem>
                  </SelectContent>
                </Select>
                {errors.academicYear && (
                  <p className="text-red-500 text-sm">{errors.academicYear.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankDepositNumber">
                Bank Deposit Number (Optional)
              </Label>
              <Input
                id="bankDepositNumber"
                placeholder="Enter bank deposit slip number if applicable"
                {...register("bankDepositNumber")}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Reference number from bank deposit slip or transaction
              </p>
            </div>

              <div className="space-y-2">
              <Label htmlFor="paymentOf">
                Payment Of :
              </Label>
              <Input
                id="paymentOf"
                placeholder="i.e Track Suit"
                {...register("paymentOf")}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Other payments 
              </p>
            </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfPayment">Date of Payment</Label>
                <Input
                  id="dob"
                  type="date"
                  {...register('dateOfPayment', { required: 'Date of Payment is required' })}
                />
                {errors.dateOfPayment && (
                  <p className="text-sm text-destructive">{errors.dateOfPayment.message}</p>
                )}
              </div>


            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Payment Description
              </Label>
              <Textarea
                id="description"
                placeholder="Brief description of what this payment covers..."
                rows={3}
                {...register("description")}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                This will appear on the receipt (e.g., "Tuition Fee - Semester 1", "School Supplies", etc.)
              </p>
            </div>

            {/* Payment Summary */}
            {selectedStudent && watchedAmount && (
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Payment Summary
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Student:</p>
                      <p className="font-medium">
                        {selectedStudent.firstName} {selectedStudent.lastName} {selectedStudent.middleName}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Admission Number:</p>
                      <p className="font-medium">{selectedStudent.admissionNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Academic Year:</p>
                      <p className="font-medium">{watch('academicYear') || 'Not selected'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Amount:</p>
                      <p className="font-bold text-lg text-green-600">
                        {formatCurrency(watchedAmount)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </ScrollArea>

        <DialogFooter className="mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={handleSubmit(onSubmit)} 
                  disabled={isSubmitting || !selectedStudent || !watchedAmount}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Receipt className="h-4 w-4" />
                      Create Payment & Download Receipt
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Payment will be recorded and receipt will be automatically downloaded</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OtherPaymentModal;