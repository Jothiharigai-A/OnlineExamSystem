const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');

const app = express();

const PORT = process.env.PORT || 8080;  // Use Railway-assigned port
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});


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

/// Student Login Page: Serve the login HTML file
app.get('/student-login', (req, res) => 
    res.sendFile(path.join(__dirname, 'views', 'student-login.html'))
  );
  
  // Handle Student Login via POST
  app.post('/student-login', (req, res) => {
      const { name, regNo } = req.body;
      let students = readStudentData();
      let existingStudent = students.find(student => student.regNo === regNo);
  
      if (existingStudent) {
          // If they've already taken the exam, redirect to result
          if (existingStudent.attempted) {
              return res.redirect('/result');
          } else {
              // Overwrite session data with existing student's info and redirect to exam
              req.session.student = existingStudent;
              return res.redirect('/exam');
          }
      } else {
          // Create a new student record
          const newStudent = { name, regNo, score: 0, attempted: false };
          students.push(newStudent);
          saveStudentData(students);
          req.session.student = newStudent;
          return res.redirect('/exam');
      }
  });
  
// Exam Page
app.get('/exam', (req, res) => {
    if (!req.session.student) {
        return res.send("<script>alert('Session expired. Please log in again.'); window.location.href='/student-login';</script>");
    }
    res.sendFile(path.join(__dirname, 'views', 'exam.html'));
});

// Handle Exam Submission
app.post('/submit-exam', (req, res) => {
    if (!req.session.student) {
        return res.send("<script>alert('Session expired. Please log in again.'); window.location.href='/student-login';</script>");
    }

    let students = readStudentData();
    let studentIndex = students.findIndex(student => student.regNo === req.session.student.regNo);

    if (studentIndex === -1) {
        return res.send("<script>alert('Student not found. Please log in again.'); window.location.href='/student-login';</script>");
    }

    let score = 0;
    // For example, check three questions. Expand this for 10 questions per section.
    if (req.body.q1 === "correct") score++;
    if (req.body.q2 === "correct") score++;
    if (req.body.q3 === "correct") score++;

    // Update student's score and mark exam as attempted
    req.session.student.score = score;
    req.session.student.attempted = true;
    students[studentIndex].score = score;
    students[studentIndex].attempted = true;
    saveStudentData(students);

    res.redirect('/result');
});

// Result Page
app.get('/result', (req, res) => {
    if (!req.session.student) {
        return res.send("<script>alert('No student data found. Please log in again.'); window.location.href='/student-login';</script>");
    }

    let students = readStudentData();
    let student = students.find(s => s.regNo === req.session.student.regNo);

    if (!student) {
        return res.send("<script>alert('Student not found.'); window.location.href='/student-login';</script>");
    }

    res.send(`
        <h2>Exam Results</h2>
        <p><strong>Student Name:</strong> ${student.name}</p>
        <p><strong>Registration No:</strong> ${student.regNo}</p>
        <p><strong>Score:</strong> ${student.score}</p>
        <a href="/">Go to Home</a>
    `);
});


//LOGOUT
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/'); 
    });
});


/* ----------------------------------------
   START SERVER
   ---------------------------------------- */
//app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));


