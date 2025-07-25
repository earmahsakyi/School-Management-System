import { useState } from 'react';
import { X, Download, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

const RecommendationModal = ({ isOpen, onClose, student }) => {
  const [formData, setFormData] = useState({
    purpose: '',
    characteristics: {
      respectful: false,
      honest: false,
      lawAbiding: false,
      hardworking: false,
      problematic: false,
      disrespectful: false,
      argumentative: false,
      weak: false
    },
    extraCurricular: '',
    otherActivities: '',
    remarks: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (characteristic) => {
    setFormData(prev => ({
      ...prev,
      characteristics: {
        ...prev.characteristics,
        [characteristic]: !prev.characteristics[characteristic]
      }
    }));
  };

  const handleGeneratePDF = async () => {
    if (!student?.id) return;

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/recommendation/${student.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${student.firstName}_${student.lastName}_Recommendation.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating recommendation PDF:', error);
      toast.error('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-teal-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Generate Recommendation Letter
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Student Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900">Student Information</h3>
            <p className="text-sm text-gray-600 mt-1">
              {student?.firstName} {student?.lastName} - {student?.admissionNumber}
            </p>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purpose of Recommendation *
            </label>
            <input
              type="text"
              name="purpose"
              value={formData.purpose}
              onChange={handleInputChange}
              placeholder="e.g., pursue higher education, seek employment, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            />
          </div>

          {/* Characteristics */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Student Characteristics
            </label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(formData.characteristics).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => handleCheckboxChange(key)}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {key === 'lawAbiding' ? 'Law Abiding' : key}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Extra-curricular Activities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Extra-curricular Activities
            </label>
            <textarea
              name="extraCurricular"
              value={formData.extraCurricular}
              onChange={handleInputChange}
              placeholder="List activities the student participated in..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Other Activities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Other Activities
            </label>
            <textarea
              name="otherActivities"
              value={formData.otherActivities}
              onChange={handleInputChange}
              placeholder="Any other notable activities..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Remarks
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              placeholder="Any additional comments about the student..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            Cancel
          </button>
          <button
            onClick={handleGeneratePDF}
            disabled={isGenerating || !formData.purpose.trim()}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? 'Generating...' : 'Generate PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationModal;