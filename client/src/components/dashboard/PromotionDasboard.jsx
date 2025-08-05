import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DashboardLayout } from './DashboardLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  GraduationCap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  PlayCircle,
  BarChart3,
  Settings,
  Loader2,
  Download,
  Filter
} from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

// Import Redux actions
import {
  getEligibleStudents,
  getPromotionPreview,
  processStudentPromotion,
  processBatchPromotions,
  getStudentYearlyAverages,
  updatePromotionStatus,
  getAllStudents,
  clearPromotionData
} from '@/actions/studentAction';

// Custom table components (renamed to avoid conflict)
const CustomTable = ({ children, className = '' }) => (
  <div className={`w-full overflow-auto ${className}`}>
    <table className="w-full caption-bottom text-sm">
      {children}
    </table>
  </div>
);

const CustomTableHeader = ({ children }) => (
  <thead className="border-b">
    {children}
  </thead>
);

const CustomTableBody = ({ children }) => (
  <tbody className="divide-y divide-gray-200">
    {children}
  </tbody>
);

const CustomTableRow = ({ children, className = '' }) => (
  <tr className={`border-b transition-colors hover:bg-muted/50 ${className}`}>
    {children}
  </tr>
);

const CustomTableHead = ({ children, className = '' }) => (
  <th className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground ${className}`}>
    {children}
  </th>
);

const CustomTableCell = ({ children, className = '' }) => (
  <td className={`p-4 align-middle ${className}`}>
    {children}
  </td>
);

const PromotionDashboard = () => {
  const dispatch = useDispatch();

  // Redux state
  const {
    students,
    eligibleStudents,
    promotionPreview,
    yearlyAverages,
    batchPromotionResult,
    promotionLoading,
    promotionError,
    loading
  } = useSelector(state => state.student);

  // Component state
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [academicYear, setAcademicYear] = useState('2024/2025');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedClassSection, setSelectedClassSection] = useState('');

  // Modal states
  const [previewModal, setPreviewModal] = useState(false);
  const [batchModal, setBatchModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [editPromotionModal, setEditPromotionModal] = useState(false);

  // Form states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [promotionStatus, setPromotionStatus] = useState('');
  const [promotedToGrade, setPromotedToGrade] = useState('');
  const [notes, setNotes] = useState('');

  // Load initial data
  useEffect(() => {
    dispatch(getAllStudents());
    return () => {
      dispatch(clearPromotionData());
    };
  }, [dispatch]);

  // Load eligible students when filters change
  useEffect(() => {
    if (selectedGrade && academicYear) {
      handleLoadEligibleStudents();
    }
  }, [selectedGrade, selectedDepartment, academicYear]);

  // Handle errors
  useEffect(() => {
    if (promotionError) {
      toast.error(promotionError);
    }
  }, [promotionError]);

  // Helper functions
  const getStatusBadge = (status) => {
    const variants = {
      'Promoted': 'bg-green-100 text-green-800',
      'Conditional Promotion': 'bg-yellow-100 text-yellow-800',
      'Not Promoted': 'bg-red-100 text-red-800'
    };
    return variants[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Promoted': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Conditional Promotion': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'Not Promoted': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // Calculate overview stats from real data
  const calculateOverviewStats = () => {
    if (!eligibleStudents?.students) {
      return {
        totalStudents: students?.length || 0,
        readyForPromotion: 0,
        conditionalPromotion: 0,
        notEligible: 0,
        processed: 0
      };
    }

    const { summary } = eligibleStudents;
    return {
      totalStudents: summary.total || 0,
      readyForPromotion: summary.readyForPromotion || 0,
      conditionalPromotion: summary.conditionalPromotion || 0,
      notEligible: summary.notEligible || 0,
      processed: (summary.readyForPromotion + summary.conditionalPromotion + summary.notEligible) || 0
    };
  };

  // Calculate grade data from students
  const calculateGradeData = () => {
    if (!students) return [];

    const gradeGroups = students.reduce((acc, student) => {
      const grade = student.gradeLevel;
      if (!acc[grade]) {
        acc[grade] = { total: 0, promoted: 0, conditional: 0, notPromoted: 0, processed: 0 };
      }
      acc[grade].total++;

      if (student.promotionStatus) {
        acc[grade].processed++;
        switch (student.promotionStatus) {
          case 'Promoted':
            acc[grade].promoted++;
            break;
          case 'Conditional Promotion':
            acc[grade].conditional++;
            break;
          case 'Not Promoted':
            acc[grade].notPromoted++;
            break;
        }
      }

      return acc;
    }, {});

    return Object.entries(gradeGroups).map(([grade, data]) => ({
      grade,
      ...data
    })).sort((a, b) => parseInt(a.grade) - parseInt(b.grade));
  };

  const handleExportReport = async () => {
    if (!eligibleStudents?.students) {
      toast.error('No data available to export');
      return;
    }

    // Get current date for export
    const exportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    // Get all students and fetch their yearly averages
    const studentsToExport = [
      ...eligibleStudents.students.promoted,
      ...eligibleStudents.students.conditional,
      ...eligibleStudents.students.notPromoted,
      ...eligibleStudents.students.incomplete
    ].filter(student => 
      // Apply classSection filter client-side
      (!selectedClassSection || selectedClassSection === 'All' || student.student.classSection === selectedClassSection)
    );

    // Fetch yearly averages for all students
    const studentsWithAverages = [];
    
    for (const item of studentsToExport) {
      const student = item.student;
      let yearlyData = yearlyAverages && yearlyAverages[student.id] ? yearlyAverages[student.id] : null;
       console.log(yearlyData)
      
      if (!yearlyData) {
        try {
          const result = await dispatch(getStudentYearlyAverages(student.id, academicYear));
          if (result?.success) {
            yearlyData = result.data;
             console.log(yearlyData)
           
          }
        } catch (error) {
          console.error(`Failed to fetch yearly averages for student ${student.id}:`, error);
        }
      }
      
      studentsWithAverages.push({
        student,
        yearlyData,
        eligibility: item.eligibility
      });
    }

    // Helper function to get core subjects for department
    const getCoreSubjects = (department) => {
      const coreSubjects = {
        JHS: ["General Science", "Mathematics", "English", "Social Studies"],
        Science: ["Mathematics", "English", "Chemistry", "Biology", "Geography", "Physics", "Economics"],
        Arts: ["Mathematics", "English", "Literature", "Biology", "Economics", "Geography", "History"]
      };
      return coreSubjects[department] || coreSubjects.JHS;
    };

    // Helper function to count failed core subjects
    const countFailedCoreSubjects = (subjectAverages, department) => {
      if (!subjectAverages || !Array.isArray(subjectAverages)) return 0;
      
      const coreSubjects = getCoreSubjects(department);
      let failedCoreCount = 0;
      
      subjectAverages.forEach(subject => {
        const isCore = coreSubjects.some(coreSubject => 
          subject.subject === coreSubject || 
          (coreSubject === "General Science" && subject.subject === "Science") ||
          (coreSubject === "Science" && subject.subject === "General Science")
        );
        
        if (isCore && subject.yearlyAverage < 70) {
          failedCoreCount++;
        }
      });
      
      return failedCoreCount;
    };

    // Categorize students into sections
    const sections = {
      principalList: [],      // 90-100%
      honorRoll: [],          // 80-89%
      completePass: [],       // 70-79%
      conditionalPass: [],    // Failed in one core subject
      completeFailed: []      // Failed in two or more core subjects
    };

    studentsWithAverages.forEach(({ student, yearlyData, eligibility }) => {
      const overallAverage = yearlyData?.overallYearlyAverage || 0;
      const subjectAverages = yearlyData?.subjectAverages || [];
      const department = student.department || 'JHS';
      const failedCoreCount = countFailedCoreSubjects(subjectAverages, department);

      const studentData = {
        fullName: `${student.lastName}, ${student.firstName} ${student.middleName || ''}`.trim(),
        sex: student.gender || 'N/A',
        overallAverage: overallAverage > 0 ? `${overallAverage.toFixed(1)}%` : 'No Data'
      };

      // Categorize based on failed core subjects first, then overall average
      if (failedCoreCount >= 2) {
        sections.completeFailed.push(studentData);
      } else if (failedCoreCount === 1) {
        sections.conditionalPass.push(studentData);
      } else if (overallAverage >= 90) {
        sections.principalList.push(studentData);
      } else if (overallAverage >= 80) {
        sections.honorRoll.push(studentData);
      } else if (overallAverage >= 70) {
        sections.completePass.push(studentData);
      } else {
        sections.completePass.push(studentData);
      }
    });

    // Sort each section by overall average (descending) then by name
    Object.keys(sections).forEach(sectionKey => {
      sections[sectionKey].sort((a, b) => {
        const avgA = a.overallAverage === 'No Data' ? 0 : parseFloat(a.overallAverage.replace('%', ''));
        const avgB = b.overallAverage === 'No Data' ? 0 : parseFloat(b.overallAverage.replace('%', ''));
        if (avgB !== avgA) return avgB - avgA; // Higher average first
        return a.fullName.localeCompare(b.fullName); // Then alphabetical
      });
    });

    // Create Word document
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 }, // 1 inch margins
            size: { width: 12240, height: 15840, orientation: 'landscape' } // A4 landscape
          }
        },
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: 'STUDENT ACADEMIC PERFORMANCE REPORT',
                bold: true,
                size: 28,
                font: 'Arial'
              })
            ],
            alignment: 'center',
            spacing: { after: 200 }
          }),
          // Filter Information
          new Paragraph({
            children: [
              new TextRun({
                text: 'FILTER INFORMATION:',
                bold: true,
                size: 20,
                font: 'Arial'
              })
            ],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [new TextRun({ text: `Grade Level: ${selectedGrade || 'All'}`, size: 20, font: 'Arial' })],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [new TextRun({ text: `Class Section: ${selectedClassSection || 'All'}`, size: 20, font: 'Arial' })],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [new TextRun({ text: `Department: ${selectedDepartment || 'All'}`, size: 20, font: 'Arial' })],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [new TextRun({ text: `Academic Year: ${academicYear}`, size: 20, font: 'Arial' })],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [new TextRun({ text: `Export Date: ${exportDate}`, size: 20, font: 'Arial' })],
            spacing: { after: 200 }
          }),
          // Section configurations
          ...[
            {
              key: 'principalList',
              title: 'SECTION 1: PRINCIPAL LIST',
              subtitle: 'Students with Overall Average 90-100%',
              students: sections.principalList
            },
            {
              key: 'honorRoll',
              title: 'SECTION 2: HONOR ROLL',
              subtitle: 'Students with Overall Average 80-89%',
              students: sections.honorRoll
            },
            {
              key: 'completePass',
              title: 'SECTION 3: COMPLETE PASS',
              subtitle: 'Students with Overall Average 70-79%',
              students: sections.completePass
            },
            {
              key: 'conditionalPass',
              title: 'SECTION 4: CONDITIONAL PASS',
              subtitle: 'Students who failed in one core subject',
              students: sections.conditionalPass
            },
            {
              key: 'completeFailed',
              title: 'SECTION 5: COMPLETE FAILED',
              subtitle: 'Students who failed in two or more core subjects',
              students: sections.completeFailed
            }
          ].flatMap(({ title, subtitle, students }) => [
            // Section Title
            new Paragraph({
              children: [new TextRun({ text: title, bold: true, size: 24, font: 'Arial' })],
              spacing: { before: 400, after: 100 }
            }),
            // Section Subtitle
            new Paragraph({
              children: [new TextRun({ text: subtitle, italics: true, size: 20, font: 'Arial' })],
              spacing: { after: 100 }
            }),
            // Total Students
            new Paragraph({
              children: [new TextRun({ text: `Total Students: ${students.length}`, size: 20, font: 'Arial' })],
              spacing: { after: 200 }
            }),
            // Section Table
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                // Header Row
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: 'S/N', bold: true, size: 20, font: 'Arial' })] })],
                      width: { size: 10, type: WidthType.PERCENTAGE },
                      borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: 'Full Name', bold: true, size: 20, font: 'Arial' })] })],
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: 'Sex', bold: true, size: 20, font: 'Arial' })] })],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                      borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: 'Overall Average', bold: true, size: 20, font: 'Arial' })] })],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                      borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                    })
                  ]
                }),
                // Data Rows
                ...(students.length > 0 ? students.map((student, idx) => new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: `${idx + 1}`, size: 20, font: 'Arial' })] })],
                      borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: student.fullName, size: 20, font: 'Arial' })] })],
                      borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: student.sex, size: 20, font: 'Arial' })] })],
                      borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: student.overallAverage, size: 20, font: 'Arial' })] })],
                      borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                    })
                  ]
                })) : [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: 'No students in this category', size: 20, font: 'Arial' })] })],
                        columnSpan: 4,
                        borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                      })
                    ]
                  })
                ])
              ]
            }),
            // Spacing after section
            new Paragraph({ children: [], spacing: { before: 400 } })
          ]),
          // Summary Table
          new Paragraph({
            children: [new TextRun({ text: 'SUMMARY REPORT', bold: true, size: 24, font: 'Arial' })],
            spacing: { before: 400, after: 200 }
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              // Header Row
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Section', bold: true, size: 20, font: 'Arial' })] })],
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Description', bold: true, size: 20, font: 'Arial' })] })],
                    width: { size: 35, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Student Count', bold: true, size: 20, font: 'Arial' })] })],
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Percentage', bold: true, size: 20, font: 'Arial' })] })],
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  })
                ]
              }),
              // Data Rows
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Principal List', size: 20, font: 'Arial' })] })],
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: '90-100% Overall Average', size: 20, font: 'Arial' })] })],
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `${sections.principalList.length}`, size: 20, font: 'Arial' })] })],
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `${studentsWithAverages.length > 0 ? ((sections.principalList.length / studentsWithAverages.length) * 100).toFixed(1) : 0}%`, size: 20, font: 'Arial' })] })],
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Honor Roll', size: 20, font: 'Arial' })] })],
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: '80-89% Overall Average', size: 20, font: 'Arial' })] })],
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `${sections.honorRoll.length}`, size: 20, font: 'Arial' })] })],
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `${studentsWithAverages.length > 0 ? ((sections.honorRoll.length / studentsWithAverages.length) * 100).toFixed(1) : 0}%`, size: 20, font: 'Arial' })] })],
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Complete Pass', size: 20, font: 'Arial' })] })],
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: '70-79% Overall Average', size: 20, font: 'Arial' })] })],
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `${sections.completePass.length}`, size: 20, font: 'Arial' })] })],
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `${studentsWithAverages.length > 0 ? ((sections.completePass.length / studentsWithAverages.length) * 100).toFixed(1) : 0}%`, size: 20, font: 'Arial' })] })],
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Conditional Pass', size: 20, font: 'Arial' })] })],
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Failed 1 Core Subject', size: 20, font: 'Arial' })] })],
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `${sections.conditionalPass.length}`, size: 20, font: 'Arial' })] })],
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `${studentsWithAverages.length > 0 ? ((sections.conditionalPass.length / studentsWithAverages.length) * 100).toFixed(1) : 0}%`, size: 20, font: 'Arial' })] })],
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Complete Failed', size: 20, font: 'Arial' })] })],
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Failed 2+ Core Subjects', size: 20, font: 'Arial' })] })],
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `${sections.completeFailed.length}`, size: 20, font: 'Arial' })] })],
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `${studentsWithAverages.length > 0 ? ((sections.completeFailed.length / studentsWithAverages.length) * 100).toFixed(1) : 0}%`, size: 20, font: 'Arial' })] })],
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Total Students', bold: true, size: 20, font: 'Arial' })] })],
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: '', size: 20, font: 'Arial' })] })],
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `${studentsWithAverages.length}`, bold: true, size: 20, font: 'Arial' })] })],
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: '100.0%', bold: true, size: 20, font: 'Arial' })] })],
                    borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
                  })
                ]
              })
            ]
          })
        ]
      }]
    });

    // Generate and save the Word document
    const blob = await Packer.toBlob(doc);
    const filename = `academic_performance_report_grade_${selectedGrade}_${academicYear.replace('/', '-')}_${exportDate.replace(/\//g, '-')}.docx`;
    saveAs(blob, filename);

    toast.success(`Academic performance report exported successfully! Total students: ${studentsWithAverages.length}`);
  };

  // Event handlers
  const handleLoadEligibleStudents = async () => {
    try {
      await dispatch(getEligibleStudents(selectedGrade, academicYear, selectedDepartment));
    } catch (error) {
      toast.error('Failed to load eligible students');
    }
  };

  const handleStudentSelection = (studentId, checked) => {
    if (checked) {
      setSelectedStudents([...selectedStudents, studentId]);
    } else {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked && eligibleStudents?.students) {
      const allIds = [
        ...eligibleStudents.students.promoted.map(s => s.student.id),
        ...eligibleStudents.students.conditional.map(s => s.student.id),
        ...eligibleStudents.students.notPromoted.map(s => s.student.id)
      ];
      setSelectedStudents(allIds);
    } else {
      setSelectedStudents([]);
    }
  };

  const handleViewDetails = async (student) => {
    setSelectedStudent(student);
    try {
      await dispatch(getStudentYearlyAverages(student.id, academicYear));
      await dispatch(getPromotionPreview(student.id, academicYear));
      setDetailModal(true);
    } catch (error) {
      toast.error('Failed to load student details');
    }
  };

  const handleEditPromotion = (student) => {
    setSelectedStudent(student);
    setPromotionStatus(student.promotionStatus || '');
    setPromotedToGrade(student.promotedToGrade || '');
    setNotes('');
    setEditPromotionModal(true);
  };

  const handleProcessIndividualPromotion = async (studentId) => {
    try {
      await dispatch(processStudentPromotion(studentId, academicYear));
      toast.success('Student promotion processed successfully');
      if (selectedGrade) {
        handleLoadEligibleStudents();
      }
    } catch (error) {
      toast.error('Failed to process student promotion');
    }
  };

  const handleBatchPromotion = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select students to promote');
      return;
    }

    try {
      const result = await dispatch(processBatchPromotions(selectedStudents, academicYear));
      toast.success(`Batch promotion completed: ${result.data.summary.promoted} promoted, ${result.data.summary.conditionallyPromoted} conditional, ${result.data.summary.notPromoted} not promoted`);
      setBatchModal(false);
      setSelectedStudents([]);
      if (selectedGrade) {
        handleLoadEligibleStudents();
      }
    } catch (error) {
      toast.error('Failed to process batch promotions');
    }
  };

  const handleManualPromotionUpdate = async (e) => {
    e.preventDefault();
    if (!promotionStatus) {
      toast.error('Please select a promotion status');
      return;
    }

    try {
      await dispatch(updatePromotionStatus(
        selectedStudent.id,
        promotionStatus,
        promotedToGrade,
        notes
      ));
      toast.success('Promotion status updated successfully');
      setEditPromotionModal(false);
      if (selectedGrade) {
        handleLoadEligibleStudents();
      }
    } catch (error) {
      toast.error('Failed to update promotion status');
    }
  };

  const handleGradeAutoPromotion = async () => {
    if (!selectedGrade) {
      toast.error('Please select a grade level');
      return;
    }

    try {
      const eligible = await dispatch(getEligibleStudents(selectedGrade, academicYear, selectedDepartment));
      const allStudentIds = [
        ...eligible.data.students.promoted.map(s => s.student.id),
        ...eligible.data.students.conditional.map(s => s.student.id)
      ];

      if (allStudentIds.length === 0) {
        toast.error('No eligible students found for auto-promotion');
        return;
      }

      await dispatch(processBatchPromotions(allStudentIds, academicYear));
      toast.success(`Auto-promotion completed for Grade ${selectedGrade}`);
      setConfirmationModal(false);
      handleLoadEligibleStudents();
    } catch (error) {
      toast.error('Failed to process grade auto-promotion');
    }
  };

  const calculateProgress = (processed, total) => {
    return total > 0 ? Math.round((processed / total) * 100) : 0;
  };

  // Get current students list for display
  const getCurrentStudentsList = () => {
    if (!eligibleStudents?.students) return [];

    return [
      ...eligibleStudents.students.promoted.map(item => ({
        ...item.student,
        status: 'Promoted',
        eligibility: item.eligibility
      })),
      ...eligibleStudents.students.conditional.map(item => ({
        ...item.student,
        status: 'Conditional Promotion',
        eligibility: item.eligibility
      })),
      ...eligibleStudents.students.notPromoted.map(item => ({
        ...item.student,
        status: 'Not Promoted',
        eligibility: item.eligibility
      })),
      ...eligibleStudents.students.incomplete.map(item => ({
        ...item.student,
        status: 'Incomplete Data',
        eligibility: item.eligibility
      }))
    ];
  };

  const overviewStats = calculateOverviewStats();
  const gradeData = calculateGradeData();
  const currentStudents = getCurrentStudentsList();

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Student Promotion Management</h1>
            <p className="text-muted-foreground">Manage student promotions for academic year {academicYear}</p>
          </div>
          <div className="flex gap-3">
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023/2024">2023/2024</SelectItem>
                <SelectItem value="2024/2025">2024/2025</SelectItem>
                <SelectItem value="2025/2026">2025/2026</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Total Students</span>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold">{overviewStats.totalStudents}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Ready for Promotion</span>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold text-green-600">{overviewStats.readyForPromotion}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-gray-600">Conditional</span>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold text-yellow-600">{overviewStats.conditionalPromotion}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-gray-600">Not Eligible</span>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold text-red-600">{overviewStats.notEligible}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-600">Processed</span>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold text-purple-600">{overviewStats.processed}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="grade-management">Grade Management</TabsTrigger>
            <TabsTrigger value="batch-operations">Batch Operations</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Promotion Overview</CardTitle>
                <CardDescription>Overall statistics for student promotion across all grades.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-md">
                    <h3 className="text-lg font-semibold mb-2">Overall Promotion Progress</h3>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Processed: {overviewStats.processed} / {overviewStats.totalStudents}</span>
                      <span>{calculateProgress(overviewStats.processed, overviewStats.totalStudents)}%</span>
                    </div>
                    <Progress value={calculateProgress(overviewStats.processed, overviewStats.totalStudents)} className="mt-2" />
                  </div>
                  <div className="p-4 border rounded-md space-y-2 text-sm">
                    <h3 className="text-lg font-semibold mb-2">Key Metrics</h3>
                    <div className="flex justify-between">
                      <span>Ready for Promotion</span>
                      <span className="font-bold text-green-600">{overviewStats.readyForPromotion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conditional Promotion</span>
                      <span className="font-bold text-yellow-600">{overviewStats.conditionalPromotion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Not Eligible</span>
                      <span className="font-bold text-red-600">{overviewStats.notEligible}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Students Processed</span>
                      <span className="font-bold">{overviewStats.processed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Rate</span>
                      <span className="font-bold text-green-600">
                        {overviewStats.totalStudents > 0
                          ? Math.round((overviewStats.readyForPromotion / overviewStats.totalStudents) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conditional Rate</span>
                      <span className="font-bold text-yellow-600">
                        {overviewStats.totalStudents > 0
                          ? Math.round((overviewStats.conditionalPromotion / overviewStats.totalStudents) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unprocessed Students</span>
                      <span className="font-bold">{overviewStats.totalStudents - overviewStats.processed}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Promotion Status by Grade Level</CardTitle>
                <CardDescription>Breakdown of promotion status for each grade.</CardDescription>
              </CardHeader>
              <CardContent>
                <CustomTable className="min-w-full">
                  <CustomTableHeader>
                    <CustomTableRow>
                      <CustomTableHead>Grade</CustomTableHead>
                      <CustomTableHead>Total Students</CustomTableHead>
                      <CustomTableHead>Promoted</CustomTableHead>
                      <CustomTableHead>Conditional</CustomTableHead>
                      <CustomTableHead>Not Promoted</CustomTableHead>
                      <CustomTableHead>Processed</CustomTableHead>
                      <CustomTableHead>Progress</CustomTableHead>
                    </CustomTableRow>
                  </CustomTableHeader>
                  <CustomTableBody>
                    {gradeData.length > 0 ? (
                      gradeData.map((data) => (
                        <CustomTableRow key={data.grade}>
                          <CustomTableCell className="font-medium">{data.grade}</CustomTableCell>
                          <CustomTableCell>{data.total}</CustomTableCell>
                          <CustomTableCell className="text-green-600">{data.promoted}</CustomTableCell>
                          <CustomTableCell className="text-yellow-600">{data.conditional}</CustomTableCell>
                          <CustomTableCell className="text-red-600">{data.notPromoted}</CustomTableCell>
                          <CustomTableCell>{data.processed}</CustomTableCell>
                          <CustomTableCell>
                            <Progress value={calculateProgress(data.processed, data.total)} className="w-[100px]" />
                            <span className="ml-2 text-sm text-muted-foreground">
                              {calculateProgress(data.processed, data.total)}%
                            </span>
                          </CustomTableCell>
                        </CustomTableRow>
                      ))
                    ) : (
                      <CustomTableRow>
                        <CustomTableCell colSpan={7} className="text-center py-4">
                          No grade data available.
                        </CustomTableCell>
                      </CustomTableRow>
                    )}
                  </CustomTableBody>
                </CustomTable>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grade-management" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Grade Management</CardTitle>
                <CardDescription>View and manage students eligible for promotion by grade and department.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="select-grade">Select Grade Level</Label>
                    <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(6)].map((_, i) => {
                          const grade = 7 + i;
                          return (
                            <SelectItem key={grade} value={String(grade)}>
                              Grade {grade}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="select-department">Select Department</Label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="Arts">Arts</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="JHS">JHS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="select-class-section">Select Class Section</Label>
                    <Select value={selectedClassSection} onValueChange={setSelectedClassSection}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Class Section" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sections</SelectItem>
                        <SelectItem value="A">Section A</SelectItem>
                        <SelectItem value="B">Section B</SelectItem>
                        <SelectItem value="C">Section C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleLoadEligibleStudents} disabled={!selectedGrade || promotionLoading}>
                    {promotionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Filter className="mr-2 h-4 w-4" />}
                    Load Students
                  </Button>
                  <Button onClick={() => setConfirmationModal(true)} variant="secondary" disabled={!selectedGrade || promotionLoading}>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Auto-Promote Grade
                  </Button>
                </div>

                <Separator />

                {promotionLoading ? (
                  <div className="flex flex-col items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="mt-4 text-muted-foreground">Loading eligible students...</p>
                  </div>
                ) : currentStudents.length > 0 ? (
                  <ScrollArea className="h-[400px] border rounded-md">
                    <CustomTable>
                      <CustomTableHeader>
                        <CustomTableRow>
                          <CustomTableHead>ID#</CustomTableHead>
                          <CustomTableHead>Name</CustomTableHead>
                          <CustomTableHead>Current Grade</CustomTableHead>
                          <CustomTableHead>Status</CustomTableHead>
                          <CustomTableHead>Reason/Details</CustomTableHead>
                          <CustomTableHead>Actions</CustomTableHead>
                        </CustomTableRow>
                      </CustomTableHeader>
                      <CustomTableBody>
                        {currentStudents.map((student) => (
                          <CustomTableRow key={student.id}>
                            <CustomTableCell className="font-medium">{student.admissionNumber}</CustomTableCell>
                            <CustomTableCell>{student.firstName} {student.lastName} {student?.middleName || ''}</CustomTableCell>
                            <CustomTableCell>{student.gradeLevel}</CustomTableCell>
                            <CustomTableCell>
                              <Badge className={getStatusBadge(student.status)}>
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(student.status)} {student.status}
                                </span>
                              </Badge>
                            </CustomTableCell>
                            <CustomTableCell>{student.eligibility.promotionDecision?.reason || 'N/A'}</CustomTableCell>
                            <CustomTableCell className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleViewDetails(student)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleEditPromotion(student)}>
                                <Settings className="h-4 w-4" />
                              </Button>
                              {!student.promotionStatus && (
                                <Button variant="default" size="sm" onClick={() => handleProcessIndividualPromotion(student.id)}>
                                  <PlayCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </CustomTableCell>
                          </CustomTableRow>
                        ))}
                      </CustomTableBody>
                    </CustomTable>
                  </ScrollArea>
                ) : (
                  <p className="text-center text-muted-foreground p-8">
                    No eligible students found for the selected criteria. Please load students.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="batch-operations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Batch Promotion Operations</CardTitle>
                <CardDescription>Process promotion for multiple selected students.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 items-center">
                  <Checkbox
                    id="selectAllStudents"
                    checked={selectedStudents.length === currentStudents.length && currentStudents.length > 0}
                    onCheckedChange={handleSelectAll}
                    disabled={currentStudents.length === 0}
                  />
                  <Label htmlFor="selectAllStudents">Select All Visible Students ({selectedStudents.length} selected)</Label>
                  <Button onClick={() => setBatchModal(true)} disabled={selectedStudents.length === 0 || promotionLoading}>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Process Selected ({selectedStudents.length})
                  </Button>
                </div>

                <Separator />

                {currentStudents.length > 0 ? (
                  <ScrollArea className="h-[400px] border rounded-md">
                    <CustomTable>
                      <CustomTableHeader>
                        <CustomTableRow>
                          <CustomTableHead className="w-[50px]">
                            <Checkbox
                              checked={selectedStudents.length === currentStudents.length && currentStudents.length > 0}
                              onCheckedChange={handleSelectAll}
                              disabled={currentStudents.length === 0}
                            />
                          </CustomTableHead>
                          <CustomTableHead>ID#</CustomTableHead>
                          <CustomTableHead>Name</CustomTableHead>
                          <CustomTableHead>Grade</CustomTableHead>
                          <CustomTableHead>Status</CustomTableHead>
                        </CustomTableRow>
                      </CustomTableHeader>
                      <CustomTableBody>
                        {currentStudents.map((student) => (
                          <CustomTableRow key={student.id}>
                            <CustomTableCell>
                              <Checkbox
                                checked={selectedStudents.includes(student.id)}
                                onCheckedChange={(checked) => handleStudentSelection(student.id, checked)}
                              />
                            </CustomTableCell>
                            <CustomTableCell className="font-medium">{student.admissionNumber}</CustomTableCell>
                            <CustomTableCell>{student.firstName} {student.lastName} {student?.middleName || ''}</CustomTableCell>
                            <CustomTableCell>{student.gradeLevel}</CustomTableCell>
                            <CustomTableCell>
                              <Badge className={getStatusBadge(student.status)}>
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(student.status)} {student.status}
                                </span>
                              </Badge>
                            </CustomTableCell>
                          </CustomTableRow>
                        ))}
                      </CustomTableBody>
                    </CustomTable>
                  </ScrollArea>
                ) : (
                  <p className="text-center text-muted-foreground p-8">
                    No students loaded for batch operations. Please select filters and load students.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Promotion Analytics</CardTitle>
                <CardDescription>In-depth insights into promotion trends and statistics.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-8 text-center text-muted-foreground border rounded-md">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Analytics charts and data will be displayed here.</p>
                  <p>Coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Preview Modal */}
        <Dialog open={previewModal} onOpenChange={setPreviewModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Promotion Preview</DialogTitle>
              <DialogDescription>Review the promotion eligibility for the selected student.</DialogDescription>
            </DialogHeader>
            {promotionPreview && selectedStudent ? (
              <div className="space-y-4">
                <p><strong>Student:</strong> {selectedStudent.firstName} {selectedStudent.lastName} {selectedStudent?.middleName || ''} ({selectedStudent.admissionNumber})</p>
                <p><strong>Current Grade:</strong> {selectedStudent.gradeLevel}</p>
                <p><strong>Predicted Status:</strong> <Badge className={getStatusBadge(promotionPreview.predictedStatus)}>{promotionPreview.predictedStatus}</Badge></p>
                <p><strong>Promoted To Grade:</strong> {promotionPreview.promotedToGrade}</p>
                <p><strong>Reason:</strong> {promotionPreview.reason}</p>
                <h4 className="font-semibold mt-4">Required Subjects Status:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {promotionPreview.subjectResults?.length > 0 ? (
                    promotionPreview.subjectResults.map((sub, index) => (
                      <li key={index} className={sub.passed ? 'text-green-700' : 'text-red-700'}>
                        {sub.subjectName}: {sub.score} ({sub.passed ? 'Passed' : 'Failed'})
                      </li>
                    ))
                  ) : (
                    <li>No subject results found.</li>
                  )}
                </ul>
              </div>
            ) : (
              <p>Loading preview...</p>
            )}
            <DialogFooter>
              <Button onClick={() => setPreviewModal(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Batch Confirmation Modal */}
        <Dialog open={batchModal} onOpenChange={setBatchModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Batch Promotion</DialogTitle>
              <DialogDescription>
                Are you sure you want to process promotion for {selectedStudents.length} selected students?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBatchModal(false)}>Cancel</Button>
              <Button onClick={handleBatchPromotion} disabled={promotionLoading}>
                {promotionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirm Process'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Student Details Modal */}
        <Dialog open={detailModal} onOpenChange={setDetailModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Student Promotion Details</DialogTitle>
              <DialogDescription>
                Detailed academic and promotion information for {selectedStudent?.firstName} {selectedStudent?.lastName} {selectedStudent?.middleName || ''}.
              </DialogDescription>
            </DialogHeader>
            {selectedStudent && yearlyAverages && promotionPreview ? (
              <ScrollArea className="h-[500px] p-4 pr-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Student Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div><strong>Name:</strong> {selectedStudent.firstName} {selectedStudent.lastName} {selectedStudent?.middleName || ''}</div>
                      <div><strong>ID#:</strong> {selectedStudent.admissionNumber}</div>
                      <div><strong>Current Grade:</strong> {selectedStudent.gradeLevel}</div>
                      <div><strong>Gender:</strong> {selectedStudent.gender}</div>
                      <div><strong>Date of Birth:</strong> {(selectedStudent.dob)}</div>
                      <div><strong>Promotion Status:</strong> <Badge className={getStatusBadge(selectedStudent.promotionStatus || 'Not Processed')}>
                        {selectedStudent.promotionStatus || 'Not Processed'}
                      </Badge></div>
                      {selectedStudent.promotedToGrade && (
                        <div><strong>Promoted To:</strong> Grade {selectedStudent.promotedToGrade}</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Promotion Eligibility (Preview)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div><strong>Predicted Status:</strong> <Badge className={getStatusBadge(promotionPreview.promotionDecision?.promotionStatus)}>{promotionPreview.promotionDecision?.promotionStatus || 'N/A'}</Badge></div>
                      <div><strong>Promoted To Grade:</strong> {promotionPreview.nextGrade || 'N/A'}</div>
                      <div><strong>Reason:</strong> {promotionPreview.promotionDecision?.reason || 'N/A'}</div>
                      <h4 className="font-semibold mt-2">Required Subjects:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {promotionPreview.subjectAverages?.length > 0 ? (
                          promotionPreview.subjectAverages.map((sub, index) => (
                            <li key={index} className={sub.yearlyAverage >= 70 ? 'text-green-700' : 'text-red-700'}>
                              {sub.subject}: {sub.yearlyAverage} ({sub.status})
                            </li>
                          ))
                        ) : (
                          <li>No subject results available.</li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="col-span-full">
                    <CardHeader>
                      <CardTitle>Yearly Subject Averages ({academicYear})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {yearlyAverages && yearlyAverages.subjectAverages?.length > 0 ? (
                        <CustomTable>
                          <CustomTableHeader>
                            <CustomTableRow>
                              <CustomTableHead>Subject</CustomTableHead>
                              <CustomTableHead>Average Score</CustomTableHead>
                              <CustomTableHead>Status</CustomTableHead>
                            </CustomTableRow>
                          </CustomTableHeader>
                          <CustomTableBody>
                            {yearlyAverages.subjectAverages.map((avg, index) => (
                              <CustomTableRow key={index}>
                                <CustomTableCell className="font-medium">{avg.subject}</CustomTableCell>
                                <CustomTableCell>{avg.yearlyAverage.toFixed(2)}</CustomTableCell>
                                <CustomTableCell>
                                  <Badge variant={avg.yearlyAverage >= 70 ? 'secondary' : 'destructive'}>
                                    {avg.yearlyAverage >= 70 ? 'Passed' : 'Failed'}
                                  </Badge>
                                </CustomTableCell>
                              </CustomTableRow>
                            ))}
                          </CustomTableBody>
                        </CustomTable>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          No yearly averages available. Ensure grades are recorded for both semesters.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center text-muted-foreground p-8">Loading student details...</div>
            )}
            <DialogFooter>
              <Button onClick={() => setDetailModal(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Modal (for Auto-Promote Grade) */}
        <Dialog open={confirmationModal} onOpenChange={setConfirmationModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Grade Auto-Promotion</DialogTitle>
              <DialogDescription>
                Are you sure you want to auto-promote all eligible students in Grade {selectedGrade}?
                This will apply promotion rules to all students in this grade level. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmationModal(false)}>Cancel</Button>
              <Button onClick={handleGradeAutoPromotion} disabled={promotionLoading}>
                {promotionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirm Auto-Promote'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Promotion Modal */}
        <Dialog open={editPromotionModal} onOpenChange={setEditPromotionModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manually Update Promotion Status</DialogTitle>
              <DialogDescription>
                Adjust the promotion status for {selectedStudent?.firstName} {selectedStudent?.lastName}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleManualPromotionUpdate} className="space-y-4">
              <div>
                <Label htmlFor="promotionStatus">Promotion Status</Label>
                <Select value={promotionStatus} onValueChange={setPromotionStatus}>
                  <SelectTrigger id="promotionStatus">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Promoted">Promoted</SelectItem>
                    <SelectItem value="Conditional Promotion">Conditional Promotion</SelectItem>
                    <SelectItem value="Not Promoted">Not Promoted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {promotionStatus === 'Promoted' && (
                <div>
                  <Label htmlFor="promotedToGrade">Promoted To Grade</Label>
                  <Input
                    id="promotedToGrade"
                    type="number"
                    value={promotedToGrade}
                    onChange={(e) => setPromotedToGrade(e.target.value)}
                    placeholder="e.g., 8"
                    min={selectedStudent ? parseInt(selectedStudent.gradeLevel) + 1 : 1}
                  />
                </div>
              )}
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any relevant notes"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditPromotionModal(false)}>Cancel</Button>
                <Button type="submit" disabled={promotionLoading}>
                  {promotionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
};

export default PromotionDashboard;
