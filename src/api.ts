const API = '/api';

function getToken(): string | null {
  return localStorage.getItem('educonnect_token');
}

async function request(path: string, options: any = {}): Promise<any> {
  const token = getToken();
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (data: any) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  me: () => request('/auth/me'),

  // Courses
  getCourses: () => request('/courses'),
  getAllCourses: () => request('/courses/all'),
  createCourse: (data: any) => request('/courses', { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (id: number, data: any) => request(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCourse: (id: number) => request(`/courses/${id}`, { method: 'DELETE' }),

  // Subjects
  getSubjects: () => request('/subjects'),
  createSubject: (data: any) => request('/subjects', { method: 'POST', body: JSON.stringify(data) }),
  deleteSubject: (id: number) => request(`/subjects/${id}`, { method: 'DELETE' }),

  // Enrollments
  getEnrollments: () => request('/enrollments'),
  createEnrollment: (data: any) => request('/enrollments', { method: 'POST', body: JSON.stringify(data) }),

  // Assignments
  getAssignments: () => request('/assignments'),
  createAssignment: (data: any) => request('/assignments', { method: 'POST', body: JSON.stringify(data) }),
  updateAssignment: (id: number, data: any) => request(`/assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAssignment: (id: number) => request(`/assignments/${id}`, { method: 'DELETE' }),

  // Submissions
  getSubmissions: () => request('/submissions'),
  getAssignmentSubmissions: (id: number) => request(`/submissions/assignment/${id}`),
  createSubmission: (data: any) => request('/submissions', { method: 'POST', body: JSON.stringify(data) }),
  gradeSubmission: (id: number, data: any) => request(`/submissions/${id}/grade`, { method: 'POST', body: JSON.stringify(data) }),

  // Notes
  getNotes: () => request('/notes'),
  createNote: (data: any) => request('/notes', { method: 'POST', body: JSON.stringify(data) }),
  updateNote: (id: number, data: any) => request(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNote: (id: number) => request(`/notes/${id}`, { method: 'DELETE' }),

  // Doubts
  getDoubts: () => request('/doubts'),
  getDoubt: (id: number) => request(`/doubts/${id}`),
  createDoubt: (data: any) => request('/doubts', { method: 'POST', body: JSON.stringify(data) }),
  replyDoubt: (id: number, reply_text: string) => request(`/doubts/${id}/reply`, { method: 'POST', body: JSON.stringify({ reply_text }) }),

  // Announcements
  getAnnouncements: () => request('/announcements'),
  createAnnouncement: (data: any) => request('/announcements', { method: 'POST', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markRead: (id: number) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),

  // Users
  getUsers: () => request('/users'),
  createUser: (data: any) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  deleteUser: (id: number) => request(`/users/${id}`, { method: 'DELETE' }),

  // Faculty list
  getFaculty: () => request('/faculty'),

  // Analytics
  getDashboard: () => request('/analytics/dashboard'),

  // Profile
  updateProfile: (data: any) => request('/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Study Assistant
  askAssistant: (question: string, type: string) => request('/assistant/ask', { method: 'POST', body: JSON.stringify({ question, type }) }),
};
