import React, { useState, useMemo, useEffect, useCallback,useRef } from 'react';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { AddStudentModal } from '../dashboard/AddStudentModal';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EditStudentModal } from '../student/EditStudentModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import Redux actions
import {
  getAllStudents,
  deleteStudentAndParent,
  clearStudentErrors,
} from '../../actions/studentAction';

const gradeLevels = [7, 8, 9, 10, 11, 12];
const departments = ["Arts", "Science","JHS"];


// Utility function to get student avatar
const getStudentAvatar = (student) => {
  const API_BASE_URL = 'http://localhost:5000';
  
  // Default avatar using student's name with random background
  let avatarSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.lastName || student?.firstName || "Student")}&background=random&color=fff&size=40&rounded=true`;
  
  // If student has a photo, use it from the uploads folder
  if (student?.photo) {
    avatarSrc = `${API_BASE_URL}/uploads/students/${student.photo.split(/[\\/]/).pop()}`;
  }
  
  return avatarSrc;
};

// Fallback avatar for error cases
const getFallbackAvatar = (student) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.lastName || student?.firstName || "Student")}&background=6366f1&color=fff&size=40&rounded=true`;
};

const Students = () => {
  const dispatch = useDispatch();
  const studentsRef = useRef([]);
  
  // Redux state
  const { 
    students, 
    loading, 
    error, 
    message, 
    count 
  } = useSelector(state => state.student);
 

   useEffect(() => {
    if (students && Array.isArray(students) && students.length > 0) {
      studentsRef.current = students;
    }
  }, [students]);
 
  // Local state
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

  // Fetch students on component mount
  useEffect(() => {
     
    dispatch(getAllStudents());


    // Cleanup on unmount
    return () => {
      dispatch(clearStudentErrors());
    };
  }, [dispatch]);

  // Clear error messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearStudentErrors());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // Clear success messages after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        dispatch(clearStudentErrors());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, dispatch]);


  const columns = useMemo(() => [
    
    {
      accessorKey: 'student',
      header: 'Student Information',
      cell: ({ row }) => {
        const student = row.original;
        
        return (
          <div className="flex items-center gap-3 py-2">
            <img
              src={getStudentAvatar(student)}
              alt={student.fullName}
              className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
              onError={(e) => {
                // Fallback to generated avatar if photo fails to load
                e.target.src = getFallbackAvatar(student);
              }}
            />
            <div className="flex flex-col">
              <span className="text-base font-semibold text-foreground">
                {student.firstName} {student.lastName}
              </span>
              <span className="text-sm text-muted-foreground">
                {student.admissionNumber}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'grade',
      header: 'Grade',
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          Grade {row.original.gradeLevel}
        </div>
      ),
    },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }) => (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
          {row.original.department || 'JHS' }
        </div>
      ),
    },
    {
      accessorKey: 'classSection',
      header: 'Section',
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          Section {row.original.classSection}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
     
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary hover:bg-primary/10"
            onClick={() => handleEdit(row.original._id)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
            onClick={() => handleDeleteClick(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  ], []);

  const filteredData = useMemo(() => {

    if (!students || !Array.isArray(students)) return [];
    
    const filtered = students.filter(student => {
    const matchesGlobal = globalFilter === '' || 
      student.firstName?.toLowerCase().includes(globalFilter.toLowerCase()) ||
      student.lastName?.toLowerCase().includes(globalFilter.toLowerCase()) ||
      student.admissionNumber?.toLowerCase().includes(globalFilter.toLowerCase());
    
    const matchesGrade = gradeFilter === '' || student.gradeLevel?.toString() === gradeFilter;
    const matchesDepartment = departmentFilter === '' || student.department === departmentFilter;
    
    return matchesGlobal && matchesGrade && matchesDepartment;
  });
  
  return filtered;
    
  }, [students, globalFilter, gradeFilter, departmentFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  const handleEdit = useCallback((studentId) => {
    
    // Use students from state, fallback to ref if state is empty
    const studentsToUse = (students && students.length > 0) ? students : studentsRef.current;
    
    
    if (!studentsToUse || !Array.isArray(studentsToUse) || studentsToUse.length === 0) {
      console.error('No students data available, refreshing...');
      dispatch(getAllStudents());
      return;
    }
    
    const student = studentsToUse.find(s => s._id === studentId)
    
    if (student) {
      setStudentToEdit(student);
      setIsEditStudentOpen(true);
    }
  }, [students, dispatch]);



  const handleDeleteClick = useCallback((student) => {
  setStudentToDelete(student);
  setDeleteDialogOpen(true);
}, []);

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;
    
    try {
      setDeleteLoading(true);
      await dispatch(deleteStudentAndParent(studentToDelete._id));
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    } catch (error) {
      console.error('Error deleting student:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Fixed handleAddStudent function
  const handleAddStudent = () => {
    setIsAddStudentOpen(true);
  };

  const clearFilters = () => {
    setGlobalFilter('');
    setGradeFilter('');
    setDepartmentFilter('');
  };

  const handleRefresh = () => {
    dispatch(getAllStudents());
  };

  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Students</h1>
            <p className="text-muted-foreground">
              Manage and view all student information ({count} total)
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
            <Button 
              onClick={handleAddStudent}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-destructive bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {message && (
          <Alert className="mb-6 border-green-500 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">
              {message}
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="bg-card rounded-xl border shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name or admission number..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Grade Level" />
                </SelectTrigger>
                <SelectContent>
                  {gradeLevels.map((grade) => (
                    <SelectItem key={grade} value={grade.toString()}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(globalFilter || gradeFilter || departmentFilter) && (
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="w-full sm:w-auto"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading students...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/50">
                    {headerGroup.headers.map((header) => (
                      <TableHead 
                        key={header.id}
                        className="font-semibold text-foreground"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, backgroundColor: "hsl(0, 0%, 100%)" }}
                      animate={{ opacity: 1, backgroundColor: "hsl(0, 0%, 100%)" }}
                      whileHover={{ 
                        backgroundColor: "hsl(210, 40%, 96.1%)",
                        transition: { duration: 0.2 }
                      }}
                      style={{ backgroundColor: "hsl(0, 0%, 100%)" }}
                      className="border-b cursor-pointer"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-4">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No students found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                filteredData.length
              )}{' '}
              of {filteredData.length} students
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="text-primary border-primary/20 hover:bg-primary/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex gap-1">
                {Array.from({ length: pageCount }, (_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i ? "default" : "outline"}
                    size="sm"
                    onClick={() => table.setPageIndex(i)}
                    className={
                      currentPage === i
                        ? "bg-primary text-primary-foreground"
                        : "text-primary border-primary/20 hover:bg-primary/10"
                    }
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="text-primary border-primary/20 hover:bg-primary/10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the student
                <strong> {studentToDelete?.fullName} </strong>
                and their parent information from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AddStudentModal 
          open={isAddStudentOpen} 
          onOpenChange={setIsAddStudentOpen} 
        />
        <EditStudentModal 
          open={isEditStudentOpen} 
        onOpenChange={setIsEditStudentOpen}
       studentData={studentToEdit}
       isEditing={true}
          />
      </div>
    </DashboardLayout>
  );
};

export default Students;