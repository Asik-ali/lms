import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CalendarDays, Clock3, CheckCircle2, FileText, Download, Play } from 'lucide-react';
import { getCourses, getCourseLessons, getCoursePdfs } from '../../data/dynamicStore';

const courseDetails = {
  1: {
    description: 'Build modern, interactive user interfaces with React and understand component-driven architecture.',
    objectives: ['Master React components and props', 'Use state and lifecycle concepts', 'Create reusable UI patterns'],
    lessons: ['Component Lifecycle', 'Hooks and State Management', 'Routing and Forms'],
    duration: '8 weeks',
  },
  2: {
    description: 'Learn server-side JavaScript development with Node.js, APIs, and scalable backend patterns.',
    objectives: ['Build REST APIs', 'Work with middleware and async flows', 'Deploy backend services securely'],
    lessons: ['Middleware Functions', 'Authentication', 'Database Integration'],
    duration: '6 weeks',
  },
  3: {
    description: 'Explore data science workflows using Python, analysis tools, and real-world project techniques.',
    objectives: ['Clean and analyze data', 'Create visualizations', 'Deliver a final data project'],
    lessons: ['Final Project', 'Data Visualization', 'Model Evaluation'],
    duration: '10 weeks',
  },
};

export default function StudentCourseDetail({ courseId: propCourseId }) {
  const { courseId: routeCourseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);

  const resolvedCourseId = propCourseId ?? routeCourseId;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const allCourses = await getCourses();
      const match = allCourses.find(item => String(item.id) === String(resolvedCourseId));
      setCourse(match || null);
      if (match) {
        const courseLessons = await getCourseLessons(match.id);
        const coursePdfs = await getCoursePdfs(match.id);
        setLessons(courseLessons);
        setPdfs(coursePdfs);
      } else {
        setLessons([]);
        setPdfs([]);
      }
      setLoading(false);
    })();
  }, [resolvedCourseId]);

  const details = course ? courseDetails[course.id] || courseDetails[course.title] : null;

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

  if (!course || !details) {
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
              <p className="text-indigo-100">{course.instructor || 'Instructor assigned'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-indigo-100">
            <span className="inline-flex items-center gap-2"><Clock3 className="w-4 h-4" /> {details.duration}</span>
            <span className="inline-flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Due {course.dueDate || 'On track'}</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">Course Progress</span>
              <span className="font-semibold text-gray-700">{course.progress || 0}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${course.progress || 0}%` }} />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">About this course</h2>
            <p className="text-gray-600">{details.description}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Learning objectives</h3>
              <ul className="space-y-2">
                {details.objectives.map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Course videos</h3>
              {lessons.length > 0 ? (
                <div className="space-y-4">
                  {lessons.map(lesson => (
                    <div key={lesson.id} className="rounded-lg border border-gray-200 p-3">
                      <p className="text-sm font-semibold text-gray-900">{lesson.title}</p>
                      <a href={lesson.video_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800">
                        <Play className="w-3.5 h-3.5" /> Watch video
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50 p-3">
                    <p className="text-sm font-semibold text-indigo-700">Lesson preview</p>
                    <p className="mt-1 text-sm text-indigo-600">{course.title} includes instructor-led lesson videos for this module.</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3">
                    <p className="text-sm font-semibold text-gray-900">Module 1: {course.title}</p>
                    <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800">
                      <Play className="w-3.5 h-3.5" /> Watch sample lesson
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">PDF resources</h3>
              {pdfs.length > 0 ? (
                <div className="space-y-3">
                  {pdfs.map(pdf => (
                    <div key={pdf.id} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                      <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{pdf.title}</p>
                      </div>
                      <a
                        href={pdf.pdf_url}
                        download={pdf.title}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" /> Download PDF
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
            <button type="button" className="btn-primary">Continue learning</button>
            <button type="button" onClick={() => navigate('/student/courses')} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Back to courses</button>
          </div>
        </div>
      </div>
    </div>
  );
}
