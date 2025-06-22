import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';

const WhiteboardToolbar = ({
  brushColor,
  setBrushColor,
  brushSize,
  setBrushSize,
  onClear,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isDrawingMode,
  onToggleDrawingMode,
  isConnected
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colors = [
    '#000000', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899'
  ];

  const brushSizes = [2, 4, 8, 14, 20];

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Mode Toggle */}
      <div>
        <h4 className="text-sm font-semibold text-gray-500 mb-2">Mode</h4>
        <div className="flex w-full">
          <button
            onClick={() => onToggleDrawingMode(true)}
            className={`w-1/2 px-4 py-2 font-medium transition-colors text-sm rounded-l-lg ${
              isDrawingMode
                ? 'bg-blue-600 text-white z-10'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Draw
          </button>
          <button
            onClick={() => onToggleDrawingMode(false)}
            className={`w-1/2 px-4 py-2 font-medium transition-colors text-sm rounded-r-lg border-l border-gray-400 ${
              !isDrawingMode
                ? 'bg-blue-600 text-white z-10'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Select
          </button>
        </div>
      </div>

      {/* Color Palette */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-semibold text-gray-500 mb-3">Color</h4>
        <div className="grid grid-cols-4 gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setBrushColor(color)}
              className={`w-full h-8 rounded-lg border-2 transition-transform hover:scale-105 ${
                brushColor === color ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-full h-8 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
            {showColorPicker && (
              <div className="absolute top-10 left-0 z-20 p-2 bg-white rounded-lg shadow-xl">
                <HexColorPicker
                  color={brushColor}
                  onChange={setBrushColor}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Brush Size */}
      <div className="border-t border-gray-200 pt-4">
        <label className="block text-sm font-semibold text-gray-500 mb-3">
          Brush Size
        </label>
        <input
          type="range"
          min="1"
          max="50"
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="text-center text-xs text-gray-500 mt-1">{brushSize}px</div>
      </div>
      
      {/* Action Buttons */}
      <div className="border-t border-gray-200 pt-4 flex flex-col gap-2">
         <button
          onClick={onUndo}
          disabled={!canUndo || !isConnected}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          Undo
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo || !isConnected}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Redo
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
        </button>
        <button
          onClick={onClear}
          disabled={!isConnected}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Clear All
        </button>
      </div>
    </div>
  );
};

export default WhiteboardToolbar; 