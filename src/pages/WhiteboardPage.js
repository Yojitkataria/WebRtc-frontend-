import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import WhiteboardCanvas from '../components/WhiteboardCanvas';
import WhiteboardToolbar from '../components/WhiteboardToolbar';
import WhiteboardChat from '../components/WhiteboardChat';
import Button from '../components/Button';

const WhiteboardPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawingMode, setIsDrawingMode] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    if (!token || !roomId) return;

    const newSocket = io('http://localhost:5000', {
      auth: {
        token: token
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      
      // Join the whiteboard room
      newSocket.emit('join-whiteboard', { roomId });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('room-participants', (participants) => {
      setParticipants(participants);
    });

    newSocket.on('user-joined', (userData) => {
      console.log(`${userData.userName} joined the room`);
    });

    newSocket.on('user-left', (userData) => {
      console.log(`${userData.userName} left the room`);
    });

    newSocket.on('error', (error) => {
      setError(error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, roomId]);

  // Fetch room data
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/rooms/${roomId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch room data');
        }

        const data = await response.json();
        setRoom(data.data);
      } catch (error) {
        setError(error.message);
      }
    };

    if (token && roomId) {
      fetchRoom();
    }
  }, [token, roomId]);

  const handleClear = () => {
    if (socket) {
      socket.emit('clear-canvas', { roomId });
    }
  };

  const handleUndo = () => {
    if (socket) {
      socket.emit('undo-redo', { roomId, action: 'undo' });
    }
  };

  const handleRedo = () => {
    if (socket) {
      socket.emit('undo-redo', { roomId, action: 'redo' });
    }
  };

  const handleToggleDrawingMode = () => {
    setIsDrawingMode(!isDrawingMode);
  };

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leave-room', { roomId });
    }
    navigate('/dashboard');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {room?.name || 'Whiteboard Session'}
              </h1>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </span>
              <Button variant="outline" onClick={handleLeaveRoom}>
                Leave Room
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Toolbar */}
          <div className="lg:col-span-1">
            <WhiteboardToolbar
              brushColor={brushColor}
              setBrushColor={setBrushColor}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              onClear={handleClear}
              onUndo={handleUndo}
              onRedo={handleRedo}
              isDrawingMode={isDrawingMode}
              onToggleDrawingMode={handleToggleDrawingMode}
            />
          </div>

          {/* Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <WhiteboardCanvas
                roomId={roomId}
                socket={socket}
                isDrawingEnabled={isDrawingMode}
                brushColor={brushColor}
                brushSize={brushSize}
              />
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-1">
            <WhiteboardChat
              socket={socket}
              roomId={roomId}
              participants={participants}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default WhiteboardPage; 