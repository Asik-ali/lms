import { useState } from 'react';
import { Video, Calendar, Clock, Users } from 'lucide-react';
import { liveClasses } from '../../data/mockData';
import MeetingRoom from '../../components/common/MeetingRoom';

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const p1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const p2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${p1}-${p2}`;
}

export default function LiveClasses() {
  const [room, setRoom] = useState(null);

  const upcoming = liveClasses.filter(lc => lc.status === 'Upcoming');
  const completed = liveClasses.filter(lc => lc.status === 'Completed');

  return (
    <div className="space-y-6">
      {room && <MeetingRoom roomCode={room} onLeave={() => setRoom(null)} />}

      <div className="card">
        <div className="card-header flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Upcoming Classes</h3>
            <span className="text-sm text-gray-500">{upcoming.length} classes</span>
          </div>
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
                      <p className="text-sm text-gray-500">{lc.instructor}</p>
                    </div>
                  </div>
                  <button onClick={() => setRoom(lc.roomCode)} className="btn-primary text-sm flex items-center gap-1.5">
                    <Video className="w-4 h-4" /> Start Room
                  </button>
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
        <div className="card-header">
          <div>
            <h3 className="text-lg font-semibold">Completed Classes</h3>
            <span className="text-sm text-gray-500">{completed.length} classes</span>
          </div>
        </div>
        {completed.length === 0 ? (
          <div className="p-6 text-center text-gray-400">No completed classes</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {completed.map(lc => (
              <div key={lc.id} className="p-4 hover:bg-gray-50 opacity-75">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Video className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-500">{lc.title}</h4>
                      <p className="text-sm text-gray-400">{lc.instructor}</p>
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
