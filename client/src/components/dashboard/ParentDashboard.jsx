import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {logout} from '../../actions/authAction'
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
  Users, 
  FileText, 
  BarChart, 
  Download, 
  Loader2, 
  School, 
  LogOut, 
  Search 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';
// import { DashboardLayout } from '../dashboard/DashboardLayout'; 
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ParentDashboard() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [grades, setGrades] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    academicYear: '',
    term: '',
    searchQuery: ''
  });
 const token = localStorage.getItem('token')
 const dispatch = useDispatch();
 const navigate = useNavigate();
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);



 // Check for mobile viewport
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch students associated with the parent
  const fetchStudents = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/grade/students/search?query=all`, {
        headers: {
          'x-auth-token': token 
        }
      });
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      if (data.success) {
        setStudents(data.data);
        if (data.data.length > 0) setSelectedStudent(data.data[0]._id);
      } else {
        throw new Error(data.message || 'Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error(error.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  // Fetch grades for the selected student
  const fetchGrades = async (studentId) => {
    if (!studentId) return;
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        ...(filters.academicYear && { academicYear: filters.academicYear }),
        ...(filters.term && { term: filters.term })
      });
      const response = await fetch(`/api/grade/student/${studentId}?${queryParams}`, {
        headers: {
           'x-auth-token': token 
        }
      });
      if (!response.ok) throw new Error('Failed to fetch grades');
      const data = await response.json();
      if (data.success) {
        setGrades(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch grades');
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
      toast.error(error.message || 'Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  // Fetch performance data for the selected student
  const fetchPerformance = async (studentId) => {
    if (!studentId) return;
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        ...(filters.academicYear && { academicYear: filters.academicYear }),
        ...(filters.term && { term: filters.term })
      });
      const response = await fetch(`/api/grade/performance/student/${studentId}?${queryParams}`, {
        headers: {
            'x-auth-token': token 
        }
      });
      if (!response.ok) throw new Error('Failed to fetch performance data');
      const data = await response.json();
      if (data.success) {
        setPerformance(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch performance data');
      }
    } catch (error) {
      console.error('Error fetching performance:', error);
      toast.error(error.message || 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  // Download report card
  const downloadReportCard = async (studentId, academicYear, term) => {
    try {
      const response = await fetch(`/api/reportcard/${studentId}/${encodeURIComponent(academicYear)}/${term}`, {
        headers: {
            'x-auth-token': token 
        }
      });
      if (!response.ok) throw new Error('Failed to download report card');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `report-card-${term ? `term-${term}` : 'annual'}-${studentId}-${academicYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Report card downloaded successfully!');
    } catch (error) {
      console.error('Report card download error:', error);
      toast.error('Failed to download report card');
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    if (selectedStudent) {
      fetchGrades(selectedStudent);
      fetchPerformance(selectedStudent);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({ academicYear: '', term: '', searchQuery: '' });
    if (selectedStudent) {
      fetchGrades(selectedStudent);
      fetchPerformance(selectedStudent);
    }
    toast.success('Filters cleared successfully.');
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchGrades(selectedStudent);
      fetchPerformance(selectedStudent);
    }
  }, [selectedStudent]);

  // Format grade to letter
  const formatGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Get periods to display based on term
  const getPeriodsForTerm = (term) => {
    if (term === '1') {
      return ['period1', 'period2', 'period3'];
    } else if (term === '2') {
      return ['period4', 'period5', 'period6'];
    } else {
      // If no specific term filter, show all periods
      return ['period1', 'period2', 'period3', 'period4', 'period5', 'period6'];
    }
  };

  const onLogout = () => {
    dispatch(logout())
    navigate('/')
  
  }

  // Get period headers based on term
  const getPeriodHeaders = (term) => {
    if (term === '1') {
      return ['Period 1', 'Period 2', 'Period 3'];
    } else if (term === '2') {
      return ['Period 4', 'Period 5', 'Period 6'];
    } else {
      return ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6'];
    }
  };

  // Determine which periods to show
  const periodsToShow = getPeriodsForTerm(filters.term);
  const periodHeaders = getPeriodHeaders(filters.term);

  return (
    // <DashboardLayout>
      <div className="space-y-6 p-4 md:p-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Parent Dashboard</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            View your child's academic results and report cards
          </p>
        </div>
        <Button variant="outline" className="gap-2 w-full md:w-auto" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* Student Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Student
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : students.length === 0 ? (
            <p className="text-center text-muted-foreground">No students associated with this account.</p>
          ) : (
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {students.map(student => (
                  <SelectItem key={student._id} value={student._id}>
                    {student.firstName} {student.lastName} ({student.admissionNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedStudent && (
        <>
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Academic Year</label>
                  <Input
                    placeholder="e.g., 2025/2026"
                    value={filters.academicYear}
                    onChange={(e) => handleFilterChange('academicYear', e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Term</label>
                  <Select
                    value={filters.term}
                    onValueChange={(value) => handleFilterChange('term', value)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                <Button variant="outline" onClick={clearFilters} disabled={loading} className="w-full sm:w-auto">
                  Clear Filters
                </Button>
                <Button onClick={handleApplyFilters} disabled={loading} className="w-full sm:w-auto">
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Results and Report Cards */}
          <Tabs defaultValue="grades" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="grades" className="text-xs sm:text-sm">Grades</TabsTrigger>
              <TabsTrigger value="performance" className="text-xs sm:text-sm">Performance</TabsTrigger>
              <TabsTrigger value="report-card" className="text-xs sm:text-sm">Report Card</TabsTrigger>
            </TabsList>

            {/* Grades Tab */}
            <TabsContent value="grades">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <School className="h-5 w-5" />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                      <span>Academic Grades</span>
                      {filters.term && (
                        <span className="text-sm font-normal text-muted-foreground">
                          {filters.term === '1' ? '(Semester 1)' : '(Semester 2)'}
                        </span>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : grades.length === 0 ? (
                    <p className="text-center text-muted-foreground">No grades found for this student.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <div className="min-w-[800px] md:min-w-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="whitespace-nowrap">Year</TableHead>
                              <TableHead className="whitespace-nowrap">Term</TableHead>
                              <TableHead className="whitespace-nowrap">Level</TableHead>
                              <TableHead className="whitespace-nowrap">Subject</TableHead>
                              {periodHeaders.map((header, index) => (
                                <TableHead key={index} className="whitespace-nowrap">
                                  {isMobile ? header.replace('Period', 'P') : header}
                                </TableHead>
                              ))}
                              <TableHead className="whitespace-nowrap">Exam</TableHead>
                              <TableHead className="whitespace-nowrap">Avg</TableHead>
                              <TableHead className="whitespace-nowrap">Grade</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {grades.map((grade, index) => (
                              grade.subjects.map((subject, subIndex) => (
                                <motion.tr
                                  key={`${grade._id}-${subject.subject}`}
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: (index * grade.subjects.length + subIndex) * 0.05 }}
                                >
                                  <TableCell className="whitespace-nowrap">{grade.academicYear}</TableCell>
                                  <TableCell className="whitespace-nowrap">S{grade.term}</TableCell>
                                  <TableCell className="whitespace-nowrap">{grade.gradeLevel}</TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    {isMobile ? subject.subject.substring(0, 3) : subject.subject}
                                  </TableCell>
                                  {periodsToShow.map((period, periodIndex) => (
                                    <TableCell key={periodIndex}>
                                      {subject.scores[period] ?? '-'}
                                    </TableCell>
                                  ))}
                                  <TableCell>{subject.scores.semesterExam ?? '-'}</TableCell>
                                  <TableCell>{subject.semesterAverage.toFixed(1)}</TableCell>
                                  <TableCell>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      formatGrade(subject.semesterAverage) === 'A' ? 'bg-green-100 text-green-800' :
                                      formatGrade(subject.semesterAverage) === 'B' ? 'bg-blue-100 text-blue-800' :
                                      formatGrade(subject.semesterAverage) === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                      formatGrade(subject.semesterAverage) === 'D' ? 'bg-orange-100 text-orange-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {formatGrade(subject.semesterAverage)}
                                    </span>
                                  </TableCell>
                                </motion.tr>
                              ))
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Analytics Tab */}
            <TabsContent value="performance">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5" />
                    Performance Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !performance || performance.subjectPerformance.length === 0 ? (
                    <p className="text-center text-muted-foreground">No performance data available.</p>
                  ) : (
                    <div className="space-y-6">
                      {/* Overall Stats */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Average Score</p>
                            <p className="text-xl md:text-2xl font-bold">{performance.overallStats.averageScore}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Passing Subjects</p>
                            <p className="text-xl md:text-2xl font-bold text-green-600">
                              {performance.overallStats.passingSubjects}
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Failing Subjects</p>
                            <p className="text-xl md:text-2xl font-bold text-red-600">
                              {performance.overallStats.failingSubjects}
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Subject Performance Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Subject Performance Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <div className="min-w-[500px] md:min-w-0">
                              <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={performance.subjectPerformance}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="subject" />
                                  <YAxis domain={[0, 100]} />
                                  <Tooltip />
                                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                  <Line type="monotone" dataKey="average" stroke="#8884d8" name="Avg" />
                                  <Line type="monotone" dataKey="highest" stroke="#82ca9d" name="High" />
                                  <Line type="monotone" dataKey="lowest" stroke="#ff7300" name="Low" />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Report Card Tab */}
            <TabsContent value="report-card">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Report Card
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : grades.length === 0 ? (
                    <p className="text-center text-muted-foreground">No report cards available.</p>
                  ) : (
                    <div className="space-y-4">
                      {grades.map(grade => (
                        <div key={grade._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/30 rounded-lg gap-2">
                          <div>
                            <p className="font-medium">{grade.academicYear} - S{grade.term}</p>
                            <p className="text-sm text-muted-foreground">Level: {grade.gradeLevel}</p>
                            <p className="text-sm text-muted-foreground">
                              Avg: {grade.overallAverage.toFixed(1)}% | Rank: {grade.rank || 'N/A'}
                            </p>
                          </div>
                          <Button
                            onClick={() => downloadReportCard(selectedStudent, grade.academicYear, grade.term)}
                            className="gap-2 w-full sm:w-auto"
                            size={isMobile ? "sm" : "default"}
                          >
                            <Download className="h-4 w-4" />
                            {isMobile ? 'Download' : 'Download Report Card'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
    // </DashboardLayout>
  );
};