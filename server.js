const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Parse JSON requests
app.use(express.static('public')); // Serve static files (CSS, JS, images, etc.)

// Session Configuration
app.use(session({
    secret: 'exam_secret_key',
    resave: false,
    saveUninitialized: true
}));

// JSON file to store student data
const DATA_FILE = path.join(__dirname, 'students.json');

// Read students from JSON
const readStudentData = () => {
    if (!fs.existsSync(DATA_FILE)) return [];
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
};

// Save students to JSON
const saveStudentData = (students) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2));
};

// Dummy staff credentials
const staffUsername = "admin";
const staffPassword = "1234";

/* ----------------------------------------
   TUTORIALS ROUTE
   ---------------------------------------- */
   app.get('/tutorials', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'tutorials.html'));});

/* ----------------------------------------
   HOME PAGE
   ---------------------------------------- */
app.get('/', (req, res) => {
    // Serve the home page (e.g., index.html)
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

/* ----------------------------------------
   STAFF LOGIN & DASHBOARD
   ---------------------------------------- */
app.get('/staff-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'staff-login.html'));
});

app.post('/staff-dashboard', (req, res) => {
    const { username, password } = req.body;
    if (username === staffUsername && password === staffPassword) {
        req.session.staffLoggedIn = true;
        res.redirect('/staff-dashboard');
    } else {
        res.send("<script>alert('Invalid credentials'); window.location.href='/staff-login';</script>");
    }
});

app.get('/staff-dashboard', (req, res) => {
    if (!req.session.staffLoggedIn) {
        return res.send("<script>alert('Unauthorized Access! Please log in.'); window.location.href='/staff-login';</script>");
    }

    let students = readStudentData();
    let studentData = `
        <h2>Student Exam Records</h2>
        <p><strong>Total Students Attended:</strong> ${students.length}</p>
        <table border="1">
            <tr>
                <th>Name</th>
                <th>Reg. No</th>
                <th>Score</th>
            </tr>`;

    students.forEach(student => {
        studentData += `
            <tr>
                <td>${student.name}</td>
                <td>${student.regNo}</td>
                <td>${student.score}</td>
            </tr>`;
    });

    studentData += `</table><br><a href="/">Go to Home</a>`;

    res.send(studentData);
});

/* ----------------------------------------
   STUDENT LOGIN
   ---------------------------------------- */
app.get('/student-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'student-login.html'));
});

app.post('/student-login', (req, res) => {
    const { name, regNo } = req.body;
    if (!name || !regNo) {
        return res.send("<script>alert('Please enter name and registration number.'); window.location.href='/student-login';</script>");
    }

    let students = readStudentData();
    let existingStudent = students.find(student => student.regNo === regNo);

    // If student exists & has a score, they've taken the exam => go to results
    if (existingStudent) {
        if (existingStudent.score > 0) {
            return res.redirect('/result');
        } else {
            // Not taken the exam yet => proceed
            req.session.student = existingStudent;
            return res.redirect('/exam');
        }
    }

    // New Student => create record
    req.session.student = { name, regNo, score: 0 };
    students.push(req.session.student);
    saveStudentData(students);
    res.redirect('/exam');
});

/* ----------------------------------------
   EXAM PAGE
   ---------------------------------------- */
app.get('/exam', (req, res) => {
    if (!req.session.student) {
        return res.send("<script>alert('Session expired. Please log in again.'); window.location.href='/student-login';</script>");
    }
    res.sendFile(path.join(__dirname, 'views', 'exam.html'));
});

/* ----------------------------------------
   SUBMIT EXAM
   ---------------------------------------- */
app.post('/submit-exam', (req, res) => {
    if (!req.session.student) {
        return res.send("<script>alert('Session expired. Please log in again.'); window.location.href='/student-login';</script>");
    }

    let students = readStudentData();
    let studentIndex = students.findIndex(student => student.regNo === req.session.student.regNo);

    if (studentIndex === -1) {
        return res.send("<script>alert('Student not found. Please login again.'); window.location.href='/student-login';</script>");
    }

    // Basic example: q1, q2, q3
    let score = 0;
    if (req.body.q1 === "correct") score++;
    if (req.body.q2 === "correct") score++;
    if (req.body.q3 === "correct") score++;

    // Update student's score in session & JSON
    req.session.student.score = score;
    students[studentIndex].score = score;
    saveStudentData(students);

    res.redirect('/result');
});

/* ----------------------------------------
   RESULT PAGE
   ---------------------------------------- */
app.get('/result', (req, res) => {
    if (!req.session.student) {
        return res.send("<script>alert('No student data found. Please login again.'); window.location.href='/student-login';</script>");
    }

    let students = readStudentData();
    let student = students.find(s => s.regNo === req.session.student.regNo);

    if (!student) {
        return res.send("<script>alert('Student not found.'); window.location.href='/student-login';</script>");
    }

    // Render a simple HTML with student results
    res.send(`
        <h2>Exam Results</h2>
        <p><strong>Student Name:</strong> ${student.name}</p>
        <p><strong>Registration No:</strong> ${student.regNo}</p>
        <p><strong>Score:</strong> ${student.score}</p>
        <a href="/">Go to Home</a>
    `);
});

/* ----------------------------------------
   LOGOUT
   ---------------------------------------- */
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

/* ----------------------------------------
   START SERVER
   ---------------------------------------- */
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
