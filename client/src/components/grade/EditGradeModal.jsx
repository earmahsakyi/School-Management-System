import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Calculator, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDispatch, useSelector } from 'react-redux';
import { updateGrade, clearGradeError } from '@/actions/gradeAction';
import { toast } from 'react-hot-toast';

const commonSubjects = [
  "English", "Mathematics", "General Science", "Social Studies", "Civics",
  "Literature", "Religious and Moral Education (RME)", "Physical Education (PE)",
  "Agriculture", "Computer Science", "History", "Biology", "Economics",
  "Geography", "R.O.T.C", "French", "Chemistry", "Physics"
];

export function EditGradeModal({ open, onOpenChange, grade, onSuccess }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.grade);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      academicYear: '',
      term: '',
      studentId: '',
      gradeLevel: '',
      department: '',
      conduct: '',
       attendance: {
    daysPresent: '',
    daysAbsent: '',
    timesTardy: ''
       },
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

  // Populate form when grade prop changes
  useEffect(() => {
    if (grade && open) {
      reset({
        academicYear: grade.academicYear || '',
        term: grade.term || '',
        conduct: grade.conduct || '',
        gradeLevel: grade.gradeLevel || '',
        department: grade.department || '',
        attendance: {
    daysPresent: grade.attendance?.daysPresent?.toString() || '',
    daysAbsent: grade.attendance?.daysAbsent?.toString() || '',
    timesTardy: grade.attendance?.timesTardy?.toString() || ''
  },
        subjects: grade.subjects?.length > 0 
          ? grade.subjects.map(subj => ({
              subject: subj.subject,
              scores: {
                period1: subj.scores?.period1?.toString() || '',
                period2: subj.scores?.period2?.toString() || '',
                period3: subj.scores?.period3?.toString() || '',
                period4: subj.scores?.period4?.toString() || '',
                period5: subj.scores?.period5?.toString() || '',
                period6: subj.scores?.period6?.toString() || '',
                semesterExam: subj.scores?.semesterExam?.toString() || ''
              }
            }))
          : [{
              subject: '',
              scores: {
                period1: '', period2: '', period3: '',
                period4: '', period5: '', period6: '',
                semesterExam: ''
              }
            }]
      });
    }
  }, [grade, open, reset]);

  // Handle error toasts
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearGradeError());
    }
  }, [error, dispatch]);

  const addSubject = () => {
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
  };

  const removeSubject = (index) => {
    if (fields.length > 1) {
      remove(index);
    } else {
      toast.error("You must have at least one subject record.");
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      dispatch(clearGradeError());

      // Validation
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
        academicYear: data.academicYear.trim(),
        term: data.term,
        gradeLevel: data.gradeLevel,
        department: data.department,
        subjects: processedSubjects,
        overallAverage: parseFloat(calculateOverallAverage()) || 0,
        attendance: {
        daysPresent: data.attendance.daysPresent || 0,
        daysAbsent: data.attendance.daysAbsent || 0,
        timesTardy: data.attendance.timesTardy || 0
        },
        conduct: data.conduct || "Good"
      };

      await dispatch(updateGrade(grade._id, payload));
      toast.success("Grade record updated successfully.");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Grade update error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.errors?.join(', ') || err.message || "Failed to update grade record.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function for period labels
  const getPeriodLabel = (period, termValue) => {
    const periodLabels = {
      '1': { period1: 'Period 1', period2: 'Period 2', period3: 'Period 3' },
      '2': { period4: 'Period 4', period5: 'Period 5', period6: 'Period 6' }
    };
    return periodLabels[termValue]?.[period] || period;
  };

  if (!grade) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Grade Record</DialogTitle>
          <DialogDescription>
            Update the details of this grade record with period scores and semester exam.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow min-h-0 pr-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Student Info (Read-only) */}
            <Card>
              <CardContent className="pt-6">
                <Label>Student Information</Label>
                <div className="p-4 border rounded-lg bg-muted/50 mt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">
                        {grade.student?.firstName} {grade.student?.lastName}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {grade.student?.admissionNumber} - Grade {grade.student?.gradeLevel}, {grade.student?.department}
                      </p>
                    </div>
                    <Badge variant="outline">Read Only</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="academicYear">Academic Year</Label>
                <Select 
                  onValueChange={v => setValue('academicYear', v)}
                  value={watch('academicYear')}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="academicYear">
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
                <Label htmlFor="term">Term</Label>
                <Select 
                  onValueChange={v => setValue('term', v)}
                  value={watch('term')}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="term">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
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
                                                              
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="daysPresent">Days Present</Label>
                    <Input
                      id="daysPresent"
                      type="number"
                      min="0"
                      {...register("attendance.daysPresent", { valueAsNumber: true,min: { value: 0, message: "Must be 0 or more" } })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="daysAbsent">Days Absent</Label>
                    <Input
                      id="daysAbsent"
                      type="number"
                      min="0"
                      {...register("attendance.daysAbsent", { valueAsNumber: true,min: { value: 0, message: "Must be 0 or more" } })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="timesTardy">Times Tardy</Label>
                    <Input
                      id="timesTardy"
                      type="number"
                      min="0"
                      {...register("attendance.timesTardy", { valueAsNumber: true,min: { value: 0, message: "Must be 0 or more" } })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="conduct">Conduct</Label>
                    <Select
                      onValueChange={(v) => setValue('conduct', v)}
                      value={watch('conduct')}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="conduct">
                        <SelectValue placeholder="Select Conduct" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Excellent">Excellent</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Satisfactory">Satisfactory</SelectItem>
                        <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

            {/* Subjects and Scores */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Subjects & Detailed Scores</CardTitle>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addSubject}
                    disabled={isSubmitting}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Subject
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
                          disabled={isSubmitting}
                        >
                          <SelectTrigger id={`subject-${index}`}>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {commonSubjects.map(subject => (
                              <SelectItem key={subject} value={subject}>
                                {subject}
                              </SelectItem>
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
                          disabled={fields.length === 1 || isSubmitting}
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
                              <Label htmlFor={`score-${index}-${period}`} className="text-xs">
                                {getPeriodLabel(period, selectedTerm)}
                              </Label>
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
                                disabled={isSubmitting}
                              />
                              {errors.subjects?.[index]?.scores?.[period] && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors.subjects[index].scores[period].message}
                                </p>
                              )}
                            </div>
                          ))}

                          <div className="space-y-1">
                            <Label htmlFor={`score-${index}-semesterExam`} className="text-xs">
                              Semester Exam
                            </Label>
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
                              disabled={isSubmitting}
                            />
                            {errors.subjects?.[index]?.scores?.semesterExam && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.subjects[index].scores.semesterExam.message}
                              </p>
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
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update Grade Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}