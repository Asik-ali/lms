import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, ChevronDown, Video, FileText, ExternalLink } from 'lucide-react';
import { getCourses, addCourse, updateCourse, deleteCourse, getCategories, getInstructors, getCourseLessons, addCourseLesson, deleteCourseLesson, getCoursePdfs, addCoursePdf, deleteCoursePdf } from '../../data/dynamicStore';
import { showSuccess, showError } from '../../components/common/Toast';

const emptyForm = { title: '', instructor: '', category: '', duration: '', status: 'Draft' };

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [cats, setCats] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [lessonCourse, setLessonCourse] = useState(null);
  const [courseLessons, setCourseLessons] = useState([]);
  const [lessonForm, setLessonForm] = useState({ title: '', videoUrl: '' });
  const [pdfCourse, setPdfCourse] = useState(null);
  const [coursePdfs, setCoursePdfs] = useState([]);
  const [pdfForm, setPdfForm] = useState({ title: '', pdfUrl: '' });

  useEffect(() => { refresh(); loadCats(); loadInstructors(); }, []);

  async function refresh() {
    try {
      setCourses([...(await getCourses())]);
    } catch (err) {
      showError('Failed to load courses');
    }
  }

  async function loadCats() {
    setCats(await getCategories());
  }

  async function loadInstructors() {
    setInstructors(await getInstructors());
  }

  function handleOpenAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  async function handleOpenEdit(course) {
    setForm({ title: course.title, instructor: course.instructor, category: course.category, duration: course.duration, status: course.status });
    setEditingId(course.id);
    setShowForm(true);
    setCourseLessons(await getCourseLessons(course.id));
    setCoursePdfs(await getCoursePdfs(course.id));
    setLessonForm({ title: '', videoUrl: '' });
    setPdfForm({ title: '', pdfUrl: '' });
  }

  function handleClose() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setCourseLessons([]);
    setCoursePdfs([]);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editingId) {
      await updateCourse(editingId, form);
    } else {
      await addCourse(form);
    }
    await refresh();
    handleClose();
  }

  async function handleDelete(id) {
    await deleteCourse(id);
    await refresh();
  }

  async function openLessons(course) {
    try {
      setLessonCourse(course);
      setLessonForm({ title: '', videoUrl: '' });
      setCourseLessons(await getCourseLessons(course.id));
    } catch (error) {
      showError(error.message || 'Failed to load lessons');
    }
  }

  async function openPdfs(course) {
    try {
      setPdfCourse(course);
      setPdfForm({ title: '', pdfUrl: '' });
      setCoursePdfs(await getCoursePdfs(course.id));
    } catch (error) {
      showError(error.message || 'Failed to load PDFs');
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
    const provider = getVideoProvider(lessonForm.videoUrl);
    if (!provider) return showError('Use a valid YouTube or Google Drive video link.');
    try {
      await addCourseLesson({
        course_id: lessonCourse.id,
        title: lessonForm.title,
        video_url: lessonForm.videoUrl,
        provider,
        position: courseLessons.length + 1,
      });
      const lessons = await getCourseLessons(lessonCourse.id);
      await updateCourse(lessonCourse.id, { lessons: lessons.length });
      setCourseLessons(lessons);
      setLessonCourse(course => ({ ...course, lessons: lessons.length }));
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
      const lessons = await getCourseLessons(lessonCourse.id);
      await updateCourse(lessonCourse.id, { lessons: lessons.length });
      setCourseLessons(lessons);
      setLessonCourse(course => ({ ...course, lessons: lessons.length }));
      await refresh();
      showSuccess('Lesson removed.');
    } catch (error) {
      showError(error.message || 'Failed to remove lesson.');
    }
  }

  async function handleAddPdf(e) {
    e.preventDefault();
    if (!pdfForm.pdfUrl) return showError('Enter a PDF URL.');
    try {
      await addCoursePdf({
        course_id: pdfCourse.id,
        title: pdfForm.title,
        pdf_url: pdfForm.pdfUrl,
        position: coursePdfs.length + 1,
      });
      setCoursePdfs(await getCoursePdfs(pdfCourse.id));
      setPdfForm({ title: '', pdfUrl: '' });
      showSuccess('PDF added successfully.');
    } catch (error) {
      showError(error.message || 'Failed to add PDF.');
    }
  }

  async function handleDeletePdf(id) {
    try {
      await deleteCoursePdf(id);
      setCoursePdfs(await getCoursePdfs(pdfCourse.id));
      showSuccess('PDF removed.');
    } catch (error) {
      showError(error.message || 'Failed to remove PDF.');
    }
  }

  const filtered = courses.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.instructor.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === 'All' || c.category === filterCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
        <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Course
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="relative">
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="input-field appearance-none pr-10"
          >
            <option value="All">All Categories</option>
            {cats.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {showForm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{editingId ? 'Edit Course' : 'Add Course'}</h2>
            <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input name="title" value={form.title} onChange={handleChange} className="input-field w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
                <select name="instructor" value={form.instructor} onChange={handleChange} className="input-field w-full" required>
                  <option value="">Select instructor</option>
                  {instructors.map(i => (
                    <option key={i.id} value={i.name}>{i.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select name="category" value={form.category} onChange={handleChange} className="input-field w-full" required>
                  <option value="">Select category</option>
                  {cats.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <input name="duration" value={form.duration} onChange={handleChange} className="input-field w-full" required placeholder="e.g. 8 weeks" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
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
              <div className="rounded-lg border border-gray-200 p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Video Lessons</h3>
                  <p className="text-sm text-gray-500">Add or remove video lessons for this course.</p>
                </div>
                <form onSubmit={handleAddLesson} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-3">
                  <input value={lessonForm.title} onChange={e => setLessonForm(form => ({ ...form, title: e.target.value }))} className="input-field" placeholder="Lesson title" required />
                  <input type="url" value={lessonForm.videoUrl} onChange={e => setLessonForm(form => ({ ...form, videoUrl: e.target.value }))} className="input-field" placeholder="YouTube or Google Drive link" required />
                  <button type="submit" className="btn-primary flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Lesson</button>
                </form>
                {courseLessons.length ? (
                  <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                    {courseLessons.map((lesson, index) => (
                      <div key={lesson.id} className="flex items-center gap-3 p-3">
                        <span className="text-sm font-medium text-gray-400">{index + 1}</span>
                        <Video className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-800">{lesson.title}</p>
                          <p className="text-xs text-gray-500">{lesson.provider}</p>
                        </div>
                        <a href={lesson.video_url} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:text-indigo-600" aria-label={`Open ${lesson.title}`}><ExternalLink className="w-4 h-4" /></a>
                        <button onClick={() => handleDeleteLesson(lesson.id)} className="p-1.5 text-gray-400 hover:text-red-600" aria-label={`Delete ${lesson.title}`}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-500">No lessons added yet.</p>}
              </div>
            )}

            {editingId && (
              <div className="rounded-lg border border-gray-200 p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">PDF Resources</h3>
                  <p className="text-sm text-gray-500">Add PDF documents for students to download.</p>
                </div>
                <form onSubmit={handleAddPdf} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-3">
                  <input value={pdfForm.title} onChange={e => setPdfForm(form => ({ ...form, title: e.target.value }))} className="input-field" placeholder="PDF title" required />
                  <input type="url" value={pdfForm.pdfUrl} onChange={e => setPdfForm(form => ({ ...form, pdfUrl: e.target.value }))} className="input-field" placeholder="PDF URL (direct link)" required />
                  <button type="submit" className="btn-primary flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add PDF</button>
                </form>
                {coursePdfs.length ? (
                  <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                    {coursePdfs.map((pdf, index) => (
                      <div key={pdf.id} className="flex items-center gap-3 p-3">
                        <span className="text-sm font-medium text-gray-400">{index + 1}</span>
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-800">{pdf.title}</p>
                        </div>
                        <a href={pdf.pdf_url} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:text-indigo-600" aria-label={`Open ${pdf.title}`}><ExternalLink className="w-4 h-4" /></a>
                        <button onClick={() => handleDeletePdf(pdf.id)} className="p-1.5 text-gray-400 hover:text-red-600" aria-label={`Delete ${pdf.title}`}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-500">No PDFs added yet.</p>}
              </div>
            )}
          </form>
        </div>
      )}

      {lessonCourse && (
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Lessons: {lessonCourse.title}</h2>
              <p className="text-sm text-gray-500">Add YouTube or Google Drive video lessons.</p>
            </div>
            <button onClick={() => setLessonCourse(null)} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Close lessons">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleAddLesson} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-3">
            <input value={lessonForm.title} onChange={e => setLessonForm(form => ({ ...form, title: e.target.value }))} className="input-field" placeholder="Lesson title" required />
            <input type="url" value={lessonForm.videoUrl} onChange={e => setLessonForm(form => ({ ...form, videoUrl: e.target.value }))} className="input-field" placeholder="YouTube or Google Drive link" required />
            <button type="submit" className="btn-primary flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Lesson</button>
          </form>
          {courseLessons.length ? (
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {courseLessons.map((lesson, index) => (
                <div key={lesson.id} className="flex items-center gap-3 p-3">
                  <span className="text-sm font-medium text-gray-400">{index + 1}</span>
                  <Video className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">{lesson.title}</p>
                    <p className="text-xs text-gray-500">{lesson.provider}</p>
                  </div>
                  <a href={lesson.video_url} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:text-indigo-600" aria-label={`Open ${lesson.title}`}><ExternalLink className="w-4 h-4" /></a>
                  <button onClick={() => handleDeleteLesson(lesson.id)} className="p-1.5 text-gray-400 hover:text-red-600" aria-label={`Delete ${lesson.title}`}><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-500">No lessons added yet.</p>}
        </div>
      )}

      {pdfCourse && (
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">PDFs: {pdfCourse.title}</h2>
              <p className="text-sm text-gray-500">Add PDF documents for students to download.</p>
            </div>
            <button onClick={() => setPdfCourse(null)} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Close PDFs">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleAddPdf} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-3">
            <input value={pdfForm.title} onChange={e => setPdfForm(form => ({ ...form, title: e.target.value }))} className="input-field" placeholder="PDF title" required />
            <input type="url" value={pdfForm.pdfUrl} onChange={e => setPdfForm(form => ({ ...form, pdfUrl: e.target.value }))} className="input-field" placeholder="PDF URL (direct link)" required />
            <button type="submit" className="btn-primary flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add PDF</button>
          </form>
          {coursePdfs.length ? (
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {coursePdfs.map((pdf, index) => (
                <div key={pdf.id} className="flex items-center gap-3 p-3">
                  <span className="text-sm font-medium text-gray-400">{index + 1}</span>
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">{pdf.title}</p>
                  </div>
                  <a href={pdf.pdf_url} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:text-indigo-600" aria-label={`Open ${pdf.title}`}><ExternalLink className="w-4 h-4" /></a>
                  <button onClick={() => handleDeletePdf(pdf.id)} className="p-1.5 text-gray-400 hover:text-red-600" aria-label={`Delete ${pdf.title}`}><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-500">No PDFs added yet.</p>}
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="table-header">Title</th>
              <th className="table-header">Instructor</th>
              <th className="table-header">Category</th>
              <th className="table-header">Students</th>
              <th className="table-header">Lessons</th>
              <th className="table-header">Status</th>
              <th className="table-header">Duration</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="table-cell font-medium">{c.title}</td>
                <td className="table-cell text-gray-500">{c.instructor}</td>
                <td className="table-cell">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.category}</span>
                </td>
                <td className="table-cell">{c.students}</td>
                <td className="table-cell">{c.lessons}</td>
                <td className="table-cell">
                  <span className={`badge ${c.status === 'Published' ? 'badge-success' : 'badge-warning'}`}>{c.status}</span>
                </td>
                <td className="table-cell text-gray-500">{c.duration}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleOpenEdit(c)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => openLessons(c)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Manage lessons">
                      <Video className="w-4 h-4" />
                    </button>
                    <button onClick={() => openPdfs(c)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Manage PDFs">
                      <FileText className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
  );
}
