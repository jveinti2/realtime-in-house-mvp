import "@livekit/components-styles";
import {
  LiveKitRoom,
  useVoiceAssistant,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  useConnectionState,
  useTranscriptions,
  useRemoteParticipants,
} from "@livekit/components-react";
import { ConnectionState, ParticipantKind } from "livekit-client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { ChatTranscript } from "./ChatTranscript";

function VoiceAssistantUI() {
  const { state } = useVoiceAssistant();
  const connectionState = useConnectionState();
  const transcriptions = useTranscriptions();
  const remoteParticipants = useRemoteParticipants();

  const agentIdentities = useMemo(() => {
    const agents = new Set();
    remoteParticipants.forEach((p) => {
      if (p.kind === ParticipantKind.AGENT) {
        agents.add(p.identity);
      }
    });
    return agents;
  }, [remoteParticipants]);

  const messages = useMemo(() => {
    const seen = new Map();

    if (transcriptions.length > 0) {
      console.log("DEBUG transcriptions:", JSON.stringify(transcriptions[0], null, 2));
      console.log("DEBUG agentIdentities:", [...agentIdentities]);
    }

    return transcriptions
      .map((t) => {
        const identity = t.participantInfo?.identity || "";
        const isAgent = agentIdentities.has(identity);
        const streamId = t.streamInfo?.id || `${Date.now()}-${Math.random()}`;
        const isFinal = t.streamInfo?.attributes?.["lk.transcription_final"] === "true";
        const segmentId = t.streamInfo?.attributes?.["lk.segment_id"];

        return {
          id: streamId,
          segmentId,
          role: isAgent ? "assistant" : "user",
          content: t.text || "",
          timestamp: t.streamInfo?.timestamp || Date.now(),
          isFinal,
        };
      })
      .filter((msg) => {
        if (!msg.content.trim()) return false;
        const key = `${msg.role}-${msg.segmentId || msg.content}`;
        if (msg.isFinal) {
          if (seen.has(key)) return false;
          seen.set(key, true);
        }
        return true;
      });
  }, [transcriptions, agentIdentities]);

  const getStateText = () => {
    switch (state) {
      case "listening":
        return "Escuchando...";
      case "thinking":
        return "Pensando...";
      case "speaking":
        return "Hablando...";
      case "idle":
        return "Listo";
      default:
        return state;
    }
  };

  const getStateColor = () => {
    switch (state) {
      case "listening":
        return "#4ade80";
      case "thinking":
        return "#facc15";
      case "speaking":
        return "#60a5fa";
      default:
        return "#94a3b8";
    }
  };

  return (
    <div className="voice-agent-wrapper">
      <div className="voice-agent-container">
        <div className="voice-agent-ui">
          <div className="state-indicator" style={{ color: getStateColor() }}>
            <span
              className="state-dot"
              style={{ backgroundColor: getStateColor() }}
            />
            {getStateText()}
          </div>

          <div className="connection-state">
            {connectionState === ConnectionState.Connected
              ? "● Conectado"
              : "○ Desconectado"}
          </div>

          <VoiceAssistantControlBar />
          <RoomAudioRenderer />
        </div>
      </div>
      <ChatTranscript messages={messages} />
    </div>
  );
}

export function VoiceAgent() {
  const [token, setToken] = useState("");
  const [wsUrl, setWsUrl] = useState("");
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchToken = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch(
        "http://localhost:3001/token?room=voice-room"
      );
      if (!response.ok) throw new Error("Error obteniendo token");

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
      onDisconnected={() => {}}
      onError={(err) => setError(err.message)}
    >
      <VoiceAssistantUI />
    </LiveKitRoom>
  );
}
