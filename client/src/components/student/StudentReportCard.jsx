import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getReportCardData } from '../../actions/reportCardAction';
import { Loader2, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { saveAs } from 'file-saver';

const StudentReportCard = () => {
  const { studentId, academicYear, term } = useParams(); // Add term parameter
  const dispatch = useDispatch();
  const { reportCardData, loading, error } = useSelector((state) => state.reportCard);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    dispatch(getReportCardData(studentId, encodeURIComponent(academicYear), term));
  }, [dispatch, studentId, academicYear, term]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const url = term 
        ? `/api/reportcard/${studentId}/${encodeURIComponent(academicYear)}/${term}`
        : `/api/reportcard/${studentId}/${encodeURIComponent(academicYear)}`;
      
      const response = await axios.get(url, {
        responseType: 'blob',
      });
      const filename = term
        ? `report-card-${studentId}-${academicYear}-term-${term}.pdf`
        : `report-card-${studentId}-${academicYear}.pdf`;
      
      saveAs(new Blob([response.data]), filename);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading report card...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          {term ? `Term ${term} Report Card` : 'Annual Report Card'}
        </h1>
        <div className="flex gap-2">
          <Button onClick={handleDownload} disabled={downloading}>
            {downloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* PDF Preview Embed */}
      <div className="w-full h-[80vh] border rounded-lg">
        <iframe 
          src={term 
            ? `/api/reportcard/${studentId}/${encodeURIComponent(academicYear)}/${term}`
            : `/api/reportcard/${studentId}/${encodeURIComponent(academicYear)}`}
          className="w-full h-full"
          title="Report Card Preview"
        />
      </div>
    </div>
  );
};

export default StudentReportCard;