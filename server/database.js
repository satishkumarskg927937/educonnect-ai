import initSqlJs from 'sql.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'educonnect.db');

let db = null;

function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Auto-save every 5 seconds
setInterval(saveDb, 5000);

export async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  
  db.run('PRAGMA foreign_keys = ON');
  return db;
}

export async function initializeDatabase() {
  const d = await getDb();
  
  d.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student','faculty','admin')),
      department TEXT DEFAULT '',
      avatar_color TEXT DEFAULT '#4F46E5',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  d.run(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      department TEXT DEFAULT '',
      faculty_id INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  d.run(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  d.run(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, course_id)
    )
  `);

  d.run(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      faculty_id INTEGER NOT NULL REFERENCES users(id),
      deadline DATETIME NOT NULL,
      max_marks INTEGER NOT NULL DEFAULT 100,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','closed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  d.run(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      answer_text TEXT NOT NULL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      marks INTEGER DEFAULT NULL,
      feedback TEXT DEFAULT NULL,
      graded_at DATETIME DEFAULT NULL,
      graded_by INTEGER DEFAULT NULL REFERENCES users(id),
      status TEXT DEFAULT 'submitted' CHECK(status IN ('submitted','graded')),
      UNIQUE(assignment_id, student_id)
    )
  `);

  d.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      faculty_id INTEGER NOT NULL REFERENCES users(id),
      published INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  d.run(`
    CREATE TABLE IF NOT EXISTS doubts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES users(id),
      status TEXT DEFAULT 'open' CHECK(status IN ('open','answered')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  d.run(`
    CREATE TABLE IF NOT EXISTS doubt_replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doubt_id INTEGER NOT NULL REFERENCES doubts(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      reply_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  d.run(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      faculty_id INTEGER NOT NULL REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  d.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      link TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDb();
  console.log('Database tables created.');
}

export async function seedDatabase() {
  const d = await getDb();
  
  const result = d.exec('SELECT COUNT(*) as count FROM users');
  const count = result[0]?.values[0]?.[0] || 0;
  
  if (count > 0) {
    console.log('Database already seeded. Skipping.');
    return;
  }

  console.log('Seeding database with demo data...');

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  // Users
  d.run('INSERT INTO users (name, email, password, role, department, avatar_color) VALUES (?,?,?,?,?,?)', ['Admin User', 'admin@educonnect.com', hash('admin123'), 'admin', 'Administration', '#6366F1']);
  d.run('INSERT INTO users (name, email, password, role, department, avatar_color) VALUES (?,?,?,?,?,?)', ['Dr. Sarah Johnson', 'sarah@educonnect.com', hash('faculty123'), 'faculty', 'Computer Science', '#8B5CF6']);
  d.run('INSERT INTO users (name, email, password, role, department, avatar_color) VALUES (?,?,?,?,?,?)', ['Prof. Michael Chen', 'michael@educonnect.com', hash('faculty123'), 'faculty', 'Mathematics', '#EC4899']);
  d.run('INSERT INTO users (name, email, password, role, department, avatar_color) VALUES (?,?,?,?,?,?)', ['Alice Williams', 'alice@educonnect.com', hash('student123'), 'student', 'Computer Science', '#14B8A6']);
  d.run('INSERT INTO users (name, email, password, role, department, avatar_color) VALUES (?,?,?,?,?,?)', ['Bob Martinez', 'bob@educonnect.com', hash('student123'), 'student', 'Computer Science', '#F59E0B']);
  d.run('INSERT INTO users (name, email, password, role, department, avatar_color) VALUES (?,?,?,?,?,?)', ['Carol Davis', 'carol@educonnect.com', hash('student123'), 'student', 'Mathematics', '#EF4444']);
  d.run('INSERT INTO users (name, email, password, role, department, avatar_color) VALUES (?,?,?,?,?,?)', ['David Lee', 'david@educonnect.com', hash('student123'), 'student', 'Computer Science', '#3B82F6']);
  d.run('INSERT INTO users (name, email, password, role, department, avatar_color) VALUES (?,?,?,?,?,?)', ['Eva Brown', 'eva@educonnect.com', hash('student123'), 'student', 'Mathematics', '#10B981']);

  // Courses
  d.run('INSERT INTO courses (name, code, description, department, faculty_id) VALUES (?,?,?,?,?)', ['Data Structures & Algorithms', 'CS201', 'Fundamental data structures and algorithm design techniques', 'Computer Science', 2]);
  d.run('INSERT INTO courses (name, code, description, department, faculty_id) VALUES (?,?,?,?,?)', ['Web Development', 'CS301', 'Modern full-stack web development with React and Node.js', 'Computer Science', 2]);
  d.run('INSERT INTO courses (name, code, description, department, faculty_id) VALUES (?,?,?,?,?)', ['Linear Algebra', 'MATH201', 'Vectors, matrices, eigenvalues, and linear transformations', 'Mathematics', 3]);

  // Subjects
  d.run('INSERT INTO subjects (name, code, course_id) VALUES (?,?,?)', ['Arrays & Linked Lists', 'CS201-1', 1]);
  d.run('INSERT INTO subjects (name, code, course_id) VALUES (?,?,?)', ['Trees & Graphs', 'CS201-2', 1]);
  d.run('INSERT INTO subjects (name, code, course_id) VALUES (?,?,?)', ['Sorting & Searching', 'CS201-3', 1]);
  d.run('INSERT INTO subjects (name, code, course_id) VALUES (?,?,?)', ['HTML & CSS', 'CS301-1', 2]);
  d.run('INSERT INTO subjects (name, code, course_id) VALUES (?,?,?)', ['JavaScript & React', 'CS301-2', 2]);
  d.run('INSERT INTO subjects (name, code, course_id) VALUES (?,?,?)', ['Node.js & APIs', 'CS301-3', 2]);
  d.run('INSERT INTO subjects (name, code, course_id) VALUES (?,?,?)', ['Vectors & Matrices', 'MATH201-1', 3]);
  d.run('INSERT INTO subjects (name, code, course_id) VALUES (?,?,?)', ['Eigenvalues', 'MATH201-2', 3]);

  // Enrollments
  const enrollments = [[4,1],[4,2],[5,1],[5,2],[7,1],[7,2],[6,3],[8,3],[6,1]];
  enrollments.forEach(([s,c]) => d.run('INSERT INTO enrollments (student_id, course_id) VALUES (?,?)', [s,c]));

  // Assignments
  d.run('INSERT INTO assignments (title, description, course_id, faculty_id, deadline, max_marks, created_at) VALUES (?,?,?,?,?,?,?)', ['Implement a Binary Search Tree', 'Write a complete BST implementation with insert, delete, search, and traversal operations. Include time complexity analysis.', 1, 2, '2026-10-20 23:59:00', 100, '2026-10-01 10:00:00']);
  d.run('INSERT INTO assignments (title, description, course_id, faculty_id, deadline, max_marks, created_at) VALUES (?,?,?,?,?,?,?)', ['Graph Traversal Algorithms', 'Implement BFS and DFS algorithms. Provide examples with at least 5 nodes. Explain the difference in use cases.', 1, 2, '2026-10-25 23:59:00', 80, '2026-10-02 10:00:00']);
  d.run('INSERT INTO assignments (title, description, course_id, faculty_id, deadline, max_marks, created_at) VALUES (?,?,?,?,?,?,?)', ['Build a Portfolio Website', 'Create a responsive personal portfolio using HTML, CSS, and JavaScript. Must include at least 4 sections.', 2, 2, '2026-10-22 23:59:00', 100, '2026-10-03 10:00:00']);
  d.run('INSERT INTO assignments (title, description, course_id, faculty_id, deadline, max_marks, created_at) VALUES (?,?,?,?,?,?,?)', ['React Todo Application', 'Build a Todo app with React including add, delete, edit, and filter functionality. Use React hooks.', 2, 2, '2026-10-28 23:59:00', 100, '2026-10-05 10:00:00']);
  d.run('INSERT INTO assignments (title, description, course_id, faculty_id, deadline, max_marks, created_at) VALUES (?,?,?,?,?,?,?)', ['Matrix Operations', 'Solve the given set of matrix multiplication and determinant problems. Show all steps.', 3, 3, '2026-10-18 23:59:00', 50, '2026-10-01 10:00:00']);
  d.run('INSERT INTO assignments (title, description, course_id, faculty_id, deadline, max_marks, created_at) VALUES (?,?,?,?,?,?,?)', ['Eigenvalue Problems', 'Find eigenvalues and eigenvectors for the given 3x3 matrices. Verify your solutions.', 3, 3, '2026-10-30 23:59:00', 60, '2026-10-08 10:00:00']);

  // Submissions
  d.run('INSERT INTO submissions (assignment_id, student_id, answer_text, submitted_at, marks, feedback, graded_at, graded_by, status) VALUES (?,?,?,?,?,?,?,?,?)', [1, 4, 'Here is my BST implementation:\n\nclass Node:\n  def __init__(self, val):\n    self.val = val\n    self.left = None\n    self.right = None\n\nclass BST:\n  def insert(self, root, val): ...\n  def search(self, root, val): ...\n  def delete(self, root, val): ...\n  def inorder(self, root): ...\n\nTime Complexity: O(log n) average, O(n) worst case', '2026-10-08 14:30:00', 92, 'Excellent implementation! Clean code and good complexity analysis. Minor: could add balancing discussion.', '2026-10-09 10:00:00', 2, 'graded']);
  d.run('INSERT INTO submissions (assignment_id, student_id, answer_text, submitted_at, marks, feedback, graded_at, graded_by, status) VALUES (?,?,?,?,?,?,?,?,?)', [1, 5, 'My BST solution uses a recursive approach with TreeNode class...', '2026-10-09 16:00:00', null, null, null, null, 'submitted']);
  d.run('INSERT INTO submissions (assignment_id, student_id, answer_text, submitted_at, marks, feedback, graded_at, graded_by, status) VALUES (?,?,?,?,?,?,?,?,?)', [3, 4, 'Portfolio website completed with: Hero section, About Me, Projects gallery with hover effects, Contact form with validation. Used CSS Grid and Flexbox for responsive design.', '2026-10-10 09:00:00', 88, 'Great work! Beautiful design. Could improve accessibility with ARIA labels.', '2026-10-10 11:00:00', 2, 'graded']);
  d.run('INSERT INTO submissions (assignment_id, student_id, answer_text, submitted_at, marks, feedback, graded_at, graded_by, status) VALUES (?,?,?,?,?,?,?,?,?)', [5, 6, 'Matrix Multiplication Solutions:\nQ1: A×B = [[19,22],[43,50]]\nQ2: det(A) = -2\nQ3: A×B×C = [[58,64],[139,154]]\nAll steps shown with intermediate calculations.', '2026-10-10 08:00:00', 45, 'Very good! All answers correct.', '2026-10-10 12:00:00', 3, 'graded']);
  d.run('INSERT INTO submissions (assignment_id, student_id, answer_text, submitted_at, marks, feedback, graded_at, graded_by, status) VALUES (?,?,?,?,?,?,?,?,?)', [5, 8, 'Solutions for Matrix Operations:\nProblem 1: Used row-column multiplication method\nResult: [[19,22],[43,50]]\nProblem 2: Determinant using cofactor expansion\ndet = -2', '2026-10-10 10:00:00', null, null, null, null, 'submitted']);

  // Notes
  d.run('INSERT INTO notes (title, content, course_id, faculty_id, created_at) VALUES (?,?,?,?,?)', ['Introduction to Binary Trees', 'A binary tree is a tree data structure where each node has at most two children.\n\nKey Properties:\n- Maximum nodes at level l = 2^l\n- Maximum nodes in tree of height h = 2^(h+1) - 1\n\nTypes: Full, Complete, Perfect, Balanced\n\nTraversal Methods:\n- Inorder (Left, Root, Right)\n- Preorder (Root, Left, Right)\n- Postorder (Left, Right, Root)\n- Level Order (BFS)', 1, 2, '2026-10-01 09:00:00']);
  d.run('INSERT INTO notes (title, content, course_id, faculty_id, created_at) VALUES (?,?,?,?,?)', ['CSS Flexbox & Grid Guide', 'CSS Layout Systems\n\nFlexbox - One-dimensional layout:\ndisplay: flex; justify-content: center; align-items: center;\n\nCSS Grid - Two-dimensional layout:\ndisplay: grid; grid-template-columns: repeat(3, 1fr);\n\nWhen to use: Flexbox for navbars, card rows. Grid for page layouts, dashboards.', 2, 2, '2026-10-02 09:00:00']);
  d.run('INSERT INTO notes (title, content, course_id, faculty_id, created_at) VALUES (?,?,?,?,?)', ['React Hooks Deep Dive', 'useState - Manages component state\nuseEffect - Handles side effects\nuseContext - Access context without prop drilling\nuseMemo & useCallback - Performance optimization\n\nCustom Hooks extract reusable logic into functions.', 2, 2, '2026-10-04 09:00:00']);
  d.run('INSERT INTO notes (title, content, course_id, faculty_id, created_at) VALUES (?,?,?,?,?)', ['Vector Spaces & Linear Transformations', 'A vector space V over field F satisfies closure, associativity, commutativity, identity, and distributive properties.\n\nLinear Independence: c1v1 + c2v2 + ... + cnvn = 0 implies all ci = 0\n\nBasis: linearly independent spanning set\nDimension: number of vectors in basis\n\nEvery linear transformation can be represented by a matrix.', 3, 3, '2026-10-03 09:00:00']);

  // Doubts
  d.run('INSERT INTO doubts (title, description, course_id, student_id, status, created_at) VALUES (?,?,?,?,?,?)', ['BST vs AVL Tree - When to use which?', 'I understand that AVL trees are balanced BSTs, but when should we prefer a regular BST over an AVL tree?', 1, 4, 'answered', '2026-10-05 14:00:00']);
  d.run('INSERT INTO doubts (title, description, course_id, student_id, status, created_at) VALUES (?,?,?,?,?,?)', ['Flexbox vs Grid for responsive nav?', 'Should I use Flexbox or CSS Grid for a responsive navigation bar?', 2, 5, 'answered', '2026-10-06 10:00:00']);
  d.run('INSERT INTO doubts (title, description, course_id, student_id, status, created_at) VALUES (?,?,?,?,?,?)', ['How to find eigenvalues of a 3x3 matrix?', 'I am struggling with finding eigenvalues for larger matrices. Any tips?', 3, 6, 'open', '2026-10-08 16:00:00']);

  // Doubt replies
  d.run('INSERT INTO doubt_replies (doubt_id, user_id, reply_text, created_at) VALUES (?,?,?,?)', [1, 2, 'Great question! Use regular BST when data is random and insertions are rare. Use AVL when you need guaranteed O(log n) operations.', '2026-10-05 16:00:00']);
  d.run('INSERT INTO doubt_replies (doubt_id, user_id, reply_text, created_at) VALUES (?,?,?,?)', [2, 2, 'For navigation bars, Flexbox is better! Navigation is one-dimensional. Use: nav { display: flex; justify-content: space-between; }', '2026-10-06 14:00:00']);

  // Announcements
  d.run('INSERT INTO announcements (title, content, course_id, faculty_id, created_at) VALUES (?,?,?,?,?)', ['Mid-Term Exam Schedule', 'The mid-term examination for Data Structures will be held on October 25th, 2026. Topics: Arrays, Linked Lists, Stacks, Queues, Binary Trees.', 1, 2, '2026-10-05 09:00:00']);
  d.run('INSERT INTO announcements (title, content, course_id, faculty_id, created_at) VALUES (?,?,?,?,?)', ['Guest Lecture on React 19', 'Guest lecture by a senior engineer on React 19 features. Date: October 15th, 3 PM. Attendance mandatory.', 2, 2, '2026-10-07 09:00:00']);
  d.run('INSERT INTO announcements (title, content, course_id, faculty_id, created_at) VALUES (?,?,?,?,?)', ['Linear Algebra Lab Sessions', 'Weekly lab sessions starting next week using MATLAB. Fridays 2-4 PM.', 3, 3, '2026-10-06 09:00:00']);

  // Notifications
  const notifs = [
    [4, 'Assignment Graded', 'Your BST assignment has been graded. You scored 92/100.', 'grade', 0, '/assignments'],
    [4, 'New Assignment', 'New assignment: React Todo Application in Web Development.', 'assignment', 0, '/assignments'],
    [4, 'New Announcement', 'Mid-Term Exam Schedule posted for Data Structures.', 'announcement', 1, '/assignments'],
    [5, 'New Assignment', 'New assignment: Graph Traversal Algorithms in DSA.', 'assignment', 0, '/assignments'],
    [5, 'Doubt Answered', 'Dr. Sarah Johnson replied to your question about Flexbox vs Grid.', 'doubt', 1, '/doubts'],
    [6, 'Assignment Graded', 'Your Matrix Operations has been graded. You scored 45/50.', 'grade', 0, '/assignments'],
    [2, 'New Submission', 'Bob Martinez submitted BST assignment.', 'submission', 0, '/submissions'],
    [2, 'New Question', 'Alice Williams asked about BST vs AVL Tree.', 'doubt', 1, '/doubts'],
  ];
  notifs.forEach(([uid, title, msg, type, read, link]) => {
    d.run('INSERT INTO notifications (user_id, title, message, type, is_read, link) VALUES (?,?,?,?,?,?)', [uid, title, msg, type, read, link]);
  });

  saveDb();
  console.log('Database seeded successfully!');
}

// Helper to run queries and get results as objects
export function queryAll(sql, params = []) {
  const d = db;
  const stmt = d.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results[0] || null;
}

export function runSql(sql, params = []) {
  const d = db;
  d.run(sql, params);
  const changes = d.getRowsModified();
  const lastId = queryOne('SELECT last_insert_rowid() as id')?.id;
  saveDb();
  return { changes, lastId };
}

export { saveDb };
export default db;
