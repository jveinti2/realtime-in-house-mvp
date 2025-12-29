import { defineAgent, WorkerOptions, cli, voice } from '@livekit/agents';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as silero from '@livekit/agents-plugin-silero';
import * as openai from '@livekit/agents-plugin-openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config();

export default defineAgent({
  prewarm: async (proc) => {
    proc.userData.vad = await silero.VAD.load();
  },
  entry: async (ctx) => {
    const vad = ctx.proc.userData.vad;

    const session = new voice.AgentSession({
      vad,
      stt: new deepgram.STT({
        model: 'nova-2',
        language: 'es',
      }),
      llm: new openai.LLM({
        model: 'gpt-4o-mini',
      }),
      tts: new openai.TTS({
        model: 'tts-1',
        voice: 'alloy',
      }),
    });

    const agent = new voice.Agent({
      instructions: 'Eres un asistente de voz amigable. Responde en español de forma concisa.',
    });

    await session.start({
      room: ctx.room,
      agent,
    });

    await ctx.connect();

    session.on('user_started_speaking', () => {
      console.log('🎤 Usuario empezó a hablar');
    });

    session.on('user_stopped_speaking', () => {
      console.log('🔇 Usuario dejó de hablar');
    });

    session.on('agent_started_speaking', () => {
      console.log('🤖 Agente empezó a responder');
    });

    session.on('agent_stopped_speaking', () => {
      console.log('✅ Agente terminó de responder');
    });
  },
});

cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }));
