export async function getMicrophoneStream() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000,
      }
    });
    return stream;
  } catch (err) {
    console.error('Error al acceder al micrófono:', err);
    throw new Error('No se pudo acceder al micrófono');
  }
}

export function createAudioProcessor(stream, onAudioChunk) {
  const audioContext = new AudioContext({ sampleRate: 16000 });
  const source = audioContext.createMediaStreamSource(stream);
  const processor = audioContext.createScriptProcessor(4096, 1, 1);

  processor.onaudioprocess = (e) => {
    const inputData = e.inputBuffer.getChannelData(0);
    const audioChunk = new Float32Array(inputData);

    if (onAudioChunk) {
      onAudioChunk(audioChunk);
    }
  };

  source.connect(processor);
  processor.connect(audioContext.destination);

  return {
    audioContext,
    processor,
    stop: () => {
      processor.disconnect();
      source.disconnect();
      audioContext.close();
    }
  };
}

export function float32ToInt16(float32Array) {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Array;
}
