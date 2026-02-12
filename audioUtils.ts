
/**
 * Compresses audio by resampling to 8kHz Mono WAV.
 * 8kHz is the standard for speech (telephony quality) and provides the 
 * fastest possible processing speed for AI models by minimizing input size.
 */
export async function compressAudio(file: File, onProgress?: (p: number) => void): Promise<Blob> {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await file.arrayBuffer();
  
  if (onProgress) onProgress(20);
  
  // Browsers decode audio fast, but large files take time.
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  
  if (onProgress) onProgress(50);

  // Target 8kHz Mono - the fastest profile for speech AI
  const targetSampleRate = 8000;
  const offlineCtx = new OfflineAudioContext(
    1, // mono
    Math.ceil(audioBuffer.duration * targetSampleRate),
    targetSampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start();

  const renderedBuffer = await offlineCtx.startRendering();
  if (onProgress) onProgress(80);

  const wavBlob = encodeWAV(renderedBuffer.getChannelData(0), targetSampleRate);
  if (onProgress) onProgress(100);
  
  return wavBlob;
}

function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 32 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}
