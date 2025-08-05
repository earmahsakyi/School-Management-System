import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { Download, Loader2, DollarSign, Filter, Calendar, Eye, Search, Printer } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

const OtherPaymentReport = () => {
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [department, setDepartment] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [classSection, setClassSection] = useState('');
  const [studentType, setStudentType] = useState('all');
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSuggestions, setFilterSuggestions] = useState({
    departments: ['JHS', 'Science', 'Arts'],
    gradeLevels: ['7', '8', '9', '10', '11', '12'],
    classSections: ['A', 'B', 'C', 'D']
  });

  // Fetch filter suggestions on mount
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await fetch(`/api/other/report-data?academicYear=${academicYear}`);
        const data = await response.json();
        if (data.suggestions) {
          setFilterSuggestions(data.suggestions);
        }
      } catch (error) {
        console.error('Failed to fetch filter suggestions:', error);
      }
    };
    if (academicYear) {
      fetchSuggestions();
    }
  }, [academicYear]);

  const handleGenerateReport = async () => {
    if (!academicYear) {
      toast.error('Please enter an Academic Year to generate the report.');
      return;
    }

    try {
      setDownloading(true);

      const queryParams = new URLSearchParams({ academicYear });
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (department) queryParams.append('department', department.trim());
      if (gradeLevel) queryParams.append('gradeLevel', gradeLevel.trim());
      if (classSection) queryParams.append('classSection', classSection.trim());
      if (studentType && studentType !== 'all') queryParams.append('studentType', studentType);

      const url = `/api/other/report?${queryParams}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const filename = `Other_Payments_Report_${academicYear}_${studentType}.pdf`;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Other Payments report generated successfully!');

    } catch (error) {
      console.error('Generation failed:', error);
      toast.error(`Failed to generate report: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrintReport = async () => {
    if (!academicYear) {
      toast.error('Please enter an Academic Year to print the report.');
      return;
    }

    try {
      setPrinting(true);

      const queryParams = new URLSearchParams({ academicYear });
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (department) queryParams.append('department', department.trim());
      if (gradeLevel) queryParams.append('gradeLevel', gradeLevel.trim());
      if (classSection) queryParams.append('classSection', classSection.trim());
      if (studentType && studentType !== 'all') queryParams.append('studentType', studentType);

      const url = `/api/other/report?${queryParams}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      const blob = await response.blob();
      const pdfUrl = window.URL.createObjectURL(blob);
      
      // Method 1: Try direct window.open approach first
      try {
        const printWindow = window.open(pdfUrl, '_blank');
        if (printWindow) {
          printWindow.addEventListener('load', () => {
            setTimeout(() => {
              printWindow.print();
              toast.success("Print dialog opened for Other Payments report!");
            }, 500);
          });

          // Cleanup after some time
          setTimeout(() => {
            window.URL.revokeObjectURL(pdfUrl);
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
      iframe.src = pdfUrl;

      document.body.appendChild(iframe);

      // Better event handling for iframe
      const handleIframeLoad = () => {
        setTimeout(() => {
          try {
            if (iframe.contentWindow) {
              iframe.contentWindow.focus();
              iframe.contentWindow.print();
              toast.success("Print dialog opened for Other Payments report!");
            }
          } catch (error) {
            console.error('Print error:', error);
            // Fallback: download the file instead
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = `Other_Payments_Report_${academicYear}_${studentType}_${new Date().getTime()}.pdf`;
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
          window.URL.revokeObjectURL(pdfUrl);
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      };

      // Cleanup after reasonable time
      setTimeout(cleanup, 15000);

    } catch (error) {
      console.error('Print failed:', error);
      toast.error(`Failed to print report: ${error.message}`);
    } finally {
      setPrinting(false);
    }
  };

  const handlePreviewReport = async () => {
    if (!academicYear) {
      toast.error('Please enter an Academic Year to preview the report.');
      return;
    }

    try {
      setPreviewing(true);

      const queryParams = new URLSearchParams({ academicYear });
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (department) queryParams.append('department', department.trim());
      if (gradeLevel) queryParams.append('gradeLevel', gradeLevel.trim());
      if (classSection) queryParams.append('classSection', classSection.trim());
      if (studentType && studentType !== 'all') queryParams.append('studentType', studentType);

      const url = `/api/other/report-data?${queryParams}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Failed to fetch report data',
          { cause: errorData.suggestions }
        );
      }

      const data = await response.json();
      setReportData(data.data);
      setFilterSuggestions(data.suggestions || filterSuggestions);

    } catch (error) {
      console.error('Preview failed:', error);
      const suggestions = error.cause || filterSuggestions;
      toast.error(
        `Failed to preview report: ${error.message}. Try these values: Departments: ${suggestions.departments?.join(', ') || 'None'}, Grade Levels: ${suggestions.gradeLevels?.join(', ') || 'None'}, Class Sections: ${suggestions.classSections?.join(', ') || 'None'}`
      );
      setReportData(null);
    } finally {
      setPreviewing(false);
    }
  };

  const filteredPayments = reportData?.payments?.filter(payment => {
    if (!searchTerm) return true;
    const student = payment.student || payment.manualStudentDetails;
    return (
      student?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.gradeLevel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.classSection?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-foreground">Other Payments Report</h1>
        </div>
        <div className="mb-8">
          <p className="text-muted-foreground">
            This report provides an overview of payments made by students who were manually added to the system or referenced from the student database.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label htmlFor="academicYear" className="block text-sm font-medium mb-2">Academic Year *</label>
                <Input
                  id="academicYear"
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="e.g., 2025/2026"
                />
              </div>
              <div>
                <label htmlFor="studentType" className="block text-sm font-medium mb-2">Student Type (Optional)</label>
                <Select value={studentType} onValueChange={setStudentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="manual">Manually Added Students</SelectItem>
                    <SelectItem value="referenced">Referenced Students</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="department" className="block text-sm font-medium mb-2">Department (Optional)</label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterSuggestions.departments.map(dep => (
                      <SelectItem key={dep} value={dep}>{dep || 'All Departments'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="gradeLevel" className="block text-sm font-medium mb-2">Grade Level (Optional)</label>
                <Select value={gradeLevel} onValueChange={setGradeLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterSuggestions.gradeLevels.map(grade => (
                      <SelectItem key={grade} value={grade}>{grade || 'All Grades'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="classSection" className="block text-sm font-medium mb-2">Class Section (Optional)</label>
                <Select value={classSection} onValueChange={setClassSection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class section" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterSuggestions.classSections.map(section => (
                      <SelectItem key={section} value={section}>{section || 'All Sections'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="text-sm font-medium mb-2 flex items-center">
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
                  <label htmlFor="endDate" className="text-sm font-medium mb-2 flex items-center">
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
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handlePreviewReport}
                disabled={previewing || !academicYear}
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
                onClick={handlePrintReport}
                disabled={printing || !academicYear}
                variant="secondary"
                className="flex-1"
              >
                {printing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparing Print...
                  </>
                ) : (
                  <>
                    <Printer className="mr-2 h-4 w-4" />
                    Print PDF
                  </>
                )}
              </Button>
              <Button
                onClick={handleGenerateReport}
                disabled={downloading || !academicYear}
                className="flex-1"
              >
                {downloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

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
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search by student name, ID#, receipt number, department, grade, or section..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {filteredPayments.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    {searchTerm
                      ? 'No payments found matching your search criteria.'
                      : `No payment records found for the selected criteria. Try these values: Departments: ${filterSuggestions.departments?.join(', ') || 'None'}, Grade Levels: ${filterSuggestions.gradeLevels?.join(', ') || 'None'}, Class Sections: ${filterSuggestions.classSections?.join(', ') || 'None'}`}
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
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt#</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {filteredPayments.map((payment, index) => {
                        const student = payment.student || payment.manualStudentDetails;
                        const isManual = payment.manualStudentDetails && !payment.student ? 'Manual' : 'Referenced';
                        return (
                          <tr key={payment._id} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 text-sm">{index + 1}</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm">
                              {student?.lastName}, {student?.firstName} {student?.middleName}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-sm font-medium">{student?.admissionNumber}</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm">{student?.gradeLevel}</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm">{student?.classSection}</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm">{student?.department}</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm">{payment.receiptNumber}</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm font-semibold text-green-600">
                              ${payment.amount.toFixed(2)} LRD
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-sm">
                              {new Date(payment.dateOfPayment).toLocaleDateString()}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-sm">{isManual}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gray-100 font-semibold">
                        <td colSpan="7" className="border border-gray-300 px-4 py-3 text-sm text-right">
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
      </motion.div>
    </DashboardLayout>
  );
};

export default OtherPaymentReport;