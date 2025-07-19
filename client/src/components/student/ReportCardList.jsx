// src/components/admin/ReportCardsList.jsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const ReportCardsList = ({ students }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [academicYear, setAcademicYear] = useState('2024/2025');
  const [selectedTerm, setSelectedTerm] = useState('');

  const filteredStudents = students.filter(student => 
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Student Report Cards</h1>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          
          <Select value={academicYear} onValueChange={setAcademicYear}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Academic Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2023/2024">2023/2024</SelectItem>
              <SelectItem value="2024/2025">2024/2025</SelectItem>
              <SelectItem value="2025/2026">2025/2026</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="All Terms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Terms</SelectItem>
              <SelectItem value="1">Term 1</SelectItem>
              <SelectItem value="2">Term 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Admission No.</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredStudents.map((student) => (
            <TableRow key={student._id}>
              <TableCell className="font-medium">
                {student.firstName} {student.lastName}
              </TableCell>
              <TableCell>Grade {student.gradeLevel}</TableCell>
              <TableCell>{student.admissionNumber}</TableCell>
              <TableCell className="text-right space-x-2">
                {selectedTerm ? (
                  <Button asChild size="sm" variant="outline">
                    <Link 
                      to={`/admin/students/${student._id}/report/${encodeURIComponent(academicYear)}/${selectedTerm}`}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="sm" variant="outline">
                      <Link 
                        to={`/admin/students/${student._id}/report/${encodeURIComponent(academicYear)}/1`}
                      >
                        Term 1
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link 
                        to={`/admin/students/${student._id}/report/${encodeURIComponent(academicYear)}/2`}
                      >
                        Term 2
                      </Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link 
                        to={`/admin/students/${student._id}/report/${encodeURIComponent(academicYear)}`}
                      >
                        Annual
                      </Link>
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ReportCardsList;