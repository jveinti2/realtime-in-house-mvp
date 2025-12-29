import '@livekit/components-styles';
import {
  LiveKitRoom,
  useVoiceAssistant,
  BarVisualizer,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  useConnectionState,
} from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { useState, useEffect, useCallback } from 'react';

function VoiceAssistantUI() {
  const { state, audioTrack } = useVoiceAssistant();
  const connectionState = useConnectionState();

  const getStateText = () => {
    switch (state) {
      case 'listening':
        return 'Escuchando...';
      case 'thinking':
        return 'Pensando...';
      case 'speaking':
        return 'Hablando...';
      case 'idle':
        return 'Listo';
      default:
        return state;
    }
  };

  const getStateColor = () => {
    switch (state) {
      case 'listening':
        return '#4ade80';
      case 'thinking':
        return '#facc15';
      case 'speaking':
        return '#60a5fa';
      default:
        return '#94a3b8';
    }
  };

  return (
    <div className="voice-agent-ui">
      <div className="visualizer-container">
        <BarVisualizer
          state={state}
          barCount={7}
          trackRef={audioTrack}
          style={{ height: '100px' }}
        />
      </div>

      <div className="state-indicator" style={{ color: getStateColor() }}>
        <span className="state-dot" style={{ backgroundColor: getStateColor() }} />
        {getStateText()}
      </div>

      <div className="connection-state">
        {connectionState === ConnectionState.Connected ? '● Conectado' : '○ Desconectado'}
      </div>

      <VoiceAssistantControlBar />
      <RoomAudioRenderer />
    </div>
  );
}

export function VoiceAgent() {
  const [token, setToken] = useState('');
  const [wsUrl, setWsUrl] = useState('');
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchToken = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/token?room=voice-room');
      if (!response.ok) throw new Error('Error obteniendo token');

      const data = await response.json();
      setToken(data.token);
      setWsUrl(data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  if (error) {
    return (
      <div className="voice-agent-error">
        <p>Error: {error}</p>
        <button onClick={fetchToken}>Reintentar</button>
      </div>
    );
  }

  if (isConnecting || !token) {
    return <div className="voice-agent-loading">Conectando a LiveKit...</div>;
  }

  return (
    <LiveKitRoom
      serverUrl={wsUrl}
      token={token}
      connect={true}
      audio={true}
      video={false}
      onDisconnected={() => console.log('Desconectado de LiveKit')}
      onError={(err) => setError(err.message)}
    >
      <VoiceAssistantUI />
    </LiveKitRoom>
  );
}
