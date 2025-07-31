import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { Search, Download, Loader2, DollarSign, Filter, Calendar, Eye, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllStudents, clearStudentErrors } from '../../actions/studentAction';
import { toast } from 'react-hot-toast';

const FinancialReport = () => {
  const dispatch = useDispatch();
  const { students } = useSelector(state => state.student);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [reportData, setReportData] = useState(null);
  const navigate = useNavigate()

  // Common grade levels and class sections
  const gradeLevels = ['7', '8', '9', '10', '11', '12'];
  const classSections = ['A', 'B', 'C', 'D'];

  // Handle Financial Report PDF generation
  const handleGenerateFinancialReport = async () => {
    if (!selectedGrade || !selectedSection || !academicYear) {
      toast.error('Please select Grade Level, Class Section, and Academic Year to generate the financial report.');
      return;
    }

    try {
      setDownloading(true);

      const queryParams = new URLSearchParams({
        gradeLevel: selectedGrade,
        classSection: selectedSection,
        academicYear: academicYear
      });

      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const url = `/api/financial/report?${queryParams}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate financial report');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      const filename = `Financial_Report_Grade${selectedGrade}_Section${selectedSection}_${academicYear}.pdf`;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Financial report generated successfully!');

    } catch (error) {
      console.error('Generation failed:', error);
      toast.error(`Failed to generate financial report: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  // Handle preview data fetching
  const handlePreviewReport = async () => {
    if (!selectedGrade || !selectedSection || !academicYear) {
      toast.error('Please select Grade Level, Class Section, and Academic Year to preview the report.');
      return;
    }

    try {
      setPreviewing(true);

      const queryParams = new URLSearchParams({
        gradeLevel: selectedGrade,
        classSection: selectedSection,
        academicYear: academicYear
      });

      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const url = `/api/financial/report-data?${queryParams}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch financial report data');
      }

      const data = await response.json();
      setReportData(data.data);

    } catch (error) {
      console.error('Preview failed:', error);
      toast.error(`Failed to preview financial report: ${error.message}`);
      setReportData(null);
    } finally {
      setPreviewing(false);
    }
  };

  // Fetch students on component mount
  useEffect(() => {
    dispatch(getAllStudents());

    return () => {
      dispatch(clearStudentErrors());
    };
  }, [dispatch]);

  // Get unique grade levels and sections from students data
  const availableGrades = [...new Set(students?.map(s => s.gradeLevel).filter(Boolean))].sort();
  const availableSections = [...new Set(students?.map(s => s.classSection).filter(Boolean))].sort();

  // Filter report data based on search term
  const filteredPayments = reportData?.payments?.filter(payment => {
    if (!searchTerm) return true;
    
    const student = payment.student;
    return (
      student?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8 max-w-7xl"
      >
        <div className="flex items-center mb-6">
          <DollarSign className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-3xl font-bold text-foreground">Financial Report Generator</h1>
        </div>
        <Button 
          onClick={()=> navigate('/tvet-report')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            >
             <FileText className="h-4 w-4 mr-2" />
               Tvet Financial Report Page
              </Button>

        {/* Financial Report Generation Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Generate Financial Report
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label htmlFor="academicYear" className="block text-sm font-medium mb-2">Academic Year *</label>
                <Input
                  id="academicYear"
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="2024"
                />
              </div>
              
              <div>
                <label htmlFor="gradeLevel" className="block text-sm font-medium mb-2">Grade Level *</label>
                <Select onValueChange={setSelectedGrade} value={selectedGrade} id="gradeLevel">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {(availableGrades.length > 0 ? availableGrades : gradeLevels).map(grade => (
                      <SelectItem key={grade} value={grade}>Grade {grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="classSection" className="block text-sm font-medium mb-2">Class Section *</label>
                <Select onValueChange={setSelectedSection} value={selectedSection} id="classSection">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {(availableSections.length > 0 ? availableSections : classSections).map(section => (
                      <SelectItem key={section} value={section}>Section {section}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="startDate" className=" text-sm font-medium mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Start Date (Optional)
                </label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className=" text-sm font-medium mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  End Date (Optional)
                </label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={handlePreviewReport}
                disabled={previewing || !selectedGrade || !selectedSection || !academicYear}
                variant="outline"
                className="flex-1"
              >
                {previewing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Preview...
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview Report
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleGenerateFinancialReport}
                disabled={downloading || !selectedGrade || !selectedSection || !academicYear}
                className="flex-1"
              >
                {downloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Generate PDF
                  </>
                )}
              </Button>
            </div>

            {(selectedGrade && selectedSection && academicYear) && (
              <div className="text-sm text-muted-foreground mt-4 p-3 bg-blue-50 rounded-lg">
                <strong>Report Configuration:</strong> Financial report for Grade {selectedGrade}, Section {selectedSection}, Academic Year {academicYear}
                {startDate && ` from ${new Date(startDate).toLocaleDateString()}`}
                {endDate && ` to ${new Date(endDate).toLocaleDateString()}`}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Preview Section */}
        {reportData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center justify-between">
                <span>Payment Records Preview</span>
                <div className="text-sm font-normal text-muted-foreground">
                  Total: ${reportData.totalAmount?.toFixed(2)} LRD ({reportData.totalCount} payments)
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search for preview */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search payments by student name, admission number, or receipt number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {filteredPayments.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    {searchTerm ? 'No payments found matching your search criteria.' : 'No payment records found for the selected criteria.'}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID#</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt#</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank Deposit</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {filteredPayments.map((payment, index) => {
                        const student = payment.student;
                        return (
                          <tr key={payment._id} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 text-sm">{index + 1}</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm">
                              {student.lastName}, {student.firstName} {student.middleName || ''}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-sm font-medium">{student.admissionNumber}</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm">{payment.receiptNumber}</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm font-semibold text-green-600">
                              ${payment.amount.toFixed(2)} LRD
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-sm">
                              {new Date(payment.dateOfPayment).toLocaleDateString()}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-sm">
                              {payment.bankDepositNumber || '-'}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gray-100 font-semibold">
                        <td colSpan="4" className="border border-gray-300 px-4 py-3 text-sm text-right">
                          <strong>Total Amount:</strong>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm font-bold text-green-600">
                          ${filteredPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)} LRD
                        </td>
                        <td colSpan="2" className="border border-gray-300 px-4 py-3 text-sm"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Summary Statistics */}
              {reportData && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-blue-600">{reportData.totalCount}</div>
                      <p className="text-sm text-muted-foreground">Total Payments</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-600">
                        ${reportData.totalAmount.toFixed(2)}
                      </div>
                      <p className="text-sm text-muted-foreground">Total Amount (LRD)</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-purple-600">
                        ${(reportData.totalAmount / reportData.totalCount).toFixed(2)}
                      </div>
                      <p className="text-sm text-muted-foreground">Average Payment (LRD)</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Summary Info */}
        {reportData && (
          <div className="text-sm text-muted-foreground">
            Showing {filteredPayments.length} of {reportData.totalCount} payment records
            {searchTerm && ` matching "${searchTerm}"`}
            {reportData.filters && (
              <span>
                {' '}for Grade {reportData.filters.gradeLevel}, Section {reportData.filters.classSection}, Academic Year {reportData.filters.academicYear}
              </span>
            )}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default FinancialReport;