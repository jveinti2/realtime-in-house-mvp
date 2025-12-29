# Realtime-In-House-MVP

## Descripción

**Realtime-In-House-MVP** es un proyecto experimental cuyo objetivo es **validar una arquitectura de conversación por voz en cuasi-tiempo real**, priorizando **latencia percibida mínima** y **flujo continuo de audio**, similar a plataformas de voice-AI en tiempo real.

El proyecto **no busca precisión perfecta**, sino **naturalidad, inmediatez y streaming end-to-end**.

---

## Objetivo

Demostrar que es posible construir una conversación por voz **speech-to-speech** sin pipelines bloqueantes, utilizando:

- Audio chunked desde el cliente
- Transcripción incremental
- Inferencia LLM en streaming
- Síntesis de voz incremental
- Comunicación bidireccional persistente

---

## Alcance del MVP

Incluye:

- Cliente web simple en React
- Backend con WebSocket persistente
- Flujo completo audio → texto → razonamiento → audio
- Streaming en todas las etapas

No incluye (intencionalmente):

- Escalabilidad horizontal
- Manejo avanzado de turn-taking
- Persistencia de estado
- Autenticación
- Producción / hardening

---

## Arquitectura General

[ Micrófono ]
│
▼
[ React Client ]
│ (audio chunks)
▼
[ WebSocket Backend ]
│
├─► Streaming STT (parciales)
│
├─► Streaming LLM (tokens)
│
└─► Streaming TTS (audio)
▼
[ Audio de respuesta en tiempo real ]

**Principio clave:**  
Ningún componente espera a que el anterior termine.

---

## Flujo de Datos

1. El cliente captura audio y lo envía en **chunks pequeños (20–50 ms)**.
2. El backend reenvía el audio a un **STT en streaming**.
3. El STT emite **transcripciones parciales**.
4. Las transcripciones parciales se envían inmediatamente al **LLM en modo streaming**.
5. El LLM produce tokens incrementales.
6. Los tokens se agrupan mínimamente y se envían al **TTS incremental**.
7. El TTS devuelve audio en streaming.
8. El backend envía el audio al cliente sin esperar el mensaje completo.

---

## Stack Tecnológico (propuesto)

### Frontend

- React
- Web Audio API
- WebSocket nativo

### Backend

- Node.js (proceso persistente)
- WebSocket (sin REST intermedio)
- Event-driven architecture

### IA (intercambiable)

- STT con soporte de streaming parcial
- LLM con input/output incremental
- TTS con generación de audio en streaming

> Los proveedores son intercambiables siempre que **cumplan contratos de streaming real**.

---

## Principios de Diseño

- **Streaming first**: todo es incremental
- **Sin await secuencial**
- **Estado en memoria**
- **Baja latencia percibida > precisión**
- **Procesos siempre vivos (no serverless)**

---

## Limitaciones Conocidas

- Turn-taking básico
- Sin cancelación avanzada (barge-in limitado)
- Latencia variable según proveedor de IA
- No apto para producción

Estas limitaciones son aceptadas por tratarse de un **MVP experimental**.

---

## Objetivo del Aprendizaje

Este proyecto busca responder:

- ¿Qué tan cerca se puede llegar a una experiencia tipo Vapi?
- ¿Dónde aparece la latencia real?
- ¿Qué partes son arquitectónicas y no de modelo?
- ¿Qué complejidad es razonable asumir en un proyecto propio?

---

## Estado del Proyecto

🚧 En desarrollo / experimental

---

## Disclaimer

Este proyecto **no intenta competir ni replicar plataformas comerciales**.  
Es una prueba técnica para comprender los límites reales del streaming speech-to-speech.

---

## Licencia

MIT
