import { Edit2, Star, Mail, Users, BookOpen } from 'lucide-react';
import { instructors } from '../../data/mockData';

export default function InstructorManagement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Instructor Management</h1>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          Add Instructor
        </button>
      </div>

      <div className="grid gap-6">
        {instructors.map(instructor => (
          <div key={instructor.id} className="card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                  {instructor.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{instructor.name}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm text-gray-500">{instructor.email}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-6 mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{instructor.courses}</p>
                  <p className="text-xs text-gray-500">Courses</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{instructor.students}</p>
                  <p className="text-xs text-gray-500">Students</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{instructor.rating}</p>
                  <p className="text-xs text-gray-500">Rating</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{instructor.department}</p>
                  <p className="text-xs text-gray-500">Department</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
