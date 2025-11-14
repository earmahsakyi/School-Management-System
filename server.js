const express = require('express');
const ConnectDB = require('./config/db');
const path = require('path');
const helmet = require('helmet');
const { apiLimiter } = require('./middleware/rateLimiter');
const getClientIp = require('./middleware/getClientIp');

const app = express();

// Enable trust proxy for Railway
app.set('trust proxy', 1);

// Connect database 
ConnectDB();

// Configure helmet with custom CSP for images
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: [
        "'self'", 
        "data:", 
        "https://ui-avatars.com",
        "https://*.amazonaws.com",
        "https://s3.amazonaws.com",
        "https://*.s3.amazonaws.com",
        "https://vmhsbucket.s3.eu-north-1.amazonaws.com/admin/",
        "https://vmhsbucket.s3.eu-north-1.amazonaws.com/staff/",
        "https://vmhsbucket.s3.eu-north-1.amazonaws.com/student/",
        "https://vmhsbucket.s3.amazonaws.com",
      ],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

app.use(getClientIp);

// app.use('/api/', apiLimiter);

// Middleware
app.use(express.json({ extended: false }));

// API welcome route - moved to /api/
app.get('/api/', (req, res) => res.json({ msg: 'Welcome to the School Management API' }));

// Define API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/student', require('./routes/students'));
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
app.use('/api/other', require('./routes/otherPaymentReport')); 
app.use('/api/tvet-financial', require('./routes/tvetFinancialReport'));

// Serve frontend build (important for Railway deployment)
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// For all other routes (non-API), return React index.html (for React Router)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

// Use Railway PORT or fallback to 5000
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on Port ${PORT}`));