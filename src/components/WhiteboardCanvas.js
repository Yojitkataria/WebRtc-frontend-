import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as fabric from 'fabric';

const WhiteboardCanvas = forwardRef(({ 
  roomId, 
  socket, 
  isDrawingEnabled,
  brushColor, 
  brushSize,
  setCanUndo,
  setCanRedo
}, ref) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const history = useRef([]);
  const redoStack = useRef([]);

  const updateHistoryButtons = useCallback(() => {
    setCanUndo(history.current.length > 0);
    setCanRedo(redoStack.current.length > 0);
  }, [setCanUndo, setCanRedo]);

  useImperativeHandle(ref, () => ({
    undo() {
      socket.emit('drawing-action', { roomId, action: { type: 'UNDO' } });
    },
    redo() {
      socket.emit('drawing-action', { roomId, action: { type: 'REDO' } });
    },
    clear() {
      if (socket && roomId) {
        socket.emit('drawing-action', { roomId, action: { type: 'CLEAR' } });
      }
    }
  }), [socket, roomId]);
  
  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: canvasRef.current.parentElement.clientWidth,
      height: canvasRef.current.parentElement.clientHeight,
      backgroundColor: '#ffffff',
      isDrawingMode: isDrawingEnabled
    });
    
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    fabricCanvasRef.current = canvas;

    canvas.on('path:created', (e) => {
      if (!socket) return;
      const path = e.path;
      path.set({ id: `${socket.id}-${new Date().getTime()}` });
      
      history.current.push(path);
      redoStack.current = [];
      updateHistoryButtons();

      socket.emit('drawing-action', { roomId, action: { type: 'ADD', data: path.toObject(['id']) } });
    });

    return () => { canvas.dispose(); };
  }, [socket, roomId, updateHistoryButtons]);

  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.isDrawingMode = isDrawingEnabled;
      if (fabricCanvasRef.current.freeDrawingBrush) {
        fabricCanvasRef.current.freeDrawingBrush.color = brushColor;
        fabricCanvasRef.current.freeDrawingBrush.width = brushSize;
      }
    }
  }, [isDrawingEnabled, brushColor, brushSize]);

  useEffect(() => {
    if (!socket) return;

    const handleAction = (action) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      switch (action.type) {
        case 'ADD':
          if (action.data.id.startsWith(socket.id)) {
            return;
          }

          fabric.util.enlivenObjects([action.data], (objects) => {
            const newObject = objects[0];
            canvas.add(newObject);
            history.current.push(newObject);
            redoStack.current = [];
            updateHistoryButtons();
          });
          break;
        case 'UNDO':
          if (history.current.length > 0) {
            const lastObj = history.current.pop();
            redoStack.current.push(lastObj);
            canvas.remove(lastObj);
            updateHistoryButtons();
          }
          break;
        case 'REDO':
          if (redoStack.current.length > 0) {
            const objToRedo = redoStack.current.pop();
            history.current.push(objToRedo);
            canvas.add(objToRedo);
            updateHistoryButtons();
          }
          break;
        case 'CLEAR':
          canvas.clear();
          canvas.backgroundColor = '#ffffff';
          history.current = [];
          redoStack.current = [];
          updateHistoryButtons();
          break;
        default:
          break;
      }
    };

    socket.on('drawing-action', handleAction);
    return () => { socket.off('drawing-action', handleAction); };
  }, [socket, updateHistoryButtons]);

  return (
    <div className="w-full h-full">
      <canvas ref={canvasRef} />
    </div>
  );
});

export default WhiteboardCanvas;