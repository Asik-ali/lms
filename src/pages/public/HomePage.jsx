import { Link } from 'react-router-dom';
import { BookOpen, Users, Video, Award, ChevronRight, GraduationCap, Laptop, Trophy } from 'lucide-react';

const features = [
  { icon: BookOpen, title: 'Course Management', desc: 'Organize courses with sections, lessons, PDFs, and video content.' },
  { icon: Video, title: 'Live Classes', desc: 'Stream live YouTube classes visible to all enrolled students.' },
  { icon: Laptop, title: 'Test Series', desc: 'Practice with organized test series for competitive exams.' },
  { icon: Users, title: 'Student Portal', desc: 'Students can track progress, view courses, and join live classes.' },
  { icon: GraduationCap, title: 'Admin Tools', desc: 'Admins manage courses, view analytics, and post announcements.' },
  { icon: Trophy, title: 'Reports & Analytics', desc: 'Track student performance, enrollment trends, and course metrics.' },
];

const stats = [
  { value: '500+', label: 'Students' },
  { value: '50+', label: 'Courses' },
  { value: '95%', label: 'Satisfaction' },
];

export default function HomePage() {
  return (
    <div className="space-y-0">
      <section className="bg-gradient-to-br from-navy-900 via-navy-700 to-navy-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              Learn Without Limits
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-navy-100">
              A complete learning management system with courses, live classes, test series, and progress tracking.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/signup" className="inline-flex items-center justify-center gap-2 bg-white text-navy-700 px-6 py-3 rounded-lg font-semibold hover:bg-navy-50 transition-colors">
                Create Account <ChevronRight className="w-4 h-4" />
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center gap-2 border border-white/30 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {stats.map(s => (
              <div key={s.label}>
                <p className="text-3xl sm:text-4xl font-bold text-navy-600">{s.value}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Everything You Need</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Powerful features for admins and students.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="card p-6 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-lg bg-navy-100 dark:bg-navy-500/15 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-navy-600 dark:text-navy-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{f.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-navy-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Ready to Start Learning?</h2>
          <p className="mt-2 text-navy-100">Create an account to access courses, live classes, and test series.</p>
          <Link to="/signup" className="mt-6 inline-flex items-center gap-2 bg-white text-navy-700 px-6 py-3 rounded-lg font-semibold hover:bg-navy-50 transition-colors">
            Sign Up Now <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
