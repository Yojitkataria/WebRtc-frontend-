import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import WhiteboardCanvas from '../components/WhiteboardCanvas';
import WhiteboardToolbar from '../components/WhiteboardToolbar';
import WhiteboardChat from '../components/WhiteboardChat';
import Button from '../components/Button';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_BASE_URL.replace('/api', '');

const WhiteboardPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const canvasRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawingMode, setIsDrawingMode] = useState(true);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    if (!token || !roomId) return;

    const newSocket = io(SOCKET_URL, {
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

    newSocket.on('connect_error', (err) => {
      console.error('Socket Connection Error:', err.message);
      setError(`Failed to connect to the whiteboard server: ${err.message}. Please try refreshing the page.`);
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
        const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
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
    if (!socket || !socket.connected) {
      console.error('Socket not connected');
      return;
    }
    
    const confirmed = window.confirm('Are you sure you want to clear the entire whiteboard? This action cannot be undone.');
    if (confirmed && canvasRef.current && canvasRef.current.clear) {
      canvasRef.current.clear();
    }
  };

  const handleUndo = () => {
    if (!socket || !socket.connected) {
      console.error('Socket not connected');
      return;
    }
    if (canvasRef.current && canvasRef.current.undo) {
      canvasRef.current.undo();
    }
  };

  const handleRedo = () => {
    if (!socket || !socket.connected) {
      console.error('Socket not connected');
      return;
    }
    if (canvasRef.current && canvasRef.current.redo) {
      canvasRef.current.redo();
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
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 z-10 flex-shrink-0">
        <div className="max-w-full mx-auto px-6">
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
      <main className="flex-grow flex overflow-hidden">
        <div className="grid grid-cols-12 flex-grow h-full">
          {/* Toolbar */}
          <div className="col-span-2 bg-white border-r border-gray-200 overflow-y-auto">
            <WhiteboardToolbar
              brushColor={brushColor}
              setBrushColor={setBrushColor}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              onClear={handleClear}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
              isDrawingMode={isDrawingMode}
              onToggleDrawingMode={handleToggleDrawingMode}
              isConnected={isConnected}
            />
          </div>

          {/* Canvas */}
          <div className="col-span-8 flex items-center justify-center p-6 bg-gray-50">
            <div className="w-full h-full bg-white rounded-lg shadow-md">
              <WhiteboardCanvas
                ref={canvasRef}
                roomId={roomId}
                socket={socket}
                isDrawingEnabled={isDrawingMode}
                brushColor={brushColor}
                brushSize={brushSize}
                setCanUndo={setCanUndo}
                setCanRedo={setCanRedo}
              />
            </div>
          </div>

          {/* Chat & Participants */}
          <div className="col-span-2 bg-white border-l border-gray-200 flex flex-col h-full">
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