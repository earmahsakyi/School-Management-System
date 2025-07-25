import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {  Download, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getAllStudents, clearStudentErrors } from '../../actions/studentAction';
import { toast } from 'react-hot-toast';

const ReportCardsList = () => {
  const dispatch = useDispatch();
  const { students, loading, error } = useSelector(state => state.student);

  const [searchTerm, setSearchTerm] = useState('');
  const [academicYear, setAcademicYear] = useState('2024/2025');
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [downloadingId, setDownloadingId] = useState(null);

  // Handle PDF download
  const handleDownload = async (studentId, academicYear, term, studentName) => {
    try {
      setDownloadingId(studentId + term);
      let url = `/api/reportcard/${studentId}/${encodeURIComponent(academicYear)}`;
      if (term) {
        url += `/${term}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to download report card');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const termText = term ? `_Term${term}` : '_Annual';
      link.download = `${studentName}_ReportCard_${academicYear.replace('/', '-')}${termText}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(`Failed to download report card: ${error.message}`);
    } finally {
      setDownloadingId(null);
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
        <h1 className="text-3xl font-bold text-foreground mb-6">Report Cards</h1>

        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search student by name or admission number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="w-48">
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Academic Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023/2024">2023/2024</SelectItem>
                <SelectItem value="2024/2025">2024/2025</SelectItem>
                <SelectItem value="2025/2026">2025/2026</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-32">
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                <SelectItem value="1">Term 1</SelectItem>
                <SelectItem value="2">Term 2</SelectItem>
              </SelectContent>
            </Select>
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
            <AlertDescription>No students found for the current search/filters.</AlertDescription>
          </Alert>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admission #</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Grade Level</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student._id}>
                  <TableCell>{student.admissionNumber}</TableCell>
                  <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>
                  <TableCell>{student.gradeLevel}</TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    {selectedTerm !== 'all' ? ( // Check if a specific term is selected
                      <Button 
                        size="sm" 
                        onClick={() => handleDownload(student._id, academicYear, selectedTerm, `${student.firstName}_${student.lastName}`)}
                        disabled={downloadingId === student._id + selectedTerm}
                      >
                        {downloadingId === student._id + selectedTerm ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        Download
                      </Button>
                    ) : (
                      // Display options for Term 1, Term 2, and Annual if "All Terms" is selected
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownload(student._id, academicYear, '1', `${student.firstName}_${student.lastName}`)}
                          disabled={downloadingId === student._id + '1'}
                        >
                          {downloadingId === student._id + '1' ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Term 1
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownload(student._id, academicYear, '2', `${student.firstName}_${student.lastName}`)}
                          disabled={downloadingId === student._id + '2'}
                        >
                          {downloadingId === student._id + '2' ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Term 2
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleDownload(student._id, academicYear, null, `${student.firstName}_${student.lastName}`)}
                          disabled={downloadingId === student._id + 'null'}
                        >
                          {downloadingId === student._id + 'null' ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Annual
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default ReportCardsList;