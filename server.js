const express = require('express');
const ConnectDB = require('./config/db');
const path = require('path');

const app = express();

// Connect database 
 ConnectDB();

// Middleware
app.use(express.json({ extended: false }));

// API welcome route
app.get('/', (req, res) => res.json({ msg: 'Welcome to the School Management API' }));

//Define API Routes
// app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
// app.use('/api/student', require('./routes/students'));
app.use('/api/reportcard', require('./routes/reportCard'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/grade', require('./routes/grade'));
app.use('/api/transcript', require('./routes/transcript'));
app.use('/api/master-grade-sheet', require('./routes/gradeSheet'));
app.use('/api/recommendation', require('./routes/recommendation'));
app.use('/api/rooster-summary', require('./routes/rosterSummary'));
app.use('/api/announcements', require('./routes/announcement'));
app.use('/api/payments', require('./routes/payment'));
app.use('/api/other-payments', require('./routes/otherPayment'));
app.use('/api/financial', require('./routes/financialReport'));
app.use('/api/tvet', require('./routes/tvet'));
app.use('/api/tvet-financial', require('./routes/tvetFinancialReport'));

//  Serve frontend build (important for Railway deployment)
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// //  For all other routes, return React index.html (for React Router)
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
// });

// Use Railway PORT or fallback to 5000
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on Port ${PORT}`));
