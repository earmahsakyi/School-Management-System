import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { Download, Loader2, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast'

const RoosterSummary = () => {
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [downloading, setDownloading] = useState(false);

  // Handling PDF generation
  const handleGenerateRoosterSummary = async () => {
    if (!academicYear) {
      alert('Please enter an academic year to generate the rooster summary.');
      return;
    }

    try {
      setDownloading(true);

      const queryParams = new URLSearchParams({ academicYear });
      const url = `/api/rooster-summary?${queryParams}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate rooster summary');
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
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error(`Failed to generate rooster summary: ${error.message}`);
    } finally {
      setDownloading(false);
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
          <h1 className="text-3xl font-bold text-foreground">Student Rooster Summary Generator</h1>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              Generate Rooster Summary
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
              <div className="flex items-end">
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
                      Generate PDF
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