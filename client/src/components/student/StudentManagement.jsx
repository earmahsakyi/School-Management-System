import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createStudentAndParent,
  getAllStudents,
  getStudentById,
  updateStudentAndParent,
  deleteStudentAndParent,
  searchStudents,
  clearStudentErrors,
  clearStudents
} from '../actions/studentActions';

const StudentManagement = () => {
  const dispatch = useDispatch();
  const { students, student, searchResults, loading, error, message, count } = useSelector(
    state => state.student
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    gradeLevel: '',
    department: '',
    classSection: '',
    name: '', // parent name
    email: '', // parent email
    phone: '', // parent phone
    photo: null
  });

  useEffect(() => {
    // Load all students on component mount
    dispatch(getAllStudents());

    // Cleanup on unmount
    return () => {
      dispatch(clearStudents());
    };
  }, [dispatch]);

  useEffect(() => {
    // Clear errors after 5 seconds
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearStudentErrors());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      photo: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const form = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== '') {
        form.append(key, formData[key]);
      }
    });

    try {
      await dispatch(createStudentAndParent(form));
      // Reset form on success
      setFormData({
        firstName: '',
        lastName: '',
        dob: '',
        gender: '',
        gradeLevel: '',
        department: '',
        classSection: '',
        name: '',
        email: '',
        phone: '',
        photo: null
      });
      // Reload students list
      dispatch(getAllStudents());
    } catch (err) {
      console.error('Failed to create student:', err);
    }
  };

  const handleUpdate = async (id, updateData) => {
    const form = new FormData();
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== null && updateData[key] !== '') {
        form.append(key, updateData[key]);
      }
    });

    try {
      await dispatch(updateStudentAndParent(id, form));
      // Reload students list
      dispatch(getAllStudents());
    } catch (err) {
      console.error('Failed to update student:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student and parent?')) {
      try {
        await dispatch(deleteStudentAndParent(id));
        // Reload students list
        dispatch(getAllStudents());
      } catch (err) {
        console.error('Failed to delete student:', err);
      }
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim()) {
      dispatch(searchStudents(value));
    } else {
      dispatch(getAllStudents());
    }
  };

  const handleViewStudent = (id) => {
    dispatch(getStudentById(id));
  };

  return (
    <div className="student-management">
      <h2>Student Management</h2>
      
      {/* Error/Success Messages */}
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}
      
      {message && (
        <div className="alert alert-success">
          {message}
        </div>
      )}

      {/* Search */}
      <div className="search-section">
        <input
          type="text"
          placeholder="Search by admission number..."
          value={searchTerm}
          onChange={handleSearch}
          className="form-control"
        />
      </div>

      {/* Create Student Form */}
      <form onSubmit={handleSubmit} className="student-form">
        <h3>Add New Student</h3>
        
        <div className="form-group">
          <label>Student First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Student Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Date of Birth</label>
          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleInputChange}
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Gender</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            required
            className="form-control"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div className="form-group">
          <label>Grade Level</label>
          <input
            type="text"
            name="gradeLevel"
            value={formData.gradeLevel}
            onChange={handleInputChange}
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Department</label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleInputChange}
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Class Section</label>
          <input
            type="text"
            name="classSection"
            value={formData.classSection}
            onChange={handleInputChange}
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Parent Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Parent Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Parent Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Student Photo</label>
          <input
            type="file"
            name="photo"
            onChange={handleFileChange}
            accept="image/*"
            className="form-control"
          />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? 'Creating...' : 'Create Student'}
        </button>
      </form>

      {/* Students List */}
      <div className="students-list">
        <h3>Students ({count})</h3>
        
        {loading && <div>Loading...</div>}
        
        <div className="students-grid">
          {(searchTerm ? searchResults : students).map(student => (
            <div key={student._id} className="student-card">
              <div className="student-info">
                <h4>{student.firstName} {student.lastName}</h4>
                <p>Admission: {student.admissionNumber}</p>
                <p>Grade: {student.gradeLevel}</p>
                <p>Gender: {student.gender}</p>
                {student.photo && (
                  <img 
                    src={`/${student.photo}`} 
                    alt={`${student.firstName} ${student.lastName}`}
                    className="student-photo"
                  />
                )}
                {student.parent && (
                  <div className="parent-info">
                    <p><strong>Parent:</strong> {student.parent.name}</p>
                    <p><strong>Email:</strong> {student.parent.email}</p>
                    <p><strong>Phone:</strong> {student.parent.phone}</p>
                  </div>
                )}
              </div>
              
              <div className="student-actions">
                <button 
                  onClick={() => handleViewStudent(student._id)}
                  className="btn btn-info btn-sm"
                >
                  View
                </button>
                <button 
                  onClick={() => handleDelete(student._id)}
                  className="btn btn-danger btn-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentManagement;