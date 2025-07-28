import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, Plus, Edit, Trash2, Eye, Search, Loader2, TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


import AddGradeModal from '../grade/AddGradeModal';
import { EditGradeModal } from '@/components/grade/EditGradeModal';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import {
  getAllGrades,
  deleteGrade,
  setGradeFilters,
  setGradePagination,
  clearGradeError,
  clearGradeFilters
} from '@/actions/gradeAction';

// New component for viewing grade details
const ViewGradeModal = ({ open, onOpenChange, grade, allStudentGrades }) => {
  if (!grade) return null;

  

  // Helper function to get period labels for display
  const getPeriodLabel = (period, termValue) => {
    const periodLabels = {
      '1': { period1: 'P1', period2: 'P2', period3: 'P3' },
      '2': { period4: 'P4', period5: 'P5', period6: 'P6' }
    };
    return periodLabels[termValue]?.[period] || period;
  };

  // Helper function to get relevant period keys based on term
  const getRelevantPeriods = (termValue) => {
    if (termValue === '1') return ['period1', 'period2', 'period3'];
    if (termValue === '2') return ['period4', 'period5', 'period6'];
    return [];
  };

  // Calculate semester average for a given subject and term (duplicated for self-containment)
  const calculateSemesterAverage = (subject, termValue) => {
    if (!subject || !subject.scores || !termValue) return 0;

    const scores = subject.scores;
    let periodsSum = 0;
    let periodsCount = 0;

    const relevantPeriods = getRelevantPeriods(termValue);

    relevantPeriods.forEach(period => {
      const num = parseFloat(scores[period]);
      if (!isNaN(num) && num >= 0) {
        periodsSum += num;
        periodsCount++;
      }
    });

    const periodsAverage = periodsCount > 0 ? periodsSum / periodsCount : 0;
    const semesterExam = parseFloat(scores.semesterExam) || 0;

    return ((periodsAverage + semesterExam) / 2).toFixed(1);
  };

  // Calculate overall semester average for a grade record
  const calculateOverallSemesterAverage = (subjects, term) => {
    if (!subjects || !subjects.length || !term) return 0;
    const validAverages = subjects
      .map(subject => parseFloat(calculateSemesterAverage(subject, term)))
      .filter(avg => !isNaN(avg) && avg >= 0);
    if (validAverages.length === 0) return 0;
    const total = validAverages.reduce((sum, avg) => sum + avg, 0);
    return (total / validAverages.length).toFixed(1);
  };

  // Calculate yearly average from both semester records for the same student and academic year
  const calculateYearlyAverage = () => {
    if (!allStudentGrades || allStudentGrades.length < 2) return null; // Need both terms for yearly average

    const term1Grade = allStudentGrades.find(g => g.term === '1');
    const term2Grade = allStudentGrades.find(g => g.term === '2');

    if (!term1Grade || !term2Grade) return null; // Both terms must exist

    const semester1Average = parseFloat(calculateOverallSemesterAverage(term1Grade.subjects, '1'));
    const semester2Average = parseFloat(calculateOverallSemesterAverage(term2Grade.subjects, '2'));

    if (isNaN(semester1Average) || isNaN(semester2Average)) return null;

    // Formula: (semester1Average + semester2Average) / 2
    return ((semester1Average + semester2Average) / 2).toFixed(1);
  };

  const yearlyAverage = calculateYearlyAverage();

  // Get grade letter based on percentage
  const getGradeLetter = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  // Get grade color for badge/circle
  const getGradeColor = (average) => {
    if (average >= 90) return "bg-green-500";
    if (average >= 80) return "bg-blue-500";
    if (average >= 70) return "bg-yellow-500";
    if (average >= 60) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Changed max-h to h for explicit height for debugging, and added overflow-hidden */}
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Grade Details: {grade.student?.firstName} {grade.student?.lastName} {grade.student?.middleName || ''}</DialogTitle>
          <DialogDescription>
            Detailed academic record for {grade.academicYear} - Term {grade.term}
          </DialogDescription>
        </DialogHeader>

        {/* Replaced ScrollArea with a div with overflow-y-auto for simpler debugging */}
        <div className="flex-grow pr-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Student and General Grade Info */}
            <Card>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Student Name</p>
                  <p className="font-semibold">{grade.student?.firstName} {grade.student?.lastName} {grade.student?.middleName ||''}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Admission Number</p>
                  <p className="font-semibold">{grade.student?.admissionNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Academic Year</p>
                  <p className="font-semibold">{grade.academicYear}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Term</p>
                  <p className="font-semibold">Term {grade.term}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Grade Level</p>
                  <p className="font-semibold">Grade {grade.gradeLevel}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Department</p>
                  <p className="font-semibold">{grade.department}</p>
                </div>
              </CardContent>
            </Card>

            {/* Subject Scores */}
            <Card>
              <CardHeader>
                <CardTitle>Subject Scores & Averages</CardTitle>
              </CardHeader>
              {/* Added min-h for visibility during debugging */}
              <CardContent className="space-y-4 min-h-[150px]">
                {grade.subjects && grade.subjects.length > 0 ? (
                  grade.subjects.map((subject, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-card shadow-sm">
                      <h4 className="font-semibold text-lg mb-2">{subject.subject}</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                        {getRelevantPeriods(grade.term).map(period => (
                          <div key={period}>
                            <p className="text-muted-foreground">{getPeriodLabel(period, grade.term)}:</p>
                            <p className="font-medium">{subject.scores?.[period] || 'N/A'}</p>
                          </div>
                        ))}
                        <div>
                          <p className="text-muted-foreground">Semester Exam:</p>
                          <p className="font-medium">{subject.scores?.semesterExam || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Semester Average:</p>
                          <Badge
                            variant={parseFloat(subject.semesterAverage) >= 75 ? "default" : "destructive"}
                            className="font-bold"
                          >
                            {subject.semesterAverage}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No subjects recorded for this term.</p>
                )}
              </CardContent>
            </Card>

            {/* Overall Averages */}
            <Card>
              <CardHeader>
                <CardTitle>Summary Averages</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Overall Semester Average</p>
                  <Badge
                    variant={parseFloat(grade.overallAverage) >= 60 ? "default" : "destructive"}
                    className="text-2xl px-4 py-2 font-bold"
                  >
                    {grade.overallAverage}% ({getGradeLetter(grade.overallAverage)})
                  </Badge>
                </div>

                <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Yearly Average</p>
                  {yearlyAverage !== null ? (
                    <Badge
                      variant={parseFloat(yearlyAverage) >= 60 ? "default" : "destructive"}
                      className="text-2xl px-4 py-2 font-bold"
                    >
                      {yearlyAverage}% ({getGradeLetter(yearlyAverage)})
                    </Badge>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      (Requires both Term 1 & Term 2 records for {grade.academicYear})
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div> {/* End of flex-grow div */}

        <DialogFooter className="mt-6">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default function GradesPage() {
  const dispatch = useDispatch();

  const {
    grades = [],
    loading = false,
    error,
    filters: reduxFilters = {},
    pagination = { current: 1, pages: 1, total: 0 }
  } = useSelector(state => state.grade);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [gradeToDelete, setGradeToDelete] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [studentGradesForYear, setStudentGradesForYear] = useState([]); // State to hold all grades for a student in a given academic year

  // Calculate overall semester average for a grade record (same as in AddGradeModal)
  const calculateOverallSemesterAverage = (subjects, term) => {
    if (!subjects || !subjects.length || !term) return 0;

    const getRelevantPeriods = (termValue) => {
      if (termValue === '1') return ['period1', 'period2', 'period3'];
      if (termValue === '2') return ['period4', 'period5', 'period6'];
      return [];
    };

    const calculateSubjectSemesterAverage = (subject, termValue) => {
      if (!subject || !subject.scores || !termValue) return 0;
      const scores = subject.scores;
      let periodsSum = 0;
      let periodsCount = 0;
      const relevantPeriods = getRelevantPeriods(termValue);
      relevantPeriods.forEach(period => {
        const num = parseFloat(scores[period]);
        if (!isNaN(num) && num >= 0) {
          periodsSum += num;
          periodsCount++;
        }
      });
      const periodsAverage = periodsCount > 0 ? periodsSum / periodsCount : 0;
      const semesterExam = parseFloat(scores.semesterExam) || 0;
      return ((periodsAverage + semesterExam) / 2); // Return raw number for further calculation
    };

    const validAverages = subjects
      .map(subject => calculateSubjectSemesterAverage(subject, term))
      .filter(avg => !isNaN(avg) && avg >= 0);

    if (validAverages.length === 0) return 0;
    const total = validAverages.reduce((sum, avg) => sum + avg, 0);
    return (total / validAverages.length).toFixed(1);
  };


  // Handle filter changes
  const handleFilterChange = (key, value) => {
    // Convert "all" value to empty string for Redux filters
    const filterValue = value === "all" ? "" : value;
    dispatch(setGradeFilters({ ...reduxFilters, [key]: filterValue })); // Update filters immediately
    // Reset to page 1 when filters change
    dispatch(setGradePagination({ ...pagination, current: 1 }));
    fetchGrades({ ...reduxFilters, [key]: filterValue }, 1); // Fetch with new filters
  };

  // Handle search (explicitly triggered)
  const handleSearch = () => {
    dispatch(setGradePagination({ ...pagination, current: 1 }));
    fetchGrades(reduxFilters, 1);
    toast.success("Search applied!");
  };

  // Fetch grades from Redux action
  const fetchGrades = (filters = {}, page = 1) => {
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value && value !== '')
    );
    dispatch(getAllGrades({ ...cleanFilters, page }));
  };

  // Handle delete confirmation
  const confirmDelete = (grade) => {
    setGradeToDelete(grade);
    setDeleteDialogOpen(true);
  };

  // Handle delete action
  const handleDelete = async () => {
    if (!gradeToDelete) return;

    setIsDeleting(true);
    try {
      await dispatch(deleteGrade(gradeToDelete._id));
      toast.success("The grade record has been removed successfully.");
      setDeleteDialogOpen(false);
      setGradeToDelete(null);

      // Recalculate target page after deletion
      const currentPage = pagination.current;
      const totalAfterDelete = pagination.total - 1;
      const itemsPerPage = 10; // Assuming 10 items per page as per common pagination
      const maxPage = Math.ceil(totalAfterDelete / itemsPerPage) || 1;
      const targetPage = currentPage > maxPage ? maxPage : currentPage;

      fetchGrades(reduxFilters, targetPage);
    } catch (err) {
      toast.error(err.message || "Failed to delete grade record");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle edit action
  const handleEdit = (grade) => {
    setSelectedGrade(grade);
    setIsEditModalOpen(true);
  };

  // Handle view details action
  const handleView = async (grade) => {
    setSelectedGrade(grade);
    // Fetch all grades for this student and academic year to calculate yearly average
    // This assumes your getAllGrades action can fetch by studentId and academicYear
    // You might need a specific action like `getStudentGradesByYear` if `getAllGrades` is too broad
    try {
      // Temporarily fetch all grades for the selected student and academic year
      // In a real app, you'd have a dedicated API endpoint for this
      const response = await dispatch(getAllGrades({
        studentId: grade.student._id,
        academicYear: grade.academicYear,
        limit: 100 // Fetch enough to cover all terms
      }));
      // Assuming response.grades contains all relevant grades for the student/year
      setStudentGradesForYear(response.grades || []); // Adjust based on actual Redux action return
    } catch (err) {
      console.error("Failed to fetch student's grades for year:", err);
      setStudentGradesForYear([]);
    }
    setIsViewModalOpen(true);
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.pages) return;
    dispatch(setGradePagination({ ...pagination, current: page }));
    fetchGrades(reduxFilters, page);
  };

  // Clear all filters
  const clearFilters = () => {
    dispatch(clearGradeFilters());
    dispatch(setGradePagination({ ...pagination, current: 1 }));
    fetchGrades({}, 1); // Fetch all grades after clearing filters
    toast.success("Filters cleared successfully.");
  };

  // Get grade letter based on percentage
  const getGradeLetter = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  // Get grade color for badge/circle
  const getGradeColor = (average) => {
    if (average >= 90) return "bg-green-500";
    if (average >= 80) return "bg-blue-500";
    if (average >= 70) return "bg-yellow-500";
    if (average >= 60) return "bg-orange-500";
    return "bg-red-500";
  };

  // Initial fetch on component mount and error handling
  useEffect(() => {
    fetchGrades(reduxFilters, pagination.current);
    return () => dispatch(clearGradeError());
  }, [dispatch]); // Only dispatch on mount

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearGradeError());
    }
  }, [error, dispatch]);

  // Calculate statistics for the cards
  const totalRecords = grades.length;
  const overallAvgPerformance = totalRecords > 0
    ? (grades.reduce((sum, grade) => sum + parseFloat(calculateOverallSemesterAverage(grade.subjects, grade.term)), 0) / totalRecords).toFixed(1)
    : '0';
  const passRate = totalRecords > 0
    ? ((grades.filter(grade => parseFloat(calculateOverallSemesterAverage(grade.subjects, grade.term)) >= 60).length / totalRecords) * 100).toFixed(1)
    : '0';
  const excellentGrades = grades.filter(grade => parseFloat(calculateOverallSemesterAverage(grade.subjects, grade.term)) >= 90).length;


  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Grade Management</h1>
            <p className="text-muted-foreground">Manage comprehensive student grades with period scores and semester averages</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Grade Record
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{pagination.total}</p>
              </div>
              <Badge variant="secondary" className="text-lg p-2 rounded-full">📊</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Semester Performance</p>
                <p className="text-2xl font-bold">
                  {overallAvgPerformance}%
                </p>
              </div>
              <Calculator className="h-6 w-6 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pass Rate (Avg &ge; 60%)</p>
                <p className="text-2xl font-bold">
                  {passRate}%
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Excellent Grades (Avg &ge; 90%)</p>
                <p className="text-2xl font-bold">
                  {excellentGrades}
                </p>
              </div>
              <Badge variant="default" className="text-lg p-2 rounded-full">🏆</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Filters Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Academic Year</label>
                <Select
                  value={reduxFilters.academicYear || 'all'} // Set default to 'all' for display
                  onValueChange={(value) => handleFilterChange('academicYear', value)}
                  disabled={loading}
                >
                  <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    <SelectItem value="2024/2025">2024/2025</SelectItem>
                    <SelectItem value="2025/2026">2025/2026</SelectItem>
                    <SelectItem value="2026/2027">2026/2027</SelectItem>
                    <SelectItem value="2027/2028">2027/2028</SelectItem>
                    <SelectItem value="2028/2029">2028/2029</SelectItem>
                    <SelectItem value="2029/2030">2029/2030</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Term</label>
                <Select
                  value={reduxFilters.term || 'all'} // Set default to 'all' for display
                  onValueChange={(value) => handleFilterChange('term', value)}
                  disabled={loading}
                >
                  <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Terms</SelectItem>
                    <SelectItem value="1">Semester 1</SelectItem>
                    <SelectItem value="2">Semester 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Grade Level</label>
                <Select
                  value={reduxFilters.gradeLevel || 'all'} // Set default to 'all' for display
                  onValueChange={(value) => handleFilterChange('gradeLevel', value)}
                  disabled={loading}
                >
                  <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    <SelectItem value="7">Grade 7</SelectItem>
                    <SelectItem value="8">Grade 8</SelectItem>
                    <SelectItem value="9">Grade 9</SelectItem>
                    <SelectItem value="10">Grade 10</SelectItem>
                    <SelectItem value="11">Grade 11</SelectItem>
                    <SelectItem value="12">Grade 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Select
                  value={reduxFilters.department || 'all'} // Set default to 'all' for display
                  onValueChange={(value) => handleFilterChange('department', value)}
                  disabled={loading}
                >
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="Arts">Arts</SelectItem>
                    <SelectItem value="JHS">JHS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Admission Number</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search admission number..."
                    value={reduxFilters.admissionNumber || ''}
                    onChange={(e) => handleFilterChange('admissionNumber', e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={clearFilters} disabled={loading}>
                Clear Filters
              </Button>
              <Button onClick={handleSearch} disabled={loading}>
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Grades Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Grade Records</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading grades...</p>
              </div>
            ) : grades.length === 0 ? (
              <div className="text-center p-6 text-muted-foreground">
                No grade records found. Try adjusting your filters or add a new record.
                <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 mt-4">
                  <Plus className="h-4 w-4" />
                  Add First Grade Record
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Admission No.</TableHead>
                        <TableHead>Academic Year</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Grade Level</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Overall Average</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grades.map((grade, index) => {
                        // Ensure overallAverage is a number, calculate if not present
                        const overallAverage = grade.overallAverage
                          ? parseFloat(grade.overallAverage)
                          : parseFloat(calculateOverallSemesterAverage(grade.subjects, grade.term));

                        const gradeLetter = getGradeLetter(overallAverage);

                        return (
                          <motion.tr
                            key={grade._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="hover:bg-muted/50"
                          >
                            <TableCell className="font-medium">
                              {grade.student?.firstName} {grade.student?.lastName} {grade.student?.middleName || ''}
                            </TableCell>
                            <TableCell>{grade.student?.admissionNumber}</TableCell>
                            <TableCell>{grade.academicYear}</TableCell>
                            <TableCell>Term {grade.term}</TableCell>
                            <TableCell>Grade {grade.gradeLevel}</TableCell>
                            <TableCell>{grade.department}</TableCell>
                            <TableCell>
                              <Badge variant={overallAverage >= 60 ? "default" : "destructive"}>
                                {overallAverage}% ({gradeLetter})
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right flex items-center justify-end gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => handleView(grade)} disabled={loading}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View Details</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(grade)} disabled={loading}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => confirmDelete(grade)} disabled={loading}>
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <Pagination className="mt-6">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={() => handlePageChange(pagination.current - 1)}
                          className={pagination.current === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      {[...Array(pagination.pages)].map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            href="#"
                            onClick={() => handlePageChange(i + 1)}
                            isActive={pagination.current === i + 1}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={() => handlePageChange(pagination.current + 1)}
                          className={pagination.current === pagination.pages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Grade Modal */}
      <AddGradeModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={() => fetchGrades(reduxFilters, pagination.current)}
      />

      {/* Edit Grade Modal */}
      {selectedGrade && (
        <EditGradeModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          grade={selectedGrade}
          onSuccess={() => {
            fetchGrades(reduxFilters, pagination.current);
            setSelectedGrade(null); // Clear selected grade after edit
          }}
        />
      )}

      {/* View Grade Details Dialog */}
      {selectedGrade && (
        <ViewGradeModal
          open={isViewModalOpen}
           onOpenChange={setIsViewModalOpen}
          grade={selectedGrade}
          allStudentGrades={studentGradesForYear} // Pass all grades for the student/year
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this grade record for{' '}
              <span className="font-semibold">
                {gradeToDelete?.student?.firstName} {gradeToDelete?.student?.lastName} {gradeToDelete?.student?.middleName || ''}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Grade'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
