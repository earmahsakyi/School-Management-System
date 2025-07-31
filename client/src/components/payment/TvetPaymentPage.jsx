import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Loader2,
  DollarSign,
  Receipt,
  Download,
  School,
  TrendingUp,
  BookOpen,
   Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import AddTvetPaymentModal from './AddTvetPaymentModal';
import { toast } from 'react-hot-toast';
import { DashboardLayout } from '../dashboard/DashboardLayout';

const PAYMENT_DESCRIPTIONS = [
  'Interview and Registration',
  'Auto Mechanic',
  'Agriculture',
  'Catering and Pastries',
  'Carpentry (Wood Work)',
  'Electricity',
  'ICT',
  'Plumbing',
  'Tile Layering',
  'Masonry'
];

const ViewTvetPaymentModal = ({ open, onOpenChange, payment }) => {
  if (!payment) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LR', {
      style: 'currency',
      currency: 'LRD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const totalProgramCost = payment.breakdown?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const totalPaid = payment.totalPaid || 0;
  const balance = totalProgramCost - totalPaid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            TVET Payment Details - {payment.receiptNumber}
          </DialogTitle>
          <DialogDescription>
            Complete TVET payment information and receipt details
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Student Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Student Name</p>
                  <p className="font-semibold">{payment.studentName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Student ID</p>
                  <p className="font-semibold">{payment.studentID}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Deposit Number</p>
                  <p className="font-semibold">{payment.depositNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Date</p>
                  <p className="font-semibold">{formatDate(payment.dateOfPayment)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Selected Programs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payment.breakdown?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="font-medium">{item.description}</span>
                      <Badge variant="outline" className="font-semibold">
                        {formatCurrency(item.amount)}
                      </Badge>
                    </div>
                  ))}
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="font-bold">Total Program Cost:</span>
                    <Badge className="font-bold text-base">
                      {formatCurrency(totalProgramCost)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {payment.firstInstallment > 0 && (
                    <div className="text-center p-3 bg-blue-50 rounded-lg border">
                      <p className="text-sm text-muted-foreground">1st Installment</p>
                      <p className="font-bold text-lg text-blue-600">
                        {formatCurrency(payment.firstInstallment)}
                      </p>
                    </div>
                  )}
                  {payment.secondInstallment > 0 && (
                    <div className="text-center p-3 bg-green-50 rounded-lg border">
                      <p className="text-sm text-muted-foreground">2nd Installment</p>
                      <p className="font-bold text-lg text-green-600">
                        {formatCurrency(payment.secondInstallment)}
                      </p>
                    </div>
                  )}
                  {payment.thirdInstallment > 0 && (
                    <div className="text-center p-3 bg-purple-50 rounded-lg border">
                      <p className="text-sm text-muted-foreground">3rd Installment</p>
                      <p className="font-bold text-lg text-purple-600">
                        {formatCurrency(payment.thirdInstallment)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Paid</p>
                    <p className="font-bold text-xl text-green-600">{formatCurrency(totalPaid)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className={`font-bold text-xl ${balance === 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-orange-600'}`}>
                      {formatCurrency(Math.abs(balance))}
                      {balance < 0 && ' (Overpaid)'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Payment Status</p>
                    <Badge className={balance === 0 ? 'bg-green-100 text-green-800' : balance < 0 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}>
                      {balance === 0 ? 'Fully Paid' : balance < 0 ? 'Overpaid' : 'Partial'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const EditTvetPaymentModal = ({ open, onOpenChange, payment, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    depositNumber: '',
    studentName: '',
    firstInstallment: '',
    secondInstallment: '',
    thirdInstallment: '',
    breakdown: []
  });
  const [newBreakdownItem, setNewBreakdownItem] = useState({
    description: '',
    amount: ''
  });

  useEffect(() => {
    if (payment) {
      setFormData({
        depositNumber: payment.depositNumber || '',
        studentName: payment.studentName || '',
        firstInstallment: payment.firstInstallment || '',
        secondInstallment: payment.secondInstallment || '',
        thirdInstallment: payment.thirdInstallment || '',
        breakdown: payment.breakdown || []
      });
      setNewBreakdownItem({ description: '', amount: '' });
    }
  }, [payment]);

  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleBreakdownChange = (key, value) => {
    setNewBreakdownItem(prev => ({ ...prev, [key]: value }));
  };

  const addBreakdownItem = () => {
    if (!newBreakdownItem.description) {
      toast.error('Please select a program.');
      return;
    }
    if (!newBreakdownItem.amount || parseFloat(newBreakdownItem.amount) <= 0) {
      toast.error('Please enter a valid amount greater than 0.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      breakdown: [
        ...prev.breakdown,
        {
          description: newBreakdownItem.description,
          amount: parseFloat(newBreakdownItem.amount)
        }
      ]
    }));
    setNewBreakdownItem({ description: '', amount: '' });
    toast.success('Program added.');
  };

  const removeBreakdownItem = (index) => {
    setFormData(prev => ({
      ...prev,
      breakdown: prev.breakdown.filter((_, i) => i !== index)
    }));
    toast.success('Program removed.');
  };

  const formatCurrency = (amount) => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-LR', {
      style: 'currency',
      currency: 'LRD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const totalBreakdown = formData.breakdown.reduce((sum, item) => sum + item.amount, 0);
  const firstInstallment = parseFloat(formData.firstInstallment) || 0;
  const secondInstallment = parseFloat(formData.secondInstallment) || 0;
  const thirdInstallment = parseFloat(formData.thirdInstallment) || 0;
  const totalPaid = firstInstallment + secondInstallment + thirdInstallment;
  const balance = totalBreakdown - totalPaid;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.depositNumber.trim()) {
      toast.error('Please enter a deposit number.');
      return;
    }
    if (!formData.studentName.trim()) {
      toast.error('Please enter a student name.');
      return;
    }
    if (formData.breakdown.length === 0) {
      toast.error('Please add at least one program.');
      return;
    }
    if (formData.firstInstallment && parseFloat(formData.firstInstallment) < 0) {
      toast.error('First installment cannot be negative.');
      return;
    }
    if (formData.secondInstallment && parseFloat(formData.secondInstallment) < 0) {
      toast.error('Second installment cannot be negative.');
      return;
    }
    if (formData.thirdInstallment && parseFloat(formData.thirdInstallment) < 0) {
      toast.error('Third installment cannot be negative.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/tvet/${payment._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          depositNumber: formData.depositNumber.trim(),
          studentName: formData.studentName.trim(),
          breakdown: formData.breakdown,
          firstInstallment: firstInstallment,
          secondInstallment: secondInstallment,
          thirdInstallment: thirdInstallment
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update TVET payment');
      }

      toast.success('TVET payment updated successfully!');
      onSuccess();
      onOpenChange(false);

    } catch (error) {
      console.error('TVET payment update error:', error);
      toast.error(error.message || 'Failed to update TVET payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit TVET Payment - {payment.receiptNumber}
          </DialogTitle>
          <DialogDescription>
            Update TVET payment details for student: {payment.studentName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow min-h-0 pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-depositNumber">Deposit Number *</Label>
                    <Input
                      id="edit-depositNumber"
                      value={formData.depositNumber}
                      onChange={(e) => handleInputChange('depositNumber', e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-studentName">Student Name *</Label>
                    <Input
                      id="edit-studentName"
                      value={formData.studentName}
                      onChange={(e) => handleInputChange('studentName', e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <School className="h-4 w-4" />
                  TVET Programs *
                </h3>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor="breakdownDescription" className="text-sm">Program *</Label>
                    <Select
                      value={newBreakdownItem.description}
                      onValueChange={(value) => handleBreakdownChange('description', value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="breakdownDescription">
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_DESCRIPTIONS.map(desc => (
                          <SelectItem key={desc} value={desc}>{desc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="breakdownAmount" className="text-sm">Amount (LRD) *</Label>
                    <Input
                      id="breakdownAmount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={newBreakdownItem.amount}
                      onChange={(e) => handleBreakdownChange('amount', e.target.value)}
                      disabled={isSubmitting}
                      placeholder="Enter amount"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={addBreakdownItem}
                    disabled={isSubmitting}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
                {formData.breakdown.length > 0 && (
                  <div className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Program</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.breakdown.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{formatCurrency(item.amount)}</TableCell>
                            <TableCell className="text-right">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeBreakdownItem(index)}
                                      disabled={isSubmitting}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Remove Program</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <p className="text-sm font-semibold mt-2">
                      Total Program Cost: {formatCurrency(totalBreakdown)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <DollarSign className="h-4 w-4" />
                  Installment Payments (LRD)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-firstInstallment">1st Installment</Label>
                    <Input
                      id="edit-firstInstallment"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.firstInstallment}
                      onChange={(e) => handleInputChange('firstInstallment', e.target.value)}
                      disabled={isSubmitting}
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-secondInstallment">2nd Installment</Label>
                    <Input
                      id="edit-secondInstallment"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.secondInstallment}
                      onChange={(e) => handleInputChange('secondInstallment', e.target.value)}
                      disabled={isSubmitting}
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-thirdInstallment">3rd Installment</Label>
                    <Input
                      id="edit-thirdInstallment"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.thirdInstallment}
                      onChange={(e) => handleInputChange('thirdInstallment', e.target.value)}
                      disabled={isSubmitting}
                      className="text-right"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {(formData.breakdown.length > 0 || totalPaid > 0) && (
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Updated Payment Summary
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <p className="text-muted-foreground">Total Program Cost:</p>
                        <p className="font-bold text-lg">{formatCurrency(totalBreakdown)}</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-muted-foreground">Total Paid:</p>
                        <p className="font-bold text-lg text-green-600">{formatCurrency(totalPaid)}</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-muted-foreground">Balance:</p>
                        <p className={`font-bold text-lg ${balance === 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-orange-600'}`}>
                          {formatCurrency(Math.abs(balance))}
                          {balance < 0 && ' (Overpaid)'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-muted-foreground font-medium">Installments:</p>
                      {firstInstallment > 0 && (
                        <div className="flex justify-between">
                          <p>1st Installment:</p>
                          <p className="font-medium">{formatCurrency(firstInstallment)}</p>
                        </div>
                      )}
                      {secondInstallment > 0 && (
                        <div className="flex justify-between">
                          <p>2nd Installment:</p>
                          <p className="font-medium">{formatCurrency(secondInstallment)}</p>
                        </div>
                      )}
                      {thirdInstallment > 0 && (
                        <div className="flex justify-between">
                          <p>3rd Installment:</p>
                          <p className="font-medium">{formatCurrency(thirdInstallment)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Updating...
              </>
            ) : (
              'Update Payment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function TvetPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    averageAmount: 0,
    installmentBreakdown: {
      firstInstallment: 0,
      secondInstallment: 0,
      thirdInstallment: 0
    },
    recentPayments: []
  });

  const [filters, setFilters] = useState({
    studentID: '',
    studentName: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    depositNumber: ''
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LR', {
      style: 'currency',
      currency: 'LRD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPaymentStatus = (payment) => {
    const totalCost = payment.breakdown?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const totalPaid = payment.totalPaid || 0;
    const balance = totalCost - totalPaid;

    if (balance === 0) return { status: 'Fully Paid', color: 'bg-green-200 text-green-800' };
    if (balance < 0) return { status: 'Overpaid', color: 'bg-red-200 text-red-800' };
    return { status: 'Partial', color: 'bg-orange-200 text-orange-800' };
  };

  const fetchPayments = async (page = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value && value.trim() !== '') acc[key] = value;
          return acc;
        }, {})
      });

      const response = await fetch(`/api/tvet?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch TVET payments');
      }

      const data = await response.json();
      if (data.success) {
        setPayments(data.tvetPayments || []);
        setPagination(data.pagination || {
          current: 1,
          pages: 1,
          total: 0,
          hasNext: false,
          hasPrev: false
        });
      } else {
        throw new Error(data.message || 'Failed to fetch TVET payments');
      }
    } catch (error) {
      console.error('Error fetching TVET payments:', error);
      toast.error(error.message || 'Failed to load TVET payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const studentIDParam = filters.studentID ? `?studentID=${encodeURIComponent(filters.studentID)}` : '';
      const response = await fetch(`/api/tvet/stats${studentIDParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  //batch printing
   const handleGenerateBatchReceipts = async () => {
      try {
        setLoading(true);
  
        const queryParams = new URLSearchParams({
          ...Object.fromEntries(
            Object.entries(filters).filter(([key, value]) => {
              if (key === 'academicYear' && value === 'all') return false;
              return value && value.trim() !== '';
            })
          ),
        });
  
        const response = await fetch(`/api/tvet/batch-receipts?${queryParams}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to generate batch receipts');
        }
  
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
  
        // Method 1: Try direct window.open approach first
        try {
          const printWindow = window.open(url, '_blank');
          if (printWindow) {
            printWindow.addEventListener('load', () => {
              setTimeout(() => {
                printWindow.print();
                toast.success("Print dialog opened for batch receipts!");
              }, 500);
            });
            
            // Cleanup after some time
            setTimeout(() => {
              window.URL.revokeObjectURL(url);
            }, 10000);
            
            return; // Exit early if this method works
          }
        } catch (error) {
          console.log('Window.open method failed, trying iframe method:', error);
        }
  
        // Method 2: Fallback to iframe approach with better timing
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.top = '-9999px';
        iframe.style.left = '-9999px';
        iframe.style.width = '1px';
        iframe.style.height = '1px';
        iframe.style.border = 'none';
        iframe.src = url;
        
        document.body.appendChild(iframe);
  
        // Better event handling for iframe
        const handleIframeLoad = () => {
          setTimeout(() => {
            try {
              if (iframe.contentWindow) {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                toast.success("Print dialog opened for batch receipts!");
              }
            } catch (error) {
              console.error('Print error:', error);
              // Fallback: download the file instead
              const link = document.createElement('a');
              link.href = url;
              link.download = `batch-receipts-${new Date().getTime()}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              toast.success("PDF downloaded successfully!");
            }
          }, 1000); // Increased delay to ensure PDF is fully loaded
        };
  
        // Add load event listener
        iframe.addEventListener('load', handleIframeLoad);
        
        // Cleanup function
        const cleanup = () => {
          try {
            if (iframe && iframe.parentNode) {
              iframe.removeEventListener('load', handleIframeLoad);
              document.body.removeChild(iframe);
            }
            window.URL.revokeObjectURL(url);
          } catch (error) {
            console.error('Cleanup error:', error);
          }
        };
  
        // Cleanup after longer delay to ensure print dialog has time to open
        setTimeout(cleanup, 15000);
  
      } catch (error) {
        console.error('Batch receipt generation error:', error);
        toast.error(error.message || "Failed to generate batch receipts");
      } finally {
        setLoading(false);
      }
    };
  
    //handle upload
     const handleDownloadBatchReceipts = async () => {
        try {
          setLoading(true);
    
          const queryParams = new URLSearchParams({
            ...Object.fromEntries(
              Object.entries(filters).filter(([key, value]) => {
                if (key === 'academicYear' && value === 'all') return false;
                return value && value.trim() !== '';
              })
            ),
          });
    
          const response = await fetch(`/api/tvet/batch-receipts?${queryParams}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
    
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to generate batch receipts');
          }
    
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          
          // Create download link
          const link = document.createElement('a');
          link.href = url;
          link.download = `batch-receipts-${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Cleanup
          window.URL.revokeObjectURL(url);
          
          toast.success("Batch receipts downloaded successfully!");
    
        } catch (error) {
          console.error('Batch receipt download error:', error);
          toast.error(error.message || "Failed to download batch receipts");
        } finally {
          setLoading(false);
        }
      };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchPayments(1);
  };

  const clearFilters = () => {
    setFilters({
      studentID: '',
      studentName: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      depositNumber: ''
    });
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchPayments(1);
    toast.success("Filters cleared successfully.");
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.pages) return;
    setPagination(prev => ({ ...prev, current: page }));
    fetchPayments(page);
  };

  const handleView = (payment) => {
    setSelectedPayment(payment);
    setIsViewModalOpen(true);
  };

  const handleEdit = (payment) => {
    setSelectedPayment(payment);
    setIsEditModalOpen(true);
  };

  const confirmDelete = (payment) => {
    setPaymentToDelete(payment);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!paymentToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tvet/${paymentToDelete._id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete TVET payment');
      }

      toast.success('TVET payment record deleted successfully.');
      setDeleteDialogOpen(false);
      setPaymentToDelete(null);

      const currentPage = pagination.current;
      const totalAfterDelete = pagination.total - 1;
      const itemsPerPage = 10;
      const maxPage = Math.ceil(totalAfterDelete / itemsPerPage) || 1;
      const targetPage = currentPage > maxPage ? maxPage : currentPage;

      fetchPayments(targetPage);
      fetchStats();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete TVET payment record');
    } finally {
      setIsDeleting(false);
    }
  };

  const regenerateReceipt = async (payment) => {
    try {
      const response = await fetch(`/api/tvet/${payment._id}/regenerate-receipt`);

      if (!response.ok) {
        throw new Error('Failed to regenerate receipt');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `tvet-receipt-${payment.receiptNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Receipt downloaded successfully!');
    } catch (error) {
      console.error('Receipt download error:', error);
      toast.error('Failed to download receipt');
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [filters.studentID]);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">TVET Payment Management</h1>
            <p className="text-muted-foreground">Manage TVET student payments and generate receipts</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Record New Payment
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-2xl font-bold">{stats.totalPayments}</p>
              </div>
              <Receipt className="h-6 w-6 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalAmount)}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-green-600" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Payment</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.averageAmount)}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Page</p>
                <p className="text-2xl font-bold">{payments.length}</p>
              </div>
              <School className="h-6 w-6 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Installment Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg border">
                <p className="text-sm text-muted-foreground">1st Installments</p>
                <p className="font-bold text-xl text-blue-600">
                  {formatCurrency(stats.installmentBreakdown?.firstInstallment || 0)}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border">
                <p className="text-sm text-muted-foreground">2nd Installments</p>
                <p className="font-bold text-xl text-green-600">
                  {formatCurrency(stats.installmentBreakdown?.secondInstallment || 0)}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border">
                <p className="text-sm text-muted-foreground">3rd Installments</p>
                <p className="font-bold text-xl text-purple-600">
                  {formatCurrency(stats.installmentBreakdown?.thirdInstallment || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Student ID</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search student ID..."
                    value={filters.studentID}
                    onChange={(e) => handleFilterChange('studentID', e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Student Name</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search student name..."
                    value={filters.studentName}
                    onChange={(e) => handleFilterChange('studentName', e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Deposit Number</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search deposit number..."
                    value={filters.depositNumber}
                    onChange={(e) => handleFilterChange('depositNumber', e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    disabled={loading}
                    className="text-sm"
                  />
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    disabled={loading}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Amount Range (LRD)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minAmount}
                    onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                    disabled={loading}
                    step="0.01"
                    min="0"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxAmount}
                    onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                    disabled={loading}
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={clearFilters} disabled={loading}>
                Clear Filters
              </Button>
              <Button type="button" onClick={handleSearch} disabled={loading}>
                Apply Filters
              </Button>
              <Button onClick={handleGenerateBatchReceipts} disabled={loading || payments.length === 0}>
               {loading ? (
                <>
                 <Loader2 className="h-4 w-4 animate-spin mr-2" />
                 Generating...
                   </>
                    ) : (
                   <>
                 <Printer className="h-4 w-4 mr-2" />
                 Print Receipts
                </>
                 )}
            </Button>
                  <Button 
                   variant="outline" 
                   onClick={handleDownloadBatchReceipts} 
                   disabled={loading || payments.length === 0}
                 >
                   {loading ? (
                     <>
                       <Loader2 className="h-4 w-4 animate-spin mr-2" />
                       Downloading...
                     </>
                   ) : (
                     'Download Receipts'
                   )}
                 </Button>           
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>TVET Payment Records</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading payments...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No TVET payment records found. Try adjusting your filters or record a new payment.
                <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 mt-4">
                  <Plus className="h-4 w-4" />
                  Record New Payment
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt No.</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Deposit No.</TableHead>
                        <TableHead>Total Cost</TableHead>
                        <TableHead>Total Paid</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment, index) => {
                        const paymentStatus = getPaymentStatus(payment);
                        const totalCost = payment.breakdown?.reduce((sum, item) => sum + item.amount, 0) || 0;
                        const balance = totalCost - payment.totalPaid;
                        return (
                          <motion.tr
                            key={payment._id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="hover:bg-muted/50"
                          >
                            <TableCell className="font-medium text-blue-600">
                              {payment.receiptNumber}
                            </TableCell>
                            <TableCell>{payment.studentID}</TableCell>
                            <TableCell>{payment.studentName}</TableCell>
                            <TableCell>{payment.depositNumber}</TableCell>
                            <TableCell>{formatCurrency(totalCost)}</TableCell>
                            <TableCell>{formatCurrency(payment.totalPaid)}</TableCell>
                            <TableCell className={balance < 0 ? 'text-red-600' : ''}>
                              {formatCurrency(Math.abs(balance))}
                              {balance < 0 && ' (Overpaid)'}
                            </TableCell>
                            <TableCell>
                              <Badge className={paymentStatus.color}>
                                {paymentStatus.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleView(payment)}
                                        disabled={loading}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>View Details</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => regenerateReceipt(payment)}
                                        disabled={loading}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Download Receipt</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEdit(payment)}
                                        disabled={loading}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit Payment</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => confirmDelete(payment)}
                                        disabled={loading}
                                      >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete Payment</TooltipContent>
                                  </Tooltip>
                                  </TooltipProvider>
                                
                              </div>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {pagination.pages > 1 && (
                  <Pagination className="mt-6">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(pagination.current - 1);
                          }}
                          className={pagination.current === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      {[...Array(pagination.pages)].map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(i + 1);
                            }}
                            isActive={pagination.current === i + 1}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(pagination.current + 1);
                          }}
                          className={pagination.current === pagination.pages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <AddTvetPaymentModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          onSuccess={() => {
            fetchPayments(pagination.current);
            fetchStats();
          }}
        />

        {selectedPayment && (
          <EditTvetPaymentModal
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            payment={selectedPayment}
            onSuccess={() => {
              fetchPayments(pagination.current);
              fetchStats();
              setSelectedPayment(null);
            }}
          />
        )}

        {selectedPayment && (
          <ViewTvetPaymentModal
            open={isViewModalOpen}
            onOpenChange={setIsViewModalOpen}
            payment={selectedPayment}
          />
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the TVET payment record for{' '}
                <span className="font-semibold">{paymentToDelete?.studentName}</span>
                {' '} with receipt number {' '}
                <span className="font-semibold text-blue-600">{paymentToDelete?.receiptNumber}</span>
                ? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete Payment'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}