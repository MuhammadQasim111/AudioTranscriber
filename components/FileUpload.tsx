
import React from 'react';

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelect, disabled }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelect(Array.from(e.target.files));
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors group">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="p-4 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-gray-700">Drop your audio files here</p>
          <p className="text-sm text-gray-500 mt-1">Supports MP3, WAV, M4A, OGG, FLAC</p>
          <div className="mt-4 flex flex-col space-y-1">
            <p className="text-xs font-bold text-blue-500 bg-blue-50 inline-block px-3 py-1 rounded-full border border-blue-100 mx-auto">
              Size Limit: Max 100MB per file
            </p>
            <p className="text-[11px] text-gray-400 italic">
              Large files are automatically compressed for processing
            </p>
          </div>
        </div>
        <label className={`inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-all active:scale-95 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          Select Audio Files
          <input
            type="file"
            className="hidden"
            accept="audio/*"
            multiple
            onChange={handleFileChange}
            disabled={disabled}
          />
        </label>
      </div>
    </div>
  );
};

export default FileUpload;
