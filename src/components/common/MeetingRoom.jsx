import { useState } from 'react';
import { X, Mic, MicOff, Camera, CameraOff, Monitor, MessageSquare, Send } from 'lucide-react';

const mockParticipants = [
  { name: 'You', initial: 'Y', isYou: true },
  { name: 'Dr. Sarah Chen', initial: 'S' },
  { name: 'Alice Johnson', initial: 'A' },
  { name: 'Bob Smith', initial: 'B' },
  { name: 'Carol White', initial: 'C' },
];

export default function MeetingRoom({ roomCode, onLeave }) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([
    { user: 'System', text: 'You joined the room', time: new Date().toLocaleTimeString() },
  ]);
  const [chatInput, setChatInput] = useState('');

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, { user: 'You', text: chatInput, time: new Date().toLocaleTimeString() }]);
    setChatInput('');
  };

  return (
    <div className="fixed inset-0 bg-gray-950 z-50 flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <span className="text-white font-medium">Room: {roomCode}</span>
          <span className="text-gray-400 text-sm">| {mockParticipants.length} participants</span>
        </div>
        <button onClick={onLeave} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
          <X className="w-4 h-4" /> Leave
        </button>
      </div>

      <div className="flex-1 flex">
        <div className={`flex-1 p-4 grid gap-4 ${showChat ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} auto-rows-[200px]`}>
          {mockParticipants.map((p, i) => (
            <div key={i} className={`rounded-xl overflow-hidden relative flex items-center justify-center ${p.isYou ? 'ring-2 ring-indigo-500' : ''}`}>
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-700 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold text-white">{p.initial}</span>
                </div>
                <span className="text-white text-sm font-medium">{p.name}{p.isYou ? ' (You)' : ''}</span>
              </div>
              {p.isYou && (
                <div className="absolute bottom-2 flex gap-2">
                  <button onClick={() => setMicOn(!micOn)} className={`p-1.5 rounded-full ${micOn ? 'bg-gray-600' : 'bg-red-600'} transition-colors`}>
                    {micOn ? <Mic className="w-3.5 h-3.5 text-white" /> : <MicOff className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <button onClick={() => setCamOn(!camOn)} className={`p-1.5 rounded-full ${camOn ? 'bg-gray-600' : 'bg-red-600'} transition-colors`}>
                    {camOn ? <Camera className="w-3.5 h-3.5 text-white" /> : <CameraOff className="w-3.5 h-3.5 text-white" />}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {showChat && (
          <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-700">
              <h3 className="text-white font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Chat
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400 text-xs font-medium">{msg.user}</span>
                    <span className="text-gray-500 text-xs">{msg.time}</span>
                  </div>
                  <p className="text-gray-300 text-sm mt-0.5">{msg.text}</p>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-600"
                />
                <button onClick={sendMessage} className="bg-indigo-600 p-2 rounded-lg hover:bg-indigo-700 transition-colors">
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 py-4 bg-gray-900">
        <button onClick={() => setMicOn(!micOn)} className={`p-3 rounded-full transition-colors ${micOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}>
          {micOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
        </button>
        <button onClick={() => setCamOn(!camOn)} className={`p-3 rounded-full transition-colors ${camOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}>
          {camOn ? <Camera className="w-5 h-5 text-white" /> : <CameraOff className="w-5 h-5 text-white" />}
        </button>
        <button className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors">
          <Monitor className="w-5 h-5 text-white" />
        </button>
        <button onClick={() => setShowChat(!showChat)} className={`p-3 rounded-full transition-colors ${showChat ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
          <MessageSquare className="w-5 h-5 text-white" />
        </button>
        <button onClick={onLeave} className="bg-red-600 text-white px-6 py-2.5 rounded-full hover:bg-red-700 transition-colors text-sm font-medium">
          Leave
        </button>
      </div>
    </div>
  );
}
