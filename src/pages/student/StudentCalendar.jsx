import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllLiveClasses, getAllAnnouncements } from '../../data/dynamicStore';
import { useAuth } from '../../contexts/AuthContext';
import { normalizeCourseAccessSelection } from '../admin/studentCourseAccess';

export default function StudentCalendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);

  useEffect(() => {
    (async () => {
      const [liveClasses, announcements] = await Promise.all([
        getAllLiveClasses(),
        getAllAnnouncements(),
      ]);
      const assigned = normalizeCourseAccessSelection(user?.course || '');
      const items = [
        ...liveClasses.map(lc => ({
          id: `lc-${lc.id}`,
          title: lc.title,
          date: lc.date,
          time: lc.time,
          type: 'Live Class',
          color: lc.status === 'Live' ? 'bg-red-500' : 'bg-blue-500',
        })),
        ...announcements.filter(a => a.status === 'Published').map(a => ({
          id: `ann-${a.id}`,
          title: a.title,
          date: a.created?.split('T')[0] || a.created,
          time: '',
          type: 'Announcement',
          color: 'bg-indigo-500',
        })),
      ];
      setEvents(items);
    })();
  }, [user?.course]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const getEventsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">{monthName}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="bg-gray-50 px-2 py-2 text-xs font-semibold text-gray-500 text-center">{d}</div>
          ))}
          {days.map((day, i) => {
            const dayEvents = getEventsForDay(day);
            const isToday = day && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            return (
              <div key={i} className={`bg-white p-2 min-h-[80px] ${isToday ? 'bg-indigo-50' : ''}`}>
                {day && (
                  <>
                    <span className={`text-sm font-medium ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>{day}</span>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 2).map(e => (
                        <div key={e.id} className={`text-xs text-white px-1.5 py-0.5 rounded truncate ${e.color}`}>
                          {e.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-xs text-gray-400">+{dayEvents.length - 2} more</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Upcoming Events</h3>
        <div className="space-y-3">
          {events.filter(e => new Date(e.date) >= new Date(today.toISOString().split('T')[0])).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5).map(e => (
            <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-indigo-200">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${e.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{e.title}</p>
                <p className="text-xs text-gray-500">{e.date} {e.time ? `at ${e.time}` : ''} &middot; {e.type}</p>
              </div>
            </div>
          ))}
          {events.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No upcoming events</p>}
        </div>
      </div>
    </div>
  );
}
