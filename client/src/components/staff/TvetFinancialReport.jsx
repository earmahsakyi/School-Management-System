import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { Search, Download, Loader2, DollarSign, Filter, Calendar, Eye, GraduationCap, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllStudents, clearStudentErrors } from '../../actions/studentAction';
import { toast } from 'react-hot-toast';

const TvetFinancialReport = () => {
  const dispatch = useDispatch();
  const { students } = useSelector(state => state.student);

  const [searchTerm, setSearchTerm] = useState('');
  const [studentID, setStudentID] = useState('');
  const [studentName, setStudentName] = useState('');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [studentSummaryData, setStudentSummaryData] = useState(null);
  const [loadingStudentSummary, setLoadingStudentSummary] = useState(false);

  // Handle TVET Financial Report PDF generation
  const handleGenerateTvetFinancialReport = async () => {
    try {
      setDownloading(true);

      const queryParams = new URLSearchParams({
        academicYear: academicYear
      });

      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (studentID) queryParams.append('studentID', studentID);
      if (studentName) queryParams.append('studentName', studentName);

      const url = `/api/tvet-financial/report?${queryParams}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate TVET financial report');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      const filename = `TVET_Financial_Report_${academicYear}${studentID ? `_${studentID}` : ''}${startDate ? `_from_${startDate}` : ''}${endDate ? `_to_${endDate}` : ''}.pdf`;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('TVET financial report generated successfully!');

    } catch (error) {
      console.error('Generation failed:', error);
      toast.error(`Failed to generate TVET financial report: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  // Handle preview data fetching
  const handlePreviewReport = async () => {
    try {
      setPreviewing(true);

      const queryParams = new URLSearchParams({
        academicYear: academicYear
      });

      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (studentID) queryParams.append('studentID', studentID);
      if (studentName) queryParams.append('studentName', studentName);

      const url = `/api/tvet-financial/report-data?${queryParams}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch TVET financial report data');
      }

      const data = await response.json();
      setReportData(data.data);

    } catch (error) {
      console.error('Preview failed:', error);
      toast.error(`Failed to preview TVET financial report: ${error.message}`);
      setReportData(null);
    } finally {
      setPreviewing(false);
    }
  };

  // Handle student summary data fetching
  const handleGetStudentSummary = async () => {
    try {
      setLoadingStudentSummary(true);

      const queryParams = new URLSearchParams({
        academicYear: academicYear
      });

      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const url = `/api/tvet-financial/student-summary?${queryParams}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch student payment summary');
      }

      const data = await response.json();
      setStudentSummaryData(data.data);

    } catch (error) {
      console.error('Student summary failed:', error);
      toast.error(`Failed to fetch student payment summary: ${error.message}`);
      setStudentSummaryData(null);
    } finally {
      setLoadingStudentSummary(false);
    }
  };

  // Fetch students on component mount
  useEffect(() => {
    dispatch(getAllStudents());

    return () => {
      dispatch(clearStudentErrors());
    };
  }, [dispatch]);

  // Filter report data based on search term
  const filteredPayments = reportData?.payments?.filter(payment => {
    if (!searchTerm) return true;
    
    return (
      payment.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.studentID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.depositNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];

  // Filter student summary data based on search term
  const filteredStudentSummary = studentSummaryData?.summary?.filter(summary => {
    if (!searchTerm) return true;
    
    return (
      summary.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      summary._id?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <GraduationCap className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-3xl font-bold text-foreground">TVET Financial Report Generator</h1>
        </div>

        {/* TVET Financial Report Generation Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Generate TVET Financial Report
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label htmlFor="academicYear" className="block text-sm font-medium mb-2">Academic Year</label>
                <Input
                  id="academicYear"
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="2024"
                />
              </div>
              
              <div>
                <label htmlFor="studentID" className="block text-sm font-medium mb-2">Student ID (Optional)</label>
                <Input
                  id="studentID"
                  type="text"
                  value={studentID}
                  onChange={(e) => setStudentID(e.target.value)}
                  placeholder="Enter student ID"
                />
              </div>
              
              <div>
                <label htmlFor="studentName" className="block text-sm font-medium mb-2">Student Name (Optional)</label>
                <Input
                  id="studentName"
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter student name"
                />
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={handlePreviewReport}
                disabled={previewing}
                variant="outline"
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
                onClick={handleGetStudentSummary}
                disabled={loadingStudentSummary}
                variant="outline"
              >
                {loadingStudentSummary ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Summary...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Student Summary
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleGenerateTvetFinancialReport}
                disabled={downloading}
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

            {/* Filter Summary */}
            <div className="text-sm text-muted-foreground mt-4 p-3 bg-blue-50 rounded-lg">
              <strong>Report Configuration:</strong> TVET financial report for Academic Year {academicYear}
              {studentID && ` • Student ID: ${studentID}`}
              {studentName && ` • Student Name: ${studentName}`}
              {startDate && ` • From: ${new Date(startDate).toLocaleDateString()}`}
              {endDate && ` • To: ${new Date(endDate).toLocaleDateString()}`}
            </div>
          </CardContent>
        </Card>

        {/* Student Payment Summary Section */}
        {studentSummaryData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center justify-between">
                <span>Student Payment Summary</span>
                <div className="text-sm font-normal text-muted-foreground">
                  {studentSummaryData.totalStudents} students
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search for student summary */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search students by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {filteredStudentSummary.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    {searchTerm ? 'No students found matching your search criteria.' : 'No student payment records found for the selected criteria.'}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Count</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">1st Installment</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">2nd Installment</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">3rd Installment</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Paid</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Latest Payment</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {filteredStudentSummary.map((summary, index) => (
                        <tr key={summary._id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-3 text-sm">{index + 1}</td>
                          <td className="border border-gray-300 px-4 py-3 text-sm font-medium">{summary._id}</td>
                          <td className="border border-gray-300 px-4 py-3 text-sm">{summary.studentName}</td>
                          <td className="border border-gray-300 px-4 py-3 text-sm text-center">{summary.paymentCount}</td>
                          <td className="border border-gray-300 px-4 py-3 text-sm font-semibold text-blue-600">
                            ${summary.firstInstallmentTotal.toFixed(2)} LRD
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-sm font-semibold text-purple-600">
                            ${summary.secondInstallmentTotal.toFixed(2)} LRD
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-sm font-semibold text-orange-600">
                            ${summary.thirdInstallmentTotal.toFixed(2)} LRD
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-sm font-bold text-green-600">
                            ${summary.totalPaid.toFixed(2)} LRD
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-sm">
                            {summary.latestPayment ? new Date(summary.latestPayment).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Report Preview Section */}
        {reportData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center justify-between">
                <span>Payment Records Preview</span>
                <div className="text-sm font-normal text-muted-foreground">
                  Total: ${reportData.summary?.totalAmount?.toFixed(2)} LRD ({reportData.summary?.totalPayments} payments)
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
                    placeholder="Search payments by student name, ID, receipt number, or deposit number..."
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
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt #</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">1st Install.</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">2nd Install.</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">3rd Install.</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Paid</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deposit #</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {filteredPayments.map((payment, index) => (
                        <tr key={payment._id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-3 text-sm">{index + 1}</td>
                          <td className="border border-gray-300 px-4 py-3 text-sm font-medium">{payment.receiptNumber}</td>
                          <td className="border border-gray-300 px-4 py-3 text-sm font-medium">{payment.studentID}</td>
                          <td className="border border-gray-300 px-4 py-3 text-sm">{payment.studentName}</td>
                          <td className="border border-gray-300 px-4 py-3 text-sm text-blue-600">
                            ${payment.firstInstallment?.toFixed(2) || '0.00'} LRD
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-sm text-purple-600">
                            ${payment.secondInstallment?.toFixed(2) || '0.00'} LRD
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-sm text-orange-600">
                            ${payment.thirdInstallment?.toFixed(2) || '0.00'} LRD
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-sm font-bold text-green-600">
                            ${payment.totalPaid?.toFixed(2)} LRD
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-sm">
                            {new Date(payment.dateOfPayment).toLocaleDateString()}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-sm">{payment.depositNumber}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100 font-semibold">
                        <td colSpan="4" className="border border-gray-300 px-4 py-3 text-sm text-right">
                          <strong>Totals:</strong>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm font-bold text-blue-600">
                          ${filteredPayments.reduce((sum, p) => sum + (p.firstInstallment || 0), 0).toFixed(2)} LRD
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm font-bold text-purple-600">
                          ${filteredPayments.reduce((sum, p) => sum + (p.secondInstallment || 0), 0).toFixed(2)} LRD
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm font-bold text-orange-600">
                          ${filteredPayments.reduce((sum, p) => sum + (p.thirdInstallment || 0), 0).toFixed(2)} LRD
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm font-bold text-green-600">
                          ${filteredPayments.reduce((sum, p) => sum + (p.totalPaid || 0), 0).toFixed(2)} LRD
                        </td>
                        <td colSpan="2" className="border border-gray-300 px-4 py-3 text-sm"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Summary Statistics */}
              {reportData?.summary && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-blue-600">{reportData.summary.totalPayments}</div>
                      <p className="text-sm text-muted-foreground">Total Payments</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-600">
                        ${reportData.summary.totalAmount.toFixed(2)}
                      </div>
                      <p className="text-sm text-muted-foreground">Total Amount (LRD)</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-purple-600">
                        ${(reportData.summary.totalAmount / reportData.summary.totalPayments).toFixed(2)}
                      </div>
                      <p className="text-sm text-muted-foreground">Average Payment (LRD)</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-orange-600">
                        {reportData.summary.uniqueStudents}
                      </div>
                      <p className="text-sm text-muted-foreground">Unique Students</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Installment Breakdown */}
              {reportData?.summary && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-blue-600">
                        ${reportData.summary.totalFirstInstallment.toFixed(2)}
                      </div>
                      <p className="text-sm text-muted-foreground">First Installments (LRD)</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-purple-600">
                        ${reportData.summary.totalSecondInstallment.toFixed(2)}
                      </div>
                      <p className="text-sm text-muted-foreground">Second Installments (LRD)</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-orange-600">
                        ${reportData.summary.totalThirdInstallment.toFixed(2)}
                      </div>
                      <p className="text-sm text-muted-foreground">Third Installments (LRD)</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Summary Info */}
        {(reportData || studentSummaryData) && (
          <div className="text-sm text-muted-foreground">
            {reportData && (
              <div>
                Showing {filteredPayments.length} of {reportData.summary?.totalPayments} payment records
                {searchTerm && ` matching "${searchTerm}"`}
              </div>
            )}
            {studentSummaryData && (
              <div>
                Showing {filteredStudentSummary.length} of {studentSummaryData.totalStudents} students
                {searchTerm && ` matching "${searchTerm}"`}
              </div>
            )}
            {academicYear && (
              <div className="mt-1">
                For Academic Year: {academicYear}
                {studentID && ` • Student ID: ${studentID}`}
                {studentName && ` • Student Name: ${studentName}`}
                {startDate && ` • From: ${new Date(startDate).toLocaleDateString()}`}
                {endDate && ` • To: ${new Date(endDate).toLocaleDateString()}`}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default TvetFinancialReport;