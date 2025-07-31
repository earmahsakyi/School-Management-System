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
  Printer,
  CreditCard,
  TrendingUp
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
import { Textarea } from '@/components/ui/textarea';
import OtherPaymentModal from './OtherPaymentModal';
import { toast } from 'react-hot-toast';
import { DashboardLayout } from '../dashboard/DashboardLayout';

// View Payment Details Modal
const ViewPaymentModal = ({ open, onOpenChange, payment }) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment Details - {payment.receiptNumber}
          </DialogTitle>
          <DialogDescription>
            Complete payment information and receipt details
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6">
            {/* Student Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Student Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Student Name</p>
                  <p className="font-semibold">{payment.student?.firstName} {payment.student?.lastName} {payment.student?.middleName || ''}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Admission Number</p>
                  <p className="font-semibold">{payment.student?.admissionNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Grade Level</p>
                  <p className="font-semibold">Grade {payment.student?.gradeLevel}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Section</p>
                  <p className="font-semibold">Section {payment.student?.classSection}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Department</p>
                  <p className="font-semibold">{payment.student?.department}</p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Receipt Number</p>
                  <p className="font-semibold text-blue-600">{payment.receiptNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount Paid</p>
                  <p className="font-bold text-lg text-green-600">{formatCurrency(payment.amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Date</p>
                  <p className="font-semibold">{formatDate(payment.dateOfPayment)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Academic Year</p>
                  <p className="font-semibold">{payment.academicYear}</p>
                </div>
                {payment.bankDepositNumber && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Bank Deposit Number</p>
                    <p className="font-semibold">{payment.bankDepositNumber}</p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="font-semibold">{payment.description}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Other Payments</p>
                  <p className="font-semibold">{payment.paymentOf}</p>
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

// Edit Payment Modal
const EditPaymentModal = ({ open, onOpenChange, payment, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    bankDepositNumber: '',
    description: '',
    academicYear: '',
    paymentOf: ''
  });

  // Initialize form data when payment changes
  useEffect(() => {
    if (payment) {
      setFormData({
        amount: payment.amount || '',
        bankDepositNumber: payment.bankDepositNumber || '',
        description: payment.description || '',
        academicYear: payment.academicYear || '',
        paymentOf: payment.paymentOf || '',
      });
    }
  }, [payment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount greater than 0.");
      return;
    }

    if (!formData.academicYear) {
      toast.error("Please select an academic year.");
      return;
    }
    if (!formData.paymentOf) {
      toast.error("Please enter the payment type.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/other-payments/${payment._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          bankDepositNumber: formData.bankDepositNumber.trim(),
          description: formData.description.trim(),
          academicYear: formData.academicYear,
          paymentOf: formData.paymentOf,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update payment');
      }

      toast.success("Payment updated successfully!");
      onSuccess();
      onOpenChange(false);

    } catch (error) {
      console.error('Payment update error:', error);
      toast.error(error.message || "Failed to update payment.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatCurrency = (amount) => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-LR', {
      style: 'currency',
      currency: 'LRD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Payment - {payment.receiptNumber}
          </DialogTitle>
          <DialogDescription>
            Update payment details for {payment.student?.firstName} {payment.student?.lastName} {payment.student?.middleName || ''}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-amount">Payment Amount (LRD) *</Label>
            <Input
              id="edit-amount"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              disabled={isSubmitting}
              className="text-right"
              required
            />
            {formData.amount && (
              <p className="text-sm text-muted-foreground">
                Amount: {formatCurrency(formData.amount)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-academicYear">Academic Year *</Label>
            <Select 
              value={formData.academicYear} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, academicYear: value }))}
              disabled={isSubmitting}
            >
              <SelectTrigger id="edit-academicYear">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-bankDepositNumber">Bank Deposit Number</Label>
            <Input
              id="edit-bankDepositNumber"
              value={formData.bankDepositNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, bankDepositNumber: e.target.value }))}
              disabled={isSubmitting}
              placeholder="Enter bank deposit slip number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentOf">Payment Of *</Label>
            <Input
              id="paymentOf"
              value={formData.paymentOf}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentOf: e.target.value }))}
              disabled={isSubmitting}
              placeholder="Enter payment type"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Payment Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={isSubmitting}
              placeholder="Brief description of payment"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
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
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    averageAmount: 0,
    recentPayments: []
  });

  const [filters, setFilters] = useState({
    academicYear: '',
    admissionNumber: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
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

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LR', {
      style: 'currency',
      currency: 'LRD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Fetch payments
  const fetchPayments = async (page = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...Object.fromEntries(
          Object.entries(filters).filter(([key, value]) => {
            if (key === 'academicYear' && value === 'all') return false;
            return value && value.trim() !== '';
          })
        ),
      });

      const response = await fetch(`/api/other-payments?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }

      const data = await response.json();

      if (data.success) {
        setPayments(data.payments || []);
        setPagination(data.pagination || {
          current: 1,
          pages: 1,
          total: 0,
          hasNext: false,
          hasPrev: false,
        });
      } else {
        throw new Error(data.message || 'Failed to fetch payments');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error(error.message || 'Failed to load payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch payment statistics
  const fetchStats = async () => {
    try {
      const academicYearParam = filters.academicYear ? `?academicYear=${filters.academicYear}` : '';
      const response = await fetch(`/api/other-payments/stats${academicYearParam}`);
      
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

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle search
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchPayments(1);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      academicYear: 'all',
      admissionNumber: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: ''
    });
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchPayments(1);
    toast.success("Filters cleared successfully.");
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.pages) return;
    setPagination(prev => ({ ...prev, current: page }));
    fetchPayments(page);
  };

  // Handle view payment
  const handleView = (payment) => {
    setSelectedPayment(payment);
    setIsViewModalOpen(true);
  };

  // Handle edit payment
  const handleEdit = (payment) => {
    setSelectedPayment(payment);
    setIsEditModalOpen(true);
  };

  // Handle delete confirmation
  const confirmDelete = (payment) => {
    setPaymentToDelete(payment);
    setDeleteDialogOpen(true);
  };

  // Handle delete payment
  const handleDelete = async () => {
    if (!paymentToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/other-payments/${paymentToDelete._id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete payment');
      }

      toast.success("Payment record deleted successfully.");
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
      toast.error(error.message || "Failed to delete payment record");
    } finally {
      setIsDeleting(false);
    }
  };

  // Download individual receipt
  const downloadReceipt = async (payment) => {
    try {
      const response = await fetch('/api/other-payments/generate-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: payment.student._id,
          amount: payment.amount,
          bankDepositNumber: payment.bankDepositNumber,
          academicYear: payment.academicYear,
          description: payment.description,
          paymentOf: payment.paymentOf,
          dateOfPayment: payment.dateOfPayment
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate receipt');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `receipt-${payment.receiptNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Receipt downloaded successfully!");

    } catch (error) {
      console.error('Receipt download error:', error);
      toast.error("Failed to download receipt");
    }
  };

  // Handle batch receipt printing
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

      const response = await fetch(`/api/other-payments/batch-receipts?${queryParams}`, {
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

      try {
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
          printWindow.addEventListener('load', () => {
            setTimeout(() => {
              printWindow.print();
              toast.success("Print dialog opened for batch receipts!");
            }, 500);
          });
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 10000);
          return;
        }
      } catch (error) {
        console.log('Window.open method failed, trying iframe method:', error);
      }

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.border = 'none';
      iframe.src = url;
      
      document.body.appendChild(iframe);

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
            const link = document.createElement('a');
            link.href = url;
            link.download = `batch-receipts-${new Date().getTime()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("PDF downloaded successfully!");
          }
        }, 1000);
      };

      iframe.addEventListener('load', handleIframeLoad);

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

      setTimeout(cleanup, 15000);

    } catch (error) {
      console.error('Batch receipt generation error:', error);
      toast.error(error.message || "Failed to generate batch receipts");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, []);

  // Fetch stats when academic year filter changes
  useEffect(() => {
    fetchStats();
  }, [filters.academicYear]);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment Management</h1>
            <p className="text-muted-foreground">Manage student payments and generate receipts</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Record New Payment
          </Button>
        </div>

        {/* Statistics Cards */}
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
              <CreditCard className="h-6 w-6 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Filters Card */}
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
                <Label>Academic Year</Label>
                <Select
                  value={filters.academicYear}
                  onValueChange={(value) => handleFilterChange('academicYear', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    <SelectItem value="2024/2025">2024/2025</SelectItem>
                    <SelectItem value="2025/2026">2025/2026</SelectItem>
                    <SelectItem value="2026/2027">2026/2027</SelectItem>
                    <SelectItem value="2027/2028">2027/2028</SelectItem>
                    <SelectItem value="2028/2029">2028/2029</SelectItem>
                    <SelectItem value="2029/2030">2029/2030</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Admission Number</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search admission number..."
                    value={filters.admissionNumber}
                    onChange={(e) => handleFilterChange('admissionNumber', e.target.value)}
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
              <Button onClick={handleSearch} disabled={loading}>
                Apply Filters
              </Button>
              <Button 
                onClick={handleGenerateBatchReceipts} 
                disabled={loading || payments.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Batch Receipts
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Records</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading payments...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center p-6 text-muted-foreground">
                No payment records found. Try adjusting your filters or record a new payment.
                <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 mt-4">
                  <Plus className="h-4 w-4" />
                  Record First Payment
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt No.</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Admission No.</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Date</TableHead>
                        <TableHead>Academic Year</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment, index) => (
                        <motion.tr
                          key={payment._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="font-medium text-blue-600">
                            {payment.receiptNumber}
                          </TableCell>
                          <TableCell>
                            {payment.student?.firstName} {payment.student?.lastName} {payment.student?.middleName || ''}
                          </TableCell>
                          <TableCell>{payment.student?.admissionNumber}</TableCell>
                          <TableCell>
                            <Badge variant="default" className="font-semibold">
                              {formatCurrency(payment.amount)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(payment.dateOfPayment)}</TableCell>
                          <TableCell>{payment.academicYear}</TableCell>
                          <TableCell className="max-w-32 truncate" title={payment.description}>
                            {payment.description}
                          </TableCell>
                          <TableCell className="text-right flex items-center justify-end gap-1">
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
                                    onClick={() => downloadReceipt(payment)} 
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
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <Pagination className="mt-6">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={() => handlePageChange(pagination.current - 1)}
                          className={pagination.current === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      {[...Array(pagination.pages)].map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            href="#"
                            onClick={() => handlePageChange(i + 1)}
                            isActive={pagination.current === i + 1}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={() => handlePageChange(pagination.current + 1)}
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
      </div>

      {/* Add Payment Modal */}
      <OtherPaymentModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={() => {
          fetchPayments(pagination.current);
          fetchStats();
        }}
      />

      {/* Edit Payment Modal */}
      {selectedPayment && (
        <EditPaymentModal
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

      {/* View Payment Details Modal */}
      {selectedPayment && (
        <ViewPaymentModal
          open={isViewModalOpen}
          onOpenChange={setIsViewModalOpen}
          payment={selectedPayment}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the payment record for{' '}
              <span className="font-semibold">
                {paymentToDelete?.student?.firstName} {paymentToDelete?.student?.lastName}
              </span>
              {' '}with receipt number{' '}
              <span className="font-semibold text-blue-600">
                {paymentToDelete?.receiptNumber}
              </span>
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
    </DashboardLayout>
  );
}