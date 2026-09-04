import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllCalendarEvents, addCalendarEvent, deleteCalendarEvent } from '../../data/dynamicStore';
import { showSuccess, showError } from '../../components/common/Toast';

const colorOptions = [
  { value: 'indigo', label: 'Indigo', bg: 'bg-navy-500' },
  { value: 'emerald', label: 'Green', bg: 'bg-emerald-500' },
  { value: 'amber', label: 'Amber', bg: 'bg-amber-500' },
  { value: 'rose', label: 'Red', bg: 'bg-rose-500' },
  { value: 'blue', label: 'Blue', bg: 'bg-blue-500' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-500' },
];

const colorMap = {
  indigo: 'bg-navy-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
};

export default function AdminCalendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', time: '', description: '', color: 'indigo' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadEvents(); }, []);

  async function loadEvents() {
    try {
      const data = await getAllCalendarEvents();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load calendar events:', err);
    }
  }

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

  async function handleCreate() {
    if (!form.title.trim() || !form.date) {
      showError('Title and date are required');
      return;
    }
    setLoading(true);
    try {
      await addCalendarEvent({ ...form, created_by: user.id });
      setShowForm(false);
      setForm({ title: '', date: '', time: '', description: '', color: 'indigo' });
      await loadEvents();
      showSuccess('Event created!');
    } catch (e) {
      showError(e.message);
    }
    setLoading(false);
  }

  async function handleDelete(id) {
    try {
      await deleteCalendarEvent(id);
      await loadEvents();
      showSuccess('Event deleted');
    } catch (e) {
      showError(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Calendar Events</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 cursor-pointer">
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 hover:bg-navy-700 rounded-lg cursor-pointer">
            <ChevronLeft className="w-5 h-5 text-navy-100" />
          </button>
          <h2 className="text-lg font-semibold text-white">{monthName}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 hover:bg-navy-700 rounded-lg cursor-pointer">
            <ChevronRight className="w-5 h-5 text-navy-100" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="bg-gray-50 bg-navy-800/60 px-2 py-2 text-xs font-semibold text-navy-200 text-center">{d}</div>
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
                        <div key={e.id} className="group relative">
                          <div className={`text-xs text-white px-1.5 py-0.5 rounded truncate ${colorMap[e.color] || 'bg-navy-500'}`}>
                            {e.title}
                          </div>
                          <button onClick={() => handleDelete(e.id)} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-[10px] leading-none">×</button>
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
        <h3 className="text-base font-semibold text-white mb-4">All Events ({events.length})</h3>
        <div className="space-y-2">
          {events.sort((a, b) => a.date.localeCompare(b.date)).map(e => (
            <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg border border-navy-700 hover:border-navy-200 group">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${colorMap[e.color] || 'bg-navy-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{e.title}</p>
                <p className="text-xs text-navy-200">{e.date} {e.time ? `at ${e.time}` : ''} {e.description ? `- ${e.description}` : ''}</p>
              </div>
              <button onClick={() => handleDelete(e.id)} className="p-1 text-navy-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {events.length === 0 && <p className="text-sm text-navy-300 text-center py-4">No events yet</p>}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Event</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 hover:bg-navy-700 rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-100 mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="Event title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-100 mb-1">Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-100 mb-1">Time</label>
                  <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-100 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} placeholder="Optional description" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-100 mb-2">Color</label>
                <div className="flex gap-2">
                  {colorOptions.map(c => (
                    <button key={c.value} onClick={() => setForm({ ...form, color: c.value })} className={`w-8 h-8 rounded-full ${c.bg} ${form.color === c.value ? 'ring-2 ring-offset-2 ring-navy-500' : ''} cursor-pointer`} />
                  ))}
                </div>
              </div>
              <button onClick={handleCreate} disabled={loading} className="w-full btn-primary cursor-pointer">
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
