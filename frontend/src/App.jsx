import { useEffect } from "react";
import "./App.css";
import { useWebSocket } from "./hooks/useWebSocket";
import { AudioRecorder } from "./components/AudioRecorder";

function App() {
  const {
    connectionState,
    error,
    connect,
    disconnect,
    sendAudioChunk,
    currentTranscript,
    partialTranscript,
    currentLLMResponse,
    enabledSTT,
    enabledLLM,
    enabledTTS,
    toggleComponent
  } = useWebSocket();

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const handleAudioChunk = (audioData) => {
    sendAudioChunk(audioData);
  };

  const getConnectionColor = () => {
    switch (connectionState) {
      case "connected":
        return "#4ade80";
      case "disconnected":
        return "#94a3b8";
      case "error":
        return "#f87171";
      default:
        return "#94a3b8";
    }
  };

  const getConnectionText = () => {
    switch (connectionState) {
      case "connected":
        return "● Conectado";
      case "disconnected":
        return "○ Desconectado";
      case "error":
        return "✕ Error";
      default:
        return "○ Desconectado";
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Realtime Voice MVP</h1>
        <p>Streaming de audio en tiempo real</p>
      </header>

      <main className="main">
        <section className="panel left">
          <div className="status">
            <span>Estado de conexión</span>
            <span
              className="status-value"
              style={{ color: getConnectionColor() }}
            >
              {getConnectionText()}
            </span>
          </div>

          <div className="recorder">
            <AudioRecorder
              onAudioChunk={handleAudioChunk}
              isConnected={connectionState === "connected"}
            />
          </div>

          {connectionState === "connected" && (
            <div className="pipeline-controls">
              <h3>Pipeline Controls</h3>
              <div className="toggle-group">
                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={enabledSTT}
                    onChange={(e) => toggleComponent('stt', e.target.checked)}
                  />
                  <span>STT (Speech-to-Text)</span>
                </label>

                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={enabledLLM}
                    onChange={(e) => toggleComponent('llm', e.target.checked)}
                  />
                  <span>LLM (Language Model)</span>
                </label>

                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={enabledTTS}
                    onChange={(e) => toggleComponent('tts', e.target.checked)}
                  />
                  <span>TTS (Text-to-Speech)</span>
                </label>
              </div>
            </div>
          )}

          {error && <div className="error">{error}</div>}
        </section>

        <section className="panel right">
          <h2>Pipeline</h2>

          <div className="pipeline-div">
            <div className="pipeline-item">
              <span>STT</span>
              <small>Speech to Text</small>
            </div>
            <div id="box-process-stt">
              {partialTranscript ? (
                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                  {partialTranscript}
                </span>
              ) : (
                currentTranscript
              )}
            </div>
          </div>

          <div className="pipeline-div">
            <div className="pipeline-item">
              <span>LLM</span>
              <small>Procesamiento</small>
            </div>
            <div id="box-process-llm">
              {currentLLMResponse}
            </div>
          </div>

          <div className="pipeline-div">
            <div className="pipeline-item">
              <span>TTS</span>
              <small>Text to Speech</small>
            </div>
            <div id="box-process-tts"></div>
          </div>
        </section>
      </main>

      <footer className="footer">
        MVP experimental · Latencia baja · Streaming continuo
      </footer>
    </div>
  );
}

export default App;
