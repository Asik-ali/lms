import { useState } from 'react';
import { Video, Calendar, Clock, Users } from 'lucide-react';
import { liveClasses } from '../../data/mockData';
import MeetingRoom from '../../components/common/MeetingRoom';

export default function StudentLiveClasses() {
  const [room, setRoom] = useState(null);
  const [joinCode, setJoinCode] = useState('');

  const upcomingLive = liveClasses.filter(c => c.status === 'Upcoming');
  const pastLive = liveClasses.filter(c => c.status === 'Completed');

  const handleJoinByCode = () => {
    if (!joinCode.trim()) return;
    setRoom(joinCode.toUpperCase());
    setJoinCode('');
  };

  return (
    <div className="space-y-6">
      {room && <MeetingRoom roomCode={room} onLeave={() => setRoom(null)} />}

      <div className="card p-4">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoinByCode()}
            placeholder="Enter room code (e.g. ABC-123)"
            className="input-field max-w-xs font-mono uppercase"
          />
          <button onClick={handleJoinByCode} className="btn-primary flex items-center gap-2">
            <Video className="w-4 h-4" /> Join Room
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Classes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingLive.map(c => (
            <div key={c.id} className="card hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                  <Video className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{c.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{c.instructor}</p>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="w-4 h-4" />{c.date}
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="w-4 h-4" />{c.time}
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Users className="w-4 h-4" />{c.students} enrolled
                  </div>
                </div>
                <div className="mt-3 px-3 py-2 bg-indigo-50 rounded-lg text-center">
                  <span className="text-xs font-mono text-indigo-600 font-medium">Room: {c.roomCode}</span>
                </div>
              </div>
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
                <button onClick={() => setRoom(c.roomCode)} className="btn-primary flex items-center justify-center gap-1.5 w-full">
                  <Video className="w-4 h-4" /> Join Class
                </button>
              </div>
            </div>
          ))}
          {upcomingLive.length === 0 && (
            <p className="text-gray-500 col-span-full text-center py-8">No upcoming live classes</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Past Classes</h2>
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="table-header">Title</th>
                <th className="table-header">Instructor</th>
                <th className="table-header">Date</th>
                <th className="table-header">Room</th>
                <th className="table-header">Recording</th>
              </tr>
            </thead>
            <tbody>
              {pastLive.map(c => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="table-cell font-medium">{c.title}</td>
                  <td className="table-cell text-gray-500">{c.instructor}</td>
                  <td className="table-cell text-gray-500">{c.date}</td>
                  <td className="table-cell">
                    <span className="text-xs font-mono text-gray-500">{c.roomCode}</span>
                  </td>
                  <td className="table-cell">
                    <button className="btn-secondary text-xs flex items-center gap-1">
                      <Video className="w-3.5 h-3.5" /> Watch Recording
                    </button>
                  </td>
                </tr>
              ))}
              {pastLive.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">No past classes</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
