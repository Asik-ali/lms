import { supabase } from '../supabase/client';

const DEFAULT_PAGE_SIZE = 50;

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

export async function getCourses({ page = 0, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('courses')
    .select('id, title, instructor, category, students, lessons, duration, status', { count: 'exact' })
    .range(from, to);
  if (error) throw error;
  return { data: data || [], total: count ?? 0 };
}
export async function getCourseById(id) {
  const numericId = Number(id);
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, instructor, category, students, lessons, duration, status')
    .eq('id', isNaN(numericId) ? id : numericId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
export async function addCourse(row) {
  const { data, error } = await supabase.from('courses').insert(row).select('id, title, instructor, category, students, lessons, duration, status').single();
  if (error) throw error;
  return data;
}
export async function updateCourse(id, row) {
  const { data, error } = await supabase.from('courses').update(row).eq('id', id).select('id, title, instructor, category, students, lessons, duration, status').single();
  if (error) throw error;
  return data;
}
export async function deleteCourse(id) {
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) throw error;
}

export async function getCourseLessons(courseId) {
  const numericId = Number(courseId);
  const { data, error } = await supabase
    .from('course_lessons')
    .select('id, course_id, title, video_url, position')
    .eq('course_id', isNaN(numericId) ? courseId : numericId)
    .order('position');
  if (error) throw error;
  return data || [];
}

export async function addCourseLesson(row) {
  const { data, error } = await supabase.from('course_lessons').insert(row).select('id, course_id, title, content, position').single();
  if (error) throw error;
  return data;
}

export async function deleteCourseLesson(id) {
  const { error } = await supabase.from('course_lessons').delete().eq('id', id);
  if (error) throw error;
}

export async function getCoursePdfs(courseId) {
  const numericId = Number(courseId);
  const { data, error } = await supabase
    .from('course_pdfs')
    .select('id, course_id, title, pdf_url, position')
    .eq('course_id', isNaN(numericId) ? courseId : numericId)
    .order('position');
  if (error) throw error;
  return data || [];
}

export async function addCoursePdf(row) {
  const { data, error } = await supabase.from('course_pdfs').insert(row).select('id, course_id, title, pdf_url, position').single();
  if (error) throw error;
  return data;
}

export async function deleteCoursePdf(id) {
  const { error } = await supabase.from('course_pdfs').delete().eq('id', id);
  if (error) throw error;
}

export async function getStudents({ page = 0, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('profiles')
    .select('id, username, name, email, role, course, status, enrolled, progress', { count: 'exact' })
    .eq('role', 'student')
    .range(from, to);
  if (error) throw error;
  return { data: data || [], total: count ?? 0 };
}
export async function addStudent(row) {
  const { data, error } = await supabase.from('profiles').insert({ ...row, role: 'student' }).select('id, username, name, email, role, course, status, enrolled, progress').single();
  if (error) throw error;
  return data;
}

export async function getInstructors({ page = 0, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('instructors')
    .select('id, name, email, department, students, courses, rating', { count: 'exact' })
    .range(from, to);
  if (error) throw error;
  return { data: data || [], total: count ?? 0 };
}
export async function addInstructor(row) {
  const { data, error } = await supabase.from('instructors').insert(row).select('id, name, email, department, students, courses, rating').single();
  if (error) throw error;
  return data;
}

export async function getAssignments({ page = 0, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('assignments')
    .select('id, title, course, due_date, submissions, total, status', { count: 'exact' })
    .range(from, to);
  if (error) throw error;
  return { data: data || [], total: count ?? 0 };
}
export async function addAssignment(row) {
  const { data, error } = await supabase.from('assignments').insert(row).select('id, title, course, due_date, submissions, total, status').single();
  if (error) throw error;
  return data;
}
export async function deleteAssignment(id) {
  const { error } = await supabase.from('assignments').delete().eq('id', id);
  if (error) throw error;
}

export async function getQuizzes({ page = 0, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('quizzes')
    .select('id, title, course, questions, total_marks, duration, status', { count: 'exact' })
    .range(from, to);
  if (error) throw error;
  return { data: data || [], total: count ?? 0 };
}
export async function addQuiz(row) {
  const { data, error } = await supabase.from('quizzes').insert(row).select('id, title, course, questions, total_marks, duration, status').single();
  if (error) throw error;
  return data;
}

export async function getQuestions({ page = 0, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('questions')
    .select('id, question, type, category, difficulty', { count: 'exact' })
    .range(from, to);
  if (error) throw error;
  return { data: data || [], total: count ?? 0 };
}
export async function addQuestion(row) {
  const { data, error } = await supabase.from('questions').insert(row).select('id, question, type, category, difficulty').single();
  if (error) {
    if (error.message?.includes('test_name')) {
      const { test_name, ...rest } = row;
      const fallback = await supabase.from('questions').insert(rest).select('id, question, type, category, difficulty').single();
      if (fallback.error) throw fallback.error;
      return fallback.data;
    }
    throw error;
  }
  return data;
}
export async function deleteQuestion(id) {
  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) throw error;
}

// Test Series (hierarchical: Series → Categories → Tests → Questions)
export async function getAllTestSeries() {
  const { data, error } = await supabase.from('test_series').select('id, name, description, created_at').order('created_at');
  if (error) throw error;
  return data || [];
}

export async function addTestSeries({ name, description }) {
  const { data, error } = await supabase.from('test_series').insert({ name, description }).select('id, name, description, created_at').single();
  if (error) throw error;
  return data;
}

export async function deleteTestSeries(id) {
  const { error } = await supabase.from('test_series').delete().eq('id', id);
  if (error) throw error;
}

// Categories (with nesting via parent_id)
export async function getCategoriesBySeries(seriesId) {
  const { data, error } = await supabase.from('test_categories').select('id, series_id, name, parent_id, position, created_at').eq('series_id', seriesId).order('position');
  if (error) throw error;
  return data || [];
}

export async function addTestCategory({ series_id, name, parent_id, position }) {
  const { data, error } = await supabase.from('test_categories').insert({ series_id, name, parent_id: parent_id || null, position: position || 0 }).select('id, series_id, name, parent_id, position, created_at').single();
  if (error) throw error;
  return data;
}

export async function deleteTestCategory(id) {
  const { error } = await supabase.from('test_categories').delete().eq('id', id);
  if (error) throw error;
}

// Tests
export async function getTestsByCategoryId(categoryId) {
  const { data, error } = await supabase.from('tests').select('id, category_id, name, description, duration, total_marks, question_count, difficulty, language, instructions, syllabus, status, created_at').eq('category_id', categoryId).order('created_at');
  if (error) throw error;
  return data || [];
}

export async function addTest({ category_id, name, description, duration, total_marks, difficulty, language, instructions, syllabus }) {
  const { data, error } = await supabase.from('tests').insert({ category_id, name, description: description || '', duration: duration || 90, total_marks: total_marks || 270, difficulty: difficulty || 'Moderate', language: language || 'English', instructions: instructions || '', syllabus: syllabus || '' }).select('id, category_id, name, description, duration, total_marks, question_count, difficulty, language, instructions, syllabus, status, created_at').single();
  if (error) throw error;
  return data;
}

export async function updateTest(id, row) {
  const { data, error } = await supabase.from('tests').update(row).eq('id', id).select('id, category_id, name, description, duration, total_marks, question_count, difficulty, language, instructions, syllabus, status, created_at').single();
  if (error) throw error;
  return data;
}

export async function deleteTest(id) {
  const { error } = await supabase.from('tests').delete().eq('id', id);
  if (error) throw error;
}

// Questions (linked to tests)
export async function getQuestionsByTestId(testId) {
  const { data, error } = await supabase.from('questions').select('id, question, type, category, difficulty, test_id').eq('test_id', testId);
  if (error) throw error;
  return data || [];
}

export async function addQuestionToTest(testId, row) {
  const { data, error } = await supabase.from('questions').insert({ ...row, test_id: testId }).select('id, question, type, category, difficulty, test_id').single();
  if (error) throw error;
  return data;
}

// Legacy compatibility
export async function getTestSeries() {
  const { data, error } = await supabase.from('questions').select('category');
  if (error) throw error;
  const seriesMap = {};
  (data || []).forEach(q => {
    const cat = q.category || 'Uncategorized';
    if (!seriesMap[cat]) seriesMap[cat] = 0;
    seriesMap[cat]++;
  });
  return Object.entries(seriesMap).map(([name, count]) => ({ name, count }));
}

export async function getTestSeriesByCategories(categories) {
  if (!categories || categories.length === 0) return getTestSeries();
  const { data, error } = await supabase.from('questions').select('category').in('category', categories);
  if (error) throw error;
  const seriesMap = {};
  (data || []).forEach(q => {
    const cat = q.category || 'Uncategorized';
    if (!seriesMap[cat]) seriesMap[cat] = 0;
    seriesMap[cat]++;
  });
  return Object.entries(seriesMap).map(([name, count]) => ({ name, count }));
}

export async function getAllTestSeriesByCategories(categories) {
  if (!categories || categories.length === 0) return getAllTestSeries();
  const { data, error } = await supabase.from('test_series').select('id, name, description, created_at').in('name', categories);
  if (error) throw error;
  return data || [];
}

// Test Taking Flow
export async function startTestAttempt(testId, studentId) {
  const { data: existing } = await supabase.from('test_attempts').select('id, status').eq('test_id', testId).eq('student_id', studentId).eq('status', 'in_progress').maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase.from('test_attempts').insert({ test_id: testId, student_id: studentId, status: 'in_progress' }).select('id, test_id, student_id, score, total_marks, correct_count, wrong_count, skipped_count, time_taken, started_at, submitted_at, status').single();
  if (error) throw error;
  return data;
}

export async function getAttempt(attemptId) {
  const { data, error } = await supabase.from('test_attempts').select('id, test_id, student_id, score, total_marks, correct_count, wrong_count, skipped_count, time_taken, started_at, submitted_at, status').eq('id', attemptId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveResponse(attemptId, questionId, studentAnswer, isCorrect, timeSpent, status) {
  const { data, error } = await supabase.from('test_responses').upsert({ attempt_id: attemptId, question_id: questionId, student_answer: studentAnswer, is_correct: isCorrect, time_spent: timeSpent, status }, { onConflict: 'attempt_id,question_id' }).select('id, attempt_id, question_id, student_answer, is_correct, time_spent, status').single();
  if (error) throw error;
  return data;
}

export async function getResponses(attemptId) {
  const { data, error } = await supabase.from('test_responses').select('id, attempt_id, question_id, student_answer, is_correct, time_spent, status').eq('attempt_id', attemptId);
  if (error) throw error;
  return data || [];
}

export async function submitAttempt(attemptId, totalTime) {
  const responses = await getResponses(attemptId);
  const correct_count = responses.filter(r => r.is_correct === true).length;
  const wrong_count = responses.filter(r => r.is_correct === false && r.status === 'answered').length;
  const skipped_count = responses.filter(r => r.status === 'not_attempted' || r.status === 'marked').length;

  const { data: attempt } = await supabase.from('test_attempts').select('total_marks').eq('id', attemptId).single();
  const totalQ = responses.length || 1;
  const marksPerQ = attempt ? Math.floor(attempt.total_marks / totalQ) : 1;
  const score = correct_count * marksPerQ;

  const { data, error } = await supabase.from('test_attempts').update({ score, correct_count, wrong_count, skipped_count, time_taken: totalTime, submitted_at: new Date().toISOString(), status: 'completed' }).eq('id', attemptId).select('id, test_id, student_id, score, total_marks, correct_count, wrong_count, skipped_count, time_taken, started_at, submitted_at, status').single();
  if (error) throw error;

  // Calculate rank
  const { count: totalAttempts } = await supabase.from('test_attempts').select('id', { count: 'exact', head: true }).eq('test_id', data.test_id).eq('status', 'completed');
  const { count: betterScores } = await supabase.from('test_attempts').select('id', { count: 'exact', head: true }).eq('test_id', data.test_id).eq('status', 'completed').gt('score', score);
  const rank = (betterScores || 0) + 1;
  const percentile = totalAttempts > 0 ? ((totalAttempts - rank) / totalAttempts * 100).toFixed(1) : 100;

  await supabase.from('test_attempts').update({ score }).eq('id', attemptId);

  return { ...data, rank, percentile };
}

export async function getTestAttemptHistory(testId, studentId) {
  const { data, error } = await supabase.from('test_attempts').select('id, test_id, student_id, score, total_marks, correct_count, wrong_count, skipped_count, time_taken, started_at, submitted_at, status').eq('test_id', testId).eq('student_id', studentId).order('started_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function reportQuestion({ question_id, student_id, reason, description }) {
  const { data, error } = await supabase.from('question_reports').insert({ question_id, student_id, reason, description }).select('id, question_id, student_id, reason, description, status, created_at').single();
  if (error) throw error;
  return data;
}

export async function getAllQuestionReports() {
  const { data, error } = await supabase.from('question_reports').select('id, question_id, student_id, reason, description, status, created_at').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAttendance({ page = 0, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('attendance')
    .select('id, name, course, present, total, percentage', { count: 'exact' })
    .range(from, to);
  if (error) throw error;
  return { data: data || [], total: count ?? 0 };
}
export async function addAttendance(row) {
  const { data, error } = await supabase.from('attendance').insert(row).select('id, name, course, present, total, percentage').single();
  if (error) throw error;
  return data;
}
export async function updateAttendance(id, row) {
  const { data, error } = await supabase.from('attendance').update(row).eq('id', id).select('id, name, course, present, total, percentage').single();
  if (error) throw error;
  return data;
}

export async function getAnnouncements({ page = 0, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('announcements')
    .select('id, title, content, target, created, status', { count: 'exact' })
    .range(from, to);
  if (error) throw error;
  return { data: data || [], total: count ?? 0 };
}
export async function addAnnouncement(row) {
  const { data, error } = await supabase.from('announcements').insert(row).select('id, title, content, target, created, status').single();
  if (error) throw error;
  return data;
}

export async function getEnrollments({ page = 0, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('enrollments')
    .select('id, name, email, course, requested, status', { count: 'exact' })
    .range(from, to);
  if (error) throw error;
  return { data: data || [], total: count ?? 0 };
}
export async function addEnrollment(row) {
  const { data, error } = await supabase.from('enrollments').insert(row).select('id, name, email, course, requested, status').single();
  if (error) throw error;
  return data;
}
export async function updateEnrollment(id, row) {
  const { data, error } = await supabase.from('enrollments').update(row).eq('id', id).select('id, name, email, course, requested, status').single();
  if (error) throw error;
  return data;
}

export async function getNotifications({ page = 0, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('notifications')
    .select('id, message, time, type', { count: 'exact' })
    .range(from, to);
  if (error) throw error;
  return { data: data || [], total: count ?? 0 };
}
export async function addNotification(row) {
  const { data, error } = await supabase.from('notifications').insert(row).select('id, message, time, type').single();
  if (error) throw error;
  return data;
}

export async function getLiveClasses({ page = 0, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('live_classes')
    .select('id, title, instructor, date, time, description, room_code, students, status, youtube_url', { count: 'exact' })
    .range(from, to);
  if (error) throw error;
  return { data: data || [], total: count ?? 0 };
}
export async function addLiveClass(row) {
  const { data, error } = await supabase.from('live_classes').insert(row).select('id, title, instructor, date, time, description, room_code, students, status, youtube_url').single();
  if (error) throw error;
  return data;
}
export async function updateLiveClass(id, row) {
  const { data, error } = await supabase.from('live_classes').update(row).eq('id', id).select('id, title, instructor, date, time, description, room_code, students, status, youtube_url').single();
  if (error) throw error;
  return data;
}
export async function deleteLiveClass(id) {
  const { error } = await supabase.from('live_classes').delete().eq('id', id);
  if (error) throw error;
}

export async function getAuditLogs({ entity, action, limit = 50, page = 0, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  let q = supabase
    .from('audit_logs')
    .select('id, created_at, username, user_role, action, entity, entity_id, description, ip', { count: 'exact' });
  if (entity) q = q.eq('entity', entity);
  if (action) q = q.eq('action', action);
  q = q.order('created_at', { ascending: false }).range(from, to).limit(limit);
  const { data, error, count } = await q;
  if (error) throw error;
  return { data: data || [], total: count ?? 0 };
}

export async function getAssignmentSubmissions(assignmentId) {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .select('id, assignment_id, student_id, link, submitted_at')
    .eq('assignment_id', assignmentId);
  if (error) throw error;
  return data || [];
}

export async function getMySubmissions(studentId) {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .select('id, assignment_id, student_id, link, submitted_at')
    .eq('student_id', studentId);
  if (error) throw error;
  return data || [];
}

export async function submitAssignmentLink(assignmentId, studentId, link) {
  const { data: existing, error: findErr } = await supabase
    .from('assignment_submissions')
    .select('id')
    .eq('assignment_id', assignmentId)
    .eq('student_id', studentId)
    .maybeSingle();
  if (findErr) throw findErr;

  if (existing) {
    const { data: row, error } = await supabase
      .from('assignment_submissions')
      .update({ link, submitted_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('id, assignment_id, student_id, link, submitted_at')
      .single();
    if (error) throw error;
    return row;
  }
  const { data: row, error } = await supabase
    .from('assignment_submissions')
    .insert({ assignment_id: assignmentId, student_id: studentId, link })
    .select('id, assignment_id, student_id, link, submitted_at')
    .single();
  if (error) throw error;
  return row;
}

export async function getSmtpSettings() {
  const { data, error } = await supabase.from('smtp_settings').select('id, host, port, username, password, sender_name').limit(1).maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function saveSmtpSettings(row) {
  const existing = await getSmtpSettings();
  if (existing) {
    const { data, error } = await supabase.from('smtp_settings').update(row).eq('id', existing.id).select('id, host, port, username, password, sender_name').maybeSingle();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from('smtp_settings').insert(row).select('id, host, port, username, password, sender_name').maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAllCourses() { const { data } = await getCourses({ pageSize: 1000 }); return data; }
export async function getAllStudents() { const { data } = await getStudents({ pageSize: 1000 }); return data; }
export async function getAllInstructors() { const { data } = await getInstructors({ pageSize: 1000 }); return data; }
export async function getAllAssignments() { const { data } = await getAssignments({ pageSize: 1000 }); return data; }
export async function getAllQuizzes() { const { data } = await getQuizzes({ pageSize: 1000 }); return data; }
export async function getAllQuestions() { const { data } = await getQuestions({ pageSize: 1000 }); return data; }
export async function getAllAttendance() { const { data } = await getAttendance({ pageSize: 1000 }); return data; }
export async function getAllAnnouncements() { const { data } = await getAnnouncements({ pageSize: 1000 }); return data; }
export async function getAllEnrollments() { const { data } = await getEnrollments({ pageSize: 1000 }); return data; }
export async function getAllNotifications() { const { data } = await getNotifications({ pageSize: 1000 }); return data; }
export async function getAllLiveClasses() { const { data } = await getLiveClasses({ pageSize: 1000 }); return data; }
export async function getAllAuditLogs(params) { const { data } = await getAuditLogs({ ...params, pageSize: 1000 }); return data; }

// Tickets
export async function getTickets(studentId) {
  let q = supabase.from('tickets').select('id, student_id, subject, message, status, created_at').order('created_at', { ascending: false });
  if (studentId) q = q.eq('student_id', studentId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function addTicket({ student_id, subject, message }) {
  const { data, error } = await supabase.from('tickets').insert({ student_id, subject, message }).select('id, student_id, subject, message, status, created_at').single();
  if (error) throw error;
  return data;
}

export async function updateTicketStatus(id, status) {
  const { data, error } = await supabase.from('tickets').update({ status }).eq('id', id).select('id, student_id, subject, message, status, created_at').single();
  if (error) throw error;
  return data;
}

export async function getTicketReplies(ticketId) {
  const { data, error } = await supabase.from('ticket_replies').select('id, ticket_id, sender_id, message, created_at').eq('ticket_id', ticketId).order('created_at');
  if (error) throw error;
  return data || [];
}

export async function addTicketReply({ ticket_id, sender_id, message }) {
  const { data, error } = await supabase.from('ticket_replies').insert({ ticket_id, sender_id, message }).select('id, ticket_id, sender_id, message, created_at').single();
  if (error) throw error;
  return data;
}

// Calendar Events
export async function getAllCalendarEvents() {
  const { data, error } = await supabase.from('calendar_events').select('id, title, date, time, description, color, created_by, created_at').order('date');
  if (error) throw error;
  return data || [];
}

export async function addCalendarEvent({ title, date, time, description, color, created_by }) {
  const { data, error } = await supabase.from('calendar_events').insert({ title, date, time, description, color, created_by }).select('id, title, date, time, description, color, created_by, created_at').single();
  if (error) throw error;
  return data;
}

export async function updateCalendarEvent(id, row) {
  const { data, error } = await supabase.from('calendar_events').update(row).eq('id', id).select('id, title, date, time, description, color, created_by, created_at').single();
  if (error) throw error;
  return data;
}

export async function deleteCalendarEvent(id) {
  const { error } = await supabase.from('calendar_events').delete().eq('id', id);
  if (error) throw error;
}
