import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';

const ReportCard = () => {
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    sex: '',
    grade: '',
    registrationNumber: '',
    academicYear: ''
  });

  const [promotionInfo, setPromotionInfo] = useState({
    completedGrade: '',
    promotedToGrade: '',
    conditionInGrade: '',
    repeatGrade: false,
    notEnrollNextYear: false
  });

  const subjects = [
    'English',
    'Literature', 
    'Mathematics',
    'Social Studies',
    'General Science',
    'Civics',
    'Physical Education',
    'Religious Education',
    'French',
    'Automotive',
    'Agriculture',
    'Electricity'
  ];

  const periods = ['1st Period', '2nd Period', '3rd Period', '4th Period', '5th Period', '6th Period'];

  return (
    <div className="min-h-screen bg-white p-8 print:p-4">
      <div className="max-w-4xl mx-auto bg-white">
        {/* Header Section */}
        <div className="text-center mb-8 border-b-2 border-black pb-6">
          <div className="flex justify-center items-center gap-4 mb-4">
            <div className="w-16 h-16 border-2 border-black rounded-full flex items-center justify-center bg-gray-100">
              <span className="text-xs">SEAL</span>
            </div>
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wide">
                VOINJAMA MULTILATERAL HIGH SCHOOL
              </h1>
              <h2 className="text-sm font-semibold">
                MINISTRY OF EDUCATION, REPUBLIC OF LIBERIA
              </h2>
              <h3 className="text-sm">
                VOINJAMA CITY, LOFA COUNTY
              </h3>
              <h2 className="text-lg font-bold mt-2 uppercase tracking-wider">
                JUNIOR HIGH REPORT CARD
              </h2>
            </div>
          </div>
        </div>

        {/* Promotion Statement */}
        <Card className="p-6 mb-6 border-2 border-black">
          <h3 className="text-lg font-bold text-center mb-4 uppercase">PROMOTION STATEMENT</h3>
          
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2">
              <span>This certifies that:</span>
              <div className="border-b border-black flex-1 min-w-[200px] h-6"></div>
            </div>
            
            <div className="flex items-center gap-2">
              <span>Has / Has not satisfactorily completed the: Grade work of</span>
              <div className="border-b border-black flex-1 min-w-[100px] h-6"></div>
            </div>
            
            <div className="flex items-center gap-2">
              <span>and is Eligible for Promoted to Grade</span>
              <div className="border-b border-black flex-1 min-w-[100px] h-6"></div>
            </div>
            
            <div className="flex items-center gap-2">
              <span>Condition in grade</span>
              <div className="border-b border-black flex-1 min-w-[150px] h-6"></div>
            </div>
            
            <p className="text-sm">(And required to attend vacation enrichment program)</p>
          </div>

          <div className="flex gap-6 mb-6">
            <div className="flex items-center space-x-2">
              <Checkbox id="repeat" />
              <label htmlFor="repeat" className="text-sm">Required to repeat the grade</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="notenroll" />
              <label htmlFor="notenroll" className="text-sm">Asked not to enroll next year</label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-8">
            <div className="text-center">
              <div className="border-b border-black h-6 mb-2"></div>
              <span className="text-sm font-semibold">REGISTRAR (signature)</span>
            </div>
            <div className="text-center">
              <div className="border-b border-black h-6 mb-2"></div>
              <span className="text-sm font-semibold">PRINCIPAL (signature)</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span>Date:</span>
              <div className="border-b border-black flex-1 max-w-[200px] h-6"></div>
            </div>
          </div>

          <p className="text-xs font-bold mt-4">NOTE: Any erasure on this card makes it invalid</p>
        </Card>

        {/* Student Information */}
        <Card className="p-6 mb-6 border-2 border-black">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Student:</span>
              <div className="border-b border-black flex-1 h-6"></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Sex:</span>
              <div className="border-b border-black w-16 h-6"></div>
              <span className="font-semibold ml-4">Grade:</span>
              <div className="border-b border-black w-20 h-6"></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">R#:</span>
              <div className="border-b border-black flex-1 h-6"></div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className="font-semibold">Academic Year:</span>
            <div className="border-b border-black flex-1 max-w-[200px] h-6"></div>
          </div>
        </Card>

        {/* Parents/Guardians Notice */}
        <Card className="p-6 mb-6 border-2 border-black">
          <h3 className="text-lg font-bold mb-4">Parents or Guardians Notice</h3>
          <div className="text-sm space-y-3">
            <p>
              Grades shown on this report card represent the cumulative average of homework, 
              classwork, participation, quizzes, projects, and tests for each academic subject.
            </p>
            <p>
              These grades are intended to encourage improvement and not for comparison.
            </p>
            <p>
              The Ministry of Education urges parents and guardians to pay close attention 
              to student performance.
            </p>
          </div>
        </Card>

        {/* Signature Tracking Table */}
        <Card className="p-6 mb-6 border-2 border-black">
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 text-left font-semibold">Period</th>
                <th className="border border-black p-2 text-left font-semibold">Parents/Guardians Signature</th>
                <th className="border border-black p-2 text-left font-semibold">Class Sponsor Signature</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period, index) => (
                <tr key={index}>
                  <td className="border border-black p-2">{period}</td>
                  <td className="border border-black p-2 h-8"></td>
                  <td className="border border-black p-2 h-8"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Academic Performance Table */}
        <Card className="p-6 mb-6 border-2 border-black">
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 text-left font-semibold">SUBJECTS</th>
                <th className="border border-black p-2 text-center font-semibold">1st</th>
                <th className="border border-black p-2 text-center font-semibold">2nd</th>
                <th className="border border-black p-2 text-center font-semibold">3rd</th>
                <th className="border border-black p-2 text-center font-semibold">Sem. Exam</th>
                <th className="border border-black p-2 text-center font-semibold">Sem. Ave</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject, index) => (
                <tr key={index}>
                  <td className="border border-black p-2 font-medium">{subject}</td>
                  <td className="border border-black p-2 h-8"></td>
                  <td className="border border-black p-2 h-8"></td>
                  <td className="border border-black p-2 h-8"></td>
                  <td className="border border-black p-2 h-8"></td>
                  <td className="border border-black p-2 h-8"></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary Section */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 p-4 bg-gray-50 border border-black">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Average:</span>
              <div className="border-b border-black flex-1 h-6"></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Times Tardy:</span>
              <div className="border-b border-black flex-1 h-6"></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Days Present:</span>
              <div className="border-b border-black flex-1 h-6"></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Days Absent:</span>
              <div className="border-b border-black flex-1 h-6"></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Conduct:</span>
              <div className="border-b border-black flex-1 h-6"></div>
            </div>
          </div>
        </Card>

        {/* Footer - Repeated 3 times */}
        {[1, 2, 3].map((num) => (
          <div key={num} className="text-center border-t-2 border-black pt-4 mb-4">
            <h3 className="font-bold text-lg">MOTTO: STRIVING FOR POSTERITY</h3>
            <p className="font-semibold text-red-600">ANY GRADE BELOW 70% IS A FAILING GRADE</p>
            <p className="italic">Accelerated education for accelerated development</p>
          </div>
        ))}

        {/* Print Button */}
        <div className="text-center mt-8 print:hidden">
          <Button 
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
          >
            Print Report Card
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;