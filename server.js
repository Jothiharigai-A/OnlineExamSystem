const express = require('express');
const app = express();
const path = require('path');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files

// Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/tutorials', (req, res) => res.sendFile(path.join(__dirname, 'views', 'tutorials.html')));
app.get('/staff-login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'staff-login.html')));
app.get('/student-login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'student-login.html')));
app.get('/exam', (req, res) => res.sendFile(path.join(__dirname, 'views', 'exam.html')));

// Start Server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
