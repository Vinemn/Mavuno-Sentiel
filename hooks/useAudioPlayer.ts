// New file: hooks/useAudioPlayer.ts
import { useState, useRef, useCallback, useEffect } from 'react';

// Helper function to decode base64 string to Uint8Array
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper function to decode raw PCM audio data into an AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


interface UseAudioPlayerProps {
    sampleRate: number;
}

export const useAudioPlayer = ({ sampleRate }: UseAudioPlayerProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);

    useEffect(() => {
        // Initialize AudioContext on the client-side, only once
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
        }
        
        return () => {
             // Stop playback on component unmount
            if (sourceRef.current) {
                sourceRef.current.stop();
            }
        };
    }, [sampleRate]);
    
    // Create the context once the component mounts
    useEffect(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
        }
    }, [sampleRate]);

    const stop = useCallback(() => {
        if (sourceRef.current) {
            sourceRef.current.stop();
            // onended will handle state changes
        }
    }, []);

    const play = useCallback(async (base64Audio: string) => {
        if (!audioContextRef.current || isPlaying) return;

        if (sourceRef.current) {
            stop();
        }
        setIsLoading(true);

        try {
            const decodedBytes = decode(base64Audio);
            const audioBuffer = await decodeAudioData(decodedBytes, audioContextRef.current, sampleRate, 1);
            
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);

            source.onended = () => {
                setIsPlaying(false);
                if (sourceRef.current === source) {
                   sourceRef.current = null;
                }
            };

            source.start();
            sourceRef.current = source;
            setIsPlaying(true);
        } catch (error) {
            console.error("Error playing audio:", error);
            setIsPlaying(false);
        } finally {
            setIsLoading(false);
        }
    }, [isPlaying, stop, sampleRate]);

    return { play, stop, isLoading, isPlaying };
};