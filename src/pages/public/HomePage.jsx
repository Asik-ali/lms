import { Link } from 'react-router-dom';
import { BookOpen, Users, Video, Award, ChevronRight, GraduationCap, Laptop, Trophy, Clock, BarChart3, Target } from 'lucide-react';
import useReveal from '../../hooks/useReveal';

const features = [
  { icon: BookOpen, title: 'Course Management', desc: 'Organize courses with sections, lessons, PDFs, and video content.' },
  { icon: Video, title: 'Live Classes', desc: 'Stream live YouTube classes visible to all enrolled students.' },
  { icon: Laptop, title: 'Test Series', desc: 'Practice with organized test series for competitive exams.' },
  { icon: Users, title: 'Student Portal', desc: 'Students can track progress, view courses, and join live classes.' },
  { icon: GraduationCap, title: 'Admin Tools', desc: 'Admins manage courses, view analytics, and post announcements.' },
  { icon: Trophy, title: 'Reports & Analytics', desc: 'Track student performance, enrollment trends, and course metrics.' },
];

const stats = [
  { value: '500+', label: 'Active Students', icon: Users },
  { value: '50+', label: 'Courses', icon: BookOpen },
  { value: '10k+', label: 'Tests Taken', icon: Target },
  { value: '95%', label: 'Success Rate', icon: Trophy },
];

const highlights = [
  { icon: Clock, title: 'Timed Practice', desc: 'Realistic exam simulation with live timers' },
  { icon: BarChart3, title: 'Instant Analytics', desc: 'Score reports and performance insights' },
  { icon: Award, title: 'Achievement Badges', desc: 'Celebrate milestones and rank progress' },
];

export default function HomePage() {
  useReveal();
  return (
    <div className="space-y-0 bg-navy-950">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#071A3D] via-[#081B3A] to-navy-600 text-white dark:from-navy-900 dark:via-navy-950 dark:to-navy-800">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-navy-600/30 blur-3xl animate-float" />
          <div className="absolute bottom-10 right-1/4 w-80 h-80 rounded-full bg-gold-500/10 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-navy-800 border border-navy-600/50 text-navy-200 text-sm mb-6 animate-fade-down">
              <Target className="w-4 h-4 text-gold-400" />
              India's trusted exam preparation platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight animate-fade-up">
              Crack Your Exams With <span className="text-gold-400">ExamStick</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-[#AECBF0] max-w-2xl animate-fade-up reveal-delay-1">
              A complete learning management system with <span className="font-semibold text-gold-400">courses</span>, <span className="font-semibold text-gold-400">live classes</span>, test series, and progress tracking — all in one place.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-fade-up reveal-delay-2">
              <Link to="/signup" className="inline-flex items-center justify-center gap-2 bg-gold-500 text-[#071A3D] dark:text-navy-900 px-8 py-4 rounded-xl font-bold hover:bg-gold-300 transition-all duration-200 hover:-translate-y-1 shadow-lg shadow-gold-500/30 animate-shine">
                Get Started Free <ChevronRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="btn-outline px-8 py-4 rounded-xl font-semibold">
                Student Login
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-16">
              {stats.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="reveal reveal-delay-1">
                    <Icon className="w-6 h-6 text-gold-400 mb-2" />
                    <p className="text-3xl font-bold text-white">{s.value}</p>
                    <p className="text-sm text-[#AECBF0] mt-1">{s.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-navy-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {highlights.map((h, i) => {
              const Icon = h.icon;
              return (
                <div key={h.title} className="card p-7 hover:-translate-y-1.5 transition-all duration-300 reveal reveal-delay-1">
                  <div className="w-12 h-12 rounded-xl bg-navy-600/20 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-gold-400" />
                  </div>
                  <h3 className="text-lg font-bold text-navy-100">{h.title}</h3>
                  <p className="mt-2 text-sm text-navy-200">{h.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center mb-14 reveal">
            <span className="text-gold-400 font-semibold uppercase tracking-widest text-sm">Platform Features</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-100 mt-3">Everything You Need To Succeed</h2>
            <p className="mt-3 text-navy-200 max-w-2xl mx-auto">Powerful tools designed for both admins and students.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="card p-7 hover:-translate-y-1.5 hover:border-navy-500 transition-all duration-300 reveal reveal-delay-1">
                  <div className="w-12 h-12 rounded-xl bg-navy-600/20 flex items-center justify-center mb-4 transition-transform duration-300 hover:scale-110">
                    <Icon className="w-6 h-6 text-navy-100" />
                  </div>
                  <h3 className="text-lg font-bold text-navy-100">{f.title}</h3>
                  <p className="mt-2 text-sm text-navy-200">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-navy-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-100 reveal">Ready To Start Learning?</h2>
          <p className="mt-4 text-lg text-navy-200 max-w-xl mx-auto reveal reveal-delay-1">Join thousands of students preparing for success with ExamStick.</p>
          <Link to="/signup" className="mt-8 inline-flex items-center gap-2 bg-gold-500 text-[#071A3D] dark:text-navy-900 px-8 py-4 rounded-xl font-bold hover:bg-gold-300 hover:-translate-y-1 transition-all duration-200 shadow-lg shadow-gold-500/30 animate-pulse-gold reveal reveal-delay-2">
            Create Free Account <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
