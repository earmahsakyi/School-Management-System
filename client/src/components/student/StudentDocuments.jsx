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
  GraduationCap,
  BookOpen,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'react-hot-toast';
import { getStudentDocuments, clearStudentDocuments, getStudentById } from '../../actions/studentAction';

const StudentDocuments = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const { 
    documents, 
    documentsLoading, 
    documentsError,
    student,
    loading: studentLoading 
  } = useSelector(state => state.student);

  const { token } = useSelector(state => state.auth);

  const [selectedImage, setSelectedImage] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [downloadingType, setDownloadingType] = useState(null);

  useEffect(() => {
    if (id) {
      dispatch(getStudentById(id));
      dispatch(getStudentDocuments(id));
    }

    return () => {
      dispatch(clearStudentDocuments());
    };
  }, [dispatch, id]);

  const handleImageView = (imageUrl, title) => {
    setSelectedImage({ url: imageUrl, title });
    setImageDialogOpen(true);
  };

  const handleDownload = async (url, filename, type = null) => {
    try {
      if (type) setDownloadingType(type);
      
      const response = await fetch(`/api/student/download-document?url=${encodeURIComponent(url)}`, {
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
      setDownloadingType(null);
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

  const DocumentCard = ({ title, icon: Icon, documentUrl, filename, downloadType }) => {
    if (!documentUrl) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icon className="h-5 w-5 mr-2" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No {title.toLowerCase()} uploaded for this student.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon className="h-5 w-5 mr-2" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="relative group">
              {isImageFile(documentUrl) ? (
                <>
                  <img
                    src={documentUrl}
                    alt={title}
                    className="w-32 h-32 object-cover rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleImageView(documentUrl, title)}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center">
                    <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </>
              ) : (
                <div className="w-32 h-32 bg-muted rounded-lg border shadow-sm flex items-center justify-center">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {isImageFile(documentUrl) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleImageView(documentUrl, title)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(documentUrl, filename, downloadType)}
                disabled={downloadingType === downloadType}
              >
                {downloadingType === downloadType ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </>
                )}
              </Button>
              {isImageFile(documentUrl) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrint(documentUrl)}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              )}
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-muted-foreground">
              File type: .{getFileExtension(documentUrl).toUpperCase()}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (studentLoading || documentsLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading student documents...</span>
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

  const studentName = student ? `${student.firstName} ${student.lastName} ${student.middleName || ''}`.trim() : 'Student';

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
              <h1 className="text-3xl font-bold text-foreground">Student Documents</h1>
              <p className="text-muted-foreground">
                {studentName} - Admission No: {student?.admissionNumber}
              </p>
              {student && (
                <p className="text-sm text-muted-foreground">
                  Grade {student.gradeLevel} | {student.gender} | {student.department || 'N/A'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Student Photo Section */}
          <DocumentCard
            title="Student Photo"
            icon={User}
            documentUrl={documents?.photo}
            filename={`${studentName}_Photo.${documents?.photo ? getFileExtension(documents.photo) : 'jpg'}`}
            downloadType="photo"
          />

          {/* Transcript Section */}
          <DocumentCard
            title="Academic Transcript"
            icon={GraduationCap}
            documentUrl={documents?.transcript}
            filename={`${studentName}_Transcript.${documents?.transcript ? getFileExtension(documents.transcript) : 'pdf'}`}
            downloadType="transcript"
          />

          {/* Report Card Section */}
          <DocumentCard
            title="Report Card"
            icon={BookOpen}
            documentUrl={documents?.reportCard}
            filename={`${studentName}_ReportCard.${documents?.reportCard ? getFileExtension(documents.reportCard) : 'pdf'}`}
            downloadType="reportCard"
          />
        </div>

        {/* Summary Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Document Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <User className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <p className="text-sm font-medium">Photo</p>
                <p className="text-xs text-muted-foreground">
                  {documents?.photo ? 'Available' : 'Not Available'}
                </p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <GraduationCap className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm font-medium">Transcript</p>
                <p className="text-xs text-muted-foreground">
                  {documents?.transcript ? 'Available' : 'Not Available'}
                </p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <p className="text-sm font-medium">Report Card</p>
                <p className="text-xs text-muted-foreground">
                  {documents?.reportCard ? 'Available' : 'Not Available'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  `${studentName}_${selectedImage?.title.replace(/\s+/g, '_')}.${getFileExtension(selectedImage?.url)}`
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

export default StudentDocuments;