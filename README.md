# Realtime Voice MVP

Voice AI experimental usando LiveKit Agents.

## Stack

- **LiveKit Agents**: Framework de voice AI en tiempo real
- **Silero VAD**: Detección de voz local (baja latencia)
- **Deepgram STT**: Transcripción en español (modelo nova-2)
- **OpenAI GPT-4o-mini**: LLM para respuestas
- **OpenAI TTS**: Síntesis de voz

## Requisitos

- Node.js 18+
- pnpm
- Cuenta LiveKit Cloud (gratis para desarrollo)
- API keys: Deepgram, OpenAI

## Setup

1. Configurar variables de entorno en `backend/.env`:

```
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-key
LIVEKIT_API_SECRET=your-secret
DEEPGRAM_API_KEY=your-key
OPENAI_API_KEY=your-key
```

2. Instalar dependencias:

```bash
cd backend && pnpm install
cd frontend && pnpm install
```

## Ejecutar

Necesitas 3 terminales:

```bash
# Terminal 1 - Token server
cd backend && pnpm dev:token

# Terminal 2 - Agent worker
cd backend && pnpm dev:agent

# Terminal 3 - Frontend
cd frontend && pnpm dev
```

Abre http://localhost:5173 en el navegador.

## Arquitectura

```
[Browser] <--WebRTC--> [LiveKit Cloud] <--WebRTC--> [Agent Worker]
                                                         │
                                                    ┌────┴────┐
                                                    │ Silero  │
                                                    │   VAD   │
                                                    └────┬────┘
                                                         │
                                             ┌───────────┼───────────┐
                                             ▼           ▼           ▼
                                        [Deepgram]  [OpenAI]   [OpenAI]
                                           STT        LLM        TTS
```

## Estructura del Proyecto

```
backend/
  src/
    agent.js      # LiveKit Agent worker
    token.js      # Token server para autenticación
frontend/
  src/
    components/
      VoiceAgent.jsx  # Componente principal LiveKit
    App.jsx
```

## Características

- Turn detection inteligente (semántico, no solo silencio)
- VAD local con Silero (sin latencia de red)
- Manejo de interrupciones (barge-in)
- WebRTC optimizado para baja latencia
- Reconexión automática

## Licencia

MIT
