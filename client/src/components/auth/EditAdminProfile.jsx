import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, User, Building2, Phone, CreditCard, Users, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { createOrUpdateAdminProfile } from '../../actions/adminAction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { loadUser } from '@/actions/authAction';

const EditAdminProfileModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();

  const { loading, error, profile } = useSelector((state) => state.admin);
  
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  const form = useForm({
    defaultValues: {
      fullName: '',
      phone: '',
      staffId: '',
      department: '',
      position: '',
      gender: '',
      status: 'Active'
    }
  });

  // Pre-fill form when profile data is available
  useEffect(() => {
    if (profile && isOpen) {
      form.reset({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        staffId: profile.staffId || '',
        department: profile.department || '',
        position: profile.position || '',
        gender: profile.gender || '',
        status: profile.status || 'Active'
      });

      // Set existing photo preview if available
      if (profile.photo) {
        const photoUrl = profile.photo;
        setPhotoPreview(photoUrl);
      } else {
        setPhotoPreview(null);
      }
    }
  }, [profile, isOpen, form]);

  const departments = [
    'Administration',
    'Academic Affairs',
    'Finance',
    'Human Resources',
    'IT Department',
    'Student Affairs',
    'Facilities Management',
    'Library Services'
  ];

  const positions = [
    'Principal',
    'Vice Principal',
    'Dean',
    'Head of Department',
    'Academic Coordinator',
    'Administrator',
    'Supervisor',
    'Manager'
  ];

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      
      // Append form fields
      Object.keys(data).forEach(key => {
        if (data[key]) {
          formData.append(key, data[key]);
        }
      });

      // Append photo if a new one is selected
      if (fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files[0]) {
        formData.append('photo', fileInputRef.current.files[0]);
      }

      const result = await dispatch(createOrUpdateAdminProfile(formData));

      if (!result.success) {
        toast.error(`${result.message || 'Failed to update profile'}`);
        return;
      }
      
      toast.success("Profile updated successfully");
      await dispatch(loadUser());
      
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleClose = () => {
    form.reset();
    setPhotoPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Edit Profile</h2>
            <p className="text-muted-foreground">Update your admin profile information</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="rounded-full hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <Form {...form}>
            <div onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Photo upload */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group hover:scale-105 transition">
                  <div className="w-32 h-32 rounded-full border-4 border-primary/30 bg-muted overflow-hidden flex items-center justify-center shadow-inner">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0 bg-primary text-white shadow-button hover:bg-primary/80"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Click to update photo. Max 5MB. JPG/PNG.
                </p>
              </div>

              {/* Form grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  rules={{ required: "Full name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-foreground">
                        <User className="h-4 w-4 text-primary" /> Full Name *
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter full name"
                          className="h-11 rounded-lg bg-background border border-border shadow-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/30 transition"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  rules={{
                    required: "Phone is required",
                    pattern: {
                      value: /^[+]?[\d\s-()]+$/,
                      message: "Invalid phone number"
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-foreground">
                        <Phone className="h-4 w-4 text-primary" /> Phone *
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="+231 77 000 0000"
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="staffId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-foreground">
                        <CreditCard className="h-4 w-4 text-primary" /> Staff ID
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="VMHS-234"
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  rules={{ required: "Department is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-foreground">
                        <Building2 className="h-4 w-4 text-primary" /> Department *
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  rules={{ required: "Position is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-foreground">
                        <Users className="h-4 w-4 text-primary" /> Position *
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {positions.map(pos => (
                            <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-foreground">
                        Gender
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-8"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={form.handleSubmit(onSubmit)}
                  className="px-8 bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-b-2 border-white rounded-full" />
                      Updating...
                    </>
                  ) : (
                    "Update Profile"
                  )}
                </Button>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default EditAdminProfileModal;