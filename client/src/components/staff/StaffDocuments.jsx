import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Eye, 
  Printer, 
  User, 
  Award,
  Loader2,
  AlertCircle,

} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'react-hot-toast';
import { getStaffDocuments, clearStaffDocuments, getStaffById } from '../../actions/staffAction';

const StaffDocuments = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const { 
    documents, 
    documentsLoading, 
    documentsError,
    singleStaff,
    loading: staffLoading 
  } = useSelector(state => state.staff);

  const [selectedImage, setSelectedImage] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [downloadingIndex, setDownloadingIndex] = useState(null);

  useEffect(() => {
    if (id) {
      dispatch(getStaffById(id));
      dispatch(getStaffDocuments(id));
    }

    return () => {
      dispatch(clearStaffDocuments());
    };
  }, [dispatch, id]);

  const handleImageView = (imageUrl, title) => {
    setSelectedImage({ url: imageUrl, title });
    setImageDialogOpen(true);
  };

  const handleDownload = async (url, filename, index = null) => {
    try {
      if (index !== null) setDownloadingIndex(index);
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/staff/download-document?url=${encodeURIComponent(url)}`, {
        headers: {
          'x-auth-token': token
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to download file');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success(`${filename} downloaded successfully`);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(`Failed to download ${filename}`);
    } finally {
      setDownloadingIndex(null);
    }
  };

  const handlePrint = (imageUrl) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Document</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh; 
            }
            img { 
              max-width: 100%; 
              max-height: 100vh; 
              object-fit: contain; 
            }
            @media print {
              body { padding: 0; }
              img { max-height: 100%; }
            }
          </style>
        </head>
        <body>
          <img src="${imageUrl}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
  };

  const getFileExtension = (url) => {
    return url.split('.').pop().toLowerCase();
  };

  const isImageFile = (url) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    return imageExtensions.includes(getFileExtension(url));
  };

  if (staffLoading || documentsLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading staff documents...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (documentsError) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{documentsError}</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  const staffName = singleStaff ? `${singleStaff.firstName} ${singleStaff.lastName} ${singleStaff?.middleName || ''}` : 'Staff Member';

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8 max-w-7xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <FileText className="h-8 w-8 text-primary mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Staff Documents</h1>
              <p className="text-muted-foreground">{staffName} - Staff ID: {singleStaff?.staffId}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Staff Photo Section */}
          {documents?.photo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Staff Photo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="relative group">
                    <img
                      src={documents.photo}
                      alt="Staff Photo"
                      className="w-32 h-32 object-cover rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleImageView(documents.photo, 'Staff Photo')}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center">
                      <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleImageView(documents.photo, 'Staff Photo')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(documents.photo, `${staffName}_Photo.${getFileExtension(documents.photo)}`)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrint(documents.photo)}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certificates Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Certificates ({documents?.certificates?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!documents?.certificates || documents.certificates.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No certificates uploaded for this staff member.</AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.certificates.map((certUrl, index) => (
                    <Card key={index} className="border border-border">
                      <CardContent className="p-4">
                        <div className="flex flex-col items-center space-y-3">
                          <div className="relative group w-full h-32">
                            {isImageFile(certUrl) ? (
                              <>
                                <img
                                  src={certUrl}
                                  alt={`Certificate ${index + 1}`}
                                  className="w-full h-full object-cover rounded cursor-pointer hover:shadow-md transition-shadow"
                                  onClick={() => handleImageView(certUrl, `Certificate ${index + 1}`)}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded transition-all flex items-center justify-center">
                                  <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          
                          <div className="text-center">
                            <p className="font-medium text-sm">Certificate {index + 1}</p>
                            <p className="text-xs text-muted-foreground">
                              .{getFileExtension(certUrl).toUpperCase()} file
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-1 justify-center">
                            {isImageFile(certUrl) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleImageView(certUrl, `Certificate ${index + 1}`)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(
                                certUrl, 
                                `${staffName}_Certificate_${index + 1}.${getFileExtension(certUrl)}`,
                                index
                              )}
                              disabled={downloadingIndex === index}
                            >
                              {downloadingIndex === index ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Download className="h-3 w-3 mr-1" />
                              )}
                              {downloadingIndex === index ? 'Downloading...' : 'Download'}
                            </Button>
                            {isImageFile(certUrl) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePrint(certUrl)}
                              >
                                <Printer className="h-3 w-3 mr-1" />
                                Print
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Image Preview Dialog */}
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>{selectedImage?.title}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center items-center max-h-[70vh] overflow-hidden">
              {selectedImage && (
                <img
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => handleDownload(
                  selectedImage?.url, 
                  `${staffName}_${selectedImage?.title.replace(/\s+/g, '_')}.${getFileExtension(selectedImage?.url)}`
                )}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                onClick={() => handlePrint(selectedImage?.url)}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
};

export default StaffDocuments;