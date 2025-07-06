const express = require('express');
const ConnectDB = require('./config/db');
const path = require('path');

const app = express();

//Connect database 
ConnectDB();

app.use(express.json({ extended: false}));

app.get('/', (req, res) => res.json({ msg: 'Welcome to the School Management API'}));

// Define Routes
app.use('/api/auth',require('./routes/auth'));  

   
const PORT = 5000;

app.listen(PORT, () => console.log(`Server started on Port ${PORT}`))