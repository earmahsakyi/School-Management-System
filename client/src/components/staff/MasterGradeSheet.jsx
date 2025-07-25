import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '../dashboard/DashboardLayout'; 

import { Search, Download, Loader2, FileSpreadsheet, Filter } from 'lucide-react';
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
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [downloading, setDownloading] = useState(false);

  // Common grade levels and subjects (you can adjust these based on your school)
  const gradeLevels = ['7','8','9', '10', '11', '12'];
  const classSections = ['A', 'B', 'C', 'D'];
  const subjects = [
     "English", "Mathematics", "General Science", "Social Studies", "Civics",
      "Literature", "Religious and Moral Education (RME)", "Physical Education (PE)",
      "Agriculture", "Computer Science", "History", "Biology", "Economics",
      "Geography", "R.O.T.C", "French", "Chemistry", "Physics","Automotive","Electricity",
  ];

  // Handle Master Grade Sheet PDF generation
  const handleGenerateMasterSheet = async () => {
    if (!selectedGrade || !selectedSection || !selectedSubject) {
      alert('Please select Grade Level, Class Section, and Subject to generate the master grade sheet.');
      return;
    }

    try {
      setDownloading(true);

      const queryParams = new URLSearchParams({
        gradeLevel: selectedGrade,
        classSection: selectedSection,
        subject: selectedSubject,
        academicYear: academicYear
      });

      // API endpoint for generating the master grade sheet 
      const url = `/api/master-grade-sheet?${queryParams}`; 
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate master grade sheet');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      // Format filename
      const filename = `Master_Grade_Sheet_Grade${selectedGrade}_Section${selectedSection}_${selectedSubject}_${academicYear}.pdf`;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error('Generation failed:', error);
      toast.error(`Failed to generate master grade sheet: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  // Fetch students on component mount
  useEffect(() => {
    dispatch(getAllStudents());

    // Clear errors when unmounting
    return () => {
      dispatch(clearStudentErrors());
    };
  }, [dispatch]); // dispatch is stable, so it's fine here.

  // Filter students based on search term and selected filters
  const filteredStudents = students?.filter(student => {
    const matchesSearch = !searchTerm ||
      student?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGrade = !selectedGrade || student?.gradeLevel === selectedGrade;
    const matchesSection = !selectedSection || student?.classSection === selectedSection;

    // Filter by subject is not applied here, as it's for the *generation* logic, not for *displaying* students in the preview table.
    // The preview table shows students based on grade/section/search, irrespective of selected subject for the PDF.
    return matchesSearch && matchesGrade && matchesSection;
  }) || [];

  // Get unique grade levels and sections from students data
  // Ensure these are derived from the *actual* student data to show available options
  const availableGrades = [...new Set(students?.map(s => s.gradeLevel).filter(Boolean))].sort();
  const availableSections = [...new Set(students?.map(s => s.classSection).filter(Boolean))].sort();

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
                  onClick={handleGenerateMasterSheet}
                  disabled={downloading || !selectedGrade || !selectedSection || !selectedSubject}
                  className="w-full"
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
            </div>

            {selectedGrade && selectedSection && (
              <div className="text-sm text-muted-foreground mt-4">
                <strong>Preview:</strong> This will generate a master grade sheet for Grade {selectedGrade}, Section {selectedSection}
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
              {selectedGrade || selectedSection ?
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Info */}
        {!loading && (students?.length > 0 || searchTerm || selectedGrade || selectedSection) && (
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredStudents.length} of {students?.length || 0} students
            {searchTerm && ` matching "${searchTerm}"`}
            {(selectedGrade || selectedSection) && ' with selected filters'}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default MasterGradeSheet;