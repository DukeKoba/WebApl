import React, { useRef, useState } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';

export default function ImageUploader({ onUpload, isUploading, imageUrl, onClear }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    onUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  if (imageUrl) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-gray-200">
        <img src={imageUrl} alt="ramen" className="w-full aspect-square object-cover" />
        <button
          onClick={onClear}
          className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        dragOver ? 'border-orange-400 bg-orange-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => handleFile(e.target.files[0])}
      />

      {isUploading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
          <p className="text-sm text-gray-500">Uploading & analyzing...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center">
            <ImageIcon className="w-7 h-7 text-orange-400" />
          </div>
          <div>
            <p className="font-medium text-gray-700">Upload your ramen photo</p>
            <p className="text-sm text-gray-400 mt-1">Click or drag &amp; drop</p>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP (max 10MB)</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full">
            <Upload className="w-3 h-3" />
            <span>Claude AI will auto-analyze the photo + GPS</span>
          </div>
        </div>
      )}
    </div>
  );
}
