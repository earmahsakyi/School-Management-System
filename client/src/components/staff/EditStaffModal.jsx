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
import { updateStaff } from '@/actions/staffAction';
import { Camera, RotateCcw, Check, X, Loader2, Upload } from 'lucide-react'; // Added Loader2 here

export function EditStaffModal({ 
  open, 
  onOpenChange, 
  staffData = null, 
  isEditing = false 
}) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.staff);
  
  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue, 
    formState: { errors }, 
    watch 
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      dob: '',
      gender: '',
      position: '',
      department: '',
      qualifications: '',
      email: '',
      phone: '',
      currentAddress:'',
      nationality: '',
      nationalID: '',
      maritalStatus: '',
      institutionAttended: {
        name: '',
        startYear: '',
        endYear: ''
      },
      ssn: '',
      payrollNumber: '',
      yearOfEmployment: '',
    }
  });
  
  const webcamRef = useRef(null);
  
  // Webcam states
  const [showWebcam, setShowWebcam] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null);
  const [uploadedPhotoFile, setUploadedPhotoFile] = useState(null);
  const [uploadedPhotoPreview, setUploadedPhotoPreview] = useState(null);

  // Utility function to get staff avatar
  const getStaffAvatar = (staff) => {
    const API_BASE_URL = 'http://localhost:5000';
    
    if (staff?.photo) {
      const photoFileName = staff.photo.includes('/') ? staff.photo.split('/').pop() : staff.photo;
      return `${API_BASE_URL}/uploads/staff/${photoFileName}`;
    }
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      (staff?.firstName || '') + ' ' + (staff?.lastName || 'Staff')
    )}&background=random&color=fff&size=128&rounded=true`;
  };

  // Watch form values with default empty strings
  const watchedGender = watch('gender') || '';
  const watchedPosition = watch('position') || '';
  const watchedDepartment = watch('department') || '';
  const watchedMaritalStatus = watch('maritalStatus') || '';

  // Effect to populate form when editing
  useEffect(() => {
    if (isEditing && staffData && open) {
      // Set form values for staff data
      setValue('firstName', staffData.firstName || '');
      setValue('lastName', staffData.lastName || '');
      setValue('dob', staffData.dob ? staffData.dob.split('T')[0] : '');
      setValue('gender', staffData.gender || '');
      setValue('position', staffData.position || '');
      setValue('department', staffData.department || '');
      setValue('qualifications', staffData.qualifications || '');
      setValue('email', staffData.email || '');
      setValue('phone', staffData.phone || '');
      setValue('maritalStatus',staffData.maritalStatus || '');
      setValue('nationality', staffData.nationality || '');
      setValue('currentAddress', staffData.currentAddress || '');
      setValue('nationalID', staffData.nationalID || '');
      setValue('name', staffData.institutionAttended.name || '');
      setValue('startYear', staffData.institutionAttended.startYear || '');
      setValue('endYear', staffData.institutionAttended.endYear || '');
      setValue('ssn', staffData.ssn || '');
      setValue('payrollNumber', staffData.payrollNumber || '');
      setValue('yearOfEmployment', staffData.yearOfEmployment || '');
      
      // Set existing photo
      if (staffData.photo) {
        setExistingPhotoUrl(getStaffAvatar(staffData));
      }
    }
  }, [isEditing, staffData, open, setValue]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset({
        firstName: '',
        lastName: '',
        dob: '',
        gender: '',
        position: '',
        department: '',
        qualifications: '',
        phone: '',
        email: '',
        currentAddress:'',
        nationality: '',
        nationalID: '',
        maritalStatus: '',
        institutionAttended: {
        name: '',
        startYear: '',
        endYear: ''
      },
      ssn: '',
      yearOfEmployment: '',
      payrollNumber: '',
      });
      setCapturedImage(null);
      setExistingPhotoUrl(null);
      setShowWebcam(false);
    }
  }, [open, reset]);

  // Convert base64 to File object
  const base64ToFile = (base64String, filename) => {
    try {
      const arr = base64String.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
    } catch (err) {
      console.error('Error converting base64 to file:', err);
      return null;
    }
  };

  // Capture photo from webcam
  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        setShowWebcam(false);
      }
    }
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
      formData.append('firstName', data.firstName || '');
      formData.append('lastName', data.lastName || '');
      formData.append('dob', data.dob || '');
      formData.append('gender', data.gender || '');
      formData.append('position', data.position || '');
      formData.append('department', data.department || '');
      formData.append('qualifications', data.qualifications || '');
      formData.append('email', data.email || '');
      formData.append('phone', data.phone || '');
      formData.append('currentAddress', data.currentAddress || '');
      formData.append('nationality', data.nationality || '');
      formData.append('maritalStatus', data.maritalStatus || '');
      formData.append('nationalID', data.nationalID || '');
      formData.append('ssn', data.ssn || '');
      formData.append('yearOfEmployment', data.yearOfEmployment || '');
      formData.append('payrollNumber', data.payrollNumber || '');

      if(data.name) formData.append('name',data.name)
      if (data.startYear) formData.append('startYear', data.startYear);
      if (data.endYear) formData.append('endYear', data.endYear);
      
      // Add captured photo if available
      if (capturedImage) {
        const photoFile = base64ToFile(capturedImage, `staff_${Date.now()}.jpg`);
        if (photoFile) {
          formData.append('photo', photoFile);
        }
      } else if (uploadedPhotoFile) {
      formData.append('photo', uploadedPhotoFile);
      }

      // If editing and existing photo was removed, indicate photo should be removed
      if (isEditing && existingPhotoUrl === null && !capturedImage && staffData?.photo) {
        formData.append('removePhoto', 'true');
      }

      // Dispatch the appropriate action
      if (isEditing && staffData?._id) {
        await dispatch(updateStaff(staffData._id, formData));
        toast.success(`${data.firstName} ${data.lastName} has been updated successfully!`);
      }
      
      // Reset form and close modal
      reset();
      setCapturedImage(null);
      setExistingPhotoUrl(null);
      onOpenChange(false);
      setUploadedPhotoFile(null);
      setUploadedPhotoPreview(null);
      
    } catch (err) {
      console.error('Error saving staff:', err);
      toast.error(error || 'Failed to update staff. Please try again.');
    }
  };
  

  const handlePhotoUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, etc.)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should not exceed 5MB');
      return;
    }
    
    setUploadedPhotoFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedPhotoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
    
    // Clear webcam captured image if exists
    setCapturedImage(null);
    // For EditStudentModal, also clear existing photo URL
    if (typeof setExistingPhotoUrl !== 'undefined') {
      setExistingPhotoUrl(null);
    }
  }
};

// Remove uploaded photo
const removeUploadedPhoto = () => {
  setUploadedPhotoFile(null);
  setUploadedPhotoPreview(null);
};

  // Get current photo to display
  const getCurrentPhoto = () => {
  if (capturedImage) return capturedImage;
  if (uploadedPhotoPreview) return uploadedPhotoPreview;
  if (existingPhotoUrl) return existingPhotoUrl;
  return null;
};


  const departments = ['Arts', 'Science', 'Administration', 'Other'];
  const positions = [
    "Teacher",
    "Head of Department",
    "Subject Coordinator",
    "Principal",
    "Vice Principal",
    "Registrar",
    "Accountant",
    "Clerk",
    "Librarian",
    "IT Support",
    "Store Keeper",
    "Security Guard",
    "Janitor"
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
          <DialogTitle>
            {isEditing ? 'Edit Staff' : 'Add New Staff'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the staff details below.' 
              : 'Fill in the staff details to register them in the system.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Photo Section */}
          <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                        Staff Photo
                      </h3>
                      
                      <div className="flex flex-col items-center space-y-4">
                        {!showWebcam && !getCurrentPhoto() && (
                          <div className="flex flex-col items-center space-y-2">
                            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                              <Camera className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowWebcam(true)}
                                className="flex items-center gap-2"
                              >
                                <Camera className="h-4 w-4" />
                                Take Photo
                              </Button>
                              <div className="relative">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="flex items-center gap-2"
                                  onClick={() => document.getElementById('photo-upload').click()}
                                >
                                  <Upload className="h-4 w-4" />
                                  Upload Photo
                                </Button>
                                <input
                                  id="photo-upload"
                                  type="file"
                                  accept="image/*"
                                  onChange={handlePhotoUpload}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                              </div>
                            </div>
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
                              {(capturedImage || uploadedPhotoPreview) && (
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
                                Take New Photo
                              </Button>
                              
                              <div className="relative">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-2"
                                  onClick={() => document.getElementById('photo-upload').click()}
                                >
                                  <Upload className="h-4 w-4" />
                                  Upload New Photo
                                </Button>
                                <input
                                  id="photo-upload"
                                  type="file"
                                  accept="image/*"
                                  onChange={handlePhotoUpload}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                              </div>
                              
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
                                  removeUploadedPhoto();
                                  // For EditStudentModal only
                                  if (typeof removeExistingPhoto !== 'undefined') {
                                    removeExistingPhoto();
                                  }
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

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">
              Personal Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name*</Label>
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
                <Label htmlFor="lastName">Last Name*</Label>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth*</Label>
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
                <Label htmlFor="gender">Gender*</Label>
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
                  <p className="text-sm text-destructive">Gender is required</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="nationalID">National ID</Label>
                <Input
                  id="nationalID"
                  {...register('nationalID', {required: 'National ID is required'})}
                  placeholder="Enter national ID number"
                />
                {errors.nationalID && (
                  <p className="text-sm text-destructive">{errors.nationalID.message}</p>
                )}
              </div>
          </div>
          
          <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                {...register('nationality', { required : 'Nationality is required'})}
                placeholder="Enter nationality here"
              />
              {errors.nationality && (
                  <p className="text-sm text-destructive">{errors.nationality.message}</p>
                )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentAddress">Current Address</Label>
              <Input
                id="currentAddress"
                {...register('currentAddress', { required: 'Current Address is required' })}
                placeholder="Enter current residential address"
              />
              {errors.currentAddress && (
                  <p className="text-sm text-destructive">{errors.currentAddress.message}</p>
                )}
            </div>
             <div className="space-y-2">
                <Label htmlFor="maritalStatus">Marital Status *</Label>
                <Select
                  value={watchedMaritalStatus} 
                  onValueChange={(value) => setValue('maritalStatus', value, { shouldValidate: true })}
                  {...register('maritalStatus', { required: 'Marital Status is required' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Marital Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Divorced">Divorced</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.maritalStatus && (
                  <p className="text-sm text-destructive">{errors.maritalStatus.message}</p>
                )}
              </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">
              Professional Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position*</Label>
                <Select 
                  value={watchedPosition} 
                  onValueChange={(value) => setValue('position', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.position && (
                  <p className="text-sm text-destructive">Position is required</p>
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
                    {departments.map((department) => (
                      <SelectItem key={department} value={department}>
                        {department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qualifications">Qualifications</Label>
              <Input
                id="qualifications"
                {...register('qualifications')}
                placeholder="Enter qualifications (e.g., B.Ed, M.A Mathematics)"
              />
            </div>
            <div className="space-y-2">
                            <Label htmlFor="ssn">Social Security Number(SSN)</Label>
                            <Input
                              id="ssn"
                              type="number"
                              {...register('ssn',{ required: 'Social Security Number is required '})}
                              placeholder="e.g. 401500"
                            />
                            {errors.ssn && (
                               <p className="text-sm text-destructive">{errors.ssn.message}</p>
                            )}
                          </div>
            
                          <div className="space-y-2">
                            <Label htmlFor="payrollNumber">Payroll Number</Label>
                            <Input
                              id="payrollNumber"
                              type="number"
                              {...register('payrollNumber', {required: 'Payroll Number is required'})}
                              placeholder="e.g. 401500"
                            />
                            {errors.payrollNumber && (
                               <p className="text-sm text-destructive">{errors.payrollNumber.message}</p>
                            )}
                          </div>
            
                          <div className="space-y-2">
                            <Label htmlFor="yearOfEmployment">Year of Employment</Label>
                            <Input
                              id="yearOfEmployment"
                              type="number"
                              {...register('yearOfEmployment', {required: 'Year Of Employment is required'})}
                              placeholder="e.g. 2019"
                            />
                            {errors.yearOfEmployment && (
                               <p className="text-sm text-destructive">{errors.yearOfEmployment.message}</p>
                            )}
                          </div>

             <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">
              Educational Background
            </h3>
            <div className="space-y-2">
                <Label htmlFor="name">Institution Name</Label>
                <Input
                  id="name"
                  type="text"
                  {...register('name')}
                  placeholder="e.g. University of Liberia"
                />
              </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startYear">Institution Start Year</Label>
                <Input
                  id="startYear"
                  type="number"
                  min="1950"
                  max={new Date().getFullYear()}
                  {...register('startYear')}
                  placeholder="e.g. 2015"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endYear">Institution End Year</Label>
                <Input
                  id="endYear"
                  type="number"
                  min="1950"
                  max={new Date().getFullYear() + 10}
                  {...register('endYear')}
                  placeholder="e.g. 2019"
                />
              </div>
            </div>
          </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">
              Contact Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email*</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  placeholder="staff@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone*</Label>
                <Input
                  id="phone"
                  {...register('phone', { 
                    required: 'Phone number is required',
                    pattern: {
                      value: /^[0-9]{10,15}$/,
                      message: 'Invalid phone number'
                    }
                  })}
                  placeholder="1234567890"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Staff' : 'Add Staff'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}