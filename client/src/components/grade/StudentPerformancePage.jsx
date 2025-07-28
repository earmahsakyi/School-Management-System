import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, User, Calendar, BookOpen, TrendingUp, Award, BarChart2, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useDispatch, useSelector } from 'react-redux';
import { getStudentPerformance, searchStudents, clearGradeError } from '@/actions/gradeAction';
import { toast } from 'react-hot-toast';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const defaultStudentPerformance = {
  student: null,
  overallStats: {
    totalSubjects: 0,
    averageScore: '0',
    highestScore: '0',
    lowestScore: '0',
    passingSubjects: 0,
    failingSubjects: 0,
    bestSubject: 'N/A',
    bestSubjectAverage: '0',
    improvementTrend: 'stable',
    totalTerms: 0
  },
  subjectPerformance: [],
  termComparison: [],
  gradeHistory: [],
  yearlyAverages: []
};

export default function StudentPerformancePage() {
  const dispatch = useDispatch();
  const { studentPerformance = defaultStudentPerformance, students = [], loading: reduxLoading, error } = useSelector(state => state.grade);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);

  const isLoading = localLoading || reduxLoading;

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a student name or admission number.');
      return;
    }

    setLocalLoading(true);
    try {
      await dispatch(searchStudents(searchQuery));
      setSearchPerformed(true);
    } catch (err) {
      toast.error(err.message || 'Error fetching student data.');
      setSearchPerformed(true);
    } finally {
      setLocalLoading(false);
    }
  };

  const loadPerformance = async (student) => {
    try {
      await dispatch(getStudentPerformance(student._id));
      setSelectedStudentId(student._id);
    } catch (err) {
      toast.error(err.message || 'Failed to load student performance.');
    }
  };

  const getGradeColor = (score) => {
    const num = parseFloat(score);
    if (num >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (num >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (num >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (num >= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const calculateTrendPercentage = (termComparison) => {
    if (!termComparison || termComparison.length < 2) return '0';
    const first = parseFloat(termComparison[termComparison.length - 1].average);
    const last = parseFloat(termComparison[0].average);
    if (first === 0) return '0';
    return ((last - first) / first * 100).toFixed(1);
  };

  const studentData = studentPerformance?.student && selectedStudentId === studentPerformance.student._id ? {
    student: studentPerformance.student,
    overallStats: {
      ...studentPerformance.overallStats,
      bestSubject: studentPerformance.subjectPerformance?.length > 0
        ? studentPerformance.subjectPerformance.reduce((best, sp) =>
            parseFloat(sp.average) > parseFloat(best.average || '0') ? sp : best, {}).subject || 'N/A'
        : 'N/A',
      bestSubjectAverage: studentPerformance.subjectPerformance?.length > 0
        ? studentPerformance.subjectPerformance.reduce((best, sp) =>
            parseFloat(sp.average) > parseFloat(best.average || '0') ? sp : best, {}).average || '0'
        : '0',
      improvementTrend: studentPerformance.termComparison?.length > 1
        ? parseFloat(studentPerformance.termComparison[0].average) >
          parseFloat(studentPerformance.termComparison[studentPerformance.termComparison.length - 1].average)
          ? 'up' : 'down'
        : 'stable',
      totalTerms: studentPerformance.termComparison?.length || 0
    },
    academicHistory: studentPerformance.gradeHistory?.reduce((acc, grade) => {
      const idx = acc.findIndex(y => y.academicYear === grade.academicYear);
      const termData = {
        term: grade.term,
        subjects: grade.subjects?.map(s => ({
          subject: s.subject,
          score: parseFloat(s.semesterAverage),
          grade: s.grade || (parseFloat(s.semesterAverage) >= 90 ? 'A' :
                             parseFloat(s.semesterAverage) >= 80 ? 'B' :
                             parseFloat(s.semesterAverage) >= 70 ? 'C' :
                             parseFloat(s.semesterAverage) >= 60 ? 'D' : 'F'),
          periodScores: s.periodScores || {}
        })) || [],
        average: parseFloat(grade.overallAverage),
        rank: grade.rank || 0,
        totalStudents: grade.totalStudents || 0
      };
      if (idx === -1) acc.push({ academicYear: grade.academicYear, terms: [termData] });
      else acc[idx].terms.push(termData);
      return acc;
    }, []) || [],
    yearlyAverages: studentPerformance.yearlyAverages || []
  } : null;

  // Prepare chart data
  const termChartData = studentPerformance?.termComparison?.length > 0
    ? studentPerformance.termComparison.map(tc => ({
        term: `${tc.academicYear} T${tc.term}`,
        score: parseFloat(tc.average),
        rank: tc.rank,
        totalStudents: tc.totalStudents
      })).reverse()
    : [];

  const yearlyChartData = studentPerformance?.yearlyAverages?.length > 0
    ? studentPerformance.yearlyAverages.map(ya => ({
        year: ya.academicYear,
        semester1: parseFloat(ya.semester1Average) || 0,
        semester2: parseFloat(ya.semester2Average) || 0,
        yearlyAverage: parseFloat(ya.yearlyAverage) || 0
      }))
    : [];

  const subjectChartData = studentPerformance?.subjectPerformance?.length > 0
    ? studentPerformance.subjectPerformance.map(sp => ({
        subject: sp.subject,
        average: parseFloat(sp.average),
        highest: parseFloat(sp.highest),
        lowest: parseFloat(sp.lowest)
      })).sort((a, b) => b.average - a.average).slice(0, 5)
    : [];

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearGradeError());
    }
  }, [error, dispatch]);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Student Performance Summary</h1>
            <p className="text-muted-foreground">Detailed academic analysis</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <User className="h-5 w-5 mr-2" />
            Individual Analytics
          </Badge>
        </div>

        <Card>
          <CardHeader><CardTitle>Search Student</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter name or admission number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={isLoading || !searchQuery.trim()}>
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </div>

            {searchPerformed && students.length > 0 && (
              <div className="mt-4 space-y-2">
                {students.map(student => (
                  <motion.div
                    key={student._id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition"
                    onClick={() => loadPerformance(student)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{student.firstName} {student.lastName} {student?.middleName}</h4>
                        <p className="text-sm text-muted-foreground">{student.admissionNumber} - Grade {student.gradeLevel}, {student.department}</p>
                      </div>
                      <Badge variant="outline">Select</Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {searchPerformed && studentData && (
          <>
            {/* Student Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Student Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <h3 className="text-2xl font-bold">
                        {studentData.student.firstName} {studentData.student.lastName} {studentData.student?.middleName || ''}
                      </h3>
                      <p className="text-muted-foreground">
                        Admission: {studentData.student.admissionNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Grade Level</p>
                      <p className="text-lg font-semibold">{studentData.student.gradeLevel}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Department</p>
                      <p className="text-lg font-semibold">{studentData.student.department}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Class Section</p>
                      <p className="text-lg font-semibold">{studentData.student.classSection}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overall Average</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{studentData.overallStats.averageScore}%</div>
                    <Progress value={parseFloat(studentData.overallStats.averageScore)} className="mt-2" />
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Best Subject</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">{studentData.overallStats.bestSubject}</div>
                    <p className="text-sm text-muted-foreground">
                      {studentData.overallStats.bestSubjectAverage}% average
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Performance Trend</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {studentData.overallStats.improvementTrend === 'up' ? (
                        <ChevronUp className="h-5 w-5 text-green-600" />
                      ) : studentData.overallStats.improvementTrend === 'down' ? (
                        <ChevronDown className="h-5 w-5 text-red-600" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-gray-600" />
                      )}
                      <span className={`text-lg font-bold ${
                        studentData.overallStats.improvementTrend === 'up' ? 'text-green-600' : 
                        studentData.overallStats.improvementTrend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {calculateTrendPercentage(studentPerformance?.termComparison || [])}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Since first term</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Terms</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{studentData.overallStats.totalTerms}</div>
                    <p className="text-sm text-muted-foreground">Academic terms completed</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Term Performance Chart */}
              {termChartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart2 className="h-5 w-5" />
                      Term Performance Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={termChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="term" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip 
                          formatter={(value) => [`${value}%`, "Average Score"]}
                          labelFormatter={(label) => `Term: ${label}`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#3b82f6" 
                          strokeWidth={2} 
                          dot={{ fill: '#3b82f6' }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Yearly Performance Chart */}
              {yearlyChartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart2 className="h-5 w-5" />
                      Yearly Performance Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={yearlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip 
                          formatter={(value) => [`${value}%`, "Average Score"]}
                          labelFormatter={(label) => `Year: ${label}`}
                        />
                        <Bar dataKey="semester1" fill="#8884d8" name="Semester 1" />
                        <Bar dataKey="semester2" fill="#82ca9d" name="Semester 2" />
                        <Bar dataKey="yearlyAverage" fill="#ffc658" name="Yearly Average" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Top Subjects */}
            {subjectChartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Top Performing Subjects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {subjectChartData.map((subject, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border rounded-lg p-4"
                      >
                        <h4 className="font-semibold">{subject.subject}</h4>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Average:</span>
                            <span className="font-medium">{subject.average}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Highest:</span>
                            <span className="font-medium">{subject.highest}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Lowest:</span>
                            <span className="font-medium">{subject.lowest}%</span>
                          </div>
                        </div>
                        <Progress value={subject.average} className="mt-3" />
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Academic History */}
            <div className="space-y-6">
              {studentData.academicHistory.map((year, yearIndex) => (
                <motion.div
                  key={year.academicYear}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (yearIndex + 1) * 0.2 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Academic Year {year.academicYear}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {year.terms.map((term, termIndex) => (
                          <div key={term.term} className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-lg font-semibold">Term {term.term}</h4>
                              <div className="flex items-center gap-4">
                                <Badge 
                                  variant={term.average >= 75 ? "default" : "destructive"}
                                  className="text-lg px-3 py-1"
                                >
                                  {term.average}% Average
                                </Badge>
                                {term.rank > 0 && term.totalStudents > 0 && (
                                  <Badge variant="outline">
                                    Rank {term.rank}/{term.totalStudents}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Subject</TableHead>
                                  <TableHead>Score</TableHead>
                                  <TableHead>Grade</TableHead>
                                  <TableHead>Period Scores</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {term.subjects.map((subject, subjectIndex) => (
                                  <TableRow key={subjectIndex}>
                                    <TableCell className="font-medium">{subject.subject}</TableCell>
                                    <TableCell>{subject.score}%</TableCell>
                                    <TableCell>
                                      <Badge 
                                        variant="outline" 
                                        className={getGradeColor(subject.score)}
                                      >
                                        {subject.grade}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-2">
                                        {Object.entries(subject.periodScores).map(([period, score]) => (
                                          <div key={period} className="text-xs text-center">
                                            <div className="text-muted-foreground">{period}</div>
                                            <div>{score || '-'}</div>
                                          </div>
                                        ))}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {searchPerformed && !studentData && !isLoading && students.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Student Found</h3>
                <p className="text-muted-foreground">
                  Please check the student name or admission number and try again.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}