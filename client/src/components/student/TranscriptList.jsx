import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Printer, Loader2, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getAllStudents, clearStudentErrors } from '../../actions/studentAction';
import { toast } from 'react-hot-toast';

const TranscriptList = () => {
  const dispatch = useDispatch();
  const { students, loading, error } = useSelector(state => state.student);

  const [searchTerm, setSearchTerm] = useState('');
  const [printingId, setPrintingId] = useState(null);

  // Handle PDF print
  const handlePrint = async (studentId, studentName) => {
    try {
      setPrintingId(studentId);
      const url = `/api/transcript/${studentId}`;

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to load transcript');
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
              toast.success(`Print dialog opened for ${studentName}'s transcript!`);
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
              toast.success(`Print dialog opened for ${studentName}'s transcript!`);
            }
          } catch (error) {
            console.error('Print error:', error);
            // Fallback: download the file instead
            const link = document.createElement('a');
            link.href = pdfUrl;
            const formattedName = studentName.replace(/\s+/g, '_');
            link.download = `${formattedName}_Transcript.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("PDF downloaded as fallback!");
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

      // Set cleanup timeout
      setTimeout(cleanup, 15000);

    } catch (error) {
      console.error('Print failed:', error);
      toast.error(`Failed to print transcript: ${error.message}`);
    } finally {
      setPrintingId(null);
    }
  };

  // Fetch students on component mount
  useEffect(() => {
    dispatch(getAllStudents());

    // Clear errors when unmounting
    return () => {
      dispatch(clearStudentErrors());
    };
  }, [dispatch]);

  // Filter students based on search term
  const filteredStudents = students?.filter(student =>
    student?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student?.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8 max-w-7xl"
      >
        <div className="flex items-center mb-6">
          <FileText className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-3xl font-bold text-foreground">Student Transcripts</h1>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search student by name or admission number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading students...</span>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : filteredStudents.length === 0 ? (
          <Alert>
            <AlertDescription>
              {searchTerm ? 'No students found matching your search criteria.' : 'No students found.'}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="bg-card rounded-lg border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admission #</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Grade Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student._id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{student.admissionNumber}</TableCell>
                    <TableCell>{`${student.firstName} ${student.lastName} ${student.middleName || ''}`}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        Grade {student.gradeLevel}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {student.isActive ? 'Active' : 'Active'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        onClick={() => handlePrint(student._id, `${student.firstName}_${student.lastName}`)}
                        disabled={printingId === student._id}
                        className="min-w-[100px]"
                      >
                        {printingId === student._id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Printing...
                          </>
                        ) : (
                          <>
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary Info */}
        {!loading && filteredStudents.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredStudents.length} of {students?.length || 0} students
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default TranscriptList;