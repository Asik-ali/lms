import { useState, useEffect } from 'react';
import { FolderOpen, FileText, ChevronRight, ExternalLink } from 'lucide-react';
import { getTestSeriesByCategories, getTestsBySeries, getQuestionsByTest, getAllCourses } from '../../data/dynamicStore';
import { useAuth } from '../../contexts/AuthContext';
import { normalizeCourseAccessSelection } from '../admin/studentCourseAccess';

export default function StudentTestSeries() {
  const { user } = useAuth();
  const [series, setSeries] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [questions, setQuestions] = useState([]);

  useEffect(() => { loadSeries(); }, [user?.course]);

  async function loadSeries() {
    const allCourses = await getAllCourses();
    const assigned = normalizeCourseAccessSelection(user?.course || '');
    const visibleCourses = assigned.length > 0
      ? allCourses.filter(c => assigned.includes(c.title))
      : [];
    const categories = [...new Set(visibleCourses.map(c => c.category).filter(Boolean))];
    setSeries(await getTestSeriesByCategories(categories));
  }

  async function handleSelectSeries(s) {
    setSelectedSeries(s);
    setSelectedTest(null);
    setQuestions([]);
    setTests(await getTestsBySeries(s.name));
  }

  async function handleSelectTest(t) {
    setSelectedTest(t);
    setQuestions(await getQuestionsByTest(selectedSeries.name, t.name));
  }

  const breadcrumb = [
    { label: 'Test Series', onClick: () => { setSelectedSeries(null); setSelectedTest(null); setQuestions([]); } },
    selectedSeries && { label: selectedSeries.name, onClick: () => { setSelectedTest(null); setQuestions([]); } },
    selectedTest && { label: selectedTest.name },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Test Series</h1>

      {breadcrumb.length > 1 && (
        <nav className="flex items-center gap-1 text-sm text-gray-500">
          {breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3" />}
              {b.onClick ? (
                <button onClick={b.onClick} className="hover:text-indigo-600 cursor-pointer">{b.label}</button>
              ) : (
                <span className="text-gray-900 font-medium">{b.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {!selectedSeries && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {series.map(s => (
            <button key={s.name} onClick={() => handleSelectSeries(s)} className="card p-5 text-left hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.count} questions</p>
                </div>
              </div>
            </button>
          ))}
          {series.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No test series available for your enrolled courses.</p>
            </div>
          )}
        </div>
      )}

      {selectedSeries && !selectedTest && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map(t => (
            <button key={t.name} onClick={() => handleSelectTest(t)} className="card p-5 text-left hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.count} questions</p>
                </div>
              </div>
            </button>
          ))}
          {tests.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No tests in this series yet.</p>
            </div>
          )}
        </div>
      )}

      {selectedTest && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{questions.length} questions in {selectedTest.name}</p>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="table-header">Question</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {questions.map(q => (
                  <tr key={q.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="table-cell font-medium max-w-md truncate">
                      {q.question.startsWith('http://') || q.question.startsWith('https://') ? (
                        <a href={q.question} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate flex items-center gap-1">
                          {q.question} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="truncate block">{q.question}</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{q.type}</span>
                    </td>
                    <td className="table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${q.difficulty === 'Easy' ? 'bg-green-50 text-green-600' : q.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>{q.difficulty}</span>
                    </td>
                  </tr>
                ))}
                {questions.length === 0 && (
                  <tr><td colSpan={3} className="text-center py-8 text-gray-400">No questions in this test yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
