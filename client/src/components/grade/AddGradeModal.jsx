
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Trash2, Search, Calculator, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { createGrade, clearGradeError } from '@/actions/gradeAction';
import { getAllStudents } from '@/actions/studentAction';
import { toast } from 'react-hot-toast';

const commonSubjects = [
  "English", "Mathematics", "General Science", "Social Studies", "Civics",
  "Literature", "Religious and Moral Education (RME)", "Physical Education (PE)",
  "Agriculture", "Computer Science", "History", "Biology", "Economics",
  "Geography", "R.O.T.C", "French", "Chemistry", "Physics"
];

const AddGradeModal = ({ open, onOpenChange, onSuccess }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.grade);
  const students = useSelector((state) => state.student.students);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');

  const { control, register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      academicYear: '',
      term: '',
      studentId: '',
      gradeLevel: '',
      department: '',
      subjects: [{ // Ensure one subject field by default
        subject: '',
        scores: {
          period1: '',
          period2: '',
          period3: '',
          period4: '',
          period5: '',
          period6: '',
          semesterExam: ''
        }
      }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'subjects' });
  const watchedSubjects = watch('subjects') || [];
  const selectedTerm = watch('term');

  // Filter students based on search input
  const filteredStudents = students.filter(student =>
    student.firstName.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.lastName.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.admissionNumber.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Handle student selection
  const handleStudentSelect = useCallback((student) => {
    setSelectedStudent(student);
    setValue('studentId', student._id);
    setValue('gradeLevel', student.gradeLevel);
    setValue('department', student.department);
  }, [setValue]);

  // Add a new subject field
  const addSubject = useCallback(() => {
    append({
      subject: '',
      scores: {
        period1: '',
        period2: '',
        period3: '',
        period4: '',
        period5: '',
        period6: '',
        semesterExam: ''
      }
    });
  }, [append]);

  // Remove a subject field
  const removeSubject = useCallback((index) => {
    if (fields.length > 1) {
      remove(index);
    } else {
      toast.error("You must have at least one subject record.");
    }
  }, [fields.length, remove]);

  // Helper function to get relevant period keys based on term
  const getRelevantPeriods = (termValue) => {
    if (termValue === '1') return ['period1', 'period2', 'period3'];
    if (termValue === '2') return ['period4', 'period5', 'period6'];
    return [];
  };

  // Calculate semester average for a subject
  const calculateSemesterAverage = useCallback((subject, termValue) => {
    if (!subject || !subject.scores || !termValue) return 0;

    const scores = subject.scores;
    let periodsSum = 0;
    let periodsCount = 0;

    const relevantPeriods = getRelevantPeriods(termValue);
    relevantPeriods.forEach(period => {
      const score = scores[period];
      const num = parseFloat(score);
      if (!isNaN(num) && num >= 0 && num <= 100) {
        periodsSum += num;
        periodsCount++;
      }
    });

    const periodsAverage = periodsCount > 0 ? periodsSum / periodsCount : 0;
    const semesterExam = parseFloat(scores.semesterExam) || 0;

    return ((periodsAverage + semesterExam) / 2).toFixed(1);
  }, []);

  // Calculate overall semester average
  const calculateOverallAverage = useCallback(() => {
    if (!watchedSubjects.length || !selectedTerm) return 0;

    const validAverages = watchedSubjects
      .filter(subject => subject.subject && subject.subject.trim() !== '')
      .map(subject => parseFloat(calculateSemesterAverage(subject, selectedTerm)))
      .filter(avg => !isNaN(avg) && avg >= 0);

    if (validAverages.length === 0) return 0;

    const total = validAverages.reduce((sum, avg) => sum + avg, 0);
    return (total / validAverages.length).toFixed(1);
  }, [watchedSubjects, selectedTerm, calculateSemesterAverage]);

  // Prepare score for backend
  const prepareScoreForBackend = useCallback((score) => {
    if (score === '' || score === null || score === undefined) {
      return null;
    }
    const num = parseFloat(score);
    return (isNaN(num) || num < 0 || num > 100) ? null : num;
  }, []);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      dispatch(clearGradeError());

      // Validation
      if (!data.studentId || !selectedStudent) {
        toast.error("Please select a student.");
        return;
      }
      if (!data.academicYear || data.academicYear.trim() === '') {
        toast.error("Please select an academic year.");
        return;
      }
      if (!data.term || !['1', '2'].includes(data.term)) {
        toast.error("Please select a valid term (1 or 2).");
        return;
      }

      // Process subjects
      const processedSubjects = data.subjects
        .filter(s => s.subject && s.subject.trim() !== '' && commonSubjects.includes(s.subject))
        .map(s => {
          const convertedScores = {
            period1: prepareScoreForBackend(s.scores.period1),
            period2: prepareScoreForBackend(s.scores.period2),
            period3: prepareScoreForBackend(s.scores.period3),
            period4: prepareScoreForBackend(s.scores.period4),
            period5: prepareScoreForBackend(s.scores.period5),
            period6: prepareScoreForBackend(s.scores.period6),
            semesterExam: prepareScoreForBackend(s.scores.semesterExam) || 0
          };

          if (!Object.values(convertedScores).some(score => score !== null)) {
            throw new Error(`Subject "${s.subject}" must have at least one valid score.`);
          }

          return {
            subject: s.subject.trim(),
            scores: convertedScores,
            semesterAverage: parseFloat(calculateSemesterAverage({ scores: convertedScores }, data.term)) || 0
          };
        });

      if (processedSubjects.length === 0) {
        toast.error("Please add at least one valid subject with scores.");
        return;
      }

      const payload = {
        student: data.studentId,
        academicYear: data.academicYear.trim(),
        term: data.term,
        gradeLevel: data.gradeLevel || selectedStudent?.gradeLevel,
        department: data.department || selectedStudent?.department,
        subjects: processedSubjects,
        overallAverage: parseFloat(calculateOverallAverage()) || 0
      };

      console.log('=== GRADE CREATION DEBUG ===');
      console.log('Selected Student:', selectedStudent);
      console.log('Form Data:', data);
      console.log('Watched Subjects:', JSON.stringify(watchedSubjects, null, 2));
      console.log('Processed Subjects:', JSON.stringify(processedSubjects, null, 2));
      console.log('Final Payload:', JSON.stringify(payload, null, 2));
      console.log('========================');

      await dispatch(createGrade(payload));
      toast.success("Grade record added successfully.");
      onSuccess();
      onOpenChange(false);
      reset();
      setSelectedStudent(null);
      setStudentSearch('');
    } catch (err) {
      console.error('Grade creation error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.errors?.join(', ') || err.message || "Failed to create grade record.";
      toast.error(errorMessage);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset({
        academicYear: '',
        term: '',
        studentId: '',
        gradeLevel: '',
        department: '',
        subjects: [{
          subject: '',
          scores: {
            period1: '', period2: '', period3: '',
            period4: '', period5: '', period6: '',
            semesterExam: ''
          }
        }]
      });
      setSelectedStudent(null);
      setStudentSearch('');
      dispatch(clearGradeError());
    }
  }, [open, reset, dispatch]);

  // Display error toasts
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearGradeError());
    }
  }, [error, dispatch]);

  // Fetch students on mount
  useEffect(() => {
    dispatch(getAllStudents());
  }, [dispatch]);


  // Helper function for period labels
  const getPeriodLabel = (period, termValue) => {
    const periodLabels = {
      '1': { period1: 'Period 1', period2: 'Period 2', period3: 'Period 3' },
      '2': { period4: 'Period 4', period5: 'Period 5', period6: 'Period 6' }
    };
    return periodLabels[termValue]?.[period] || period;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Grade Record</DialogTitle>
          <DialogDescription>
            Fill in the details to add a comprehensive grade record with period scores and semester exam.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow min-h-0 pr-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Student Selection */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <Label htmlFor="student-search">Select Student</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="student-search"
                    placeholder="Search by name or admission number..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>

                {selectedStudent ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 border rounded-lg bg-muted/50 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{selectedStudent.firstName} {selectedStudent.lastName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedStudent.admissionNumber} - Grade {selectedStudent.gradeLevel}, {selectedStudent.department}
                        </p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedStudent(null)} disabled={loading}>
                        Change
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="grid gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map(student => (
                        <motion.div
                          key={student._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleStudentSelect(student)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{student.firstName} {student.lastName}</h4>
                              <p className="text-sm text-muted-foreground">{student.admissionNumber}</p>
                            </div>
                            <Badge variant="outline">Grade {student.gradeLevel} - {student.department}</Badge>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">No students found.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="academicYear">Academic Year</Label>
                <Select onValueChange={v => setValue('academicYear', v)} disabled={loading} value={watch('academicYear')}>
                  <SelectTrigger id="academicYear"><SelectValue placeholder="Select year" /></SelectTrigger>
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
                <Label htmlFor="term">Term</Label>
                <Select onValueChange={v => setValue('term', v)} disabled={loading} value={watch('term')}>
                  <SelectTrigger id="term"><SelectValue placeholder="Select term" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Semester 1 (Periods 1-3)</SelectItem>
                    <SelectItem value="2">Semester 2 (Periods 4-6)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Overall Semester Average</Label>
                <div className="flex items-center h-10 px-3 border rounded-md bg-muted/50">
                  <Calculator className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Badge variant={parseFloat(calculateOverallAverage()) >= 75 ? "default" : "destructive"}>
                    {calculateOverallAverage()}%
                  </Badge>
                </div>
              </div>
            </div>

            {/* Subjects and Scores */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Subjects & Detailed Scores</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addSubject} disabled={loading}>
                    <Plus className="h-4 w-4 mr-1" />Add Subject
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {fields.map((field, index) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 border rounded-lg space-y-4 shadow-sm"
                  >
                    {/* Subject Selection and Remove Button */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Label htmlFor={`subject-${index}`}>Subject</Label>
                        <Select
                          onValueChange={v => setValue(`subjects.${index}.subject`, v)}
                          value={watchedSubjects[index]?.subject || ''}
                          disabled={loading}
                        >
                          <SelectTrigger id={`subject-${index}`}><SelectValue placeholder="Select subject" /></SelectTrigger>
                          <SelectContent>
                            {commonSubjects.map(subject => (
                              <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="pt-6">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSubject(index)}
                          disabled={fields.length === 1 || loading}
                          title="Remove Subject"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {/* Score Inputs */}
                    {selectedTerm ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          {getRelevantPeriods(selectedTerm).map(period => (
                            <div key={period} className="space-y-1">
                              <Label htmlFor={`score-${index}-${period}`} className="text-xs">{getPeriodLabel(period, selectedTerm)}</Label>
                              <Input
                                id={`score-${index}-${period}`}
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="0-100"
                                {...register(`subjects.${index}.scores.${period}`, {
                                  valueAsNumber: true,
                                  min: { value: 0, message: "Score cannot be negative" },
                                  max: { value: 100, message: "Score cannot exceed 100" }
                                })}
                                className="text-center"
                                disabled={loading}
                              />
                              {errors.subjects?.[index]?.scores?.[period] && (
                                <p className="text-red-500 text-xs mt-1">{errors.subjects[index].scores[period].message}</p>
                              )}
                            </div>
                          ))}

                          <div className="space-y-1">
                            <Label htmlFor={`score-${index}-semesterExam`} className="text-xs">Semester Exam</Label>
                            <Input
                              id={`score-${index}-semesterExam`}
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              placeholder="0-100"
                              {...register(`subjects.${index}.scores.semesterExam`, {
                                valueAsNumber: true,
                                min: { value: 0, message: "Score cannot be negative" },
                                max: { value: 100, message: "Score cannot exceed 100" }
                              })}
                              className="text-center"
                              disabled={loading}
                            />
                            {errors.subjects?.[index]?.scores?.semesterExam && (
                              <p className="text-red-500 text-xs mt-1">{errors.subjects[index].scores.semesterExam.message}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm font-medium flex items-center gap-1">
                            Semester Average:
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-sm">
                                  (Average of Period Scores + Semester Exam Score) / 2
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </span>
                          <Badge
                            variant={parseFloat(calculateSemesterAverage(watchedSubjects[index], selectedTerm)) >= 75 ? "default" : "destructive"}
                            className="font-bold"
                          >
                            {calculateSemesterAverage(watchedSubjects[index], selectedTerm)}%
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-4">
                        Please select a Term to enter subject scores.
                      </div>
                    )}
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </form>
        </ScrollArea>

        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={loading || !selectedStudent || !selectedTerm}>
            {loading ? "Adding..." : "Add Grade Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddGradeModal;
