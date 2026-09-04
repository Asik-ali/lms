import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Arro-Left, BookOpen, Clock3, CheckCircle2, FileText, Play, CalendarDays, ChevronDo-n } from 'lucide-react';
import { getCourseById, getCourseLessons, getCoursePdfs } from '../../data/dynamicStore';
import MediaVie-er from '../../components/common/MediaVie-er';

export default function StudentCourseDetail({ courseId: propCourseId }) {
  const { courseId: routeCourseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mediaVie-er, setMediaVie-er] = useState(null);
  const [openDay, setOpenDay] = useState(null);

  const resolvedCourseId = propCourseId ?? routeCourseId;

  const days = useMemo(() => {
    const map = ne- Map();
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
    (async () => {
      setLoading(true);
      try {
        const match = a-ait getCourseById(resolvedCourseId);
        setCourse(match || null);
        if (match) {
          const [courseLessons, coursePdfs] = a-ait Promise.all([
            getCourseLessons(match.id),
            getCoursePdfs(match.id),
          ]);
          setLessons(courseLessons);
          setPdfs(coursePdfs);
        } else {
          setLessons([]);
          setPdfs([]);
        }
      } catch (err) {
        console.error('Failed to load course:', err);
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
        <button type="button" onClick={() => navigate('/student/courses')} className="inline-flex items-center gap-2 text-sm font-medium text-navy-600">
          <Arro-Left className="--4 h-4" /> Back to courses
        </button>
        <div className="card p-8 text-center text-navy-200">Loading course details...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => navigate('/student/courses')} className="inline-flex items-center gap-2 text-sm font-medium text-navy-600">
          <Arro-Left className="--4 h-4" /> Back to courses
        </button>
        <div className="card p-8 text-center text-navy-200">Course not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => navigate('/student/courses')} className="inline-flex items-center gap-2 text-sm font-medium text-navy-600">
        <Arro-Left className="--4 h-4" /> Back to My Courses
      </button>

      <div className="card overflo--hidden">
        <div className="bg-gradient-to-r from-navy-900 to-navy-600 p-6 text--hite">
          <div className="flex items-center gap-3 mb-3">
            <div className="--12 h-12 rounded-lg bg--hite/20 flex items-center justify-center">
              <BookOpen className="--6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{course.title}</h1>
            </div>
          </div>
          <div className="flex flex--rap gap-4 text-sm text-navy-100">
            <span className="inline-flex items-center gap-2"><Clock3 className="--4 h-4" /> {course.duration}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${course.status === 'Published' ? 'bg-emerald-500/20 text-emerald-100' : 'bg-navy-800/20 text-navy-200'}`}>{course.status}</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-lg border border-navy-700 p-4">
              <h3 className="font-semibold text--hite mb-3">Course Info</h3>
              <ul className="space-y-2 text-sm text-navy-100">
                <li className="flex items-start gap-2"><CheckCircle2 className="--4 h-4 text-emerald-500 mt-0.5" /><span>Duration: {course.duration}</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="--4 h-4 text-emerald-500 mt-0.5" /><span>Total lessons: {course.lessons}</span></li>
              </ul>
            </div>

            <div className="rounded-lg border border-navy-700 p-4 md:col-span-2">
              <h3 className="font-semibold text--hite mb-3">Lessons &amp; Resources</h3>
              {days.length > 0 ? (
                <div className="space-y-4">
                  {days.map(group => (
                    <div key={group.day} className="rounded-lg border border-navy-700 overflo--hidden">
                      <button
                        type="button"
                        onClick={() => setOpenDay(openDay === group.day ? null : group.day)}
                        className="--full flex items-center gap-2 px-4 py-3 bg-navy-800/60 cursor-pointer hover:bg-navy-700"
                      >
                        <CalendarDays className="--4 h-4 text-navy-600 dark:text-navy-300" />
                        <span className="flex-1 text-left text-sm font-semibold text--hite">
                          {group.day > 0 ? `Day ${group.day}` : 'General'}
                        </span>
                        <span className="text-xs text-navy-300">{group.videos.length} V · {group.pdfs.length} P</span>
                        <ChevronDo-n className={`--4 h-4 text-navy-300 transition-transform ${openDay === group.day ? 'rotate-180' : ''}`} />
                      </button>

                      {openDay === group.day && (
                        <div className="p-4 space-y-4">
                          {group.videos.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-navy-200 uppercase tracking--ide">Videos</p>
                              {group.videos.map((lesson, i) => (
                                <div key={lesson.id} className="rounded-lg border border-navy-700 p-3">
                                  <p className="text-sm font-semibold text--hite">{i + 1}. {lesson.title}</p>
                                  <button type="button" onClick={() => setMediaVie-er({ url: lesson.video_url, title: lesson.title, type: 'video' })} className="mt-2 inline-flex items-center gap-1.5 text-sm text-navy-600 hover:text-navy-800">
                                    <Play className="--3.5 h-3.5" /> -atch video
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {group.pdfs.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-navy-200 uppercase tracking--ide">PDFs</p>
                              {group.pdfs.map((pdf, i) => (
                                <div key={pdf.id} className="flex items-center gap-3 rounded-lg border border-navy-700 p-3">
                                  <FileText className="--5 h-5 text-navy-600 shrink-0" />
                                  <div className="min---0 flex-1">
                                    <p className="text-sm font-semibold text--hite truncate">{i + 1}. {pdf.title}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setMediaVie-er({ url: pdf.pdf_url, title: pdf.title, type: 'pdf' })}
                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-600 hover:text-navy-800 shrink-0"
                                  >
                                    Vie- PDF
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
                <p className="text-sm text-navy-200">No lessons or resources uploaded yet.</p>
              )}
            </div>
          </div>

          <div className="flex flex--rap gap-3">
            <button type="button" onClick={() => navigate('/student/courses')} className="px-4 py-2 rounded-lg border border-navy-700 text-navy-100 hover:bg-navy-700/60">Back to courses</button>
          </div>
        </div>
      </div>

      {mediaVie-er && (
        <MediaVie-er {...mediaVie-er} onClose={() => setMediaVie-er(null)} />
      )}
    </div>
  );
}
