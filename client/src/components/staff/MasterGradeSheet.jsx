import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '../dashboard/DashboardLayout'; 
import { Search, Printer, Loader2, FileSpreadsheet, Filter } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; 
import { getAllStudents, clearStudentErrors } from '../../actions/studentAction'; 
import { toast } from 'react-hot-toast'

const MasterGradeSheet = () => {
  const dispatch = useDispatch();
  const { students, loading, error } = useSelector(state => state.student);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [printing, setPrinting] = useState(false);

  // Common grade levels, sections, subjects, and departments
  const gradeLevels = ['7', '8', '9', '10', '11', '12'];
  const classSections = ['A', 'B', 'C', 'D'];
  const subjects = [
    "English", "Mathematics", "General Science", "Social Studies", "Civics",
    "Literature", "Religious and Moral Education (RME)", "Physical Education (PE)",
    "Agriculture", "Computer Science", "History", "Biology", "Economics",
    "Geography", "R.O.T.C", "French", "Chemistry", "Physics", "Automotive", "Electricity"
  ];
  const departments = ['Arts', 'Science', 'JHS', 'All'];

  // Handle Master Grade Sheet PDF print
  const handlePrintMasterSheet = async () => {
    if (!selectedGrade || !selectedSection || !selectedSubject) {
      toast.error('Please select Grade Level, Class Section, and Subject to print the master grade sheet.');
      return;
    }

    try {
      setPrinting(true);

      const queryParams = new URLSearchParams({
        gradeLevel: selectedGrade,
        classSection: selectedSection,
        subject: selectedSubject,
        academicYear: academicYear
      });
      if (selectedDepartment && selectedDepartment !== 'All') {
        queryParams.append('department', selectedDepartment);
      }

      // API endpoint for generating the master grade sheet 
      const url = `/api/master-grade-sheet?${queryParams}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate master grade sheet');
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
              const sheetInfo = `Grade ${selectedGrade}, Section ${selectedSection} - ${selectedSubject}`;
              toast.success(`Print dialog opened for Master Grade Sheet: ${sheetInfo}!`);
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
              const sheetInfo = `Grade ${selectedGrade}, Section ${selectedSection} - ${selectedSubject}`;
              toast.success(`Print dialog opened for Master Grade Sheet: ${sheetInfo}!`);
            }
          } catch (error) {
            console.error('Print error:', error);
            // Fallback: download the file instead
            const link = document.createElement('a');
            link.href = pdfUrl;
            const filename = `Master_Grade_Sheet_Grade${selectedGrade}_Section${selectedSection}_${selectedSubject}_${academicYear}${selectedDepartment && selectedDepartment !== 'All' ? `_${selectedDepartment}` : ''}.pdf`;
            link.download = filename;
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
      toast.error(`Failed to print master grade sheet: ${error.message}`);
    } finally {
      setPrinting(false);
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

  // Filter students based on search term and selected filters
  const filteredStudents = students?.filter(student => {
    const matchesSearch = !searchTerm ||
      student?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGrade = !selectedGrade || student?.gradeLevel === selectedGrade;
    const matchesSection = !selectedSection || student?.classSection === selectedSection;
    const matchesDepartment = !selectedDepartment || selectedDepartment === 'All' || student?.department === selectedDepartment;

    return matchesSearch && matchesGrade && matchesSection && matchesDepartment;
  }) || [];

  // Get unique grade levels, sections, and departments from students data
  const availableGrades = [...new Set(students?.map(s => s.gradeLevel).filter(Boolean))].sort();
  const availableSections = [...new Set(students?.map(s => s.classSection).filter(Boolean))].sort();
  const availableDepartments = [...new Set(students?.map(s => s.department).filter(Boolean))].sort();

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8 max-w-7xl"
      >
        <div className="flex items-center mb-6">
          <FileSpreadsheet className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-3xl font-bold text-foreground">Master Grade Sheet Generator</h1>
        </div>

        {/* Grade Sheet Generation Section - Wrapped in Card component */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Generate Master Grade Sheet
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
                <label htmlFor="gradeLevel" className="block text-sm font-medium mb-2">Grade Level</label>
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
                <label htmlFor="classSection" className="block text-sm font-medium mb-2">Class Section</label>
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
              <div>
                <label htmlFor="department" className="block text-sm font-medium mb-2">Department</label>
                <Select onValueChange={setSelectedDepartment} value={selectedDepartment} id="department">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Departments</SelectItem>
                    {(availableDepartments.length > 0 ? availableDepartments : departments.filter(d => d !== 'All')).map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2">Subject</label>
                <Select onValueChange={setSelectedSubject} value={selectedSubject} id="subject">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handlePrintMasterSheet}
                  disabled={printing || !selectedGrade || !selectedSection || !selectedSubject}
                  className="w-full"
                >
                  {printing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Printing...
                    </>
                  ) : (
                    <>
                      <Printer className="mr-2 h-4 w-4" />
                      Print PDF
                    </>
                  )}
                </Button>
              </div>
            </div>

            {selectedGrade && selectedSection && (
              <div className="text-sm text-muted-foreground mt-4">
                <strong>Preview:</strong> This will print a master grade sheet for Grade {selectedGrade}, Section {selectedSection}
                {selectedDepartment && selectedDepartment !== 'All' && `, Department ${selectedDepartment}`}
                {selectedSubject && ` - ${selectedSubject}`} (targeting {filteredStudents.length} students currently displayed)
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Search and Filter Section */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search students by name or admission number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Students Preview Table */}
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
              {selectedGrade || selectedSection || selectedDepartment ?
                'No students found matching the selected criteria.' :
                searchTerm ? 'No students found matching your search criteria.' : 'No students found.'
              }
            </AlertDescription>
          </Alert>
        ) : (
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Students Preview</h3>
              <p className="text-sm text-muted-foreground">
                Students that will be considered for the master grade sheet based on current filters
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Middle Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student, index) => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.admissionNumber}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{student.lastName}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{student.firstName}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{student.middleName || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{student.gender}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {student.gradeLevel}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {student.classSection}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {student.department || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Info */}
        {!loading && (students?.length > 0 || searchTerm || selectedGrade || selectedSection || selectedDepartment) && (
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredStudents.length} of {students?.length || 0} students
            {searchTerm && ` matching "${searchTerm}"`}
            {(selectedGrade || selectedSection || selectedDepartment) && ' with selected filters'}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default MasterGradeSheet;