import { useState } from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import { studentCourses } from '../../data/mockData';

const filters = ['All', 'In Progress', 'Completed'];

export default function StudentCourses() {
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = studentCourses.filter(c => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'In Progress') return c.progress < 100;
    if (activeFilter === 'Completed') return c.progress === 100;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
      </div>

      <div className="flex gap-2">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(c => (
          <div key={c.id} className="card hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{c.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{c.instructor}</p>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-medium text-gray-700">{c.progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${c.progress}%` }} />
                </div>
              </div>
              <div className="mt-4 space-y-1 text-sm">
                <p className="text-gray-500">Next: <span className="text-gray-700">{c.nextLesson}</span></p>
                <p className="text-gray-500">Due: <span className="text-gray-700">{c.dueDate}</span></p>
              </div>
            </div>
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
              <button className="btn-primary w-full flex items-center justify-center gap-1">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
