import { useState, useRef } from "react";
import {
  getMicrophoneStream,
  createAudioProcessor,
  float32ToInt16,
} from "../utils/audioUtils";

export function AudioRecorder({ onAudioChunk, isConnected }) {
  const [isRecording, setIsRecording] = useState(false);
  const streamRef = useRef(null);
  const processorRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await getMicrophoneStream();
      streamRef.current = stream;

      const processor = createAudioProcessor(stream, (audioChunk) => {
        const int16Data = float32ToInt16(audioChunk);
        if (onAudioChunk) {
          onAudioChunk(int16Data.buffer);
        }
      });

      processorRef.current = processor;
      setIsRecording(true);
    } catch (err) {
      console.error("Error al iniciar grabación:", err);
      alert("No se pudo acceder al micrófono");
    }
  };

  const stopRecording = () => {
    if (processorRef.current) {
      processorRef.current.stop();
      processorRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
  };

  const handleToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="audio-recorder">
      <button
        onClick={handleToggle}
        disabled={!isConnected}
        className={isRecording ? "recording" : ""}
      >
        {isRecording ? "⏹ Cerrar audio" : "🎤 Abrir microfono"}
      </button>
      {isRecording && (
        <span className="recording-indicator">● Hablando...</span>
      )}
    </div>
  );
}
