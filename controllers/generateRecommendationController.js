const generateRecommendationPdf = require('../utils/generateRecommendation');
const Student = require('../models/Student');

const recommendationController = {
  // Generate and download recommendation PDF
  getRecommendationPdf: async (req, res) => {
    try {
      const { studentId } = req.params;
      const recommendationData = req.body; 

      // Fetch student data from database
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student not found' 
        });
      }

      // Generate PDF buffer
      const pdfBuffer = await generateRecommendationPdf(student, recommendationData);

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${student.firstName}_${student.lastName}_Recommendation.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send PDF
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Error generating recommendation PDF:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error generating recommendation PDF',
        error: error.message 
      });
    }
  },

  // Preview recommendation data (optional - for UI preview)
  previewRecommendation: async (req, res) => {
    try {
      const { studentId } = req.params;
      
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student not found' 
        });
      }

      res.json({
        success: true,
        student: {
          id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          admissionNumber: student.admissionNumber,
          gradeLevel: student.gradeLevel
        }
      });

    } catch (error) {
      console.error('Error fetching student data:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching student data',
        error: error.message 
      });
    }
  }
};

module.exports = recommendationController;