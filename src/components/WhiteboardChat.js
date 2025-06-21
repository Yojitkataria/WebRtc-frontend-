import React, { useState, useEffect, useRef } from 'react';

const WhiteboardChat = ({ socket, roomId, participants }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (data) => {
      setMessages(prev => [...prev, data]);
    };

    const handleTyping = (data) => {
      if (data.isTyping) {
        setTypingUsers(prev => [...prev.filter(user => user.userId !== data.userId), data]);
      } else {
        setTypingUsers(prev => prev.filter(user => user.userId !== data.userId));
      }
    };

    socket.on('chat-message', handleChatMessage);
    socket.on('typing', handleTyping);

    return () => {
      socket.off('chat-message', handleChatMessage);
      socket.off('typing', handleTyping);
    };
  }, [socket]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      socket.emit('chat-message', {
        roomId,
        message: newMessage.trim()
      });
      setNewMessage('');
      setIsTyping(false);
      socket.emit('typing', { roomId, isTyping: false });
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      socket?.emit('typing', { roomId, isTyping: true });
    }
  };

  const stopTyping = () => {
    setIsTyping(false);
    socket?.emit('typing', { roomId, isTyping: false });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg h-96 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Chat</h3>
        <p className="text-sm text-gray-600">
          {participants.length} participant{participants.length !== 1 ? 's' : ''} online
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message, index) => (
          <div key={index} className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-900">
                {message.userName}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="bg-gray-100 rounded-lg p-3">
              <p className="text-gray-800">{message.message}</p>
            </div>
          </div>
        ))}
        
        {typingUsers.length > 0 && (
          <div className="text-sm text-gray-500 italic">
            {typingUsers.map(user => user.userName).join(', ')} typing...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            onBlur={stopTyping}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default WhiteboardChat; 