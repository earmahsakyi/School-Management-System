const express = require('express');
const ConnectDB = require('./config/db');
const path = require('path');

const app = express();

//Connect database 
ConnectDB();
  
app.use(express.json({ extended: false}));

app.get('/', (req, res) => res.json({ msg: 'Welcome to the School Management API'}));

// Serve static files from the "uploads" directory
app.use('/uploads/admins', express.static(path.join(__dirname, 'uploads', 'admins')));
app.use('/uploads/students', express.static(path.join(__dirname, 'uploads', 'students')));
app.use('/uploads/staff', express.static(path.join(__dirname, 'uploads', 'staff')));
  
// Define Routes
app.use('/api/auth',require('./routes/auth'));      
app.use('/api/admin',require('./routes/admin'));        
app.use('/api/student',require('./routes/students'));
app.use('/api/reportcard', require('./routes/reportCard'));      
app.use('/api/staff',require('./routes/staff'));      
app.use('/api/grade',require('./routes/grade'));      
app.use('/api/transcript',require('./routes/transcript'));      
app.use('/api/master-grade-sheet',require('./routes/gradeSheet'));     
app.use('/api/recommendation',require('./routes/recommendation'));     
app.use('/api/rooster-summary',require('./routes/rosterSummary'));     

       
const PORT = 5000;

app.listen(PORT, () => console.log(`Server started on Port ${PORT}`))