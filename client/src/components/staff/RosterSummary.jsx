import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { Download, Loader2, FileSpreadsheet, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

const RoosterSummary = () => {
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

  // Handling PDF generation
  const handleGenerateRoosterSummary = async () => {
    if (!academicYear) {
      toast.error('Please enter an academic year to generate the roster summary.');
      return;
    }

    try {
      setDownloading(true);

      const queryParams = new URLSearchParams({ academicYear });
      const url = `/api/rooster-summary?${queryParams}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate roster summary');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Rooster_Summary_${academicYear}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Roster summary downloaded successfully!");
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error(`Failed to generate roster summary: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  // Handling PDF printing
  const handlePrintRoosterSummary = async () => {
    if (!academicYear) {
      toast.error('Please enter an academic year to print the roster summary.');
      return;
    }

    try {
      setPrinting(true);

      const queryParams = new URLSearchParams({ academicYear });
      const url = `/api/rooster-summary?${queryParams}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate roster summary');
      }

      const blob = await response.blob();
      const pdfUrl = window.URL.createObjectURL(blob);

      // Method 1: Try direct window.open approach first
      try {
        const printWindow = window.open(pdfUrl, '_blank');
        if (printWindow) {
          printWindow.addEventListener('load', () => {
            setTimeout(() => {
              printWindow.print();
              toast.success("Print dialog opened for roster summary!");
            }, 500);
          });
          setTimeout(() => {
            window.URL.revokeObjectURL(pdfUrl);
          }, 10000);
          return;
        }
      } catch (error) {
        console.log('Window.open method failed, trying iframe method:', error);
      }

      // Method 2: Fallback to iframe approach
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.border = 'none';
      iframe.src = pdfUrl;
      document.body.appendChild(iframe);

      const handleIframeLoad = () => {
        setTimeout(() => {
          try {
            if (iframe.contentWindow) {
              iframe.contentWindow.focus();
              iframe.contentWindow.print();
              toast.success("Print dialog opened for roster summary!");
            }
          } catch (error) {
            console.error('Print error:', error);
            const link = document.createElement('a');
            link.href = pdfUrl;
            const filename = `Rooster_Summary_${academicYear}_${new Date().getTime()}.pdf`;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("PDF downloaded successfully!");
          }
        }, 1000);
      };

      iframe.addEventListener('load', handleIframeLoad);

      const cleanup = () => {
        try {
          if (iframe && iframe.parentNode) {
            iframe.removeEventListener('load', handleIframeLoad);
            document.body.removeChild(iframe);
          }
          window.URL.revokeObjectURL(pdfUrl);
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      };
      
      setTimeout(cleanup, 15000);

    } catch (error) {
      console.error('Print failed:', error);
      toast.error(`Failed to print roster summary: ${error.message}`);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8 max-w-7xl"
      >
        <div className="flex items-center mb-6">
          <FileSpreadsheet className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-3xl font-bold text-foreground">Student Roster Summary Generator</h1>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              Generate Roster Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="academicYear" className="block text-sm font-medium mb-2">Academic Year</label>
                <Input
                  id="academicYear"
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="2024"
                />
              </div>
              <div className="flex items-end gap-4">
                <Button
                  onClick={handleGenerateRoosterSummary}
                  disabled={downloading || !academicYear}
                  className="w-full"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </>
                  )}
                </Button>
                <Button
                  onClick={handlePrintRoosterSummary}
                  disabled={printing || !academicYear}
                  className="w-full"
                  variant="secondary"
                >
                  {printing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Preparing Print...
                    </>
                  ) : (
                    <>
                      <Printer className="mr-2 h-4 w-4" />
                      Print PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default RoosterSummary;