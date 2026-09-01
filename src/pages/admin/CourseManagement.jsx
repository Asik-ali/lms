import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, Trash2, X, Video, FileText, ExternalLink } from 'lucide-react';
import { getAllCourses, addCourse, updateCourse, deleteCourse, getCourseLessons, addCourseLesson, deleteCourseLesson, getCoursePdfs, addCoursePdf, deleteCoursePdf } from '../../data/dynamicStore';
import { showSuccess, showError } from '../../components/common/Toast';
import MediaViewer from '../../components/common/MediaViewer';
import { useAuth } from '../../contexts/AuthContext';

const emptyForm = { title: '', duration: '', status: 'Draft' };

export default function CourseManagement() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isCreatePage = location.pathname.endsWith('/create');
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(isCreatePage);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [courseLessons, setCourseLessons] = useState([]);
  const [lessonForm, setLessonForm] = useState({ title: '', videoUrl: '' });
  const [coursePdfs, setCoursePdfs] = useState([]);
  const [pdfForm, setPdfForm] = useState({ title: '', pdfUrl: '' });
  const [mediaViewer, setMediaViewer] = useState(null);
  const [maxDays, setMaxDays] = useState(0);
  const [activeDay, setActiveDay] = useState(1);

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    if (isCreatePage) {
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(true);
    }
  }, [isCreatePage]);

  async function refresh() {
    try {
      setCourses([...(await getAllCourses())]);
    } catch (err) {
      showError('Failed to load courses');
    }
  }

  function handleOpenAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  async function handleOpenEdit(course) {
    setForm({ title: course.title, duration: course.duration, status: course.status });    setEditingId(course.id);
    setShowForm(true);
    const days = parseDurationDays(course.duration);
    setMaxDays(days);
    setActiveDay(1);
    try {
      setCourseLessons(await getCourseLessons(course.id));
      setCoursePdfs(await getCoursePdfs(course.id));
    } catch (err) {
      console.error('Failed to load course lessons/pdfs:', err);
      setCourseLessons([]);
      setCoursePdfs([]);
    }
    setLessonForm({ title: '', videoUrl: '' });
    setPdfForm({ title: '', pdfUrl: '' });
  }

  function handleClose() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setCourseLessons([]);
    setCoursePdfs([]);
    setMaxDays(0);
    setActiveDay(1);
    if (isCreatePage) navigate('/admin/courses');
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === 'duration') {
      setMaxDays(parseDurationDays(e.target.value));
      setActiveDay(1);
    }
  }

  function parseDurationDays(duration) {
    if (!duration) return 0;
    const match = String(duration).match(/\d+/);
    const n = match ? parseInt(match[0], 10) : 0;
    return n > 0 && n <= 365 ? n : 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form, instructor: user?.name || user?.username || '' };
    try {
      if (editingId) {
        await updateCourse(editingId, payload);
      } else {
        await addCourse(payload);
      }
      await refresh();
      handleClose();
      if (isCreatePage) navigate('/admin/courses');
    } catch (err) {
      showError(err.message || 'Failed to save course');
    }
  }

  async function handleDelete(id) {
    try {
      await deleteCourse(id);
      await refresh();
    } catch (err) {
      showError(err.message || 'Failed to delete course');
    }
  }

  function getVideoProvider(videoUrl) {
    try {
      const hostname = new URL(videoUrl).hostname.toLowerCase();
      if (hostname === 'youtu.be' || hostname.endsWith('youtube.com')) return 'YouTube';
      if (hostname === 'drive.google.com') return 'Google Drive';
    } catch {}
    return null;
  }

  async function handleAddLesson(e) {
    e.preventDefault();
    try {
      const title = lessonForm.title.trim() || `Day ${activeDay} - Video ${(courseLessons.filter(l => Number(l.day) === activeDay).length) + 1}`;
      let videoUrl = lessonForm.videoUrl.trim();
      let provider = getVideoProvider(videoUrl) || 'Link';
      if (videoUrl && !getVideoProvider(videoUrl)) provider = 'Link';
      await addCourseLesson({
        course_id: editingId,
        title,
        video_url: videoUrl || 'https://example.com/',
        provider,
        day: activeDay,
        position: courseLessons.length + 1,
      });
      const lessons = await getCourseLessons(editingId);
      await updateCourse(editingId, { lessons: lessons.length });
      setCourseLessons(lessons);
      setLessonForm({ title: '', videoUrl: '' });
      await refresh();
      showSuccess('Lesson added successfully.');
    } catch (error) {
      showError(error.message || 'Failed to add lesson.');
    }
  }

  async function handleDeleteLesson(id) {
    try {
      await deleteCourseLesson(id);
      const lessons = await getCourseLessons(editingId);
      await updateCourse(editingId, { lessons: lessons.length });
      setCourseLessons(lessons);
      await refresh();
      showSuccess('Lesson removed.');
    } catch (error) {
      showError(error.message || 'Failed to remove lesson.');
    }
  }

  async function handleAddPdf(e) {
    e.preventDefault();
    try {
      const title = pdfForm.title.trim() || `Day ${activeDay} - PDF ${(coursePdfs.filter(p => Number(p.day) === activeDay).length) + 1}`;
      await addCoursePdf({
        course_id: editingId,
        title,
        pdf_url: pdfForm.pdfUrl.trim() || 'https://example.com/',
        day: activeDay,
        position: coursePdfs.length + 1,
      });
      setCoursePdfs(await getCoursePdfs(editingId));
      setPdfForm({ title: '', pdfUrl: '' });
      showSuccess('PDF added successfully.');
    } catch (error) {
      showError(error.message || 'Failed to add PDF.');
    }
  }

  async function handleDeletePdf(id) {
    try {
      await deleteCoursePdf(id);
      setCoursePdfs(await getCoursePdfs(editingId));
      showSuccess('PDF removed.');
    } catch (error) {
      showError(error.message || 'Failed to remove PDF.');
    }
  }

  const filtered = courses.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Course Management</h1>
        <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Course
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {showForm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{editingId ? 'Edit Course' : 'Add Course'}</h2>
            <button onClick={handleClose} className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input name="title" value={form.title} onChange={handleChange} className="input-field w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
                <input name="duration" value={form.duration} onChange={handleChange} className="input-field w-full" required placeholder="e.g. 8 weeks" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select name="status" value={form.status} onChange={handleChange} className="input-field w-full">
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Add'} Course</button>
                <button type="button" onClick={handleClose} className="btn-secondary">Cancel</button>
              </div>
            </div>

            {editingId && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Video Lessons &amp; PDF Resources</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {maxDays > 0
                      ? `This course has ${maxDays} days. Select a day to add videos and PDFs (all optional, multiple allowed per day).`
                      : 'Add a numeric Duration (e.g. 90 DAYS) to enable day-wise videos and PDFs. All fields are optional.'}
                  </p>
                </div>

                {maxDays > 0 && (
                  <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto py-1">
                    {Array.from({ length: maxDays }, (_, i) => i + 1).map(day => {
                      const hasVideos = courseLessons.some(l => Number(l.day) === day);
                      const hasPdfs = coursePdfs.some(p => Number(p.day) === day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => { setActiveDay(day); setLessonForm({ title: '', videoUrl: '' }); setPdfForm({ title: '', pdfUrl: '' }); }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                            activeDay === day
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-400'
                          }`}
                        >
                          Day {day}
                          {(hasVideos || hasPdfs) && <span className="ml-1.5 text-xs opacity-80">({(hasVideos ? 1 : 0) + (hasPdfs ? 1 : 0)})</span>}
                        </button>
                      );
                    })}
                  </div>
                )}

                {maxDays > 0 && (
                  <>
                    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Day {activeDay} – Video Lessons</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Add one or more videos for this day (all optional).</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-3">
                        <input value={lessonForm.title} onChange={e => setLessonForm(form => ({ ...form, title: e.target.value }))} className="input-field" placeholder="Lesson title" />
                        <input type="url" value={lessonForm.videoUrl} onChange={e => setLessonForm(form => ({ ...form, videoUrl: e.target.value }))} className="input-field" placeholder="YouTube or Google Drive link" />
                        <button type="button" onClick={handleAddLesson} className="btn-primary flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Lesson</button>
                      </div>
                      {(() => {
                        const dayLessons = courseLessons.filter(l => Number(l.day) === activeDay);
                        return dayLessons.length ? (
                          <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-lg border border-gray-200 dark:border-gray-800">
                            {dayLessons.map((lesson, index) => (
                              <div key={lesson.id} className="flex items-center gap-3 p-3">
                                <span className="text-sm font-medium text-gray-400 dark:text-gray-500">{index + 1}</span>
                                <Video className="w-4 h-4 text-indigo-600 dark:text-indigo-300 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{lesson.title}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{lesson.provider}</p>
                                </div>
                                <button type="button" onClick={() => setMediaViewer({ url: lesson.video_url, title: lesson.title, type: 'video' })} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-indigo-600" aria-label={`Open ${lesson.title}`}><ExternalLink className="w-4 h-4" /></button>
                                <button type="button" onClick={() => handleDeleteLesson(lesson.id)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600" aria-label={`Delete ${lesson.title}`}><Trash2 className="w-4 h-4" /></button>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-sm text-gray-500 dark:text-gray-400">No videos for Day {activeDay} yet.</p>;
                      })()}
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Day {activeDay} – PDF Resources</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Add one or more PDFs for this day (all optional).</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-3">
                        <input value={pdfForm.title} onChange={e => setPdfForm(form => ({ ...form, title: e.target.value }))} className="input-field" placeholder="PDF title" />
                        <input type="url" value={pdfForm.pdfUrl} onChange={e => setPdfForm(form => ({ ...form, pdfUrl: e.target.value }))} className="input-field" placeholder="PDF URL (direct link)" />
                        <button type="button" onClick={handleAddPdf} className="btn-primary flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add PDF</button>
                      </div>
                      {(() => {
                        const dayPdfs = coursePdfs.filter(p => Number(p.day) === activeDay);
                        return dayPdfs.length ? (
                          <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-lg border border-gray-200 dark:border-gray-800">
                            {dayPdfs.map((pdf, index) => (
                              <div key={pdf.id} className="flex items-center gap-3 p-3">
                                <span className="text-sm font-medium text-gray-400 dark:text-gray-500">{index + 1}</span>
                                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-300 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{pdf.title}</p>
                                </div>
                                <button type="button" onClick={() => setMediaViewer({ url: pdf.pdf_url, title: pdf.title, type: 'pdf' })} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-indigo-600" aria-label={`Open ${pdf.title}`}><ExternalLink className="w-4 h-4" /></button>
                                <button type="button" onClick={() => handleDeletePdf(pdf.id)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600" aria-label={`Delete ${pdf.title}`}><Trash2 className="w-4 h-4" /></button>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-sm text-gray-500 dark:text-gray-400">No PDFs for Day {activeDay} yet.</p>;
                      })()}
                    </div>
                  </>
                )}
              </div>
            )}
          </form>
        </div>
      )}

      {mediaViewer && (
        <MediaViewer {...mediaViewer} onClose={() => setMediaViewer(null)} />
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
              <th className="table-header">Title</th>
              <th className="table-header">Students</th>
              <th className="table-header">Lessons</th>
              <th className="table-header">Status</th>
              <th className="table-header">Duration</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                <td className="table-cell font-medium">{c.title}</td>
                <td className="table-cell">{c.students}</td>
                <td className="table-cell">{c.lessons}</td>
                <td className="table-cell">
                  <span className={`badge ${c.status === 'Published' ? 'badge-success' : 'badge-warning'}`}>{c.status}</span>
                </td>
                <td className="table-cell text-gray-500 dark:text-gray-400">{c.duration}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleOpenEdit(c)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
