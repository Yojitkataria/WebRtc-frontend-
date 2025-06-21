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
  isDrawingMode,
  onToggleDrawingMode
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colors = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
    '#008000', '#800000', '#000080', '#808080', '#c0c0c0'
  ];

  const brushSizes = [1, 3, 5, 8, 12, 16, 20];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Drawing Tools</h3>
        
        <button
          onClick={onToggleDrawingMode}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isDrawingMode
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {isDrawingMode ? 'Select Mode' : 'Draw Mode'}
        </button>
      </div>

      {/* Color Palette */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color
        </label>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-10 h-10 rounded-lg border-2 border-gray-300"
              style={{ backgroundColor: brushColor }}
            />
            {showColorPicker && (
              <div className="absolute top-12 left-0 z-10">
                <HexColorPicker
                  color={brushColor}
                  onChange={setBrushColor}
                />
              </div>
            )}
          </div>
          
          <div className="flex gap-1">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setBrushColor(color)}
                className={`w-8 h-8 rounded border-2 transition-transform hover:scale-110 ${
                  brushColor === color ? 'border-gray-800' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Brush Size */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Brush Size: {brushSize}px
        </label>
        <div className="flex gap-2">
          {brushSizes.map((size) => (
            <button
              key={size}
              onClick={() => setBrushSize(size)}
              className={`w-8 h-8 rounded-full border-2 transition-colors ${
                brushSize === size
                  ? 'border-blue-600 bg-blue-100'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{
                width: `${size + 8}px`,
                height: `${size + 8}px`
              }}
            >
              <div
                className="w-full h-full rounded-full"
                style={{
                  backgroundColor: brushColor,
                  width: `${size}px`,
                  height: `${size}px`,
                  margin: 'auto'
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onUndo}
          className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
        >
          Undo
        </button>
        <button
          onClick={onRedo}
          className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
        >
          Redo
        </button>
        <button
          onClick={onClear}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default WhiteboardToolbar; 