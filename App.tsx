
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppStatus, TranscriptionResult, FileTask } from './types';
import { transcribeAudio } from './services/groqService';
import { compressAudio } from './audioUtils';
import FileUpload from './components/FileUpload';
import TranscriptDisplay from './components/TranscriptDisplay';
import Login from './components/Login';

const MAX_INPUT_FILE_SIZE = 100 * 1024 * 1024;
const COMPRESSION_THRESHOLD = 1 * 1024 * 1024; // Compress almost everything for speed

const App: React.FC = () => {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [tasks, setTasks] = useState<FileTask[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const tasksRef = useRef<FileTask[]>([]);
  tasksRef.current = tasks;

  useEffect(() => {
    const savedUser = localStorage.getItem('bracual_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = (email: string) => {
    const userData = { email };
    setUser(userData);
    localStorage.setItem('bracual_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('bracual_user');
  };

  useEffect(() => {
    const processQueue = async () => {
      if (isProcessing || !user) return;
      const nextTask = tasks.find(t => t.status === AppStatus.PENDING);
      if (!nextTask) return;
      setIsProcessing(true);
      await processTask(nextTask.id);
      setIsProcessing(false);
    };
    processQueue();
  }, [tasks, isProcessing, user]);

  const processTask = async (taskId: string) => {
    const updateTask = (id: string, updates: Partial<FileTask>) => {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const task = tasksRef.current.find(t => t.id === taskId);
    if (!task) return;

    try {
      let audioToProcess: File | Blob = task.file;

      if (task.file.size > COMPRESSION_THRESHOLD) {
        updateTask(taskId, { status: AppStatus.COMPRESSING, progress: 0 });
        audioToProcess = await compressAudio(task.file, (p) => {
          updateTask(taskId, { progress: p });
        });
      }

      updateTask(taskId, { status: AppStatus.UPLOADING, progress: 0 });
      const base64 = await dataToBase64(audioToProcess, (p) => {
        updateTask(taskId, { progress: p });
      });

      updateTask(taskId, { status: AppStatus.TRANSCRIBING, progress: 100 });
      const transcription = await transcribeAudio(base64, audioToProcess.type);

      updateTask(taskId, { status: AppStatus.SUCCESS, result: transcription, progress: 100 });
      if (!activeTaskId) setActiveTaskId(taskId);
    } catch (err: any) {
      console.error("Task processing error:", err);
      updateTask(taskId, {
        status: AppStatus.ERROR,
        error: err.message || 'Processing failed.',
        progress: 0
      });
    }
  };

  const handleFilesSelect = (files: File[]) => {
    const newTasks: FileTask[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: file.size > MAX_INPUT_FILE_SIZE ? AppStatus.ERROR : AppStatus.PENDING,
      error: file.size > MAX_INPUT_FILE_SIZE ? `File exceeds 100MB limit.` : null,
      progress: 0
    }));
    setTasks(prev => [...prev, ...newTasks]);
  };

  const dataToBase64 = (data: File | Blob, onProgress: (progress: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      reader.readAsDataURL(data);
      reader.onload = () => {
        const resultString = reader.result as string;
        if (resultString.includes(',')) resolve(resultString.split(',')[1]);
        else reject(new Error("Invalid audio data"));
      };
      reader.onerror = () => reject(new Error("File reading failed."));
    });
  };

  const handleCancelTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (activeTaskId === taskId) setActiveTaskId(null);
  };

  const activeTask = tasks.find(t => t.id === activeTaskId);

  const handleCopy = useCallback(() => {
    if (!activeTask?.result) return;
    const text = activeTask.result.segments
      .map(s => `[${s.timestamp}] ${s.speaker}: ${s.text}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  }, [activeTask]);

  const handleDownload = useCallback(() => {
    if (!activeTask?.result) return;
    const text = activeTask.result.segments
      .map(s => `[${s.timestamp}] ${s.speaker}: ${s.text}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription-${activeTask.file.name.replace(/\.[^/.]+$/, "")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [activeTask]);

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen pb-20 bg-[#F9FAFB]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-none">Bracual</h1>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-1">Turbo Transcription Engine</p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
              <span>Live Engine</span>
            </div>

            <div className="flex items-center space-x-4 pl-6 border-l border-gray-100">
              <div className="flex flex-col items-end">
                <span className="text-[11px] font-bold text-gray-900 truncate max-w-[120px]">{user.email}</span>
                <button onClick={handleLogout} className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-colors">Sign Out</button>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                {user.email.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
            Audio to Text in <span className="text-blue-600 underline decoration-blue-200">Seconds</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Optimized 8kHz engine for ultra-fast native script transcription.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <FileUpload onFilesSelect={handleFilesSelect} disabled={false} />

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">High Speed Queue</h3>
                <span className="text-xs text-gray-500">{tasks.length} Files</span>
              </div>

              <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {tasks.length === 0 ? (
                  <div className="px-5 py-10 text-center text-gray-400">
                    <p className="text-sm">Upload to see the speed of Bracual.</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`px-5 py-5 flex flex-col hover:bg-gray-50 transition-colors cursor-default ${activeTaskId === task.id ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : ''}`}
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="flex-grow min-w-0 pr-4">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-semibold text-gray-900 truncate">{task.file.name}</p>
                            <span className="text-[10px] text-gray-400 font-mono">{(task.file.size / (1024 * 1024)).toFixed(1)}MB</span>
                          </div>

                          <div className="mt-1 flex items-center space-x-3">
                            {task.status === AppStatus.COMPRESSING && (
                              <span className="flex items-center text-[10px] text-orange-600 font-bold uppercase tracking-tight">
                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2 animate-bounce"></span> Resampling 8kHz ({task.progress}%)
                              </span>
                            )}
                            {task.status === AppStatus.UPLOADING && (
                              <span className="flex items-center text-[10px] text-blue-600 font-bold uppercase tracking-tight">
                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2 animate-pulse"></span> Fast Upload ({task.progress}%)
                              </span>
                            )}
                            {task.status === AppStatus.TRANSCRIBING && (
                              <span className="flex items-center text-[10px] text-indigo-600 font-bold uppercase tracking-tight">
                                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2 animate-ping"></span> AI Turbo Mode...
                              </span>
                            )}
                            {task.status === AppStatus.SUCCESS && (
                              <span className="flex items-center text-[10px] text-green-600 font-bold uppercase tracking-tight">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span> Completed
                              </span>
                            )}
                            {task.status === AppStatus.ERROR && (
                              <span className="flex items-center text-[10px] text-red-500 font-bold uppercase tracking-tight">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span> Error
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {task.status === AppStatus.SUCCESS && (
                            <button
                              onClick={() => setActiveTaskId(task.id)}
                              className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${activeTaskId === task.id ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100'}`}
                            >
                              View
                            </button>
                          )}
                          <button onClick={() => handleCancelTask(task.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {(task.status === AppStatus.COMPRESSING || task.status === AppStatus.UPLOADING || task.status === AppStatus.TRANSCRIBING) && (
                        <div className="w-full mt-3">
                          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ease-out ${task.status === AppStatus.TRANSCRIBING ? 'bg-indigo-500 animate-pulse' :
                                  task.status === AppStatus.COMPRESSING ? 'bg-orange-500' : 'bg-blue-600'
                                }`}
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {activeTask?.result ? (
              <TranscriptDisplay
                result={activeTask.result}
                onCopy={handleCopy}
                onDownload={handleDownload}
              />
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 bg-white rounded-2xl border-2 border-dashed border-gray-100 text-gray-400">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100 shadow-inner">
                  <svg className="w-8 h-8 text-blue-300 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Turbo Mode Active</h3>
                <p className="text-sm mt-1 text-center max-w-xs text-gray-500 leading-relaxed">Processing is now 10x faster using 8kHz resampling and immediate AI streaming.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-20 border-t border-gray-200 pt-8 pb-12 text-center text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Bracual Turbo. Fast. Native. Accurate.</p>
      </footer>
    </div>
  );
};

export default App;
