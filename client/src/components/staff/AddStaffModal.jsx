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
import { createStaff, getAllStaff } from '@/actions/staffAction';
import { Camera, RotateCcw, Check, X, FileText, Trash2, Upload, Plus } from 'lucide-react';

export function AddStaffModal({ open, onOpenChange }) {
  const dispatch = useDispatch();
  const { loading, error, message } = useSelector(state => state.staff);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  const webcamRef = useRef(null);
  
  const [showWebcam, setShowWebcam] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [uploadedPhotoFile, setUploadedPhotoFile] = useState(null);
  const [uploadedPhotoPreview, setUploadedPhotoPreview] = useState(null);
  const [certificateFiles, setCertificateFiles] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [institutions, setInstitutions] = useState([{ name: '', qualification: '', startYear: '', endYear: '' }]);

  useEffect(() => {
    if (!open) {
      reset();
      setCapturedImage(null);
      setCertificateFiles([]);
      setShowWebcam(false);
      setIsCreating(false);
      setUploadedPhotoFile(null);
      setUploadedPhotoPreview(null);
      setInstitutions([{ name: '', qualification: '', startYear: '', endYear: '' }]);
    }
  }, [open, reset]);

  useEffect(() => {
    if (message && isCreating) {
      toast.success(message);
      setIsCreating(false);
      dispatch(getAllStaff());
      setTimeout(() => {
        onOpenChange(false);
      }, 500);
    }
  }, [message, isCreating, dispatch, onOpenChange]);

  useEffect(() => {
    if (error && isCreating) {
      toast.error(error);
      setIsCreating(false);
    }
  }, [error, isCreating]);

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

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file (JPG, PNG, etc.)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should not exceed 5MB');
        return;
      }
      setUploadedPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      setCapturedImage(null);
    }
  };

  const removeUploadedPhoto = () => {
    setUploadedPhotoFile(null);
    setUploadedPhotoPreview(null);
  };

  const handleCertificateFiles = (event) => {
    const files = Array.from(event.target.files);
    const invalidFiles = files.filter(file => file.type !== 'application/pdf');
    if (invalidFiles.length > 0) {
      toast.error('Please select only PDF files for certificates');
      return;
    }
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('Each certificate file should not exceed 5MB');
      return;
    }
    setCertificateFiles(prev => [...prev, ...files]);
  };

  const removeCertificateFile = (index) => {
    setCertificateFiles(prev => prev.filter((_, i) => i !== index));
  };

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setShowWebcam(false);
  }, [webcamRef]);

  const retakePhoto = () => {
    setCapturedImage(null);
    setShowWebcam(true);
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const closeWebcam = () => {
    setShowWebcam(false);
    setCapturedImage(null);
  };

  const addInstitution = () => {
    setInstitutions([...institutions, { name: '', qualification: '', startYear: '', endYear: '' }]);
  };

  const updateInstitution = (index, field, value) => {
    const newInstitutions = [...institutions];
    newInstitutions[index][field] = value;
    setInstitutions(newInstitutions);
  };

  const removeInstitution = (index) => {
    setInstitutions(institutions.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    try {
      setIsCreating(true);
      const formData = new FormData();
      
      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);
      formData.append('middleName', data.middleName || '');
      formData.append('dob', data.dob);
      formData.append('placeOfBirth', data.placeOfBirth);
      formData.append('gender', data.gender);
      formData.append('phone', data.phone);
      formData.append('department', data.department);
      formData.append('position', data.position);
      formData.append('qualifications', data.qualifications || '');
      formData.append('email', data.email);
      formData.append('currentAddress', data.currentAddress || '');
      formData.append('nationalID', data.nationalID || '');
      formData.append('nationality', data.nationality || '');
      formData.append('maritalStatus', data.maritalStatus || '');
      formData.append('ssn', data.ssn);
      formData.append('payrollNumber', data.payrollNumber);
      formData.append('yearOfEmployment', data.yearOfEmployment);
      formData.append('institutionAttended', JSON.stringify(institutions.filter(inst => inst.name || inst.qualification || inst.startYear || inst.endYear)));

      if (capturedImage) {
        const photoFile = base64ToFile(capturedImage, `staff_${Date.now()}.jpg`);
        formData.append('photo', photoFile);
      } else if (uploadedPhotoFile) {
        formData.append('photo', uploadedPhotoFile);
      }

      certificateFiles.forEach((file, index) => {
        formData.append('certificates', file);
      });

      if (!data.gender || !data.department || !data.position) {
        toast.error('Please fill all required fields');
        setIsCreating(false);
        return;
      }

      await dispatch(createStaff(formData));
    } catch (err) {
      console.error('Error creating staff:', err);
      toast.error('Failed to create staff. Please try again.');
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    reset();
    setCapturedImage(null);
    setCertificateFiles([]);
    setShowWebcam(false);
    setIsCreating(false);
    setUploadedPhotoFile(null);
    setUploadedPhotoPreview(null);
    setInstitutions([{ name: '', qualification: '', startYear: '', endYear: '' }]);
    onOpenChange(false);
  };

  const getCurrentDisplayPhoto = () => {
    if (capturedImage) return capturedImage;
    if (uploadedPhotoPreview) return uploadedPhotoPreview;
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Staff</DialogTitle>
          <DialogDescription>
            Fill in the staff details to register them in the system.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">
              Staff Photo
            </h3>
            <div className="flex flex-col items-center space-y-4">
              {!showWebcam && !getCurrentDisplayPhoto() && (
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

              {getCurrentDisplayPhoto() && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <img
                      src={getCurrentDisplayPhoto()}
                      alt="Staff photo"
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

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">
              Certificates (Optional)
            </h3>
            <div className="space-y-2">
              <Label htmlFor="certificates">Upload Certificates (PDF)</Label>
              <Input
                id="certificates"
                type="file"
                accept=".pdf"
                multiple
                onChange={handleCertificateFiles}
                className="file:mr-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {certificateFiles.length > 0 && (
                <div className="space-y-2 mt-2">
                  {certificateFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-800 truncate">
                          {file.name}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCertificateFile(index)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              * PDF files only, maximum 5MB each
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
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
                <Label htmlFor="lastName">Last Name *</Label>
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
                <Label htmlFor="dob">Date of Birth *</Label>
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
                <Label htmlFor="placeOfBirth">Place of Birth *</Label>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select 
                  onValueChange={(value) => setValue('gender', value, { shouldValidate: true })}
                  {...register('gender', { required: 'Gender is required' })}
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
              <div className="space-y-2">
                <Label htmlFor="nationalID">National ID</Label>
                <Input
                  id="nationalID"
                  {...register('nationalID', { required: 'National ID is required' })}
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
                {...register('nationality', { required: 'Nationality is required' })}
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
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">
              Professional Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select 
                  onValueChange={(value) => setValue('department', value, { shouldValidate: true })}
                  {...register('department', { required: 'Department is required' })}
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
                {errors.department && (
                  <p className="text-sm text-destructive">{errors.department.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Select 
                  onValueChange={(value) => setValue('position', value, { shouldValidate: true })}
                  {...register('position', { required: 'Position is required' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {pos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.position && (
                  <p className="text-sm text-destructive">{errors.position.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qualifications">Other Qualifications (Optional)</Label>
              <Input
                id="qualifications"
                {...register('qualifications')}
                placeholder="e.g. Additional Cert 1, Additional Cert 2 (comma-separated)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ssn">Social Security Number(SSN)</Label>
              <Input
                id="ssn"
                type="number"
                {...register('ssn', { required: 'Social Security Number is required' })}
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
                {...register('payrollNumber', { required: 'Payroll Number is required' })}
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
                {...register('yearOfEmployment', { required: 'Year Of Employment is required' })}
                placeholder="e.g. 2019"
              />
              {errors.yearOfEmployment && (
                <p className="text-sm text-destructive">{errors.yearOfEmployment.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                Educational Background
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addInstitution}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Institution
              </Button>
            </div>
            {institutions.map((inst, index) => (
              <div key={index} className="border p-4 rounded-lg space-y-2 relative">
                {institutions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeInstitution(index)}
                    className="absolute top-2 right-2 h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
                <div className="space-y-2">
                  <Label htmlFor={`name-${index}`}>Institution Name</Label>
                  <Input
                    id={`name-${index}`}
                    value={inst.name}
                    onChange={(e) => updateInstitution(index, 'name', e.target.value)}
                    placeholder="e.g. University of Liberia"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`qualification-${index}`}>Qualification</Label>
                  <Input
                    id={`qualification-${index}`}
                    value={inst.qualification}
                    onChange={(e) => updateInstitution(index, 'qualification', e.target.value)}
                    placeholder="e.g. B.Sc Computer Science"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`startYear-${index}`}>Start Year</Label>
                    <Input
                      id={`startYear-${index}`}
                      type="number"
                      min="1950"
                      max={new Date().getFullYear()}
                      value={inst.startYear}
                      onChange={(e) => updateInstitution(index, 'startYear', e.target.value)}
                      placeholder="e.g. 2015"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`endYear-${index}`}>End Year</Label>
                    <Input
                      id={`endYear-${index}`}
                      type="number"
                      min="1950"
                      max={new Date().getFullYear() + 10}
                      value={inst.endYear}
                      onChange={(e) => updateInstitution(index, 'endYear', e.target.value)}
                      placeholder="e.g. 2019"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">
              Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  {...register('phone', { required: 'Phone is required' })}
                  placeholder="(555) 123-4567"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
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
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading || isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || isCreating}>
              {loading || isCreating ? 'Creating...' : 'Add Staff'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}