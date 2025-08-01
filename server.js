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

// Load routes one by one with detailed error logging
const routes = [
  { path: '/api/auth', file: './routes/auth', name: 'Auth' },
  { path: '/api/admin', file: './routes/admin', name: 'Admin' },
  { path: '/api/reportcard', file: './routes/reportCard', name: 'Report Card' },
  { path: '/api/staff', file: './routes/staff', name: 'Staff' },
  { path: '/api/grade', file: './routes/grade', name: 'Grade' },
  { path: '/api/transcript', file: './routes/transcript', name: 'Transcript' },
  { path: '/api/master-grade-sheet', file: './routes/gradeSheet', name: 'Grade Sheet' },
  { path: '/api/recommendation', file: './routes/recommendation', name: 'Recommendation' },
  { path: '/api/rooster-summary', file: './routes/rosterSummary', name: 'Roster Summary' },
  { path: '/api/announcements', file: './routes/announcement', name: 'Announcements' },
  { path: '/api/payments', file: './routes/payment', name: 'Payments' },
  { path: '/api/other-payments', file: './routes/otherPayment', name: 'Other Payments' },
  { path: '/api/financial', file: './routes/financialReport', name: 'Financial Report' },
  { path: '/api/tvet', file: './routes/tvet', name: 'TVET' },
  { path: '/api/tvet-financial', file: './routes/tvetFinancialReport', name: 'TVET Financial' }
];

console.log('Starting to load routes...');

routes.forEach((route, index) => {
  try {
    console.log(`[${index + 1}/${routes.length}] Loading ${route.name} routes from ${route.file}...`);
    
    const routeModule = require(route.file);
    console.log(`[${index + 1}/${routes.length}] ✓ Successfully required ${route.name} module`);
    
    app.use(route.path, routeModule);
    console.log(`[${index + 1}/${routes.length}] ✓ Successfully mounted ${route.name} routes on ${route.path}`);
    
  } catch (error) {
    console.error(`[${index + 1}/${routes.length}] ✗ ERROR loading ${route.name} routes:`, error.message);
    console.error(`Stack trace:`, error.stack);
    
    // Don't exit, continue loading other routes to see which ones work
    console.log(`Continuing with other routes...`);
  }
});

console.log('Finished loading all routes');

// Serve static files from the React app build
console.log('Setting up static file serving...');
app.use(express.static(path.join(__dirname, 'client', 'dist')));
console.log('✓ Static file serving configured');

// Catch all handler: send back React's index.html file for any non-API routes
console.log('Setting up catch-all route...');
app.get('/*', (req, res) => {
  const indexPath = path.join(__dirname, 'client', 'dist', 'index.html');
  console.log(`Serving index.html from: ${indexPath}`);
  res.sendFile(indexPath);
});
console.log('✓ Catch-all route configured');

const PORT = process.env.PORT || 5000;

console.log(`Starting server on port ${PORT}...`);
app.listen(PORT, () => {
  console.log(`✓ Server started successfully on Port ${PORT}`);
  console.log('Server is ready to handle requests');
});