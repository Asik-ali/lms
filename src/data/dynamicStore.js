import { supabase } from '../supabase/client';

export async function getCategories() {
  const { data, error } = await supabase.from('categories').select('name');
  if (error) throw error;
  return (data || []).map(c => c.name);
}
export async function addCategory(name) {
  const { error } = await supabase.from('categories').insert({ name });
  if (error) throw error;
}
export async function deleteCategory(name) {
  const { error } = await supabase.from('categories').delete().eq('name', name);
  if (error) throw error;
}

export async function getCourses() {
  const { data } = await supabase.from('courses').select('*');
  return data || [];
}
export async function addCourse(data) {
  const { data: row } = await supabase.from('courses').insert(data).select();
  return row?.[0];
}
export async function updateCourse(id, data) {
  await supabase.from('courses').update(data).eq('id', id);
  const { data: row } = await supabase.from('courses').select('*').eq('id', id).single();
  return row;
}
export async function deleteCourse(id) {
  await supabase.from('courses').delete().eq('id', id);
}

export async function getCourseLessons(courseId) {
  const { data, error } = await supabase
    .from('course_lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('position');
  if (error) throw error;
  return data || [];
}

export async function addCourseLesson(data) {
  const { data: row, error } = await supabase.from('course_lessons').insert(data).select().single();
  if (error) throw error;
  return row;
}

export async function deleteCourseLesson(id) {
  const { error } = await supabase.from('course_lessons').delete().eq('id', id);
  if (error) throw error;
}

export async function getCoursePdfs(courseId) {
  const { data, error } = await supabase
    .from('course_pdfs')
    .select('*')
    .eq('course_id', courseId)
    .order('position');
  if (error) throw error;
  return data || [];
}

export async function addCoursePdf(data) {
  const { data: row, error } = await supabase.from('course_pdfs').insert(data).select().single();
  if (error) throw error;
  return row;
}

export async function deleteCoursePdf(id) {
  const { error } = await supabase.from('course_pdfs').delete().eq('id', id);
  if (error) throw error;
}

export async function getStudents() {
  const { data } = await supabase.from('profiles').select('*').eq('role', 'student');
  return data || [];
}
export async function addStudent(data) {
  const { data: row } = await supabase.from('profiles').insert({ ...data, role: 'student' }).select();
  return row?.[0];
}

export async function getInstructors() {
  const { data } = await supabase.from('instructors').select('*');
  return data || [];
}
export async function addInstructor(data) {
  const { data: row } = await supabase.from('instructors').insert(data).select();
  return row?.[0];
}

export async function getAssignments() {
  const { data } = await supabase.from('assignments').select('*');
  return data || [];
}
export async function addAssignment(data) {
  const { data: row } = await supabase.from('assignments').insert(data).select();
  return row?.[0];
}
export async function deleteAssignment(id) {
  await supabase.from('assignments').delete().eq('id', id);
}

export async function getQuizzes() {
  const { data } = await supabase.from('quizzes').select('*');
  return data || [];
}
export async function addQuiz(data) {
  const { data: row } = await supabase.from('quizzes').insert(data).select();
  return row?.[0];
}

export async function getQuestions() {
  const { data } = await supabase.from('questions').select('*');
  return data || [];
}
export async function addQuestion(data) {
  const { data: row } = await supabase.from('questions').insert(data).select();
  return row?.[0];
}

export async function getAttendance() {
  const { data } = await supabase.from('attendance').select('*');
  return data || [];
}
export async function addAttendance(data) {
  const { data: row } = await supabase.from('attendance').insert(data).select();
  return row?.[0];
}
export async function updateAttendance(id, data) {
  await supabase.from('attendance').update(data).eq('id', id);
  const { data: row } = await supabase.from('attendance').select('*').eq('id', id).single();
  return row;
}

export async function getAnnouncements() {
  const { data } = await supabase.from('announcements').select('*');
  return data || [];
}
export async function addAnnouncement(data) {
  const { data: row } = await supabase.from('announcements').insert(data).select();
  return row?.[0];
}

export async function getEnrollments() {
  const { data } = await supabase.from('enrollments').select('*');
  return data || [];
}
export async function addEnrollment(data) {
  const { data: row } = await supabase.from('enrollments').insert(data).select();
  return row?.[0];
}
export async function updateEnrollment(id, data) {
  await supabase.from('enrollments').update(data).eq('id', id);
  const { data: row } = await supabase.from('enrollments').select('*').eq('id', id).single();
  return row;
}

export async function getNotifications() {
  const { data } = await supabase.from('notifications').select('*');
  return data || [];
}
export async function addNotification(data) {
  const { data: row } = await supabase.from('notifications').insert(data).select();
  return row?.[0];
}

export async function getLiveClasses() {
  const { data } = await supabase.from('live_classes').select('*');
  return data || [];
}
export async function addLiveClass(data) {
  const { data: row } = await supabase.from('live_classes').insert(data).select();
  return row?.[0];
}
export async function deleteLiveClass(id) {
  await supabase.from('live_classes').delete().eq('id', id);
}

export async function getAuditLogs(params = {}) {
  let q = supabase.from('audit_logs').select('*');
  if (params.entity) q = q.eq('entity', params.entity);
  if (params.action) q = q.eq('action', params.action);
  if (params.limit) q = q.limit(Number(params.limit));
  q = q.order('created_at', { ascending: false });
  const { data } = await q;
  return data || [];
}

export async function getAssignmentSubmissions(assignmentId) {
  const { data } = await supabase.from('assignment_submissions').select('*').eq('assignment_id', assignmentId);
  return data || [];
}

export async function getMySubmissions(studentId) {
  const { data } = await supabase.from('assignment_submissions').select('*').eq('student_id', studentId);
  return data || [];
}

export async function submitAssignmentLink(assignmentId, studentId, link) {
  const { data: existing } = await supabase.from('assignment_submissions').select('*').eq('assignment_id', assignmentId).eq('student_id', studentId).maybeSingle();
  if (existing) {
    const { data: row } = await supabase.from('assignment_submissions').update({ link, submitted_at: new Date().toISOString() }).eq('id', existing.id).select().single();
    return row;
  }
  const { data: row } = await supabase.from('assignment_submissions').insert({ assignment_id: assignmentId, student_id: studentId, link }).select().single();
  return row;
}

export async function getSmtpSettings() {
  const { data, error } = await supabase.from('smtp_settings').select('*').limit(1).maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function saveSmtpSettings(data) {
  const existing = await getSmtpSettings();
  if (existing) {
    const { data: row, error } = await supabase.from('smtp_settings').update(data).eq('id', existing.id).select().maybeSingle();
    if (error) throw error;
    return row;
  }
  const { data: row, error } = await supabase.from('smtp_settings').insert(data).select().maybeSingle();
  if (error) throw error;
  return row;
}
