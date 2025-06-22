import React, { useState, useEffect, useRef } from 'react';

const WhiteboardChat = ({ socket, roomId, participants }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on('chat-message', handleChatMessage);

    return () => {
      socket.off('chat-message', handleChatMessage);
    };
  }, [socket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && socket) {
      socket.emit('chat-message', { roomId, message });
      setMessages((prev) => [
        ...prev,
        { message, userName: 'Me', timestamp: new Date() }
      ]);
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Participants List */}
      <div className="p-4 border-b border-gray-200">
        <h4 className="text-sm font-semibold text-gray-500 mb-2">
          Participants ({participants.length})
        </h4>
        <ul className="space-y-2">
          {participants.map((p) => (
            <li key={p.user} className="flex items-center gap-2 text-sm text-gray-700">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>{p.userName}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Messages */}
      <div className="flex-grow p-4 overflow-y-auto">
        <ul className="space-y-4">
          {messages.map((msg, index) => (
            <li key={index} className={`flex ${msg.userName === 'Me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs p-3 rounded-lg ${
                msg.userName === 'Me' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-800'
              }`}>
                <p className="text-sm">{msg.message}</p>
                <p className={`text-xs mt-1 ${
                  msg.userName === 'Me' ? 'text-blue-200' : 'text-gray-500'
                }`}>
                  {msg.userName} - {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div ref={chatEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={!message.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default WhiteboardChat; 