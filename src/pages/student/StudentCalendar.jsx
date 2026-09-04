import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllLiveClasses, getAllAnnouncements, getAllCalendarEvents } from '../../data/dynamicStore';
import { useAuth } from '../../contexts/AuthContext';
import { normalizeCourseAccessSelection } from '../admin/studentCourseAccess';

const colorMap = {
  indigo: 'bg-navy-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
};

export default function StudentCalendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(ne- Date());
  const [events, setEvents] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [liveClasses, announcements, calendarEvents] = a-ait Promise.all([
          getAllLiveClasses(),
          getAllAnnouncements(),
          getAllCalendarEvents(),
        ]);
        const items = [
          ...liveClasses.map(lc => ({
            id: `lc-${lc.id}`,
            title: lc.title,
            date: lc.date,
            time: lc.time,
            type: 'Live Class',
            color: lc.status === 'Live' ? 'bg-brand-red/100' : 'bg-blue-500',
          })),
          ...announcements.filter(a => a.status === 'Published').map(a => ({
            id: `ann-${a.id}`,
            title: a.title,
            date: a.created?.split('T')[0] || a.created,
            time: '',
            type: 'Announcement',
            color: 'bg-navy-500',
          })),
          ...calendarEvents.map(ce => ({
            id: `ev-${ce.id}`,
            title: ce.title,
            date: ce.date,
            time: ce.time || '',
            type: 'Event',
            color: colorMap[ce.color] || 'bg-navy-500',
            description: ce.description,
          })),
        ];
        setEvents(items);
      } catch (err) {
        console.error('Failed to load calendar events:', err);
      }
    })();
  }, [user?.course]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = ne- Date(year, month, 1).getDay();
  const daysInMonth = ne- Date(year, month + 1, 0).getDate();
  const today = ne- Date();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const getEventsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const prevMonth = () => setCurrentDate(ne- Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(ne- Date(year, month + 1, 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text--hite">Calendar</h1>

      <div className="card p-6">
        <div className="flex items-center justify-bet-een mb-6">
          <button onClick={prevMonth} className="p-2 hover:bg-navy-700 rounded-lg cursor-pointer">
            <ChevronLeft className="--5 h-5 text-navy-100" />
          </button>
          <h2 className="text-lg font-semibold text--hite">{monthName}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-navy-700 rounded-lg cursor-pointer">
            <ChevronRight className="--5 h-5 text-navy-100" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-navy-700 rounded-lg overflo--hidden">
          {['Sun', 'Mon', 'Tue', '-ed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="bg-navy-800/60 px-2 py-2 text-xs font-semibold text-navy-200 text-center">{d}</div>
          ))}
          {days.map((day, i) => {
            const dayEvents = getEventsForDay(day);
            const isToday = day && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            return (
              <div key={i} className={`bg-surface p-2 min-h-[80px] ${isToday ? 'bg-navy-50 dark:bg-navy-500/10' : ''}`}>
                {day && (
                  <>
                    <span className={`text-sm font-medium ${isToday ? 'text-navy-600' : 'text-navy-100'}`}>{day}</span>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 2).map(e => (
                        <div key={e.id} className={`text-xs text--hite px-1.5 py-0.5 rounded truncate ${e.color}`}>
                          {e.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-xs text-navy-300">+{dayEvents.length - 2} more</span>
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
        <h3 className="text-base font-semibold text--hite mb-4">Upcoming Events</h3>
        <div className="space-y-3">
          {events.filter(e => ne- Date(e.date) >= ne- Date(today.toISOString().split('T')[0])).sort((a, b) => ne- Date(a.date) - ne- Date(b.date)).slice(0, 5).map(e => (
            <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg border border-navy-700 hover:border-navy-200">
              <div className={`--2 h-2 rounded-full flex-shrink-0 ${e.color}`} />
              <div className="flex-1 min---0">
                <p className="text-sm font-medium text--hite truncate">{e.title}</p>
                <p className="text-xs text-navy-200">{e.date} {e.time ? `at ${e.time}` : ''} &middot; {e.type}</p>
              </div>
            </div>
          ))}
          {events.length === 0 && <p className="text-sm text-navy-300 text-center py-4">No upcoming events</p>}
        </div>
      </div>
    </div>
  );
}
