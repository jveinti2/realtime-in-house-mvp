import { defineAgent, WorkerOptions, cli, voice } from "@livekit/agents";
import * as deepgram from "@livekit/agents-plugin-deepgram";
import * as silero from "@livekit/agents-plugin-silero";
import * as openai from "@livekit/agents-plugin-openai";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

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
        model: "nova-2",
        language: "es",
      }),
      llm: new openai.LLM({
        model: "gpt-4o-mini",
      }),
      tts: new openai.TTS({
        model: "tts-1",
        voice: "alloy",
      }),
    });

    const agent = new voice.Agent({
      instructions:
        "Eres un asistente de voz amigable. Responde en español de forma concisa.",
    });

    await session.start({
      room: ctx.room,
      agent,
      outputOptions: {
        transcriptionEnabled: true,
      },
    });

    await ctx.connect();

    // Solo logs para debugging - transcripciones van automáticamente al frontend via useTranscriptions
    session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (ev) => {
      const { role, content } = ev.item;
      console.log(`${role === "user" ? "📝 Usuario" : "🤖 Agente"}: ${content}`);
    });
  },
});

cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }));
