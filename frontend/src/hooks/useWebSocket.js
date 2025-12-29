import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = 'ws://localhost:3001';

export function useWebSocket() {
  const [connectionState, setConnectionState] = useState('disconnected');
  const wsRef = useRef(null);
  const [error, setError] = useState(null);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [currentLLMResponse, setCurrentLLMResponse] = useState('');
  const currentTranscriptRef = useRef('');
  const currentLLMResponseRef = useRef('');
  const llmFinishedRef = useRef(false);
  const audioContextRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const [enabledSTT, setEnabledSTT] = useState(true);
  const [enabledLLM, setEnabledLLM] = useState(true);
  const [enabledTTS, setEnabledTTS] = useState(true);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, []);

  const playNextInQueue = useCallback(() => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    const audioData = audioQueueRef.current.shift();

    initAudioContext();
    const audioContext = audioContextRef.current;

    try {
      const numSamples = Math.floor(audioData.byteLength / 2);

      const dataView = new DataView(audioData);
      const float32Data = new Float32Array(numSamples);

      for (let i = 0; i < numSamples; i++) {
        const int16Sample = dataView.getInt16(i * 2, true);
        float32Data[i] = int16Sample / 32768.0;
      }

      const audioBuffer = audioContext.createBuffer(1, numSamples, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      source.onended = () => {
        isPlayingRef.current = false;
        playNextInQueue();
      };

      source.start();
    } catch (err) {
      console.error('Error procesando audio PCM:', err);
      isPlayingRef.current = false;
      playNextInQueue();
    }
  }, [initAudioContext]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('WebSocket conectado');
        setConnectionState('connected');
        setError(null);
      };

      ws.onclose = () => {
        console.log('WebSocket desconectado');
        setConnectionState('disconnected');
      };

      ws.onerror = (err) => {
        console.error('Error en WebSocket:', err);
        setError('Error de conexión');
        setConnectionState('error');
      };

      ws.onmessage = (event) => {
        if (event.data instanceof Blob || event.data instanceof ArrayBuffer) {
          const audioData = event.data instanceof Blob
            ? event.data.arrayBuffer()
            : Promise.resolve(event.data);

          audioData.then(buffer => {
            audioQueueRef.current.push(buffer);
            playNextInQueue();
          });
        } else {
          try {
            const message = JSON.parse(event.data);
            console.log('Mensaje parseado:', message);

            if (message.type === 'transcript_partial') {
              setPartialTranscript(message.text);
            } else if (message.type === 'transcript_done') {
              setPartialTranscript('');
              if (currentLLMResponseRef.current) {
                currentLLMResponseRef.current = '';
                setCurrentLLMResponse('');
              }

              currentTranscriptRef.current = message.text;
              setCurrentTranscript(currentTranscriptRef.current);
              llmFinishedRef.current = false;
            } else if (message.type === 'llm_token') {
              currentLLMResponseRef.current += message.token;
              setCurrentLLMResponse(currentLLMResponseRef.current);
            } else if (message.type === 'llm_done') {
              llmFinishedRef.current = true;
            } else if (message.type === 'config_updated') {
              console.log('Configuración actualizada:', message);
              setEnabledSTT(message.stt);
              setEnabledLLM(message.llm);
              setEnabledTTS(message.tts);
            }
          } catch (err) {
            console.log('Error parseando mensaje:', err);
            console.log('Mensaje recibido:', event.data);
          }
        }
      };

      wsRef.current = ws;
    } catch (err) {
      setError('No se pudo conectar');
      setConnectionState('error');
    }
  }, [playNextInQueue]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    } else {
      console.warn('WebSocket no está conectado');
    }
  }, []);

  const sendAudioChunk = useCallback((audioData) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(audioData);
    }
  }, []);

  const toggleComponent = useCallback((component, enabled) => {
    const message = JSON.stringify({
      type: 'toggle_component',
      component: component,
      enabled: enabled
    });

    sendMessage(message);

    if (component === 'stt') setEnabledSTT(enabled);
    else if (component === 'llm') setEnabledLLM(enabled);
    else if (component === 'tts') setEnabledTTS(enabled);
  }, [sendMessage]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionState,
    error,
    connect,
    disconnect,
    sendMessage,
    sendAudioChunk,
    currentTranscript,
    partialTranscript,
    currentLLMResponse,
    enabledSTT,
    enabledLLM,
    enabledTTS,
    toggleComponent,
  };
}
