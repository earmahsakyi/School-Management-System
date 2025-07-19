import { useForm } from 'react-hook-form';
import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { updateStudentAndParent } from '@/actions/studentAction';
import { Camera, RotateCcw, Check, X, FileText, Trash2 } from 'lucide-react';

export function EditStudentModal({ 
  open, 
  onOpenChange, 
  studentData = null, 
  isEditing = false 
}) {
  const dispatch = useDispatch();
  const {loading, error } = useSelector(state => state.student);

  
  const { register, handleSubmit, reset, setValue, formState: { errors }, watch } = useForm({
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      dob: '',
      placeOfBirth: '',
      gender: '',
      grade: '',
      department: '',
      lastSchoolAttended: '',
      classSection: '',
      guardianName: '',
      guardianEmail: '',
      guardianPhone: '',
      guardianOccupation: '',
    }
  });
  
  const webcamRef = useRef(null);
  
  // Webcam states
  const [showWebcam, setShowWebcam] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null);

  // Document states
  const [transcriptFile, setTranscriptFile] = useState(null);
  const [reportCardFile, setReportCardFile] = useState(null);
  const [existingTranscript, setExistingTranscript] = useState(null);
  const [existingReportCard, setExistingReportCard] = useState(null);

  // Utility function to get student avatar
  const getStudentAvatar = (student) => {
    const API_BASE_URL = 'http://localhost:5000';
    
    if (student?.photo) {
      return `${API_BASE_URL}/uploads/students/${student.photo.split(/[\\/]/).pop()}`;
    }
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.lastName || student?.firstName || "Student")}&background=random&color=fff&size=128&rounded=true`;
  };

  // Watch form values with default empty strings
  const watchedGender = watch('gender') || '';
  const watchedGrade = watch('grade') || '';
  const watchedDepartment = watch('department') || '';

  // Effect to populate form when editing
  useEffect(() => {
    if (isEditing && studentData && open) {
      // Set form values for student data
      setValue('firstName', studentData.firstName || '');
      setValue('middleName', studentData.middleName || '');
      setValue('lastName', studentData.lastName || '');
      setValue('dob', studentData.dob ? studentData.dob.split('T')[0] : ''); 
      setValue('placeOfBirth', studentData.placeOfBirth || '');
      setValue('gender', studentData.gender || '');
      setValue('grade', studentData.gradeLevel?.toString() || '');
      setValue('department', studentData.department || '');
      setValue('classSection', studentData.classSection || '');
      setValue('lastSchoolAttended', studentData.lastSchoolAttended || '');
      
      // Set form values for parent/guardian data
      setValue('guardianName', studentData.parent?.name || '');
      setValue('guardianEmail', studentData.parent?.email || '');
      setValue('guardianPhone', studentData.parent?.phone || '');
      setValue('guardianOccupation', studentData.parent?.occupation || '');
      console.log(studentData.parent)
      // Set existing files
      if (studentData.photo) {
        setExistingPhotoUrl(getStudentAvatar(studentData));
      }
      if (studentData.transcript) {
        setExistingTranscript(studentData.transcript);
      }
      if (studentData.reportCard) {
        setExistingReportCard(studentData.reportCard);
      }
    }
  }, [isEditing, studentData, open, setValue]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset({
        firstName: '',
        middleName: '',
        lastName: '',
        dob: '',
        placeOfBirth: '',
        gender: '',
        lastSchoolAttended: '',
        grade: '',
        department: '',
        classSection: '',
        guardianName: '',
        guardianEmail: '',
        guardianPhone: '',
        guardianOccupation: '',
      });
      setCapturedImage(null);
      setExistingPhotoUrl(null);
      setShowWebcam(false);
      setTranscriptFile(null);
      setReportCardFile(null);
      setExistingTranscript(null);
      setExistingReportCard(null);
    }
  }, [open, reset]);

  // Convert base64 to File object
  const base64ToFile = (base64String, filename) => {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Handle file selection
  const handleFileSelect = (event, fileType) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type (PDF only)
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file only');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should not exceed 10MB');
        return;
      }
      
      if (fileType === 'transcript') {
        setTranscriptFile(file);
        setExistingTranscript(null);
      } else if (fileType === 'reportCard') {
        setReportCardFile(file);
        setExistingReportCard(null);
      }
    }
  };

  // Remove selected file
  const removeFile = (fileType) => {
    if (fileType === 'transcript') {
      setTranscriptFile(null);
      setExistingTranscript(null);
    } else if (fileType === 'reportCard') {
      setReportCardFile(null);
      setExistingReportCard(null);
    }
  };

  // Capture photo from webcam
  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setShowWebcam(false);
  }, [webcamRef]);

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null);
    setShowWebcam(true);
  };

  // Switch camera (front/back)
  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Close webcam
  const closeWebcam = () => {
    setShowWebcam(false);
    setCapturedImage(null);
  };

  // Remove existing photo
  const removeExistingPhoto = () => {
    setExistingPhotoUrl(null);
  };

  const onSubmit = async (data) => {
    try {
      // Create FormData for multipart/form-data
      const formData = new FormData();
      
      // Map form fields to match your API expectations
      formData.append('firstName', data.firstName);
      formData.append('middleName', data.middleName || '');
      formData.append('lastName', data.lastName);
      formData.append('dob', data.dob);
      formData.append('placeOfBirth', data.placeOfBirth);
      formData.append('gender', data.gender);
      formData.append('gradeLevel', data.grade);
      formData.append('department', data.department || '');
      formData.append('classSection', data.classSection || '');
      formData.append('lastSchoolAttended', data.lastSchoolAttended || '');
      
      // Parent information
      formData.append('name', data.guardianName);
      formData.append('email', data.guardianEmail);
      formData.append('phone', data.guardianPhone);
      formData.append('occupation', data.guardianOccupation);
      
      // Add captured photo if available
      if (capturedImage) {
        const photoFile = base64ToFile(capturedImage, `student_${Date.now()}.jpg`);
        formData.append('photo', photoFile);
      }

      // Add transcript file if selected
      if (transcriptFile) {
        formData.append('transcript', transcriptFile);
      } else if (existingTranscript === null) {
        formData.append('removeTranscript', 'true');
      }

      // Add report card file if selected
      if (reportCardFile) {
        formData.append('reportCard', reportCardFile);
      } else if (existingReportCard === null) {
        formData.append('removeReportCard', 'true');
      }

      // If editing and existing photo was removed, indicate photo should be removed
      if (isEditing && existingPhotoUrl === null && !capturedImage) {
        formData.append('removePhoto', 'true');
      }

      // Dispatch the appropriate action
      if (isEditing) {
        await dispatch(updateStudentAndParent(studentData._id, formData));
        toast.success(`${data.firstName} ${data.lastName} has been updated successfully!`);
      }
      
      // Reset form and close modal
      reset({
        firstName: '',
        middleName: '',
        lastName: '',
        dob: '',
        placeOfBirth: '',
        gender: '',
        grade: '',
        department: '',
        classSection: '',
        lastSchoolAttended:'',
        guardianName: '',
        guardianEmail: '',
        guardianPhone: '',
        guardianOccupation:''
      });
      setCapturedImage(null);
      setExistingPhotoUrl(null);
      setTranscriptFile(null);
      setReportCardFile(null);
      setExistingTranscript(null);
      setExistingReportCard(null);
      onOpenChange(false);
      
    } catch (err) {
      console.error('Error saving student:', err);
      toast.error(error || `Failed to update student. Please try again.`);
    }
  };

  const grades = ['7', '8', '9', '10', '11', '12'];
  const departments = ['Arts', 'Science', 'JHS'];

  const videoConstraints = {
    width: 320,
    height: 240,
    facingMode: facingMode
  };

  // Get current photo to display
  const getCurrentPhoto = () => {
    if (capturedImage) return capturedImage;
    if (existingPhotoUrl) return existingPhotoUrl;
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Student' : 'Add New Student'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the student details below.' 
              : 'Fill in the student details to register them in the system.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Photo Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">
              Student Photo
            </h3>
            
            <div className="flex flex-col items-center space-y-4">
              {!showWebcam && !getCurrentPhoto() && (
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <Camera className="h-8 w-8 text-gray-400" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowWebcam(true)}
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Take Photo
                  </Button>
                </div>
              )}

              {showWebcam && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      videoConstraints={videoConstraints}
                      className="rounded-lg border"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={capturePhoto}
                      className="flex items-center gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      Capture
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={switchCamera}
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Switch Camera
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={closeWebcam}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {getCurrentPhoto() && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <img
                      src={getCurrentPhoto()}
                      alt="Student photo"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    {capturedImage && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowWebcam(true)}
                      className="flex items-center gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      {capturedImage || existingPhotoUrl ? 'Change Photo' : 'Take Photo'}
                    </Button>
                    
                    {capturedImage && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={retakePhoto}
                        className="flex items-center gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Retake
                      </Button>
                    )}
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCapturedImage(null);
                        removeExistingPhoto();
                      }}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">
              Documents
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Transcript Upload */}
              <div className="space-y-2">
                <Label htmlFor="transcript">Transcript (PDF)</Label>
                {!transcriptFile && !existingTranscript ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      id="transcript"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileSelect(e, 'transcript')}
                      className="file:mr-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800 truncate">
                        {transcriptFile?.name || existingTranscript?.split(/[\\/]/).pop()}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile('transcript')}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Report Card Upload */}
              <div className="space-y-2">
                <Label htmlFor="reportCard">Report Card (PDF)</Label>
                {!reportCardFile && !existingReportCard ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      id="reportCard"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileSelect(e, 'reportCard')}
                      className="file:mr-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800 truncate">
                        {reportCardFile?.name || existingReportCard?.split(/[\\/]/).pop()}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile('reportCard')}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-xs text-gray-500">
              * PDF files only, maximum 10MB each
            </p>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">
              Personal Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  {...register('firstName', { required: 'First name is required' })}
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  {...register('lastName', { required: 'Last name is required' })}
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="middleName">Middle Name (Optional)</Label>
              <Input
                id="middleName"
                {...register('middleName')}
                placeholder="Enter middle name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  {...register('dob', { required: 'Date of birth is required' })}
                />
                {errors.dob && (
                  <p className="text-sm text-destructive">{errors.dob.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="placeOfBirth">Place of Birth</Label>
                <Input
                  id="placeOfBirth"
                  {...register('placeOfBirth', { required: 'Place of birth is required' })}
                  placeholder="Enter place of birth"
                />
                {errors.placeOfBirth && (
                  <p className="text-sm text-destructive">{errors.placeOfBirth.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select 
                value={watchedGender} 
                onValueChange={(value) => setValue('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-sm text-destructive">{errors.gender.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade Level</Label>
                <Select 
                  value={watchedGrade} 
                  onValueChange={(value) => setValue('grade', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        Grade {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.grade && (
                  <p className="text-sm text-destructive">{errors.grade.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select 
                  value={watchedDepartment} 
                  onValueChange={(value) => setValue('department', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="lastSchoolAttended">Last School Attended</Label>
              <Input
                id="lastSchoolAttended"
                {...register('lastSchoolAttended')}
                placeholder="Bride Int. Sch"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="classSection">Class Section (Optional)</Label>
              <Input
                id="classSection"
                {...register('classSection')}
                placeholder="Enter class section (e.g., A, B, C)"
              />
            </div>
          </div>

          {/* Guardian Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">
              Parent/Guardian Information
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="guardianName">Parent/Guardian Name</Label>
              <Input
                id="guardianName"
                {...register('guardianName', { required: 'Guardian name is required' })}
                placeholder="Enter parent/guardian name"
              />
              {errors.guardianName && (
                <p className="text-sm text-destructive">{errors.guardianName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="guardianOccupation">Parent/Guardian Occupation</Label>
              <Input
                id="guardianOccupation"
                {...register('guardianOccupation', { required: 'Guardian Occupation is required' })}
                placeholder="Enter parent/guardian Occupation"
              />
              {errors.guardianOccupation && (
                <p className="text-sm text-destructive">{errors.guardianOccupation.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guardianEmail">Parent/Guardian Email</Label>
                <Input
                  id="guardianEmail"
                  type="email"
                  {...register('guardianEmail', { 
                    required: 'Guardian email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  placeholder="parent@example.com"
                />
                {errors.guardianEmail && (
                  <p className="text-sm text-destructive">{errors.guardianEmail.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="guardianPhone">Parent/Guardian Phone</Label>
                <Input
                  id="guardianPhone"
                  {...register('guardianPhone', { required: 'Guardian phone is required' })}
                  placeholder="(555) 123-4567"
                />
                {errors.guardianPhone && (
                  <p className="text-sm text-destructive">{errors.guardianPhone.message}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset({
                  firstName: '',
                  middleName: '',
                  lastName: '',
                  dob: '',
                  placeOfBirth: '',
                  gender: '',
                  grade: '',
                  department: '',
                  classSection: '',
                  lastSchoolAttended: '',
                  guardianName: '',
                  guardianEmail: '',
                  guardianPhone: '',
                  guardianOccupation: ''
                });
                setCapturedImage(null);
                setExistingPhotoUrl(null);
                setTranscriptFile(null);
                setReportCardFile(null);
                setExistingTranscript(null);
                setExistingReportCard(null);
                setShowWebcam(false);
                onOpenChange(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}