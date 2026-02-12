
import React, { useState } from 'react';
import { TranscriptionResult } from '../types';

interface TranscriptDisplayProps {
  result: TranscriptionResult;
  onCopy: () => void;
  onDownload: () => void;
}

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({ result, onCopy, onDownload }) => {
  const [forceUrduMode, setForceUrduMode] = useState(false);

  // Helper to detect if text is likely Urdu/Arabic for RTL support
  const isRTL = (text: string) => {
    const rtlChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return rtlChars.test(text);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <h3 className="text-lg font-semibold text-gray-800">Transcription Result</h3>
        </div>

        <div className="flex items-center gap-4">
          {/* Urdu Mode Toggle */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-gray-200 shadow-sm">
            <span className={`text-xs font-bold uppercase tracking-wider ${forceUrduMode ? 'text-blue-600' : 'text-gray-400'}`}>
              Urdu Mode
            </span>
            <button
              onClick={() => setForceUrduMode(!forceUrduMode)}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${forceUrduMode ? 'bg-blue-600' : 'bg-gray-200'}`}
              role="switch"
              aria-checked={forceUrduMode}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${forceUrduMode ? 'translate-x-4' : 'translate-x-0'}`}
              />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onCopy}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy
            </button>
            <button
              onClick={onDownload}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {result.summary && (
          <div 
            className={`mb-8 p-5 bg-blue-50/50 rounded-xl border border-blue-100 ${forceUrduMode || isRTL(result.summary) ? 'text-right' : 'text-left'}`} 
            dir={forceUrduMode || isRTL(result.summary) ? 'rtl' : 'ltr'}
          >
            <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em] mb-3 opacity-60">Executive Summary</h4>
            <p className={`text-blue-800 leading-relaxed font-medium text-lg ${forceUrduMode || isRTL(result.summary) ? 'font-urdu' : ''}`}>
              {result.summary}
            </p>
          </div>
        )}

        <div className="space-y-8">
          {result.segments.map((segment, idx) => {
            const rtl = forceUrduMode || isRTL(segment.text);
            return (
              <div key={idx} className={`flex gap-6 group ${rtl ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="flex-shrink-0 w-20 pt-1">
                  <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                    {segment.timestamp}
                  </span>
                </div>
                <div className={`flex-grow ${rtl ? 'text-right' : 'text-left'}`} dir={rtl ? 'rtl' : 'ltr'}>
                  <p className="text-xs font-black text-blue-600 mb-2 uppercase tracking-widest opacity-80">{segment.speaker}</p>
                  <p className={`text-gray-800 leading-relaxed text-lg ${rtl ? 'font-urdu' : ''}`}>
                    {segment.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TranscriptDisplay;
