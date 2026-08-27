import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CalendarDays, Clock3, CheckCircle2, FileText, Download, Play } from 'lucide-react';
import { getCourseById, getCourseLessons, getCoursePdfs } from '../../data/dynamicStore';
import MediaViewer from '../../components/common/MediaViewer';

export default function StudentCourseDetail({ courseId: propCourseId }) {
  const { courseId: routeCourseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mediaViewer, setMediaViewer] = useState(null);

  const resolvedCourseId = propCourseId ?? routeCourseId;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const match = await getCourseById(resolvedCourseId);
        setCourse(match || null);
        if (match) {
          const [courseLessons, coursePdfs] = await Promise.all([
            getCourseLessons(match.id),
            getCoursePdfs(match.id),
          ]);
          setLessons(courseLessons);
          setPdfs(coursePdfs);
        } else {
          setLessons([]);
          setPdfs([]);
        }
      } catch {
        setCourse(null);
        setLessons([]);
        setPdfs([]);
      }
      setLoading(false);
    })();
  }, [resolvedCourseId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => navigate('/student/courses')} className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600">
          <ArrowLeft className="w-4 h-4" /> Back to courses
        </button>
        <div className="card p-8 text-center text-gray-500">Loading course details...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => navigate('/student/courses')} className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600">
          <ArrowLeft className="w-4 h-4" /> Back to courses
        </button>
        <div className="card p-8 text-center text-gray-500">Course not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => navigate('/student/courses')} className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600">
        <ArrowLeft className="w-4 h-4" /> Back to My Courses
      </button>

      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{course.title}</h1>
              <p className="text-indigo-100">{course.instructor}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-indigo-100">
            <span className="inline-flex items-center gap-2"><Clock3 className="w-4 h-4" /> {course.duration}</span>
            <span className="inline-flex items-center gap-2"><CalendarDays className="w-4 h-4" /> {course.category}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${course.status === 'Published' ? 'bg-green-500/20 text-green-100' : 'bg-gray-500/20 text-gray-200'}`}>{course.status}</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Course Info</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" /><span>Instructor: {course.instructor}</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" /><span>Category: {course.category}</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" /><span>Duration: {course.duration}</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" /><span>Students enrolled: {course.students}</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" /><span>Total lessons: {course.lessons}</span></li>
              </ul>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Course videos</h3>
              {lessons.length > 0 ? (
                <div className="space-y-4">
                  {lessons.map(lesson => (
                    <div key={lesson.id} className="rounded-lg border border-gray-200 p-3">
                      <p className="text-sm font-semibold text-gray-900">{lesson.title}</p>
                      <button onClick={() => setMediaViewer({ url: lesson.video_url, title: lesson.title, type: 'video' })} className="mt-2 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800">
                        <Play className="w-3.5 h-3.5" /> Watch video
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No video lessons uploaded yet.</p>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 p-4 md:col-span-2">
              <h3 className="font-semibold text-gray-900 mb-3">PDF resources</h3>
              {pdfs.length > 0 ? (
                <div className="space-y-3">
                  {pdfs.map(pdf => (
                    <div key={pdf.id} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                      <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{pdf.title}</p>
                      </div>
                      <button
                        onClick={() => setMediaViewer({ url: pdf.pdf_url, title: pdf.title, type: 'pdf' })}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" /> View PDF
                      </button>
                      <a
                        href={pdf.pdf_url}
                        download={pdf.title}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No PDF resources available for this course.</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => navigate('/student/courses')} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Back to courses</button>
          </div>
        </div>
      </div>

      {mediaViewer && (
        <MediaViewer {...mediaViewer} onClose={() => setMediaViewer(null)} />
      )}
    </div>
  );
}
