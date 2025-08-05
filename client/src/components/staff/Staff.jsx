import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { AddStaffModal } from './AddStaffModal';
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
  Loader2,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EditStaffModal } from '../staff/EditStaffModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { getAllStaff, deleteStaff, clearStaffErrors } from '../../actions/staffAction';
import { useNavigate } from 'react-router-dom';

const departments = ['Arts', 'Science', 'Administration', 'Other'];
const position = [
  'Teacher',
  'Head of Department',
  'Subject Coordinator',
  'Principal',
  'Vice Principal',
  'Registrar',
  'Accountant',
  'Clerk',
  'Librarian',
  'IT Support',
  'Store Keeper',
  'Security Guard',
  'Janitor',
];

const getStaffAvatar = (staff) => {
  let avatarSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    (staff?.firstName || '') + ' ' + (staff?.lastName || 'Staff')
  )}&background=random&color=fff&size=40&rounded=true`;

  if (staff?.photo) {
    avatarSrc = staff.photo;
  }

  return avatarSrc;
};

const getFallbackAvatar = (staff) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    staff?.lastName || staff?.firstName || 'Staff'
  )}&background=6366f1&color=fff&size=40&rounded=true`;
};

const Staff = () => {
  const dispatch = useDispatch();
  const staffsRef = useRef([]);
  const { staff, loading, error, message, totalStaff } = useSelector((state) => state.staff);

  useEffect(() => {
    if (staff && Array.isArray(staff) && staff.length > 0) {
      staffsRef.current = staff;
    }
  }, [staff]);

  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getAllStaff());
    return () => {
      dispatch(clearStaffErrors());
    };
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearStaffErrors());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        dispatch(clearStaffErrors());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, dispatch]);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'staff',
        header: 'Staff Information',
        cell: ({ row }) => {
          const staff = row.original || {};
          return (
            <div className="flex items-center gap-3 py-2">
              <img
                src={getStaffAvatar(staff)}
                alt={staff?.firstName || 'Staff'}
                className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
                onError={(e) => {
                  e.target.src = getFallbackAvatar(staff);
                }}
              />
              <div className="flex flex-col">
                <span className="text-base font-semibold text-foreground">
                  {staff.firstName || ''} {staff.lastName || ''} {staff.middleName || ''}
                </span>
                <span className="text-sm text-muted-foreground">{staff.staffId || 'N/A'}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'position',
        header: 'Position',
        cell: ({ row }) => <div className="text-sm font-medium">{row.original?.position || 'N/A'}</div>,
      },
      {
        accessorKey: 'department',
        header: 'Department',
        cell: ({ row }) => (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {row.original?.department || 'Others'}
          </div>
        ),
      },
      {
        accessorKey: 'qualifications',
        header: 'Qualifications',
        cell: ({ row }) => {
          const staff = row.original || {};
          const institutionQuals = staff.institutionAttended?.map(inst => inst.qualification).filter(q => q) || [];
          const otherQuals = staff.qualifications || [];
          const allQuals = [...institutionQuals, ...otherQuals];
          return (
            <div className="text-sm font-medium">
              {allQuals.length > 0 ? allQuals.join(', ') : 'N/A'}
            </div>
          );
        },
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
              onClick={() => handleEdit(row.original?._id)}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/staff/${row.original?._id}/documents`)}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Documents
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const filteredData = useMemo(() => {
    if (!staff || !Array.isArray(staff)) return [];

    return staff.filter((staffMember) => {
      if (!staffMember || !staffMember.firstName || !staffMember.lastName) {
        return false;
      }
      const matchesGlobal =
        globalFilter === '' ||
        staffMember.firstName?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        staffMember.lastName?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        staffMember.staffId?.toLowerCase().includes(globalFilter.toLowerCase());
      const matchesPosition = positionFilter === '' || staffMember.position === positionFilter;
      const matchesDepartment = departmentFilter === '' || staffMember.department === departmentFilter;

      return matchesGlobal && matchesPosition && matchesDepartment;
    });
  }, [staff, globalFilter, positionFilter, departmentFilter]);

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

  const handleEdit = useCallback((staffId) => {
    const staffsToUse = (staff && staff.length > 0) ? staff : staffsRef.current;
    
    if (!staffsToUse || !Array.isArray(staffsToUse) || staffsToUse.length === 0) {
      console.error('No staff data available, refreshing...');
      dispatch(getAllStaff());
      return;
    }
    
    const staffMember = staffsToUse.find(s => s._id === staffId);
    
    if (staffMember) {
      setStaffToEdit(staffMember);
      setIsEditStaffOpen(true);
    }
  }, [staff, dispatch]);

  const handleDeleteClick = useCallback((staffMember) => {
    setStaffToDelete(staffMember);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!staffToDelete) return;
    
    try {
      setDeleteLoading(true);
      await dispatch(deleteStaff(staffToDelete._id));
      setDeleteDialogOpen(false);
      setStaffToDelete(null);
    } catch (error) {
      console.error('Error deleting staff:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddStaff = () => {
    setIsAddStaffOpen(true);
  };

  const clearFilters = () => {
    setGlobalFilter('');
    setPositionFilter('');
    setDepartmentFilter('');
  };

  const handleRefresh = () => {
    dispatch(getAllStaff());
  };

  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Staff</h1>
            <p className="text-muted-foreground">Manage and view all staff information ({totalStaff} total)</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
            </Button>
            <Button
              onClick={handleAddStaff}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 border-destructive bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert className="mb-6 border-green-500 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">{message}</AlertDescription>
          </Alert>
        )}

        <div className="bg-card rounded-xl border shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name or staff ID..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Position" />
                </SelectTrigger>
                <SelectContent>
                  {position.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
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
              {(globalFilter || positionFilter || departmentFilter) && (
                <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading staff...</span>
            </div>
          ) : filteredData.length === 0 ? (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/50">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="font-semibold text-foreground">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    No staff found.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/50">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="font-semibold text-foreground">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, backgroundColor: 'hsl(0, 0%, 100%)' }}
                    animate={{ opacity: 1, backgroundColor: 'hsl(0, 0%, 100%)' }}
                    whileHover={{
                      backgroundColor: 'hsl(210, 40%, 96.1%)',
                      transition: { duration: 0.2 },
                    }}
                    style={{ backgroundColor: 'hsl(0, 0%, 100%)' }}
                    className="border-b cursor-pointer"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {!loading && filteredData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                filteredData.length
              )}{' '}
              of {filteredData.length} staff
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
                    variant={currentPage === i ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => table.setPageIndex(i)}
                    className={
                      currentPage === i
                        ? 'bg-primary text-primary-foreground'
                        : 'text-primary border-primary/20 hover:bg-primary/10'
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

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the staff member
                <strong> {staffToDelete?.firstName || ''} {staffToDelete?.lastName || ''} </strong>
                and their additional information from the system.
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
        <AddStaffModal open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen} />
        <EditStaffModal open={isEditStaffOpen} onOpenChange={setIsEditStaffOpen} staffData={staffToEdit} isEditing={true} />
      </div>
    </DashboardLayout>
  );
};

export default Staff;