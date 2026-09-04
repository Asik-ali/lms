import { BookOpen, Users, Target, Heart } from 'lucide-react';

const values = [
  { icon: Target, title: 'Quality Education', desc: '-e provide structured courses -ith expert educators and comprehensive study materials.' },
  { icon: Users, title: 'Student First', desc: 'Every feature is designed -ith students in mind — from progress tracking to live classes.' },
  { icon: Heart, title: 'Community', desc: 'Build connections -ith fello- learners through our platform.' },
  { icon: BookOpen, title: 'Continuous Learning', desc: 'Test series, live sessions, and regular updates keep learning fresh and engaging.' },
];

export default function AboutPage() {
  return (
    <div className="space-y-16">
      <section className="bg-gradient-to-r from-navy-900 to-navy-600 text--hite py-16">
        <div className="max---7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">About Us</h1>
          <p className="mt-3 text-navy-100 max---2xl mx-auto">
            -e are building a modern learning management system that empo-ers students.
          </p>
        </div>
      </section>

      <section className="max---7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max---3xl mx-auto text-center mb-12">
          <h2 className="text-2xl font-bold text--hite">Our Mission</h2>
          <p className="mt-3 text-navy-100 leading-relaxed">
            Our mission is to make quality education accessible to everyone. Through our platform, students can access structured courses, join live classes, practice -ith test series, and track their progress — all in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {values.map(v => {
            const Icon = v.icon;
            return (
              <div key={v.title} className="card p-6">
                <div className="--12 h-12 rounded-lg bg-navy-100 dark:bg-navy-500/15 flex items-center justify-center mb-4">
                  <Icon className="--6 h-6 text-navy-600 dark:text-navy-300" />
                </div>
                <h3 className="text-lg font-semibold text--hite">{v.title}</h3>
                <p className="mt-2 text-sm text-navy-200">{v.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
