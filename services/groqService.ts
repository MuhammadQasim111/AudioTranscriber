import Groq from "groq-sdk";
import { TranscriptionResult } from "../types";

const groq = new Groq({
    apiKey: (import.meta as any).env.VITE_GROK_API_KEY || process.env.GROK_API_KEY || '',
    dangerouslyAllowBrowser: true
});

const TRANSCRIPTION_MODEL = 'whisper-large-v3-turbo';

export async function transcribeAudio(
    base64Audio: string,
    mimeType: string
): Promise<TranscriptionResult> {
    try {
        // Convert base64 to File/Blob
        const byteCharacters = atob(base64Audio);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        const file = new File([blob], "audio.wav", { type: mimeType });

        const transcription = await groq.audio.transcriptions.create({
            file: file,
            model: TRANSCRIPTION_MODEL,
            response_format: 'verbose_json',
        }) as any; // Cast to any because standard type might not reflect verbose_json structure correctly yet

        const segments = transcription.segments?.map((seg: any) => ({
            speaker: "Speaker",
            timestamp: formatTimestamp(seg.start),
            text: seg.text.trim()
        })) || [];

        if (segments.length === 0 && transcription.text) {
            segments.push({
                speaker: "Speaker",
                timestamp: "00:00",
                text: transcription.text.trim()
            });
        }

        const fullText = segments.map((s: any) => s.text).join(" ");
        let summary = "Processed with Groq";

        if (fullText.length > 50) {
            try {
                const completion = await groq.chat.completions.create({
                    messages: [
                        { role: "system", content: "You are a helpful assistant. Please provide a concise summary of the following transcript." },
                        { role: "user", content: fullText }
                    ],
                    model: "llama-3.1-8b-instant", // Using the user-specified model
                    temperature: 0.5,
                    max_tokens: 256
                });
                summary = completion.choices[0]?.message?.content || summary;
            } catch (e) {
                console.error("Summary generation failed:", e);
            }
        }

        return {
            segments,
            summary
        };

    } catch (error: any) {
        console.error("Groq Transcription Error:", error);
        throw new Error(error.message || "Transcription failed");
    }
}

function formatTimestamp(seconds: number): string {
    const mm = Math.floor(seconds / 60);
    const ss = Math.floor(seconds % 60);
    return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
}
