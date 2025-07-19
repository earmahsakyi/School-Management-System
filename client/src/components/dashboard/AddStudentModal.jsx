import { useForm } from 'react-hook-form';
import { useState, useRef, useCallback } from 'react';
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
import { createStudentAndParent } from '@/actions/studentAction';
import { Camera, RotateCcw, Check, X, Upload, FileText, Trash2 } from 'lucide-react';

export function AddStudentModal({ open, onOpenChange }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.student);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  const webcamRef = useRef(null);
  
  // Webcam states
  const [showWebcam, setShowWebcam] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  
  // Document upload states
  const [transcriptFile, setTranscriptFile] = useState(null);
  const [reportCardFile, setReportCardFile] = useState(null);

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
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should not exceed 10MB');
        return;
      }
      
      if (fileType === 'transcript') {
        setTranscriptFile(file);
      } else if (fileType === 'reportCard') {
        setReportCardFile(file);
      }
    }
  };

  // Remove selected file
  const removeFile = (fileType) => {
    if (fileType === 'transcript') {
      setTranscriptFile(null);
    } else if (fileType === 'reportCard') {
      setReportCardFile(null);
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

  const onSubmit = async (data) => {
    try {
      // Create FormData for multipart/form-data
      const formData = new FormData();
      
      // Map form fields to match your API expectations
      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);
      formData.append('middleName', data.middleName || '');
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
      }

      // Add report card file if selected
      if (reportCardFile) {
        formData.append('reportCard', reportCardFile);
      }

      // Dispatch the action
      await dispatch(createStudentAndParent(formData));
      
      toast.success(`${data.firstName} ${data.lastName} has been registered successfully!`);
      
      // Reset form and close modal
      reset();
      setCapturedImage(null);
      setTranscriptFile(null);
      setReportCardFile(null);
      onOpenChange(false);
      
    } catch (err) {
      console.error('Error creating student:', err);
      toast.error(error || 'Failed to create student. Please try again.');
    }
  };

  const grades = [
    '7','8','9','10','11','12'
  ];

  const videoConstraints = {
    width: 320,
    height: 240,
    facingMode: facingMode
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Fill in the student details to register them in the system.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Photo Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">
              Student Photo
            </h3>
            
            <div className="flex flex-col items-center space-y-4">
              {!showWebcam && !capturedImage && (
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

              {capturedImage && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <img
                      src={capturedImage}
                      alt="Captured student"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
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
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">
              Documents (Optional)
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Transcript Upload */}
              <div className="space-y-2">
                <Label htmlFor="transcript">Transcript (PDF)</Label>
                {!transcriptFile ? (
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
                        {transcriptFile.name}
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
                {!reportCardFile ? (
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
                        {reportCardFile.name}
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
              * PDF files only, maximum 5MB each
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
              <Select onValueChange={(value) => setValue('gender', value)} {...register('gender', { required: 'Gender is required' })}>
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
                <Select onValueChange={(value) => setValue('grade', value)} {...register('grade', { required: 'Grade level is required' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
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
                <Select onValueChange={(value) => setValue('department', value)}{...register('department', { required: 'Department  is required' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arts">Arts</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="JHS">JHS</SelectItem>
                  </SelectContent>
                </Select>
                {errors.department && (
                <p className="text-sm text-destructive">{errors.department.message}</p>
              )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastSchoolAttended">Last School Attended</Label>
              <Input
                id="lastSchoolAttended"
                {...register('lastSchoolAttended',{ required: 'Guardian name is required' })}
                placeholder="Bridge Int. Sch"
              />
              {errors.lastSchoolAttended && (
                <p className="text-sm text-destructive">{errors.lastSchoolAttended.message}</p>
              )}
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
              <Label htmlFor="occupation">Parent/Guardian Occupation</Label>
              <Input
                id="occupation"
                {...register('occupation', { required: 'Guardian name is required' })}
                placeholder="Enter parent/guardian occupation"
              />
              {errors.occupation && (
                <p className="text-sm text-destructive">{errors.occupation.message}</p>
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
                reset();
                setCapturedImage(null);
                setTranscriptFile(null);
                setReportCardFile(null);
                setShowWebcam(false);
                onOpenChange(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Add Student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}