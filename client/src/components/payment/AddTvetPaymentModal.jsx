import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Predefined list of payment descriptions
const PAYMENT_DESCRIPTIONS = [
  'Interview and Registeration',
  'Auto Mechanic',
  'Agriculture',
  'Catering and Pasteries',
  'Carpentry (wood work)',
  'electricity',
  'ICT',
  'Plumbing',
  'Tile Layering',
  'Masonry',
];

const AddTvetPaymentModal = ({ open, onOpenChange, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    depositNumber: '',
    studentID: '',
    studentName: '',
    dateOfPayment: '',
    firstInstallment: '',
    secondInstallment: '',
    thirdInstallment: '',
    breakdown: [] // Array of { description, amount }
  });
  const [newBreakdownItem, setNewBreakdownItem] = useState({
    description: '',
    amount: ''
  });

  // Format currency for display
  const formatCurrency = (amount) => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-LR', {
      style: 'currency',
      currency: 'LRD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Handle input changes for main form fields
  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Handle input changes for breakdown item
  const handleBreakdownChange = (key, value) => {
    setNewBreakdownItem(prev => ({ ...prev, [key]: value }));
  };

  // Add a new breakdown item
  const addBreakdownItem = () => {
    if (!newBreakdownItem.description) {
      toast.error('Please select a payment description.');
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
    toast.success('Breakdown item added.');
  };

  // Remove a breakdown item
  const removeBreakdownItem = (index) => {
    setFormData(prev => ({
      ...prev,
      breakdown: prev.breakdown.filter((_, i) => i !== index)
    }));
    toast.success('Breakdown item removed.');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.depositNumber) {
      toast.error('Please enter a deposit number.');
      return;
    }
    if (!formData.studentID) {
      toast.error('Please enter a student ID.');
      return;
    }
    if (!formData.studentName) {
      toast.error('Please enter a student name.');
      return;
    }
    if (!formData.dateOfPayment) {
      toast.error('Please select a payment date.');
      return;
    }
    if (formData.breakdown.length === 0) {
      toast.error('Please add at least one breakdown item.');
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
      const response = await fetch('/api/tvet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          depositNumber: formData.depositNumber,
          studentID: formData.studentID,
          studentName: formData.studentName,
          dateOfPayment: formData.dateOfPayment,
          breakdown: formData.breakdown,
          firstInstallment: formData.firstInstallment ? parseFloat(formData.firstInstallment) : 0,
          secondInstallment: formData.secondInstallment ? parseFloat(formData.secondInstallment) : 0,
          thirdInstallment: formData.thirdInstallment ? parseFloat(formData.thirdInstallment) : 0
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create TVET payment');
      }

      toast.success('TVET payment recorded successfully!');
      setFormData({
        depositNumber: '',
        studentID: '',
        studentName: '',
        dateOfPayment: '',
        firstInstallment: '',
        secondInstallment: '',
        thirdInstallment: '',
        breakdown: []
      });
      onSuccess();
      onOpenChange(false);

    } catch (error) {
      console.error('Error creating TVET payment:', error);
      toast.error(error.message || 'Failed to record TVET payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Record New TVET Payment
          </DialogTitle>
          <DialogDescription>
            Enter the details for the TVET payment and add breakdown items.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4 pb-6">
            {/* Deposit Number */}
            <div className="space-y-2">
              <Label htmlFor="depositNumber">Deposit Number *</Label>
              <Input
                id="depositNumber"
                value={formData.depositNumber}
                onChange={(e) => handleInputChange('depositNumber', e.target.value)}
                disabled={isSubmitting}
                placeholder="Enter bank deposit number"
                required
              />
            </div>

            {/* Student ID */}
            <div className="space-y-2">
              <Label htmlFor="studentID">Student ID *</Label>
              <Input
                id="studentID"
                value={formData.studentID}
                onChange={(e) => handleInputChange('studentID', e.target.value)}
                disabled={isSubmitting}
                placeholder="Enter student ID"
                required
              />
            </div>

            {/* Student Name */}
            <div className="space-y-2">
              <Label htmlFor="studentName">Student Name *</Label>
              <Input
                id="studentName"
                value={formData.studentName}
                onChange={(e) => handleInputChange('studentName', e.target.value)}
                disabled={isSubmitting}
                placeholder="Enter student name"
                required
              />
            </div>

            {/* Date of Payment */}
            <div className="space-y-2">
              <Label htmlFor="dateOfPayment">Date of Payment *</Label>
              <Input
                id="dateOfPayment"
                type="date"
                value={formData.dateOfPayment}
                onChange={(e) => handleInputChange('dateOfPayment', e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Breakdown Items */}
            <div className="space-y-2">
              <Label>Add Payment Breakdown *</Label>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label htmlFor="breakdownDescription" className="text-sm">Description *</Label>
                  <Select
                    value={newBreakdownItem.description}
                    onValueChange={(value) => handleBreakdownChange('description', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="breakdownDescription">
                      <SelectValue placeholder="Select description" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_DESCRIPTIONS.map((desc) => (
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
            </div>

            {/* Breakdown Table */}
            {formData.breakdown.length > 0 && (
              <div className="space-y-2">
                <Label>Breakdown Summary</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
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
                              <TooltipContent>Remove Item</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-sm font-semibold">
                  Total: {formatCurrency(formData.breakdown.reduce((sum, item) => sum + item.amount, 0))}
                </p>
              </div>
            )}

            {/* Installments */}
            <div className="space-y-2">
              <Label>Installments (Optional)</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="firstInstallment">First Installment (LRD)</Label>
                  <Input
                    id="firstInstallment"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.firstInstallment}
                    onChange={(e) => handleInputChange('firstInstallment', e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <Label htmlFor="secondInstallment">Second Installment (LRD)</Label>
                  <Input
                    id="secondInstallment"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.secondInstallment}
                    onChange={(e) => handleInputChange('secondInstallment', e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <Label htmlFor="thirdInstallment">Third Installment (LRD)</Label>
                  <Input
                    id="thirdInstallment"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.thirdInstallment}
                    onChange={(e) => handleInputChange('thirdInstallment', e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Enter amount"
                  />
                </div>
              </div>
              <p className="text-sm font-semibold">
                Total Paid: {formatCurrency(
                  (parseFloat(formData.firstInstallment) || 0) +
                  (parseFloat(formData.secondInstallment) || 0) +
                  (parseFloat(formData.thirdInstallment) || 0)
                )}
              </p>
            </div>

            {/* DialogFooter inside ScrollArea */}
            <DialogFooter className="pt-4 sticky bottom-0 bg-white">
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
                    Recording...
                  </>
                ) : (
                  'Record Payment'
                )}
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AddTvetPaymentModal;