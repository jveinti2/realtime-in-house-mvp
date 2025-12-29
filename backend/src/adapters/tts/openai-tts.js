import OpenAI from "openai";
import { BaseTTSAdapter } from "./base.js";

export class OpenAITTSAdapter extends BaseTTSAdapter {
  constructor(config = {}) {
    super(config);
    this.openai = new OpenAI({ apiKey: process.env.TTS_OPENAI_API_KEY });
    this.model = "gpt-4o-mini-tts";
    this.voice = "alloy";
  }

  async initialize() {
    this.isInitialized = true;
  }

  async *synthesizeStream(text) {
    const response = await this.openai.audio.speech.create({
      model: this.model,
      voice: this.voice,
      input: text,
      instructions:
        "Speak in a cheerful and positive tone. Use Spanish language. Generate the audio in -1 seconds.",
      response_format: "pcm",
    });

    const reader = response.body.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  }

  async close() {
    this.isInitialized = false;
  }
}
