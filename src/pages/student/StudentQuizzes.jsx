import { useState } from 'react';
import { ClipboardList, Clock, HelpCircle, Play, BarChart3 } from 'lucide-react';
import { quizzes } from '../../data/mockData';

const quizResults = [
  { id: 1, title: 'React Basics Quiz', course: 'React Fundamentals', score: 85, total: 100, date: '2026-07-20' },
  { id: 2, title: 'Python Fundamentals', course: 'Python for Data Science', score: 92, total: 50, date: '2026-07-22' },
];

export default function StudentQuizzes() {
  const [showResults, setShowResults] = useState(false);

  const published = quizzes.filter(q => q.status === 'Published');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quizzes</h1>
        <button
          onClick={() => setShowResults(!showResults)}
          className="btn-secondary flex items-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          {showResults ? 'Available Quizzes' : 'My Results'}
        </button>
      </div>

      {!showResults ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {published.map(q => (
            <div key={q.id} className="card hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center mb-4">
                  <ClipboardList className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{q.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{q.course}</p>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <HelpCircle className="w-4 h-4" />
                    {q.questions} Questions
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="w-4 h-4" />
                    {q.duration}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Marks:</span>
                    <span className="font-medium text-gray-700">{q.totalMarks}</span>
                  </div>
                </div>
                <span className="badge badge-success mt-3 inline-block">Published</span>
              </div>
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
                <button className="btn-primary w-full flex items-center justify-center gap-1.5">
                  <Play className="w-4 h-4" /> Start Quiz
                </button>
              </div>
            </div>
          ))}
          {published.length === 0 && (
            <p className="text-gray-500 col-span-full text-center py-8">No quizzes available</p>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Quiz Results History</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="table-header">Quiz</th>
                <th className="table-header">Course</th>
                <th className="table-header">Date</th>
                <th className="table-header">Score</th>
              </tr>
            </thead>
            <tbody>
              {quizResults.map(r => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="table-cell font-medium">{r.title}</td>
                  <td className="table-cell text-gray-500">{r.course}</td>
                  <td className="table-cell text-gray-500">{r.date}</td>
                  <td className="table-cell">
                    <span className={`badge ${r.score / r.total >= 0.7 ? 'badge-success' : 'badge-warning'}`}>
                      {r.score}/{r.total}
                    </span>
                  </td>
                </tr>
              ))}
              {quizResults.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">No results yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
