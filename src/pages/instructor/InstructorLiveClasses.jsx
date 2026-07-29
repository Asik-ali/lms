import { useState } from 'react';
import { Video, Calendar, Clock, Users, Play, Edit2, X, Trash2 } from 'lucide-react';
import { liveClasses } from '../../data/mockData';
import MeetingRoom from '../../components/common/MeetingRoom';

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const p1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const p2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${p1}-${p2}`;
}

const instructorName = 'Dr. Sarah Chen';

export default function InstructorLiveClasses() {
  const [room, setRoom] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newClass, setNewClass] = useState({ title: '', date: '', time: '', description: '' });
  const [localClasses, setLocalClasses] = useState(liveClasses);

  const myClasses = localClasses.filter(lc => lc.instructor === instructorName);
  const upcoming = myClasses.filter(lc => lc.status === 'Upcoming');
  const past = myClasses.filter(lc => lc.status === 'Completed');

  const handleSchedule = () => {
    if (!newClass.title || !newClass.date || !newClass.time) return;
    setLocalClasses(prev => [...prev, {
      id: Date.now(),
      title: newClass.title,
      instructor: instructorName,
      date: newClass.date,
      time: newClass.time,
      roomCode: generateRoomCode(),
      students: 0,
      status: 'Upcoming',
    }]);
    setNewClass({ title: '', date: '', time: '', description: '' });
    setShowForm(false);
  };

  const handleCancel = (id) => {
    setLocalClasses(prev => prev.filter(lc => lc.id !== id));
  };

  return (
    <div className="space-y-6">
      {room && <MeetingRoom roomCode={room} onLeave={() => setRoom(null)} />}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Live Classes</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Video className="w-4 h-4" /> Schedule New Class
        </button>
      </div>

      {showForm && (
        <div className="card p-6 border-indigo-200 bg-indigo-50/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Schedule a Live Class</h3>
            <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" placeholder="Class title" value={newClass.title} onChange={e => setNewClass(prev => ({ ...prev, title: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={newClass.date} onChange={e => setNewClass(prev => ({ ...prev, date: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input type="time" value={newClass.time} onChange={e => setNewClass(prev => ({ ...prev, time: e.target.value }))} className="input-field" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" placeholder="Optional description" value={newClass.description} onChange={e => setNewClass(prev => ({ ...prev, description: e.target.value }))} className="input-field" />
            </div>
          </div>
          <button onClick={handleSchedule} className="btn-primary">Schedule Class</button>
        </div>
      )}

      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h3 className="text-lg font-semibold">Upcoming Classes</h3>
          <span className="text-sm text-gray-500">{upcoming.length} classes</span>
        </div>
        {upcoming.length === 0 ? (
          <div className="p-6 text-center text-gray-400">No upcoming classes</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {upcoming.map(lc => (
              <div key={lc.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                      <Video className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{lc.title}</h4>
                      <p className="text-xs text-gray-500">{lc.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setRoom(lc.roomCode)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                      <Play className="w-3.5 h-3.5" /> Start Room
                    </button>
                    <button className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => handleCancel(lc.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{lc.date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{lc.time}</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{lc.students} students</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-mono text-xs">Room: {lc.roomCode}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h3 className="text-lg font-semibold">Past Classes</h3>
          <span className="text-sm text-gray-500">{past.length} classes</span>
        </div>
        {past.length === 0 ? (
          <div className="p-6 text-center text-gray-400">No past classes</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {past.map(lc => (
              <div key={lc.id} className="p-4 hover:bg-gray-50 opacity-75">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Video className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-500">{lc.title}</h4>
                    </div>
                  </div>
                  <span className="badge-success text-xs">Completed</span>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{lc.date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{lc.time}</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{lc.students} students</span>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-mono text-xs">{lc.roomCode}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
