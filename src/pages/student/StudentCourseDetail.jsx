import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock3, CheckCircle2, FileText, Play, CalendarDays, ChevronDown } from 'lucide-react';
import { getCourseById, getCourseLessons, getCoursePdfs } from '../../data/dynamicStore';
import MediaViewer from '../../components/common/MediaViewer';

export default function StudentCourseDetail({ courseId: propCourseId }) {
  const { courseId: routeCourseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resourceErrors, setResourceErrors] = useState({});
  const [retry, setRetry] = useState(0);
  const [mediaViewer, setMediaViewer] = useState(null);
  const [openDay, setOpenDay] = useState(null);

  const resolvedCourseId = propCourseId ?? routeCourseId;

  const days = useMemo(() => {
    const map = new Map();
    const add = (items, type) => {
      (items || []).forEach(item => {
        const day = Number(item.day) || 0;
        if (!map.has(day)) map.set(day, { day, videos: [], pdfs: [] });
        map.get(day)[type].push(item);
      });
    };
    add(lessons, 'videos');
    add(pdfs, 'pdfs');
    return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v);
  }, [lessons, pdfs]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      setResourceErrors({});
      try {
        const [courseResult, videosResult, pdfsResult] = await Promise.allSettled([
          getCourseById(resolvedCourseId), getCourseLessons(resolvedCourseId), getCoursePdfs(resolvedCourseId, { hideSource: true }),
        ]);
        if (!active) return;
        if (courseResult.status === 'rejected') throw courseResult.reason;
        const match = courseResult.value;
        setCourse(match || null);
        if (match) {
          setLessons(videosResult.status === 'fulfilled' ? videosResult.value : []);
          setPdfs(pdfsResult.status === 'fulfilled' ? pdfsResult.value : []);
          setResourceErrors({ videos: videosResult.status === 'rejected', pdfs: pdfsResult.status === 'rejected' });
        } else {
          setLessons([]);
          setPdfs([]);
        }
      } catch (err) {
        if (!active) return;
        console.error('Failed to load course:', err);
        setError('Unable to load this course. Please check your connection and try again.');
        setCourse(null);
        setLessons([]);
        setPdfs([]);
      }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [resolvedCourseId, retry]);

  useEffect(() => { setMediaViewer(null); setOpenDay(null); }, [resolvedCourseId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => navigate('/student/courses')} className="inline-flex items-center gap-2 text-sm font-medium text-navy-600">
          <ArrowLeft className="w-4 h-4" /> Back to courses
        </button>
        <div className="card p-8 text-center text-navy-200">Loading course details...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => navigate('/student/courses')} className="inline-flex items-center gap-2 text-sm font-medium text-navy-600">
          <ArrowLeft className="w-4 h-4" /> Back to courses
        </button>
        <div className="card p-8 text-center text-navy-200" role={error ? 'alert' : undefined}>{error || 'Course not found.'}{error && <button className="btn-secondary mt-4 mx-auto flex" onClick={() => setRetry(value => value + 1)}>Retry course</button>}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => navigate('/student/courses')} className="inline-flex items-center gap-2 text-sm font-medium text-navy-600">
        <ArrowLeft className="w-4 h-4" /> Back to My Courses
      </button>

      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-[#071A3D] to-navy-600 p-6 text-white dark:from-navy-900">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{course.title}</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-[#D6E4FA]">
            <span className="inline-flex items-center gap-2"><Clock3 className="w-4 h-4" /> {course.duration}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${course.status === 'Published' ? 'bg-emerald-500/20 text-emerald-100' : 'bg-navy-800/20 text-navy-200'}`}>{course.status}</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-lg border border-navy-700 p-4">
              <h3 className="font-semibold text-navy-100 mb-3">Course Info</h3>
              <ul className="space-y-2 text-sm text-navy-100">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" /><span>Duration: {course.duration}</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" /><span>Total lessons: {course.lessons}</span></li>
              </ul>
            </div>

            <div className="rounded-lg border border-navy-700 p-4 md:col-span-2">
              <h3 className="font-semibold text-navy-100 mb-3">Lessons &amp; Resources</h3>
              {(resourceErrors.videos || resourceErrors.pdfs) && <div role="alert" className="mb-4 rounded-lg border border-navy-700 bg-navy-900 p-4 text-sm text-navy-200"><p>{resourceErrors.videos ? 'Videos could not be loaded. ' : ''}{resourceErrors.pdfs ? 'PDF resources could not be loaded.' : ''}</p><button className="btn-secondary mt-3" onClick={() => setRetry(value => value + 1)}>Retry resources</button></div>}
              {days.length > 0 ? (
                <div className="space-y-4">
                  {days.map(group => (
                    <div key={group.day} className="rounded-lg border border-navy-700 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setOpenDay(openDay === group.day ? null : group.day)}
                        className="w-full flex items-center gap-2 px-4 py-3 bg-navy-800/60 cursor-pointer hover:bg-navy-700"
                      >
                        <CalendarDays className="w-4 h-4 text-navy-600 dark:text-navy-300" />
                        <span className="flex-1 text-left text-sm font-semibold text-navy-100">
                          {group.day > 0 ? `Day ${group.day}` : 'General'}
                        </span>
                        <span className="text-xs text-navy-300">{group.videos.length} V · {group.pdfs.length} P</span>
                        <ChevronDown className={`w-4 h-4 text-navy-300 transition-transform ${openDay === group.day ? 'rotate-180' : ''}`} />
                      </button>

                      {openDay === group.day && (
                        <div className="p-4 space-y-4">
                          {group.videos.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-navy-200 uppercase tracking-wide">Videos</p>
                              {group.videos.map((lesson, i) => (
                                <div key={lesson.id} className="rounded-lg border border-navy-700 p-3">
                                  <p className="text-sm font-semibold text-navy-100">{i + 1}. {lesson.title}</p>
                                  <button type="button" onClick={() => setMediaViewer({ url: lesson.video_url, title: lesson.title, type: 'video' })} className="mt-2 inline-flex items-center gap-1.5 text-sm text-navy-600 hover:text-navy-500 dark:hover:text-navy-400">
                                    <Play className="w-3.5 h-3.5" /> Watch video
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {group.pdfs.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-navy-200 uppercase tracking-wide">PDFs</p>
                              {group.pdfs.map((pdf, i) => (
                                <div key={pdf.id} className="flex items-center gap-3 rounded-lg border border-navy-700 p-3">
                                  <FileText className="w-5 h-5 text-navy-600 shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-navy-100 truncate">{i + 1}. {pdf.title}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setMediaViewer({ fileId: pdf.id, title: pdf.title, type: 'pdf' })}
                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-600 hover:text-navy-500 dark:hover:text-navy-400 shrink-0"
                                  >
                                    View PDF
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {group.videos.length === 0 && group.pdfs.length === 0 && (                            <p className="text-sm text-navy-200">No content for {group.day > 0 ? `Day ${group.day}` : 'this section'} yet.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                !resourceErrors.videos && !resourceErrors.pdfs && <p className="text-sm text-navy-200">No lessons or resources uploaded yet.</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => navigate('/student/courses')} className="px-4 py-2 rounded-lg border border-navy-700 text-navy-100 hover:bg-navy-700/60">Back to courses</button>
          </div>
        </div>
      </div>

      {mediaViewer && (
        <MediaViewer {...mediaViewer} onClose={() => setMediaViewer(null)} />
      )}
    </div>
  );
}
