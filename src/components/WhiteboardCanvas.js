import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, PencilBrush, Path } from 'fabric';

const WhiteboardCanvas = ({ 
  roomId, 
  socket, 
  isDrawingEnabled = true, 
  brushColor = '#000000', 
  brushSize = 5 
}) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState(null);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      fabricCanvasRef.current = new Canvas(canvasRef.current, {
        width: 1200,
        height: 800,
        backgroundColor: '#ffffff',
        isDrawingMode: false
      });

      // Set up drawing mode
      fabricCanvasRef.current.freeDrawingBrush = new PencilBrush(fabricCanvasRef.current);
      fabricCanvasRef.current.freeDrawingBrush.color = brushColor;
      fabricCanvasRef.current.freeDrawingBrush.width = brushSize;

      // Handle drawing events
      fabricCanvasRef.current.on('path:created', (e) => {
        const path = e.path;
        if (socket && isDrawingEnabled) {
          socket.emit('drawing-action', {
            roomId,
            action: {
              type: 'draw',
              data: {
                path: path.toObject(),
                color: path.stroke,
                brushSize: path.strokeWidth
              }
            }
          });
        }
      });

      // Handle object modifications
      fabricCanvasRef.current.on('object:modified', (e) => {
        if (socket && isDrawingEnabled) {
          const obj = e.target;
          socket.emit('drawing-action', {
            roomId,
            action: {
              type: 'modify',
              data: {
                objectId: obj.id,
                object: obj.toObject()
              }
            }
          });
        }
      });

      // Handle object deletion
      fabricCanvasRef.current.on('object:removed', (e) => {
        if (socket && isDrawingEnabled) {
          socket.emit('drawing-action', {
            roomId,
            action: {
              type: 'delete',
              data: {
                objectId: e.target.id
              }
            }
          });
        }
      });
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [socket, roomId, isDrawingEnabled]);

  // Update brush properties when they change
  useEffect(() => {
    if (fabricCanvasRef.current && fabricCanvasRef.current.freeDrawingBrush) {
      fabricCanvasRef.current.freeDrawingBrush.color = brushColor;
      fabricCanvasRef.current.freeDrawingBrush.width = brushSize;
    }
  }, [brushColor, brushSize]);

  // Handle incoming drawing actions from other users
  useEffect(() => {
    if (!socket) return;

    const handleDrawingAction = (data) => {
      if (!fabricCanvasRef.current) return;

      const { action, userId, userName } = data;

      switch (action.type) {
        case 'draw':
          const path = new Path(action.data.path.path, {
            stroke: action.data.path.stroke,
            strokeWidth: action.data.path.strokeWidth,
            fill: action.data.path.fill,
            selectable: false,
            evented: false
          });
          fabricCanvasRef.current.add(path);
          fabricCanvasRef.current.renderAll();
          break;

        case 'clear':
          fabricCanvasRef.current.clear();
          fabricCanvasRef.current.backgroundColor = '#ffffff';
          fabricCanvasRef.current.renderAll();
          break;

        case 'erase':
          // Handle eraser functionality
          break;

        default:
          break;
      }
    };

    socket.on('drawing-action', handleDrawingAction);

    return () => {
      socket.off('drawing-action', handleDrawingAction);
    };
  }, [socket]);

  // Clear canvas function
  const clearCanvas = useCallback(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();
      fabricCanvasRef.current.backgroundColor = '#ffffff';
      fabricCanvasRef.current.renderAll();
      
      if (socket) {
        socket.emit('clear-canvas', { roomId });
      }
    }
  }, [socket, roomId]);

  // Undo function
  const undo = useCallback(() => {
    if (fabricCanvasRef.current) {
      const objects = fabricCanvasRef.current.getObjects();
      if (objects.length > 0) {
        fabricCanvasRef.current.remove(objects[objects.length - 1]);
        fabricCanvasRef.current.renderAll();
        
        if (socket) {
          socket.emit('undo-redo', { roomId, action: 'undo' });
        }
      }
    }
  }, [socket, roomId]);

  // Toggle drawing mode
  const toggleDrawingMode = useCallback(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.isDrawingMode = !fabricCanvasRef.current.isDrawingMode;
    }
  }, []);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="border border-gray-300 rounded-lg shadow-lg"
      />
      
      {/* Canvas Controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <button
          onClick={toggleDrawingMode}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            fabricCanvasRef.current?.isDrawingMode
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {fabricCanvasRef.current?.isDrawingMode ? 'Select Mode' : 'Draw Mode'}
        </button>
        
        <button
          onClick={clearCanvas}
          className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          Clear
        </button>
        
        <button
          onClick={undo}
          className="px-3 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          Undo
        </button>
      </div>
    </div>
  );
};

export default WhiteboardCanvas; 