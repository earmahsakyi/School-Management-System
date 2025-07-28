import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Users, BookOpen, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useDispatch, useSelector } from 'react-redux';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { getClassPerformance, clearGradeError, clearGradeFilters, setGradeFilters } from '@/actions/gradeAction';
import { toast } from 'react-hot-toast';

const departments = ['Science', 'Arts', 'JHS'];

const defaultPerformanceData = {
  overallStats: {
    totalStudents: 0,
    averageScore: '0',
    passingRate: '0',
    topPerformer: 'N/A',
    lowestPerformer: 'N/A'
  },
  subjectAverages: [],
  gradeDistribution: [
    { grade: 'A (90-100)', count: 0, percentage: '0' },
    { grade: 'B (80-89)', count: 0, percentage: '0' },
    { grade: 'C (70-79)', count: 0, percentage: '0' },
    { grade: 'D (60-69)', count: 0, percentage: '0' },
    { grade: 'F (0-59)', count: 0, percentage: '0' }
  ]
};

export default function ClassPerformancePage() {
  const dispatch = useDispatch();
  const { 
    classPerformance, 
    loading, 
    error,
    filters: reduxFilters
  } = useSelector(state => state.grade);

  // Use Redux filters as initial state, with fallback to defaults
  const [filters, setFilters] = useState({
    academicYear: reduxFilters?.academicYear || '2024/2025',
    term: reduxFilters?.term || '1',
    gradeLevel: reduxFilters?.gradeLevel || 'all',
    department: reduxFilters?.department || 'all'
  });

  // Get performance data with fallback to default
  const performanceData = classPerformance || defaultPerformanceData;

  const handleFilterChange = (key, value) => {
    const updatedFilters = { ...filters, [key]: value };
    setFilters(updatedFilters);
    
    // Update Redux filters
    dispatch(setGradeFilters(updatedFilters));
    
    // Fetch new data
    fetchPerformanceData(updatedFilters);
  };

  const clearFilters = () => {
    const resetFilters = {
      academicYear: '2024/2025',
      term: '1',
      gradeLevel: 'all',
      department: 'all'
    };
    setFilters(resetFilters);
    dispatch(clearGradeFilters());
    fetchPerformanceData(resetFilters);
    toast.success("Filters cleared successfully");
  };

  const fetchPerformanceData = async (filterParams) => {
    try {
      // Clean up filters - convert 'all' to empty string for API
      const cleanedFilters = Object.entries(filterParams).reduce((acc, [key, value]) => {
        if (value && value.trim() !== '' && value !== 'all') {
          acc[key] = value;
        }
        return acc;
      }, {});

      await dispatch(getClassPerformance(cleanedFilters));
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast.error('Failed to fetch performance data');
    }
  };

  const getGradeColor = (average) => {
    const avg = parseFloat(average);
    if (avg >= 90) return "text-green-600";
    if (avg >= 80) return "text-blue-600";
    if (avg >= 70) return "text-yellow-600";
    if (avg >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getTrendIcon = (trend) => {
    return trend === "up" ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getGradeBarColor = (gradeIndex) => {
    const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];
    return colors[gradeIndex] || 'bg-gray-500';
  };

  // Load initial data
  useEffect(() => {
    fetchPerformanceData(filters);
    
    // Cleanup on unmount
    return () => {
      dispatch(clearGradeError());
    };
  }, [dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearGradeError());
    }
  }, [error, dispatch]);

  // Sync with Redux filters when they change
  useEffect(() => {
    if (reduxFilters) {
      setFilters(prev => ({
        ...prev,
        ...reduxFilters
      }));
    }
  }, [reduxFilters]);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Class Performance Analytics</h1>
            <p className="text-muted-foreground">Overview of academic performance across all classes</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <BarChart3 className="h-5 w-5 mr-2" />
            Analytics Dashboard
          </Badge>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Performance Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Academic Year</label>
                <Select 
                  value={filters.academicYear} 
                  onValueChange={(value) => handleFilterChange('academicYear', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Grade Level</label>
                <Select 
                  value={filters.gradeLevel} 
                  onValueChange={(value) => handleFilterChange('gradeLevel', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Grades" />
                  </SelectTrigger>
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
                  value={filters.department} 
                  onValueChange={(value) => handleFilterChange('department', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={clearFilters} disabled={loading}>
                Clear Filters
              </Button>
              <Button 
                variant="outline" 
                onClick={() => fetchPerformanceData(filters)}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Refresh Data'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Grade Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceData.gradeDistribution.map((grade, index) => (
                <div key={grade.grade} className="flex items-center space-x-4">
                  <div className="w-24 text-sm font-medium">{grade.grade}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div 
                      className={`${getGradeBarColor(index)} h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                      style={{ width: `${grade.percentage}%` }}
                    >
                      <span className="text-white text-xs font-medium">
                        {grade.count}
                      </span>
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm font-medium">
                    {grade.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Overview Stats */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading performance data...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{performanceData.overallStats.totalStudents}</div>
                    <p className="text-xs text-muted-foreground">Enrolled in filtered classes</p>
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
                    <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{performanceData.overallStats.averageScore}%</div>
                    <p className="text-xs text-muted-foreground">Across all subjects</p>
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
                    <CardTitle className="text-sm font-medium">Passing Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{performanceData.overallStats.passingRate}%</div>
                    <p className="text-xs text-muted-foreground">Students scoring 60% or above</p>
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
                    <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold truncate" title={performanceData.overallStats.topPerformer}>
                      {performanceData.overallStats.topPerformer}
                    </div>
                    <p className="text-xs text-muted-foreground">Highest average score</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Subject Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {performanceData.subjectAverages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No subject data available for the selected filters</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {performanceData.subjectAverages.map((subject, index) => (
                      <motion.div
                        key={subject.subject}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {getTrendIcon(subject.trend)}
                            <h3 className="font-medium">{subject.subject}</h3>
                          </div>
                          <Badge variant="outline">{subject.studentCount} students</Badge>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="w-32">
                            <Progress value={parseFloat(subject.average)} className="h-2" />
                          </div>
                          <div className={`text-xl font-bold ${getGradeColor(subject.average)}`}>
                            {subject.average}%
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Grade Distribution Details */}
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.gradeDistribution.map((grade, index) => (
                    <motion.div
                      key={grade.grade}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="min-w-20 justify-center">
                          {grade.grade}
                        </Badge>
                        <span className="font-medium">{grade.count} students</span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-40">
                          <Progress value={parseFloat(grade.percentage)} className="h-2" />
                        </div>
                        <div className="text-lg font-bold min-w-16 text-right">
                          {grade.percentage}%
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Additional Statistics */}
            {performanceData.overallStats.totalStudents > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">PERFORMANCE SUMMARY</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Top Performer:</span>
                          <span className="font-medium">{performanceData.overallStats.topPerformer}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Lowest Performer:</span>
                          <span className="font-medium">{performanceData.overallStats.lowestPerformer}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pass Rate:</span>
                          <span className="font-medium">{performanceData.overallStats.passingRate}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">CURRENT FILTERS</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Academic Year:</span>
                          <span className="font-medium">{filters.academicYear || 'All'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Term:</span>
                          <span className="font-medium">{filters.term || 'All'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Grade Level:</span>
                          <span className="font-medium">{filters.gradeLevel === 'all' ? 'All' : `Grade ${filters.gradeLevel}`}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Department:</span>
                          <span className="font-medium">{filters.department === 'all' ? 'All' : filters.department}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}