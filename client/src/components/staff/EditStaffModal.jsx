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
import { Camera, RotateCcw, Check, X, Loader2 } from 'lucide-react'; // Added Loader2 here

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
    }
  });
  
  const webcamRef = useRef(null);
  
  // Webcam states
  const [showWebcam, setShowWebcam] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null);

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
      
      // Add captured photo if available
      if (capturedImage) {
        const photoFile = base64ToFile(capturedImage, `staff_${Date.now()}.jpg`);
        if (photoFile) {
          formData.append('photo', photoFile);
        }
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
      
    } catch (err) {
      console.error('Error saving staff:', err);
      toast.error(error || 'Failed to update staff. Please try again.');
    }
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
                      alt="Staff"
                      className="w-32 h-32 object-cover rounded-lg border"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          (staffData?.firstName || '') + '+' + (staffData?.lastName || 'Staff')
                        )}&background=random&color=fff&size=128&rounded=true`;
                      }}
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