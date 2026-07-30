import { useState, useEffect } from 'react';
import { ClipboardList, Clock, HelpCircle, Play, BarChart3 } from 'lucide-react';
import { getQuizzes } from '../../data/dynamicStore';

export default function StudentQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    getQuizzes().then(setQuizzes);
  }, []);

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
                    <span className="font-medium text-gray-700">{q.total_marks}</span>
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
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">Results coming soon</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
