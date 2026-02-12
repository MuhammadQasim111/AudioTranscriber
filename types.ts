
export interface TranscriptSegment {
  speaker: string;
  timestamp: string;
  text: string;
}

export interface TranscriptionResult {
  segments: TranscriptSegment[];
  summary?: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PENDING = 'PENDING',
  COMPRESSING = 'COMPRESSING',
  UPLOADING = 'UPLOADING',
  TRANSCRIBING = 'TRANSCRIBING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface FileTask {
  id: string;
  file: File;
  status: AppStatus;
  result?: TranscriptionResult;
  error?: string | null;
  progress: number;
}
