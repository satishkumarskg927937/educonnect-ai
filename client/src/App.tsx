import { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import {
  LayoutDashboard, BookOpen, FileText, GraduationCap, MessageCircle,
  Bell, User, LogOut, Plus, Search, Menu, X, ChevronRight,
  Clock, CheckCircle, AlertCircle, BarChart3, Users, BookMarked,
  Send, Eye, Star, Award, Calendar, Megaphone, Bot, Settings,
  ClipboardList, Layers, Edit, Trash2, Check, BellRing, HelpCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// ==================== TYPES ====================
interface UserData {
  id: number; name: string; email: string; role: string;
  department: string; avatar_color: string;
}

// ==================== APP ====================
export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState(localStorage.getItem('educonnect_token'));
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const showToast = useCallback((msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    if (token) {
      api.me().then(u => { setUser(u); setLoading(false); })
        .catch(() => { localStorage.removeItem('educonnect_token'); setToken(null); setLoading(false); });
    } else { setLoading(false); }
  }, [token]);

  const handleLogin = (tkn: string, userData: UserData) => {
    localStorage.setItem('educonnect_token', tkn);
    setToken(tkn);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('educonnect_token');
    setToken(null);
    setUser(null);
  };

  if (loading) return <div className="loading" style={{ height: '100vh' }}><div className="spinner" /> Loading...</div>;
  if (!user) return <LoginPage onLogin={handleLogin} showToast={showToast} />;

  return (
    <>
      <Dashboard user={user} onLogout={handleLogout} showToast={showToast} />
      {toast && <div className={`toast ${toast.type}`}>{toast.type === 'success' ? <CheckCircle size={18} /> : toast.type === 'error' ? <AlertCircle size={18} /> : <Bell size={18} />}{toast.msg}</div>}
    </>
  );
}

// ==================== LOGIN PAGE ====================
function LoginPage({ onLogin, showToast }: { onLogin: (t: string, u: UserData) => void; showToast: (m: string, t?: string) => void }) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (tab === 'login') {
        const data = await api.login(email, password);
        onLogin(data.token, data.user);
      } else {
        if (!name.trim()) { setError('Name is required'); setBusy(false); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); setBusy(false); return; }
        const data = await api.register({ name, email, password, role, department });
        onLogin(data.token, data.user);
      }
    } catch (err: any) {
      setError(err.message);
    }
    setBusy(false);
  };

  const demoLogin = async (demoEmail: string, demoPass: string) => {
    setBusy(true);
    setError('');
    try {
      const data = await api.login(demoEmail, demoPass);
      onLogin(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo">
            <div className="login-logo-icon">E</div>
            <h1>EduConnect AI</h1>
          </div>
          <p className="login-subtitle">Intelligent Faculty–Student Academic Collaboration Platform</p>

          <div className="login-tabs">
            <button className={`login-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Sign In</button>
            <button className={`login-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Register</button>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            {tab === 'register' && (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input className="form-input" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input className="form-input" placeholder="e.g. Computer Science" value={department} onChange={e => setDepartment(e.target.value)} />
                </div>
              </>
            )}
            <div className="form-group">
              <label>Email</label>
              <input className="form-input" type="email" placeholder="you@educonnect.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button className="btn-login" disabled={busy}>{busy ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}</button>
          </form>

          <div className="demo-credentials">
            <h4>🔑 Quick Demo Access</h4>
            <button className="demo-btn" onClick={() => demoLogin('admin@educonnect.com', 'admin123')} disabled={busy}>
              <span className="demo-role">Admin</span> — admin@educonnect.com
            </button>
            <button className="demo-btn" onClick={() => demoLogin('sarah@educonnect.com', 'faculty123')} disabled={busy}>
              <span className="demo-role">Faculty</span> — Dr. Sarah Johnson
            </button>
            <button className="demo-btn" onClick={() => demoLogin('michael@educonnect.com', 'faculty123')} disabled={busy}>
              <span className="demo-role">Faculty</span> — Prof. Michael Chen
            </button>
            <button className="demo-btn" onClick={() => demoLogin('alice@educonnect.com', 'student123')} disabled={busy}>
              <span className="demo-role">Student</span> — Alice Williams
            </button>
            <button className="demo-btn" onClick={() => demoLogin('bob@educonnect.com', 'student123')} disabled={busy}>
              <span className="demo-role">Student</span> — Bob Martinez
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN DASHBOARD SHELL ====================
function Dashboard({ user, onLogout, showToast }: { user: UserData; onLogout: () => void; showToast: (m: string, t?: string) => void }) {
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifCount = useCallback(() => {
    api.getNotifications().then(d => setUnreadCount(d.unread_count)).catch(() => {});
  }, []);

  useEffect(() => { fetchNotifCount(); const i = setInterval(fetchNotifCount, 30000); return () => clearInterval(i); }, [fetchNotifCount]);

  const navItems = getNavItems(user.role, unreadCount);

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">E</div>
            <div><h2>EduConnect AI</h2><span>Academic Platform</span></div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-title">Menu</div>
          {navItems.map(item => (
            <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => { setPage(item.id); setSidebarOpen(false); }}>
              {item.icon}
              {item.label}
              {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-card" onClick={() => { setPage('profile'); setSidebarOpen(false); }}>
            <div className="user-avatar" style={{ background: user.avatar_color }}>{user.name.charAt(0)}</div>
            <div className="user-info">
              <div className="user-name">{user.name}</div>
              <div className="user-role">{user.role}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="page-title">{navItems.find(n => n.id === page)?.label || 'Profile'}</h1>
          </div>
          <div className="topbar-right">
            <button className="notif-btn" onClick={() => setPage('notifications')}>
              <Bell size={18} />
              {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
          </div>
        </header>

        <div className="page-content">
          <PageRouter page={page} user={user} showToast={showToast} setPage={setPage} refreshNotifs={fetchNotifCount} />
        </div>
      </main>
    </div>
  );
}

function getNavItems(role: string, unread: number) {
  const items: { id: string; label: string; icon: any; badge?: number }[] = [];
  if (role === 'student') {
    items.push(
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      { id: 'courses', label: 'My Courses', icon: <BookOpen size={18} /> },
      { id: 'assignments', label: 'Assignments', icon: <FileText size={18} /> },
      { id: 'notes', label: 'Notes', icon: <BookMarked size={18} /> },
      { id: 'doubts', label: 'Doubt Discussion', icon: <MessageCircle size={18} /> },
      { id: 'assistant', label: 'Study Assistant', icon: <Bot size={18} /> },
      { id: 'notifications', label: 'Notifications', icon: <Bell size={18} />, badge: unread || undefined },
      { id: 'profile', label: 'Profile', icon: <User size={18} /> },
    );
  } else if (role === 'faculty') {
    items.push(
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      { id: 'courses', label: 'My Courses', icon: <BookOpen size={18} /> },
      { id: 'assignments', label: 'Assignments', icon: <FileText size={18} /> },
      { id: 'submissions', label: 'Submissions & Grading', icon: <ClipboardList size={18} /> },
      { id: 'notes', label: 'Notes', icon: <BookMarked size={18} /> },
      { id: 'doubts', label: 'Student Doubts', icon: <MessageCircle size={18} /> },
      { id: 'announcements', label: 'Announcements', icon: <Megaphone size={18} /> },
      { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
      { id: 'notifications', label: 'Notifications', icon: <Bell size={18} />, badge: unread || undefined },
      { id: 'profile', label: 'Profile', icon: <User size={18} /> },
    );
  } else {
    items.push(
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      { id: 'users', label: 'Users', icon: <Users size={18} /> },
      { id: 'courses', label: 'Courses', icon: <BookOpen size={18} /> },
      { id: 'subjects', label: 'Subjects', icon: <Layers size={18} /> },
      { id: 'assignments', label: 'Assignments Overview', icon: <FileText size={18} /> },
      { id: 'notifications', label: 'Notifications', icon: <Bell size={18} />, badge: unread || undefined },
      { id: 'profile', label: 'Profile', icon: <User size={18} /> },
    );
  }
  return items;
}

// ==================== PAGE ROUTER ====================
function PageRouter({ page, user, showToast, setPage, refreshNotifs }: any) {
  switch (page) {
    case 'dashboard': return <DashboardPage user={user} setPage={setPage} />;
    case 'courses': return <CoursesPage user={user} showToast={showToast} />;
    case 'assignments': return <AssignmentsPage user={user} showToast={showToast} refreshNotifs={refreshNotifs} />;
    case 'submissions': return <SubmissionsPage user={user} showToast={showToast} refreshNotifs={refreshNotifs} />;
    case 'notes': return <NotesPage user={user} showToast={showToast} />;
    case 'doubts': return <DoubtsPage user={user} showToast={showToast} refreshNotifs={refreshNotifs} />;
    case 'announcements': return <AnnouncementsPage user={user} showToast={showToast} />;
    case 'notifications': return <NotificationsPage user={user} refreshNotifs={refreshNotifs} />;
    case 'assistant': return <AssistantPage user={user} />;
    case 'analytics': return <AnalyticsPage user={user} />;
    case 'users': return <UsersPage user={user} showToast={showToast} />;
    case 'subjects': return <SubjectsPage user={user} showToast={showToast} />;
    case 'profile': return <ProfilePage user={user} showToast={showToast} />;
    default: return <DashboardPage user={user} setPage={setPage} />;
  }
}

// ==================== DASHBOARD ====================
function DashboardPage({ user, setPage }: { user: UserData; setPage: (p: string) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /> Loading dashboard...</div>;
  if (!data) return <div className="empty-state"><AlertCircle /><h3>Unable to load dashboard</h3></div>;

  if (user.role === 'student') return <StudentDashboard data={data} user={user} setPage={setPage} />;
  if (user.role === 'faculty') return <FacultyDashboard data={data} user={user} setPage={setPage} />;
  return <AdminDashboard data={data} user={user} />;
}

function StudentDashboard({ data, user, setPage }: any) {
  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444'];
  const chartData = [
    { name: 'Submitted', value: data.submitted },
    { name: 'Graded', value: data.graded },
    { name: 'Pending', value: data.pending > 0 ? data.pending : 0 },
  ].filter(d => d.value > 0);

  return (
    <>
      <div className="welcome-banner">
        <h2>Welcome back, {user.name}! 👋</h2>
        <p>Track your academic progress, submit assignments, and explore study materials.</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card blue"><div className="stat-card-header"><span className="stat-card-title">Enrolled Courses</span><div className="stat-card-icon blue"><BookOpen size={20} /></div></div><div className="stat-card-value">{data.enrolledCourses}</div></div>
        <div className="stat-card purple"><div className="stat-card-header"><span className="stat-card-title">Total Assignments</span><div className="stat-card-icon purple"><FileText size={20} /></div></div><div className="stat-card-value">{data.totalAssignments}</div></div>
        <div className="stat-card green"><div className="stat-card-header"><span className="stat-card-title">Submitted</span><div className="stat-card-icon green"><CheckCircle size={20} /></div></div><div className="stat-card-value">{data.submitted}</div><div className="stat-card-sub">{data.graded} graded</div></div>
        <div className="stat-card orange"><div className="stat-card-header"><span className="stat-card-title">Pending</span><div className="stat-card-icon orange"><Clock size={20} /></div></div><div className="stat-card-value">{data.pending > 0 ? data.pending : 0}</div></div>
        <div className="stat-card blue"><div className="stat-card-header"><span className="stat-card-title">Avg. Score</span><div className="stat-card-icon blue"><Award size={20} /></div></div><div className="stat-card-value">{data.avgMarks}%</div></div>
      </div>
      <div className="content-grid">
        <div className="card">
          <div className="card-header"><span className="card-title"><Clock size={18} /> Upcoming Deadlines</span></div>
          <div className="card-body no-pad">
            {data.upcomingDeadlines?.length > 0 ? (
              <table className="data-table">
                <thead><tr><th>Assignment</th><th>Course</th><th>Deadline</th></tr></thead>
                <tbody>
                  {data.upcomingDeadlines.map((d: any) => (
                    <tr key={d.id}><td>{d.title}</td><td>{d.course_name}</td><td className="deadline-highlight">{formatDate(d.deadline)}</td></tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="empty-state"><CheckCircle /><h3>All caught up!</h3><p>No pending deadlines</p></div>}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title"><BarChart3 size={18} /> Assignment Status</span></div>
          <div className="card-body">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="empty-state"><BarChart3 /><h3>No data yet</h3></div>}
          </div>
        </div>
      </div>
      {data.performanceData?.length > 0 && (
        <div className="card mb-6">
          <div className="card-header"><span className="card-title"><Award size={18} /> Performance</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.performanceData.map((p: any) => ({ name: p.title.substring(0, 20), marks: p.marks, max: p.max_marks }))}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="marks" fill="#6366F1" radius={[4, 4, 0, 0]} name="Score" />
                <Bar dataKey="max" fill="#E2E8F0" radius={[4, 4, 0, 0]} name="Max" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {data.recentAnnouncements?.length > 0 && (
        <div className="card">
          <div className="card-header"><span className="card-title"><Megaphone size={18} /> Recent Announcements</span></div>
          <div className="card-body">
            {data.recentAnnouncements.map((a: any) => (
              <div key={a.id} className="announcement-card" style={{ border: 'none', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                <h3 style={{ fontSize: 14 }}>{a.title}</h3>
                <p style={{ fontSize: 13 }}>{a.content}</p>
                <span className="text-sm text-muted">{a.course_name} • {formatDate(a.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function FacultyDashboard({ data, user, setPage }: any) {
  return (
    <>
      <div className="welcome-banner">
        <h2>Welcome, {user.name}! 🎓</h2>
        <p>Manage your courses, review submissions, and engage with students.</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card blue"><div className="stat-card-header"><span className="stat-card-title">Total Students</span><div className="stat-card-icon blue"><Users size={20} /></div></div><div className="stat-card-value">{data.totalStudents}</div></div>
        <div className="stat-card purple"><div className="stat-card-header"><span className="stat-card-title">Courses</span><div className="stat-card-icon purple"><BookOpen size={20} /></div></div><div className="stat-card-value">{data.assignedCourses}</div></div>
        <div className="stat-card green"><div className="stat-card-header"><span className="stat-card-title">Assignments</span><div className="stat-card-icon green"><FileText size={20} /></div></div><div className="stat-card-value">{data.totalAssignments}</div></div>
        <div className="stat-card orange"><div className="stat-card-header"><span className="stat-card-title">Pending Grading</span><div className="stat-card-icon orange"><Clock size={20} /></div></div><div className="stat-card-value">{data.pendingSubmissions}</div></div>
        <div className="stat-card blue"><div className="stat-card-header"><span className="stat-card-title">Graded</span><div className="stat-card-icon blue"><CheckCircle size={20} /></div></div><div className="stat-card-value">{data.gradedSubmissions}</div></div>
      </div>
      <div className="content-grid">
        <div className="card">
          <div className="card-header"><span className="card-title"><BarChart3 size={18} /> Course Overview</span></div>
          <div className="card-body no-pad">
            {data.courseStats?.length > 0 ? (
              <table className="data-table">
                <thead><tr><th>Course</th><th>Students</th><th>Assignments</th><th>Submissions</th></tr></thead>
                <tbody>
                  {data.courseStats.map((c: any, i: number) => (
                    <tr key={i}><td>{c.course_name}</td><td>{c.students}</td><td>{c.assignments}</td><td>{c.submissions}</td></tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="empty-state"><BookOpen /><h3>No courses yet</h3></div>}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title"><MessageCircle size={18} /> Recent Questions</span><button className="btn btn-ghost btn-sm" onClick={() => setPage('doubts')}>View All</button></div>
          <div className="card-body">
            {data.recentQuestions?.length > 0 ? data.recentQuestions.map((q: any) => (
              <div key={q.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div className="flex-between"><strong style={{ fontSize: 14 }}>{q.title}</strong><span className={`badge ${q.status}`}>{q.status}</span></div>
                <span className="text-sm text-muted">{q.student_name} • {q.course_name}</span>
              </div>
            )) : <div className="empty-state"><MessageCircle /><h3>No questions yet</h3></div>}
          </div>
        </div>
      </div>
      {data.courseStats?.length > 0 && (
        <div className="card">
          <div className="card-header"><span className="card-title"><BarChart3 size={18} /> Submissions by Course</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.courseStats}>
                <XAxis dataKey="course_name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="students" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Students" />
                <Bar dataKey="submissions" fill="#6366F1" radius={[4, 4, 0, 0]} name="Submissions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  );
}

function AdminDashboard({ data, user }: any) {
  return (
    <>
      <div className="welcome-banner">
        <h2>Admin Dashboard 🛡️</h2>
        <p>Platform overview and management tools.</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card blue"><div className="stat-card-header"><span className="stat-card-title">Students</span><div className="stat-card-icon blue"><GraduationCap size={20} /></div></div><div className="stat-card-value">{data.totalStudents}</div></div>
        <div className="stat-card purple"><div className="stat-card-header"><span className="stat-card-title">Faculty</span><div className="stat-card-icon purple"><Users size={20} /></div></div><div className="stat-card-value">{data.totalFaculty}</div></div>
        <div className="stat-card green"><div className="stat-card-header"><span className="stat-card-title">Courses</span><div className="stat-card-icon green"><BookOpen size={20} /></div></div><div className="stat-card-value">{data.totalCourses}</div></div>
        <div className="stat-card orange"><div className="stat-card-header"><span className="stat-card-title">Assignments</span><div className="stat-card-icon orange"><FileText size={20} /></div></div><div className="stat-card-value">{data.totalAssignments}</div></div>
        <div className="stat-card blue"><div className="stat-card-header"><span className="stat-card-title">Submissions</span><div className="stat-card-icon blue"><ClipboardList size={20} /></div></div><div className="stat-card-value">{data.totalSubmissions}</div></div>
        <div className="stat-card purple"><div className="stat-card-header"><span className="stat-card-title">Notes</span><div className="stat-card-icon purple"><BookMarked size={20} /></div></div><div className="stat-card-value">{data.totalNotes}</div></div>
      </div>
      {data.recentUsers?.length > 0 && (
        <div className="card">
          <div className="card-header"><span className="card-title"><Users size={18} /> Recent Users</span></div>
          <div className="card-body no-pad">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
              <tbody>
                {data.recentUsers.map((u: any) => (
                  <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td><span className={`badge ${u.role}`}>{u.role}</span></td><td>{formatDate(u.created_at)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// ==================== COURSES ====================
function CoursesPage({ user, showToast }: any) {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', department: '', faculty_id: '' });
  const [faculty, setFaculty] = useState<any[]>([]);
  const [editId, setEditId] = useState<number | null>(null);

  const load = () => {
    const p = user.role === 'admin' ? api.getAllCourses() : api.getCourses();
    p.then(setCourses).catch(() => {}).finally(() => setLoading(false));
    if (user.role === 'admin') api.getFaculty().then(setFaculty).catch(() => {});
  };
  useEffect(load, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.updateCourse(editId, { ...formData, faculty_id: formData.faculty_id ? Number(formData.faculty_id) : null });
        showToast('Course updated!');
      } else {
        await api.createCourse({ ...formData, faculty_id: formData.faculty_id ? Number(formData.faculty_id) : null });
        showToast('Course created!');
      }
      setShowForm(false);
      setEditId(null);
      setFormData({ name: '', code: '', description: '', department: '', faculty_id: '' });
      load();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this course?')) return;
    try { await api.deleteCourse(id); showToast('Course deleted'); load(); } catch (err: any) { showToast(err.message, 'error'); }
  };

  if (loading) return <div className="loading"><div className="spinner" /> Loading...</div>;

  return (
    <>
      {user.role === 'admin' && (
        <div className="flex-between mb-4">
          <div />
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditId(null); setFormData({ name: '', code: '', description: '', department: '', faculty_id: '' }); }}><Plus size={16} /> Add Course</button>
        </div>
      )}
      {courses.length > 0 ? (
        <div className="notes-grid">
          {courses.map(c => (
            <div key={c.id} className="note-card">
              <div className="flex-between"><h3>{c.name}</h3><span className="badge active">{c.code}</span></div>
              <p className="note-preview">{c.description || 'No description'}</p>
              <div className="note-footer">
                <span>{c.faculty_name || 'Unassigned'}</span>
                <span>{c.department}</span>
              </div>
              {user.role === 'admin' && (
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setEditId(c.id); setFormData({ name: c.name, code: c.code, description: c.description, department: c.department, faculty_id: c.faculty_id?.toString() || '' }); setShowForm(true); }}><Edit size={14} /> Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : <div className="empty-state"><BookOpen size={48} /><h3>No courses found</h3><p>{user.role === 'admin' ? 'Create your first course' : 'No courses assigned'}</p></div>}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">{editId ? 'Edit' : 'Add'} Course</h2><button className="modal-close" onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group-light"><label>Course Name *</label><input className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div className="form-group-light"><label>Code *</label><input className="input" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} required /></div>
                <div className="form-group-light"><label>Description</label><textarea className="input" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
                <div className="form-group-light"><label>Department</label><input className="input" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} /></div>
                <div className="form-group-light"><label>Faculty</label>
                  <select className="input" value={formData.faculty_id} onChange={e => setFormData({ ...formData, faculty_id: e.target.value })}>
                    <option value="">Select Faculty</option>
                    {faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Create'}</button></div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ==================== ASSIGNMENTS ====================
function AssignmentsPage({ user, showToast, refreshNotifs }: any) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSubmit, setShowSubmit] = useState<any>(null);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', description: '', course_id: '', deadline: '', max_marks: '100' });
  const [answerText, setAnswerText] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = () => {
    api.getAssignments().then(setAssignments).catch(() => {}).finally(() => setLoading(false));
    api.getCourses().then(setCourses).catch(() => {});
  };
  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAssignment({ ...formData, course_id: Number(formData.course_id), max_marks: Number(formData.max_marks) });
      showToast('Assignment created!');
      setShowForm(false);
      setFormData({ title: '', description: '', course_id: '', deadline: '', max_marks: '100' });
      load();
      refreshNotifs();
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) { showToast('Please enter your answer', 'error'); return; }
    try {
      await api.createSubmission({ assignment_id: showSubmit.id, answer_text: answerText });
      showToast('Assignment submitted successfully!');
      setShowSubmit(null);
      setAnswerText('');
      load();
      refreshNotifs();
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this assignment?')) return;
    try { await api.deleteAssignment(id); showToast('Assignment deleted'); load(); } catch (err: any) { showToast(err.message, 'error'); }
  };

  const getStatus = (a: any) => {
    if (user.role === 'student') {
      if (a.submission_status === 'graded') return 'graded';
      if (a.has_submitted > 0) return 'submitted';
      if (new Date(a.deadline) < new Date()) return 'overdue';
      return 'pending';
    }
    return 'active';
  };

  const filtered = assignments.filter(a => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'all') return true;
    return getStatus(a) === filter;
  });

  if (loading) return <div className="loading"><div className="spinner" /> Loading...</div>;

  return (
    <>
      <div className="flex-between mb-4">
        <div className="filter-bar">
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" placeholder="Search assignments..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
          </div>
          {user.role === 'student' && (
            <div className="tab-bar">
              {['all', 'pending', 'submitted', 'graded', 'overdue'].map(f => (
                <button key={f} className={`tab-item ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>{f}</button>
              ))}
            </div>
          )}
        </div>
        {user.role === 'faculty' && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Create Assignment</button>
        )}
      </div>

      <div className="assignment-list">
        {filtered.length > 0 ? filtered.map(a => (
          <div key={a.id} className="assignment-card" onClick={() => setShowDetail(a)}>
            <div className="assignment-card-top">
              <h3>{a.title}</h3>
              <span className={`badge ${getStatus(a)}`}>{getStatus(a)}</span>
            </div>
            <p>{a.description.substring(0, 150)}{a.description.length > 150 ? '...' : ''}</p>
            <div className="assignment-meta">
              <span><BookOpen size={14} /> {a.course_name}</span>
              <span><Calendar size={14} /> Due: {formatDate(a.deadline)}</span>
              <span><Star size={14} /> Max: {a.max_marks} marks</span>
              {user.role === 'faculty' && <span><Users size={14} /> {a.total_submissions || 0}/{a.enrolled_students || 0} submitted</span>}
              {user.role === 'student' && a.submission_status === 'graded' && <span><Award size={14} /> Score: {a.my_marks}/{a.max_marks}</span>}
            </div>
            {user.role === 'student' && !a.has_submitted && new Date(a.deadline) > new Date() && (
              <button className="btn btn-primary btn-sm mt-4" onClick={e => { e.stopPropagation(); setShowSubmit(a); setAnswerText(''); }}><Send size={14} /> Submit Answer</button>
            )}
            {user.role === 'faculty' && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); handleDelete(a.id); }}><Trash2 size={14} /></button>
              </div>
            )}
          </div>
        )) : <div className="empty-state"><FileText size={48} /><h3>No assignments found</h3><p>{user.role === 'faculty' ? 'Create your first assignment' : 'No assignments available'}</p></div>}
      </div>

      {/* Create Assignment Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Create Assignment</h2><button className="modal-close" onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group-light"><label>Title *</label><input className="input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required /></div>
                <div className="form-group-light"><label>Description *</label><textarea className="input" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required /></div>
                <div className="form-group-light"><label>Course *</label>
                  <select className="input" value={formData.course_id} onChange={e => setFormData({ ...formData, course_id: e.target.value })} required>
                    <option value="">Select Course</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                  </select>
                </div>
                <div className="form-group-light"><label>Deadline *</label><input className="input" type="datetime-local" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} required /></div>
                <div className="form-group-light"><label>Maximum Marks</label><input className="input" type="number" min="1" value={formData.max_marks} onChange={e => setFormData({ ...formData, max_marks: e.target.value })} /></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create Assignment</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Answer Modal */}
      {showSubmit && (
        <div className="modal-overlay" onClick={() => setShowSubmit(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Submit: {showSubmit.title}</h2><button className="modal-close" onClick={() => setShowSubmit(null)}><X size={20} /></button></div>
            <div className="modal-body">
              <div style={{ marginBottom: 16, padding: 14, background: 'var(--surface-alt)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--text-secondary)' }}>
                <strong>Instructions:</strong> {showSubmit.description}
                <br /><br /><strong>Deadline:</strong> {formatDate(showSubmit.deadline)} • <strong>Max Marks:</strong> {showSubmit.max_marks}
              </div>
              <div className="form-group-light">
                <label>Your Answer *</label>
                <textarea className="input" rows={8} value={answerText} onChange={e => setAnswerText(e.target.value)} placeholder="Type your answer here..." style={{ minHeight: 160 }} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>📝 Text submissions only. File upload is not available.</p>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowSubmit(null)}>Cancel</button><button className="btn btn-primary" onClick={handleSubmitAnswer}><Send size={14} /> Submit</button></div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header"><h2 className="modal-title">{showDetail.title}</h2><button className="modal-close" onClick={() => setShowDetail(null)}><X size={20} /></button></div>
            <div className="modal-body">
              <p style={{ marginBottom: 16, lineHeight: 1.6 }}>{showDetail.description}</p>
              <div className="assignment-meta mb-4">
                <span><BookOpen size={14} /> {showDetail.course_name}</span>
                <span><Calendar size={14} /> Due: {formatDate(showDetail.deadline)}</span>
                <span><Star size={14} /> Max: {showDetail.max_marks} marks</span>
              </div>
              {user.role === 'student' && showDetail.submission_status === 'graded' && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ marginBottom: 8 }}>📊 Your Grade</h4>
                  <div className="marks-display">{showDetail.my_marks} / {showDetail.max_marks}</div>
                  {showDetail.my_feedback && (
                    <><h4 style={{ marginTop: 12, marginBottom: 4 }}>💬 Faculty Feedback</h4><div className="feedback-box">{showDetail.my_feedback}</div></>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ==================== SUBMISSIONS (Faculty) ====================
function SubmissionsPage({ user, showToast, refreshNotifs }: any) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState<any>(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [filter, setFilter] = useState('all');

  const load = () => { api.getSubmissions().then(setSubmissions).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(load, []);

  const handleGrade = async () => {
    if (!marks) { showToast('Please enter marks', 'error'); return; }
    const m = Number(marks);
    if (m < 0 || m > grading.max_marks) { showToast(`Marks must be 0-${grading.max_marks}`, 'error'); return; }
    try {
      await api.gradeSubmission(grading.id, { marks: m, feedback });
      showToast('Submission graded!');
      setGrading(null);
      setMarks('');
      setFeedback('');
      load();
      refreshNotifs();
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const filtered = submissions.filter(s => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  if (loading) return <div className="loading"><div className="spinner" /> Loading...</div>;

  return (
    <>
      <div className="tab-bar mb-4">
        {['all', 'submitted', 'graded'].map(f => (
          <button key={f} className={`tab-item ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
            {f} ({submissions.filter(s => f === 'all' ? true : s.status === f).length})
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="card">
          <div className="card-body no-pad">
            <table className="data-table">
              <thead><tr><th>Student</th><th>Assignment</th><th>Course</th><th>Submitted</th><th>Status</th><th>Marks</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.student_name}</strong><br /><span className="text-sm text-muted">{s.student_email}</span></td>
                    <td>{s.assignment_title}</td>
                    <td>{s.course_name}</td>
                    <td>{formatDate(s.submitted_at)}</td>
                    <td><span className={`badge ${s.status}`}>{s.status}</span></td>
                    <td>{s.status === 'graded' ? `${s.marks}/${s.max_marks}` : '—'}</td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => { setGrading(s); setMarks(s.marks?.toString() || ''); setFeedback(s.feedback || ''); }}>
                        {s.status === 'graded' ? <><Eye size={14} /> Review</> : <><CheckCircle size={14} /> Grade</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : <div className="empty-state"><ClipboardList size={48} /><h3>No submissions found</h3></div>}

      {grading && (
        <div className="modal-overlay" onClick={() => setGrading(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header"><h2 className="modal-title">Grade Submission</h2><button className="modal-close" onClick={() => setGrading(null)}><X size={20} /></button></div>
            <div className="modal-body">
              <div style={{ marginBottom: 16 }}>
                <strong>Student:</strong> {grading.student_name}<br />
                <strong>Assignment:</strong> {grading.assignment_title}<br />
                <strong>Submitted:</strong> {formatDate(grading.submitted_at)}
              </div>
              <div style={{ background: 'var(--surface-alt)', padding: 16, borderRadius: 'var(--radius)', marginBottom: 20, whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6, maxHeight: 250, overflow: 'auto' }}>
                <strong>Student's Answer:</strong><br /><br />{grading.answer_text}
              </div>
              <div className="form-group-light"><label>Marks (out of {grading.max_marks}) *</label><input className="input" type="number" min="0" max={grading.max_marks} value={marks} onChange={e => setMarks(e.target.value)} /></div>
              <div className="form-group-light"><label>Feedback</label><textarea className="input" value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Provide feedback to the student..." /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setGrading(null)}>Cancel</button><button className="btn btn-success" onClick={handleGrade}><Check size={14} /> Save Grade</button></div>
          </div>
        </div>
      )}
    </>
  );
}

// ==================== NOTES ====================
function NotesPage({ user, showToast }: any) {
  const [notes, setNotes] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', content: '', course_id: '' });
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');

  const load = () => {
    api.getNotes().then(setNotes).catch(() => {}).finally(() => setLoading(false));
    api.getCourses().then(setCourses).catch(() => {});
  };
  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createNote({ ...formData, course_id: Number(formData.course_id) });
      showToast('Note published!');
      setShowForm(false);
      setFormData({ title: '', content: '', course_id: '' });
      load();
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this note?')) return;
    try { await api.deleteNote(id); showToast('Note deleted'); load(); } catch (err: any) { showToast(err.message, 'error'); }
  };

  const filtered = notes.filter(n => {
    if (search && !n.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (courseFilter !== 'all' && n.course_id.toString() !== courseFilter) return false;
    return true;
  });

  if (loading) return <div className="loading"><div className="spinner" /> Loading...</div>;

  return (
    <>
      <div className="flex-between mb-4">
        <div className="filter-bar">
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" placeholder="Search notes..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
          </div>
          <select className="input" value={courseFilter} onChange={e => setCourseFilter(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="all">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {user.role === 'faculty' && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Create Note</button>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="notes-grid">
          {filtered.map(n => (
            <div key={n.id} className="note-card" onClick={() => setShowDetail(n)}>
              <h3>{n.title}</h3>
              <div className="note-preview">{n.content}</div>
              <div className="note-footer">
                <span>{n.course_name}</span>
                <span>{formatDate(n.created_at)}</span>
              </div>
              {user.role === 'faculty' && n.faculty_id === user.id && (
                <button className="btn btn-danger btn-sm mt-4" onClick={e => { e.stopPropagation(); handleDelete(n.id); }}><Trash2 size={14} /></button>
              )}
            </div>
          ))}
        </div>
      ) : <div className="empty-state"><BookMarked size={48} /><h3>No notes found</h3></div>}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Create Note</h2><button className="modal-close" onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group-light"><label>Title *</label><input className="input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required /></div>
                <div className="form-group-light"><label>Course *</label>
                  <select className="input" value={formData.course_id} onChange={e => setFormData({ ...formData, course_id: e.target.value })} required>
                    <option value="">Select Course</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group-light"><label>Content *</label><textarea className="input" rows={10} value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} required style={{ minHeight: 200 }} /></div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>📝 Text-based notes. PDF upload is not supported in this version.</p>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary">Publish Note</button></div>
            </form>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header"><h2 className="modal-title">{showDetail.title}</h2><button className="modal-close" onClick={() => setShowDetail(null)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="assignment-meta mb-4">
                <span><BookOpen size={14} /> {showDetail.course_name}</span>
                {showDetail.faculty_name && <span><User size={14} /> {showDetail.faculty_name}</span>}
                <span><Calendar size={14} /> {formatDate(showDetail.created_at)}</span>
              </div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 14 }}>{showDetail.content}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ==================== DOUBTS ====================
function DoubtsPage({ user, showToast, refreshNotifs }: any) {
  const [doubts, setDoubts] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', description: '', course_id: '' });
  const [replyText, setReplyText] = useState('');
  const [search, setSearch] = useState('');

  const load = () => {
    api.getDoubts().then(setDoubts).catch(() => {}).finally(() => setLoading(false));
    api.getCourses().then(setCourses).catch(() => {});
  };
  useEffect(load, []);

  const openDetail = async (doubt: any) => {
    setShowDetail(doubt);
    try {
      const data = await api.getDoubt(doubt.id);
      setDetailData(data);
    } catch {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDoubt({ ...formData, course_id: Number(formData.course_id) });
      showToast('Question posted!');
      setShowForm(false);
      setFormData({ title: '', description: '', course_id: '' });
      load();
      refreshNotifs();
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      await api.replyDoubt(showDetail.id, replyText);
      showToast('Reply posted!');
      setReplyText('');
      const data = await api.getDoubt(showDetail.id);
      setDetailData(data);
      load();
      refreshNotifs();
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const filtered = doubts.filter(d => {
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="loading"><div className="spinner" /> Loading...</div>;

  return (
    <>
      <div className="flex-between mb-4">
        <div className="filter-bar">
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" placeholder="Search questions..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
          </div>
        </div>
        {user.role === 'student' && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Ask Question</button>
        )}
      </div>

      {filtered.length > 0 ? filtered.map(d => (
        <div key={d.id} className="doubt-card" onClick={() => openDetail(d)}>
          <div className="flex-between"><h3>{d.title}</h3><span className={`badge ${d.status}`}>{d.status}</span></div>
          <p>{d.description.substring(0, 120)}{d.description.length > 120 ? '...' : ''}</p>
          <div className="doubt-meta">
            <span><User size={13} /> {d.student_name}</span>
            <span><BookOpen size={13} /> {d.course_name}</span>
            <span><MessageCircle size={13} /> {d.reply_count} replies</span>
            <span><Clock size={13} /> {formatDate(d.created_at)}</span>
          </div>
        </div>
      )) : <div className="empty-state"><MessageCircle size={48} /><h3>No questions yet</h3></div>}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Ask a Question</h2><button className="modal-close" onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group-light"><label>Question Title *</label><input className="input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required /></div>
                <div className="form-group-light"><label>Course *</label>
                  <select className="input" value={formData.course_id} onChange={e => setFormData({ ...formData, course_id: e.target.value })} required>
                    <option value="">Select Course</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group-light"><label>Details *</label><textarea className="input" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required /></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary">Post Question</button></div>
            </form>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="modal-overlay" onClick={() => { setShowDetail(null); setDetailData(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 660 }}>
            <div className="modal-header"><h2 className="modal-title">{showDetail.title}</h2><button className="modal-close" onClick={() => { setShowDetail(null); setDetailData(null); }}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="flex-between mb-4">
                <span className="text-sm text-muted">{showDetail.student_name} • {showDetail.course_name}</span>
                <span className={`badge ${showDetail.status}`}>{showDetail.status}</span>
              </div>
              <p style={{ lineHeight: 1.6, marginBottom: 16 }}>{detailData?.doubt?.description || showDetail.description}</p>

              <div className="reply-list">
                <h4 style={{ marginBottom: 12 }}>Replies ({detailData?.replies?.length || 0})</h4>
                {detailData?.replies?.length > 0 ? detailData.replies.map((r: any) => (
                  <div key={r.id} className="reply-item">
                    <div className="user-avatar" style={{ background: r.avatar_color, width: 32, height: 32, fontSize: 12 }}>{r.user_name.charAt(0)}</div>
                    <div className="reply-content">
                      <div className="reply-author">{r.user_name} <span className={`badge ${r.user_role}`} style={{ marginLeft: 6 }}>{r.user_role}</span></div>
                      <div className="reply-text">{r.reply_text}</div>
                      <div className="reply-time">{formatDate(r.created_at)}</div>
                    </div>
                  </div>
                )) : <div className="empty-state" style={{ padding: 20 }}><p>No replies yet</p></div>}
              </div>

              <div style={{ marginTop: 16 }}>
                <div className="form-group-light"><label>Your Reply</label>
                  <textarea className="input" rows={3} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write your reply..." />
                </div>
                <button className="btn btn-primary" onClick={handleReply} disabled={!replyText.trim()}><Send size={14} /> Reply</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ==================== ANNOUNCEMENTS ====================
function AnnouncementsPage({ user, showToast }: any) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', course_id: '' });

  const load = () => {
    api.getAnnouncements().then(setAnnouncements).catch(() => {}).finally(() => setLoading(false));
    api.getCourses().then(setCourses).catch(() => {});
  };
  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAnnouncement({ ...formData, course_id: formData.course_id ? Number(formData.course_id) : null });
      showToast('Announcement posted!');
      setShowForm(false);
      setFormData({ title: '', content: '', course_id: '' });
      load();
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  if (loading) return <div className="loading"><div className="spinner" /> Loading...</div>;

  return (
    <>
      {user.role === 'faculty' && (
        <div className="flex-between mb-4">
          <div />
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> New Announcement</button>
        </div>
      )}
      {announcements.length > 0 ? announcements.map(a => (
        <div key={a.id} className="announcement-card">
          <h3>{a.title}</h3>
          <p>{a.content}</p>
          <div className="announcement-footer">
            {a.course_name && <span><BookOpen size={13} /> {a.course_name}</span>}
            {a.faculty_name && <span><User size={13} /> {a.faculty_name}</span>}
            <span><Calendar size={13} /> {formatDate(a.created_at)}</span>
          </div>
        </div>
      )) : <div className="empty-state"><Megaphone size={48} /><h3>No announcements</h3></div>}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">New Announcement</h2><button className="modal-close" onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group-light"><label>Title *</label><input className="input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required /></div>
                <div className="form-group-light"><label>Course</label>
                  <select className="input" value={formData.course_id} onChange={e => setFormData({ ...formData, course_id: e.target.value })}>
                    <option value="">All Courses</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group-light"><label>Content *</label><textarea className="input" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} required /></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary">Post</button></div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ==================== NOTIFICATIONS ====================
function NotificationsPage({ user, refreshNotifs }: any) {
  const [data, setData] = useState<{ notifications: any[]; unread_count: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => { api.getNotifications().then(setData).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(load, []);

  const markRead = async (id: number) => {
    await api.markRead(id);
    load();
    refreshNotifs();
  };

  const markAllRead = async () => {
    await api.markAllRead();
    load();
    refreshNotifs();
  };

  if (loading) return <div className="loading"><div className="spinner" /> Loading...</div>;

  return (
    <>
      {data && data.unread_count > 0 && (
        <div className="flex-between mb-4">
          <span className="text-sm text-muted">{data.unread_count} unread notification{data.unread_count > 1 ? 's' : ''}</span>
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}><Check size={14} /> Mark all as read</button>
        </div>
      )}
      <div className="card">
        <div className="card-body no-pad">
          {data?.notifications?.length ? data.notifications.map(n => (
            <div key={n.id} className={`notif-item ${n.is_read ? '' : 'unread'}`} onClick={() => !n.is_read && markRead(n.id)}>
              <div className={`notif-icon ${n.type}`}>
                {n.type === 'grade' && <Award size={18} />}
                {n.type === 'assignment' && <FileText size={18} />}
                {n.type === 'announcement' && <Megaphone size={18} />}
                {n.type === 'submission' && <ClipboardList size={18} />}
                {n.type === 'doubt' && <MessageCircle size={18} />}
                {!['grade', 'assignment', 'announcement', 'submission', 'doubt'].includes(n.type) && <Bell size={18} />}
              </div>
              <div className="notif-body">
                <div className="notif-title">{n.title}</div>
                <div className="notif-message">{n.message}</div>
                <div className="notif-time">{formatDate(n.created_at)}</div>
              </div>
              {!n.is_read && <span className="badge pending" style={{ fontSize: 11 }}>New</span>}
            </div>
          )) : <div className="empty-state"><Bell size={48} /><h3>No notifications</h3><p>You're all caught up!</p></div>}
        </div>
      </div>
    </>
  );
}

// ==================== STUDY ASSISTANT ====================
function AssistantPage({ user }: any) {
  const [question, setQuestion] = useState('');
  const [mode, setMode] = useState('ask');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setResponse('');
    try {
      const data = await api.askAssistant(question, mode);
      setResponse(data.answer);
    } catch (err: any) {
      setResponse('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <>
      <div className="ai-notice mb-4">
        <HelpCircle size={16} />
        <span><strong>Local Fallback Assistant:</strong> This assistant provides predefined educational responses. For AI-powered answers, configure an AI API key in server settings.</span>
      </div>
      <div className="assistant-container">
        <div className="assistant-input-area">
          <div className="card">
            <div className="card-header"><span className="card-title"><Bot size={18} /> Ask a Question</span></div>
            <div className="card-body">
              <div className="assistant-mode-tabs mb-4">
                {[['ask', '💬 Ask'], ['summarize', '📝 Summarize'], ['generate-questions', '📋 Generate Questions']].map(([id, label]) => (
                  <button key={id} className={`mode-tab ${mode === id ? 'active' : ''}`} onClick={() => setMode(id)}>{label}</button>
                ))}
              </div>
              <div className="form-group-light">
                <label>{mode === 'ask' ? 'Your Question' : mode === 'summarize' ? 'Text to Summarize' : 'Topics/Notes for Questions'}</label>
                <textarea className="input" rows={6} value={question} onChange={e => setQuestion(e.target.value)}
                  placeholder={mode === 'ask' ? 'E.g., Explain binary search tree operations...' : mode === 'summarize' ? 'Paste your study material here...' : 'Enter topics separated by commas...'} />
              </div>
              <button className="btn btn-primary" onClick={ask} disabled={loading || !question.trim()}>
                {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Thinking...</> : <><Send size={14} /> Get Answer</>}
              </button>
            </div>
          </div>
        </div>
        <div>
          <div className="card" style={{ height: '100%' }}>
            <div className="card-header"><span className="card-title"><Star size={18} /> Response</span></div>
            <div className="card-body">
              {response ? (
                <div className="assistant-response" style={{ border: 'none', padding: 0 }}>{response}</div>
              ) : (
                <div className="empty-state">
                  <Bot size={48} />
                  <h3>Ready to help!</h3>
                  <p>Ask a question, paste text to summarize, or generate revision questions.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ==================== ANALYTICS (Faculty) ====================
function AnalyticsPage({ user }: any) {
  const [data, setData] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDashboard(), api.getAssignments()])
      .then(([d, a]) => { setData(d); setAssignments(a); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /> Loading...</div>;
  if (!data) return <div className="empty-state"><BarChart3 /><h3>Unable to load analytics</h3></div>;

  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899'];
  const gradingData = [
    { name: 'Graded', value: data.gradedSubmissions },
    { name: 'Pending', value: data.pendingSubmissions },
  ].filter(d => d.value > 0);

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card blue"><div className="stat-card-header"><span className="stat-card-title">Total Submissions</span><div className="stat-card-icon blue"><ClipboardList size={20} /></div></div><div className="stat-card-value">{data.totalSubmissions}</div></div>
        <div className="stat-card green"><div className="stat-card-header"><span className="stat-card-title">Graded</span><div className="stat-card-icon green"><CheckCircle size={20} /></div></div><div className="stat-card-value">{data.gradedSubmissions}</div></div>
        <div className="stat-card orange"><div className="stat-card-header"><span className="stat-card-title">Pending</span><div className="stat-card-icon orange"><Clock size={20} /></div></div><div className="stat-card-value">{data.pendingSubmissions}</div></div>
      </div>
      <div className="content-grid">
        <div className="card">
          <div className="card-header"><span className="card-title"><BarChart3 size={18} /> Assignment Submissions</span></div>
          <div className="card-body">
            {assignments.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={assignments.map(a => ({ name: a.title.substring(0, 15), submitted: a.total_submissions || 0, total: a.enrolled_students || 0 }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="submitted" fill="#6366F1" name="Submitted" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total" fill="#E2E8F0" name="Enrolled" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="empty-state"><h3>No data</h3></div>}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title"><BarChart3 size={18} /> Grading Progress</span></div>
          <div className="card-body">
            {gradingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={gradingData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {gradingData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="empty-state"><h3>No submissions yet</h3></div>}
          </div>
        </div>
      </div>
    </>
  );
}

// ==================== USERS (Admin) ====================
function UsersPage({ user, showToast }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'student', department: '' });

  const load = () => { api.getUsers().then(setUsers).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser(formData);
      showToast('User created!');
      setShowForm(false);
      setFormData({ name: '', email: '', password: '', role: 'student', department: '' });
      load();
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this user?')) return;
    try { await api.deleteUser(id); showToast('User deleted'); load(); } catch (err: any) { showToast(err.message, 'error'); }
  };

  if (loading) return <div className="loading"><div className="spinner" /> Loading...</div>;

  return (
    <>
      <div className="flex-between mb-4">
        <span className="text-sm text-muted">{users.length} users</span>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Add User</button>
      </div>
      <div className="card">
        <div className="card-body no-pad">
          <table className="data-table">
            <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Department</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><div className="inline-flex"><div className="user-avatar" style={{ background: u.avatar_color, width: 28, height: 28, fontSize: 11 }}>{u.name.charAt(0)}</div>{u.name}</div></td>
                  <td>{u.email}</td>
                  <td><span className={`badge ${u.role}`}>{u.role}</span></td>
                  <td>{u.department || '—'}</td>
                  <td>{u.id !== user.id && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}><Trash2 size={14} /></button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Add User</h2><button className="modal-close" onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group-light"><label>Name *</label><input className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div className="form-group-light"><label>Email *</label><input className="input" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required /></div>
                <div className="form-group-light"><label>Password *</label><input className="input" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required /></div>
                <div className="form-group-light"><label>Role *</label>
                  <select className="input" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group-light"><label>Department</label><input className="input" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} /></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create User</button></div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ==================== SUBJECTS (Admin) ====================
function SubjectsPage({ user, showToast }: any) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', course_id: '' });

  const load = () => {
    api.getSubjects().then(setSubjects).catch(() => {}).finally(() => setLoading(false));
    api.getAllCourses().then(setCourses).catch(() => {});
  };
  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSubject({ ...formData, course_id: Number(formData.course_id) });
      showToast('Subject created!');
      setShowForm(false);
      setFormData({ name: '', code: '', course_id: '' });
      load();
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this subject?')) return;
    try { await api.deleteSubject(id); showToast('Subject deleted'); load(); } catch (err: any) { showToast(err.message, 'error'); }
  };

  if (loading) return <div className="loading"><div className="spinner" /> Loading...</div>;

  return (
    <>
      <div className="flex-between mb-4">
        <span className="text-sm text-muted">{subjects.length} subjects</span>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Add Subject</button>
      </div>
      <div className="card">
        <div className="card-body no-pad">
          {subjects.length > 0 ? (
            <table className="data-table">
              <thead><tr><th>Subject</th><th>Code</th><th>Course</th><th>Actions</th></tr></thead>
              <tbody>
                {subjects.map(s => (
                  <tr key={s.id}><td>{s.name}</td><td><span className="badge active">{s.code}</span></td><td>{s.course_name}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="empty-state"><Layers size={48} /><h3>No subjects yet</h3></div>}
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Add Subject</h2><button className="modal-close" onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group-light"><label>Name *</label><input className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div className="form-group-light"><label>Code *</label><input className="input" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} required /></div>
                <div className="form-group-light"><label>Course *</label>
                  <select className="input" value={formData.course_id} onChange={e => setFormData({ ...formData, course_id: e.target.value })} required>
                    <option value="">Select Course</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create</button></div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ==================== PROFILE ====================
function ProfilePage({ user, showToast }: any) {
  const [name, setName] = useState(user.name);
  const [department, setDepartment] = useState(user.department);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile({ name, department });
      showToast('Profile updated!');
    } catch (err: any) { showToast(err.message, 'error'); }
    setSaving(false);
  };

  return (
    <>
      <div className="profile-card">
        <div className="profile-avatar" style={{ background: user.avatar_color }}>{user.name.charAt(0)}</div>
        <div className="profile-info">
          <h2>{user.name}</h2>
          <p className="profile-detail">{user.email}</p>
          <p className="profile-detail"><span className={`badge ${user.role}`}>{user.role}</span></p>
          <p className="profile-detail">{user.department || 'No department set'}</p>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title"><Settings size={18} /> Edit Profile</span></div>
        <div className="card-body">
          <div className="form-group-light"><label>Name</label><input className="input" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="form-group-light"><label>Department</label><input className="input" value={department} onChange={e => setDepartment(e.target.value)} /></div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
      <div className="card mt-4">
        <div className="card-header"><span className="card-title">⚠️ Demo Mode Notice</span></div>
        <div className="card-body">
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            This application is running in <strong>demo mode</strong> with local authentication (JWT + bcrypt hashed passwords).
            All data is stored in a local SQLite database and persists across page refreshes and server restarts.
            <br /><br />
            <strong>Security note:</strong> This is a demonstration environment. Production deployment would require HTTPS, 
            proper session management, CSRF protection, rate limiting, and a production database.
          </p>
        </div>
      </div>
    </>
  );
}

// ==================== UTILS ====================
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return dateStr; }
}
