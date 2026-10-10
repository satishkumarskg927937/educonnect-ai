import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, seedDatabase, queryAll, queryOne, runSql, saveDb } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../client/dist');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'educonnect-demo-secret-2026';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(distPath));

// JWT middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// ========== AUTH ==========
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = queryOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, avatar_color: user.avatar_color }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, avatar_color: user.avatar_color } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
    const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const hash = bcrypt.hashSync(password, 10);
    const validRole = ['student', 'faculty'].includes(role) ? role : 'student';
    const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6', '#10B981', '#EF4444'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const { lastId } = runSql('INSERT INTO users (name, email, password, role, department, avatar_color) VALUES (?,?,?,?,?,?)', [name, email, hash, validRole, department || '', color]);
    const token = jwt.sign({ id: lastId, name, email, role: validRole, department: department || '', avatar_color: color }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, user: { id: lastId, name, email, role: validRole, department: department || '', avatar_color: color } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  try {
    const user = queryOne('SELECT id, name, email, role, department, avatar_color, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== COURSES ==========
app.get('/api/courses', authMiddleware, (req, res) => {
  try {
    let courses;
    if (req.user.role === 'student') {
      courses = queryAll(`SELECT c.*, u.name as faculty_name FROM courses c LEFT JOIN users u ON c.faculty_id = u.id WHERE c.id IN (SELECT course_id FROM enrollments WHERE student_id = ?)`,[req.user.id]);
    } else if (req.user.role === 'faculty') {
      courses = queryAll('SELECT c.*, u.name as faculty_name FROM courses c LEFT JOIN users u ON c.faculty_id = u.id WHERE c.faculty_id = ?', [req.user.id]);
    } else {
      courses = queryAll('SELECT c.*, u.name as faculty_name FROM courses c LEFT JOIN users u ON c.faculty_id = u.id');
    }
    res.json(courses);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/courses/all', authMiddleware, (req, res) => {
  try {
    const courses = queryAll('SELECT c.*, u.name as faculty_name FROM courses c LEFT JOIN users u ON c.faculty_id = u.id');
    res.json(courses);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/courses', authMiddleware, requireRole('admin'), (req, res) => {
  try {
    const { name, code, description, department, faculty_id } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'Name and code required' });
    const existing = queryOne('SELECT id FROM courses WHERE code = ?', [code]);
    if (existing) return res.status(409).json({ error: 'Course code already exists' });
    const { lastId } = runSql('INSERT INTO courses (name, code, description, department, faculty_id) VALUES (?,?,?,?,?)', [name, code, description || '', department || '', faculty_id || null]);
    res.status(201).json({ id: lastId, name, code });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/courses/:id', authMiddleware, requireRole('admin'), (req, res) => {
  try {
    const { name, code, description, department, faculty_id } = req.body;
    runSql('UPDATE courses SET name=?, code=?, description=?, department=?, faculty_id=? WHERE id=?', [name, code, description || '', department || '', faculty_id || null, req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/courses/:id', authMiddleware, requireRole('admin'), (req, res) => {
  try {
    runSql('DELETE FROM courses WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== SUBJECTS ==========
app.get('/api/subjects', authMiddleware, (req, res) => {
  try {
    const subjects = queryAll('SELECT s.*, c.name as course_name FROM subjects s LEFT JOIN courses c ON s.course_id = c.id');
    res.json(subjects);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/subjects', authMiddleware, requireRole('admin'), (req, res) => {
  try {
    const { name, code, course_id } = req.body;
    if (!name || !code || !course_id) return res.status(400).json({ error: 'Name, code and course required' });
    const { lastId } = runSql('INSERT INTO subjects (name, code, course_id) VALUES (?,?,?)', [name, code, course_id]);
    res.status(201).json({ id: lastId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/subjects/:id', authMiddleware, requireRole('admin'), (req, res) => {
  try {
    runSql('DELETE FROM subjects WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== ENROLLMENTS ==========
app.get('/api/enrollments', authMiddleware, (req, res) => {
  try {
    let enrollments;
    if (req.user.role === 'student') {
      enrollments = queryAll('SELECT e.*, c.name as course_name, c.code as course_code FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.student_id = ?', [req.user.id]);
    } else {
      enrollments = queryAll('SELECT e.*, c.name as course_name, u.name as student_name FROM enrollments e JOIN courses c ON e.course_id = c.id JOIN users u ON e.student_id = u.id');
    }
    res.json(enrollments);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/enrollments', authMiddleware, requireRole('admin'), (req, res) => {
  try {
    const { student_id, course_id } = req.body;
    const existing = queryOne('SELECT id FROM enrollments WHERE student_id=? AND course_id=?', [student_id, course_id]);
    if (existing) return res.status(409).json({ error: 'Already enrolled' });
    runSql('INSERT INTO enrollments (student_id, course_id) VALUES (?,?)', [student_id, course_id]);
    res.status(201).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== ASSIGNMENTS ==========
app.get('/api/assignments', authMiddleware, (req, res) => {
  try {
    let assignments;
    if (req.user.role === 'student') {
      assignments = queryAll(`SELECT a.*, c.name as course_name, c.code as course_code, u.name as faculty_name,
        (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = ?) as has_submitted,
        (SELECT s.status FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = ?) as submission_status,
        (SELECT s.marks FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = ?) as my_marks,
        (SELECT s.feedback FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = ?) as my_feedback,
        (SELECT s.id FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = ?) as my_submission_id
        FROM assignments a 
        JOIN courses c ON a.course_id = c.id 
        LEFT JOIN users u ON a.faculty_id = u.id
        WHERE a.course_id IN (SELECT course_id FROM enrollments WHERE student_id = ?)
        ORDER BY a.deadline ASC`, [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]);
    } else if (req.user.role === 'faculty') {
      assignments = queryAll(`SELECT a.*, c.name as course_name, c.code as course_code,
        (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) as total_submissions,
        (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id AND s.status = 'graded') as graded_count,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = a.course_id) as enrolled_students
        FROM assignments a 
        JOIN courses c ON a.course_id = c.id 
        WHERE a.faculty_id = ?
        ORDER BY a.created_at DESC`, [req.user.id]);
    } else {
      assignments = queryAll(`SELECT a.*, c.name as course_name, u.name as faculty_name,
        (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) as total_submissions
        FROM assignments a 
        JOIN courses c ON a.course_id = c.id 
        LEFT JOIN users u ON a.faculty_id = u.id
        ORDER BY a.created_at DESC`);
    }
    res.json(assignments);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/assignments', authMiddleware, requireRole('faculty'), (req, res) => {
  try {
    const { title, description, course_id, deadline, max_marks } = req.body;
    if (!title || !description || !course_id || !deadline) return res.status(400).json({ error: 'Title, description, course and deadline required' });
    // Verify faculty owns this course
    const course = queryOne('SELECT id FROM courses WHERE id = ? AND faculty_id = ?', [course_id, req.user.id]);
    if (!course) return res.status(403).json({ error: 'You can only create assignments for your own courses' });
    const { lastId } = runSql('INSERT INTO assignments (title, description, course_id, faculty_id, deadline, max_marks) VALUES (?,?,?,?,?,?)', [title, description, course_id, req.user.id, deadline, max_marks || 100]);
    // Create notifications for enrolled students
    const students = queryAll('SELECT student_id FROM enrollments WHERE course_id = ?', [course_id]);
    const courseName = queryOne('SELECT name FROM courses WHERE id = ?', [course_id])?.name;
    students.forEach(s => {
      runSql('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?,?,?,?,?)', [s.student_id, 'New Assignment', `New assignment: ${title} in ${courseName}`, 'assignment', '/assignments']);
    });
    res.status(201).json({ id: lastId, title });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/assignments/:id', authMiddleware, requireRole('faculty'), (req, res) => {
  try {
    const assignment = queryOne('SELECT * FROM assignments WHERE id = ?', [req.params.id]);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    if (assignment.faculty_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    const { title, description, deadline, max_marks } = req.body;
    runSql('UPDATE assignments SET title=?, description=?, deadline=?, max_marks=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [title || assignment.title, description || assignment.description, deadline || assignment.deadline, max_marks || assignment.max_marks, req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/assignments/:id', authMiddleware, requireRole('faculty'), (req, res) => {
  try {
    const assignment = queryOne('SELECT * FROM assignments WHERE id = ?', [req.params.id]);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    if (assignment.faculty_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    runSql('DELETE FROM assignments WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== SUBMISSIONS ==========
app.get('/api/submissions', authMiddleware, (req, res) => {
  try {
    let submissions;
    if (req.user.role === 'student') {
      submissions = queryAll(`SELECT s.*, a.title as assignment_title, a.max_marks, a.deadline, c.name as course_name
        FROM submissions s 
        JOIN assignments a ON s.assignment_id = a.id 
        JOIN courses c ON a.course_id = c.id
        WHERE s.student_id = ?
        ORDER BY s.submitted_at DESC`, [req.user.id]);
    } else if (req.user.role === 'faculty') {
      submissions = queryAll(`SELECT s.*, a.title as assignment_title, a.max_marks, a.deadline, c.name as course_name, u.name as student_name, u.email as student_email
        FROM submissions s 
        JOIN assignments a ON s.assignment_id = a.id 
        JOIN courses c ON a.course_id = c.id 
        JOIN users u ON s.student_id = u.id
        WHERE a.faculty_id = ?
        ORDER BY s.submitted_at DESC`, [req.user.id]);
    } else {
      submissions = queryAll(`SELECT s.*, a.title as assignment_title, u.name as student_name
        FROM submissions s 
        JOIN assignments a ON s.assignment_id = a.id 
        JOIN users u ON s.student_id = u.id
        ORDER BY s.submitted_at DESC`);
    }
    res.json(submissions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/submissions/assignment/:id', authMiddleware, requireRole('faculty'), (req, res) => {
  try {
    const assignment = queryOne('SELECT * FROM assignments WHERE id = ? AND faculty_id = ?', [req.params.id, req.user.id]);
    if (!assignment) return res.status(403).json({ error: 'Not authorized' });
    const submissions = queryAll(`SELECT s.*, u.name as student_name, u.email as student_email 
      FROM submissions s JOIN users u ON s.student_id = u.id 
      WHERE s.assignment_id = ? ORDER BY s.submitted_at DESC`, [req.params.id]);
    res.json({ assignment, submissions });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/submissions', authMiddleware, requireRole('student'), (req, res) => {
  try {
    const { assignment_id, answer_text } = req.body;
    if (!assignment_id || !answer_text || !answer_text.trim()) return res.status(400).json({ error: 'Assignment and answer text required' });
    // Check if already submitted
    const existing = queryOne('SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?', [assignment_id, req.user.id]);
    if (existing) return res.status(409).json({ error: 'You have already submitted this assignment' });
    // Check enrollment
    const assignment = queryOne('SELECT a.*, c.name as course_name FROM assignments a JOIN courses c ON a.course_id = c.id WHERE a.id = ?', [assignment_id]);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    const enrolled = queryOne('SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?', [req.user.id, assignment.course_id]);
    if (!enrolled) return res.status(403).json({ error: 'Not enrolled in this course' });
    const { lastId } = runSql('INSERT INTO submissions (assignment_id, student_id, answer_text) VALUES (?,?,?)', [assignment_id, req.user.id, answer_text.trim()]);
    // Notify faculty
    runSql('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?,?,?,?,?)', [assignment.faculty_id, 'New Submission', `${req.user.name} submitted ${assignment.title}`, 'submission', '/submissions']);
    res.status(201).json({ id: lastId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== GRADING ==========
app.post('/api/submissions/:id/grade', authMiddleware, requireRole('faculty'), (req, res) => {
  try {
    const { marks, feedback } = req.body;
    const submission = queryOne(`SELECT s.*, a.faculty_id, a.max_marks, a.title as assignment_title FROM submissions s JOIN assignments a ON s.assignment_id = a.id WHERE s.id = ?`, [req.params.id]);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (submission.faculty_id !== req.user.id) return res.status(403).json({ error: 'Not authorized to grade this submission' });
    if (marks === undefined || marks === null) return res.status(400).json({ error: 'Marks required' });
    if (marks < 0 || marks > submission.max_marks) return res.status(400).json({ error: `Marks must be between 0 and ${submission.max_marks}` });
    runSql('UPDATE submissions SET marks=?, feedback=?, graded_at=CURRENT_TIMESTAMP, graded_by=?, status=? WHERE id=?', [marks, feedback || '', req.user.id, 'graded', req.params.id]);
    // Notify student
    runSql('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?,?,?,?,?)', [submission.student_id, 'Assignment Graded', `Your ${submission.assignment_title} has been graded. Score: ${marks}/${submission.max_marks}`, 'grade', '/assignments']);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== NOTES ==========
app.get('/api/notes', authMiddleware, (req, res) => {
  try {
    let notes;
    if (req.user.role === 'student') {
      notes = queryAll(`SELECT n.*, c.name as course_name, u.name as faculty_name 
        FROM notes n JOIN courses c ON n.course_id = c.id LEFT JOIN users u ON n.faculty_id = u.id
        WHERE n.published = 1 AND n.course_id IN (SELECT course_id FROM enrollments WHERE student_id = ?)
        ORDER BY n.created_at DESC`, [req.user.id]);
    } else if (req.user.role === 'faculty') {
      notes = queryAll(`SELECT n.*, c.name as course_name FROM notes n JOIN courses c ON n.course_id = c.id WHERE n.faculty_id = ? ORDER BY n.created_at DESC`, [req.user.id]);
    } else {
      notes = queryAll(`SELECT n.*, c.name as course_name, u.name as faculty_name FROM notes n JOIN courses c ON n.course_id = c.id LEFT JOIN users u ON n.faculty_id = u.id ORDER BY n.created_at DESC`);
    }
    res.json(notes);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/notes', authMiddleware, requireRole('faculty'), (req, res) => {
  try {
    const { title, content, course_id } = req.body;
    if (!title || !content || !course_id) return res.status(400).json({ error: 'Title, content and course required' });
    const course = queryOne('SELECT id FROM courses WHERE id = ? AND faculty_id = ?', [course_id, req.user.id]);
    if (!course) return res.status(403).json({ error: 'Not authorized for this course' });
    const { lastId } = runSql('INSERT INTO notes (title, content, course_id, faculty_id) VALUES (?,?,?,?)', [title, content, course_id, req.user.id]);
    res.status(201).json({ id: lastId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/notes/:id', authMiddleware, requireRole('faculty'), (req, res) => {
  try {
    const note = queryOne('SELECT * FROM notes WHERE id = ? AND faculty_id = ?', [req.params.id, req.user.id]);
    if (!note) return res.status(403).json({ error: 'Not authorized' });
    const { title, content, published } = req.body;
    runSql('UPDATE notes SET title=?, content=?, published=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [title || note.title, content || note.content, published !== undefined ? published : note.published, req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/notes/:id', authMiddleware, requireRole('faculty'), (req, res) => {
  try {
    const note = queryOne('SELECT * FROM notes WHERE id = ? AND faculty_id = ?', [req.params.id, req.user.id]);
    if (!note) return res.status(403).json({ error: 'Not authorized' });
    runSql('DELETE FROM notes WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== DOUBTS ==========
app.get('/api/doubts', authMiddleware, (req, res) => {
  try {
    let doubts;
    if (req.user.role === 'student') {
      doubts = queryAll(`SELECT d.*, c.name as course_name, u.name as student_name,
        (SELECT COUNT(*) FROM doubt_replies dr WHERE dr.doubt_id = d.id) as reply_count
        FROM doubts d JOIN courses c ON d.course_id = c.id JOIN users u ON d.student_id = u.id
        WHERE d.course_id IN (SELECT course_id FROM enrollments WHERE student_id = ?)
        ORDER BY d.created_at DESC`, [req.user.id]);
    } else if (req.user.role === 'faculty') {
      doubts = queryAll(`SELECT d.*, c.name as course_name, u.name as student_name,
        (SELECT COUNT(*) FROM doubt_replies dr WHERE dr.doubt_id = d.id) as reply_count
        FROM doubts d JOIN courses c ON d.course_id = c.id JOIN users u ON d.student_id = u.id
        WHERE d.course_id IN (SELECT id FROM courses WHERE faculty_id = ?)
        ORDER BY d.created_at DESC`, [req.user.id]);
    } else {
      doubts = queryAll(`SELECT d.*, c.name as course_name, u.name as student_name,
        (SELECT COUNT(*) FROM doubt_replies dr WHERE dr.doubt_id = d.id) as reply_count
        FROM doubts d JOIN courses c ON d.course_id = c.id JOIN users u ON d.student_id = u.id
        ORDER BY d.created_at DESC`);
    }
    res.json(doubts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/doubts/:id', authMiddleware, (req, res) => {
  try {
    const doubt = queryOne(`SELECT d.*, c.name as course_name, u.name as student_name FROM doubts d JOIN courses c ON d.course_id = c.id JOIN users u ON d.student_id = u.id WHERE d.id = ?`, [req.params.id]);
    if (!doubt) return res.status(404).json({ error: 'Doubt not found' });
    const replies = queryAll(`SELECT dr.*, u.name as user_name, u.role as user_role, u.avatar_color FROM doubt_replies dr JOIN users u ON dr.user_id = u.id WHERE dr.doubt_id = ? ORDER BY dr.created_at ASC`, [req.params.id]);
    res.json({ doubt, replies });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/doubts', authMiddleware, requireRole('student'), (req, res) => {
  try {
    const { title, description, course_id } = req.body;
    if (!title || !description || !course_id) return res.status(400).json({ error: 'Title, description and course required' });
    const { lastId } = runSql('INSERT INTO doubts (title, description, course_id, student_id) VALUES (?,?,?,?)', [title, description, course_id, req.user.id]);
    // Notify faculty
    const course = queryOne('SELECT faculty_id, name FROM courses WHERE id = ?', [course_id]);
    if (course) {
      runSql('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?,?,?,?,?)', [course.faculty_id, 'New Question', `${req.user.name} asked a question in ${course.name}`, 'doubt', '/doubts']);
    }
    res.status(201).json({ id: lastId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/doubts/:id/reply', authMiddleware, (req, res) => {
  try {
    const { reply_text } = req.body;
    if (!reply_text || !reply_text.trim()) return res.status(400).json({ error: 'Reply text required' });
    const doubt = queryOne('SELECT * FROM doubts WHERE id = ?', [req.params.id]);
    if (!doubt) return res.status(404).json({ error: 'Doubt not found' });
    runSql('INSERT INTO doubt_replies (doubt_id, user_id, reply_text) VALUES (?,?,?)', [req.params.id, req.user.id, reply_text.trim()]);
    // Mark as answered if faculty replies
    if (req.user.role === 'faculty') {
      runSql('UPDATE doubts SET status = ? WHERE id = ?', ['answered', req.params.id]);
      // Notify student
      runSql('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?,?,?,?,?)', [doubt.student_id, 'Doubt Answered', `${req.user.name} replied to your question: ${doubt.title}`, 'doubt', '/doubts']);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== ANNOUNCEMENTS ==========
app.get('/api/announcements', authMiddleware, (req, res) => {
  try {
    let announcements;
    if (req.user.role === 'student') {
      announcements = queryAll(`SELECT a.*, c.name as course_name, u.name as faculty_name 
        FROM announcements a LEFT JOIN courses c ON a.course_id = c.id LEFT JOIN users u ON a.faculty_id = u.id
        WHERE a.course_id IN (SELECT course_id FROM enrollments WHERE student_id = ?)
        ORDER BY a.created_at DESC`, [req.user.id]);
    } else if (req.user.role === 'faculty') {
      announcements = queryAll(`SELECT a.*, c.name as course_name FROM announcements a LEFT JOIN courses c ON a.course_id = c.id WHERE a.faculty_id = ? ORDER BY a.created_at DESC`, [req.user.id]);
    } else {
      announcements = queryAll(`SELECT a.*, c.name as course_name, u.name as faculty_name FROM announcements a LEFT JOIN courses c ON a.course_id = c.id LEFT JOIN users u ON a.faculty_id = u.id ORDER BY a.created_at DESC`);
    }
    res.json(announcements);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/announcements', authMiddleware, requireRole('faculty'), (req, res) => {
  try {
    const { title, content, course_id } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
    const { lastId } = runSql('INSERT INTO announcements (title, content, course_id, faculty_id) VALUES (?,?,?,?)', [title, content, course_id || null, req.user.id]);
    // Notify students
    if (course_id) {
      const students = queryAll('SELECT student_id FROM enrollments WHERE course_id = ?', [course_id]);
      students.forEach(s => {
        runSql('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?,?,?,?,?)', [s.student_id, 'New Announcement', `${title}`, 'announcement', '/announcements']);
      });
    }
    res.status(201).json({ id: lastId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== NOTIFICATIONS ==========
app.get('/api/notifications', authMiddleware, (req, res) => {
  try {
    const notifications = queryAll('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    const unread = queryOne('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0', [req.user.id]);
    res.json({ notifications, unread_count: unread?.count || 0 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/notifications/:id/read', authMiddleware, (req, res) => {
  try {
    runSql('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/notifications/read-all', authMiddleware, (req, res) => {
  try {
    runSql('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== USERS (Admin) ==========
app.get('/api/users', authMiddleware, requireRole('admin'), (req, res) => {
  try {
    const users = queryAll('SELECT id, name, email, role, department, avatar_color, created_at FROM users ORDER BY role, name');
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/users', authMiddleware, requireRole('admin'), (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ error: 'All fields required' });
    const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(409).json({ error: 'Email already exists' });
    const hash = bcrypt.hashSync(password, 10);
    const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const { lastId } = runSql('INSERT INTO users (name, email, password, role, department, avatar_color) VALUES (?,?,?,?,?,?)', [name, email, hash, role, department || '', color]);
    res.status(201).json({ id: lastId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/users/:id', authMiddleware, requireRole('admin'), (req, res) => {
  try {
    if (req.params.id == req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    runSql('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== ANALYTICS ==========
app.get('/api/analytics/dashboard', authMiddleware, (req, res) => {
  try {
    if (req.user.role === 'student') {
      const enrolledCourses = queryOne('SELECT COUNT(*) as count FROM enrollments WHERE student_id = ?', [req.user.id])?.count || 0;
      const totalAssignments = queryOne(`SELECT COUNT(*) as count FROM assignments WHERE course_id IN (SELECT course_id FROM enrollments WHERE student_id = ?)`, [req.user.id])?.count || 0;
      const submitted = queryOne(`SELECT COUNT(*) as count FROM submissions WHERE student_id = ?`, [req.user.id])?.count || 0;
      const graded = queryOne(`SELECT COUNT(*) as count FROM submissions WHERE student_id = ? AND status = 'graded'`, [req.user.id])?.count || 0;
      const pending = totalAssignments - submitted;
      const avgMarks = queryOne(`SELECT AVG(CAST(marks AS FLOAT) / CAST(a.max_marks AS FLOAT) * 100) as avg FROM submissions s JOIN assignments a ON s.assignment_id = a.id WHERE s.student_id = ? AND s.status = 'graded'`, [req.user.id])?.avg || 0;
      const upcomingDeadlines = queryAll(`SELECT a.id, a.title, a.deadline, c.name as course_name FROM assignments a JOIN courses c ON a.course_id = c.id WHERE a.course_id IN (SELECT course_id FROM enrollments WHERE student_id = ?) AND a.deadline > datetime('now') AND a.id NOT IN (SELECT assignment_id FROM submissions WHERE student_id = ?) ORDER BY a.deadline ASC LIMIT 5`, [req.user.id, req.user.id]);
      const recentAnnouncements = queryAll(`SELECT a.*, c.name as course_name FROM announcements a LEFT JOIN courses c ON a.course_id = c.id WHERE a.course_id IN (SELECT course_id FROM enrollments WHERE student_id = ?) ORDER BY a.created_at DESC LIMIT 3`, [req.user.id]);
      const performanceData = queryAll(`SELECT a.title, s.marks, a.max_marks, c.name as course_name FROM submissions s JOIN assignments a ON s.assignment_id = a.id JOIN courses c ON a.course_id = c.id WHERE s.student_id = ? AND s.status = 'graded' ORDER BY s.graded_at DESC`, [req.user.id]);
      res.json({ enrolledCourses, totalAssignments, submitted, graded, pending, avgMarks: Math.round(avgMarks), upcomingDeadlines, recentAnnouncements, performanceData });
    } else if (req.user.role === 'faculty') {
      const totalStudents = queryOne(`SELECT COUNT(DISTINCT e.student_id) as count FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.faculty_id = ?`, [req.user.id])?.count || 0;
      const assignedCourses = queryOne('SELECT COUNT(*) as count FROM courses WHERE faculty_id = ?', [req.user.id])?.count || 0;
      const totalAssignments = queryOne('SELECT COUNT(*) as count FROM assignments WHERE faculty_id = ?', [req.user.id])?.count || 0;
      const totalSubmissions = queryOne(`SELECT COUNT(*) as count FROM submissions s JOIN assignments a ON s.assignment_id = a.id WHERE a.faculty_id = ?`, [req.user.id])?.count || 0;
      const gradedSubmissions = queryOne(`SELECT COUNT(*) as count FROM submissions s JOIN assignments a ON s.assignment_id = a.id WHERE a.faculty_id = ? AND s.status = 'graded'`, [req.user.id])?.count || 0;
      const pendingSubmissions = totalSubmissions - gradedSubmissions;
      const recentQuestions = queryAll(`SELECT d.*, c.name as course_name, u.name as student_name FROM doubts d JOIN courses c ON d.course_id = c.id JOIN users u ON d.student_id = u.id WHERE c.faculty_id = ? ORDER BY d.created_at DESC LIMIT 5`, [req.user.id]);
      const courseStats = queryAll(`SELECT c.name as course_name, 
        (SELECT COUNT(*) FROM assignments a WHERE a.course_id = c.id) as assignments,
        (SELECT COUNT(DISTINCT e.student_id) FROM enrollments e WHERE e.course_id = c.id) as students,
        (SELECT COUNT(*) FROM submissions s JOIN assignments a ON s.assignment_id = a.id WHERE a.course_id = c.id) as submissions
        FROM courses c WHERE c.faculty_id = ?`, [req.user.id]);
      res.json({ totalStudents, assignedCourses, totalAssignments, totalSubmissions, gradedSubmissions, pendingSubmissions, recentQuestions, courseStats });
    } else {
      const totalStudents = queryOne("SELECT COUNT(*) as count FROM users WHERE role = 'student'")?.count || 0;
      const totalFaculty = queryOne("SELECT COUNT(*) as count FROM users WHERE role = 'faculty'")?.count || 0;
      const totalCourses = queryOne('SELECT COUNT(*) as count FROM courses')?.count || 0;
      const totalAssignments = queryOne('SELECT COUNT(*) as count FROM assignments')?.count || 0;
      const totalSubmissions = queryOne('SELECT COUNT(*) as count FROM submissions')?.count || 0;
      const totalNotes = queryOne('SELECT COUNT(*) as count FROM notes')?.count || 0;
      const recentUsers = queryAll('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5');
      res.json({ totalStudents, totalFaculty, totalCourses, totalAssignments, totalSubmissions, totalNotes, recentUsers });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== FACULTY LIST (for admin) ==========
app.get('/api/faculty', authMiddleware, (req, res) => {
  try {
    const faculty = queryAll("SELECT id, name, email, department FROM users WHERE role = 'faculty'");
    res.json(faculty);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== STUDY ASSISTANT ==========
app.post('/api/assistant/ask', authMiddleware, (req, res) => {
  try {
    const { question, type } = req.body;
    if (!question || !question.trim()) return res.status(400).json({ error: 'Question is required' });

    // Fallback AI assistant with predefined educational responses
    const q = question.toLowerCase().trim();
    let answer = '';

    if (type === 'summarize') {
      const words = question.split(/\s+/);
      const sentences = question.split(/[.!?]+/).filter(s => s.trim().length > 10);
      if (sentences.length <= 2) {
        answer = `📝 **Summary:** ${question.trim()}`;
      } else {
        const keysentences = sentences.slice(0, Math.ceil(sentences.length / 3));
        answer = `📝 **Summary (${keysentences.length} key points from ${sentences.length} sentences):**\n\n${keysentences.map((s, i) => `${i+1}. ${s.trim()}`).join('\n')}\n\n*Word count reduced from ${words.length} to approximately ${keysentences.join(' ').split(/\s+/).length} words.*`;
      }
    } else if (type === 'generate-questions') {
      const topics = question.split(/[,.\n]+/).filter(s => s.trim().length > 3).slice(0, 8);
      answer = `📋 **Revision Questions Generated:**\n\n${topics.map((t, i) => `**Q${i+1}.** Explain the concept of ${t.trim()} in detail.\n**Q${i+1}b.** What are the real-world applications of ${t.trim()}?\n`).join('\n')}`;
      if (topics.length === 0) answer = '📋 Please provide some topics or notes content to generate questions from.';
    } else {
      // General Q&A with educational fallback
      const responses = {
        'binary search tree': '🌳 **Binary Search Tree (BST)**\n\nA BST is a binary tree where:\n- Left child < Parent < Right child\n- Enables O(log n) search, insert, delete on average\n- Worst case O(n) when degenerate (linked list form)\n\n**Operations:** Insert, Search, Delete, Traversal (Inorder gives sorted order)\n\n**Applications:** Databases, symbol tables, priority queues',
        'sorting': '📊 **Sorting Algorithms Comparison**\n\n| Algorithm | Best | Average | Worst | Stable |\n|-----------|------|---------|-------|--------|\n| Bubble Sort | O(n) | O(n²) | O(n²) | Yes |\n| Merge Sort | O(n log n) | O(n log n) | O(n log n) | Yes |\n| Quick Sort | O(n log n) | O(n log n) | O(n²) | No |\n| Heap Sort | O(n log n) | O(n log n) | O(n log n) | No |\n\n**Tip:** Use Merge Sort for stability, Quick Sort for average performance.',
        'react': '⚛️ **React Fundamentals**\n\nReact is a JavaScript library for building UIs:\n\n1. **Components** - Reusable UI building blocks\n2. **JSX** - JavaScript XML syntax\n3. **State** - Component data that can change\n4. **Props** - Data passed from parent to child\n5. **Hooks** - useState, useEffect, useContext\n\n**Virtual DOM** makes React fast by minimizing actual DOM updates.',
        'css': '🎨 **CSS Layout Systems**\n\n**Flexbox** - 1D layouts (rows/columns):\n```css\ndisplay: flex; justify-content: center;\n```\n\n**Grid** - 2D layouts:\n```css\ndisplay: grid; grid-template-columns: repeat(3, 1fr);\n```\n\n**When to use:** Flexbox for navbars/cards, Grid for page layouts.',
        'eigenvalue': '🔢 **Eigenvalues & Eigenvectors**\n\nFor matrix A, eigenvalue λ satisfies: **Av = λv**\n\n**Steps to find:**\n1. Solve det(A - λI) = 0 (characteristic equation)\n2. Find λ values (eigenvalues)\n3. For each λ, solve (A - λI)v = 0 for eigenvectors\n\n**Applications:** PCA, quantum mechanics, vibration analysis',
        'matrix': '🔢 **Matrix Operations**\n\n**Multiplication:** (m×n) × (n×p) = (m×p)\n- Row × Column = Element\n\n**Determinant (2×2):** ad - bc\n**Determinant (3×3):** Expand along first row\n\n**Inverse:** A⁻¹ = adj(A)/det(A)\n\n**Properties:** Not commutative (AB ≠ BA generally)',
        'linked list': '🔗 **Linked Lists**\n\n**Types:** Singly, Doubly, Circular\n\n**Operations:** Insert O(1), Delete O(1), Search O(n)\n\n**vs Array:** Dynamic size, efficient insertion/deletion, but no random access\n\n**Applications:** Memory allocation, undo functionality, hash table chaining',
        'graph': '📊 **Graph Algorithms**\n\n**BFS** - Level by level (Queue)\n- Shortest path in unweighted graphs\n\n**DFS** - Deep first (Stack/Recursion)\n- Topological sort, cycle detection\n\n**Dijkstra** - Shortest path (weighted)\n**Kruskal/Prim** - Minimum spanning tree',
      };

      let found = false;
      for (const [key, response] of Object.entries(responses)) {
        if (q.includes(key)) { answer = response; found = true; break; }
      }
      if (!found) {
        answer = `🤖 **Study Assistant Response**\n\nGreat question about "${question.substring(0, 100)}"!\n\nHere are some study tips:\n\n1. **Break it down** - Divide the concept into smaller parts\n2. **Practice problems** - Apply the theory with examples\n3. **Teach others** - Explaining concepts reinforces understanding\n4. **Use diagrams** - Visual representations aid memory\n5. **Review regularly** - Spaced repetition improves retention\n\n💡 *This is a fallback study assistant. For detailed AI-powered responses, configure an AI API key in the server settings.*`;
      }
    }

    res.json({ answer, isAI: false, notice: 'This is a local fallback assistant. Connect an AI API for advanced responses.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== PROFILE ==========
app.put('/api/profile', authMiddleware, (req, res) => {
  try {
    const { name, department } = req.body;
    runSql('UPDATE users SET name=?, department=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [name || req.user.name, department || '', req.user.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== SPA CLIENT FALLBACK ==========
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

// ========== START ==========
async function start() {
  await initializeDatabase();
  await seedDatabase();
  app.listen(PORT, () => {
    console.log(`\n🚀 EduConnect AI Server running at http://localhost:${PORT}`);
    console.log(`\n📋 Demo Credentials:`);
    console.log(`   Admin:   admin@educonnect.com / admin123`);
    console.log(`   Faculty: sarah@educonnect.com / faculty123`);
    console.log(`   Faculty: michael@educonnect.com / faculty123`);
    console.log(`   Student: alice@educonnect.com / student123`);
    console.log(`   Student: bob@educonnect.com / student123`);
    console.log(`   Student: carol@educonnect.com / student123`);
    console.log(`   Student: david@educonnect.com / student123`);
    console.log(`   Student: eva@educonnect.com / student123\n`);
  });
}

start().catch(console.error);
