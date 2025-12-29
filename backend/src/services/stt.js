import { OpenAIRealtimeAdapter } from "../adapters/stt/openai-realtime.js";
import { DeepgramAdapter } from "../adapters/stt/deepgram.js";

export class STTService {
  constructor(adapterType = "deepgram", config = {}) {
    this.adapterType = adapterType;
    this.config = config;
    this.adapter = null;
    this.isInitialized = false;
  }

  createAdapter() {
    switch (this.adapterType) {
      case "openai-realtime":
        return new OpenAIRealtimeAdapter(this.config);
      case "deepgram":
        return new DeepgramAdapter(this.config);
      default:
        throw new Error(`Adaptador STT desconocido: ${this.adapterType}`);
    }
  }

  async initialize() {
    if (this.isInitialized) {
      console.log("⚠️  STT Service ya está inicializado");
      return;
    }

    this.adapter = this.createAdapter();
    await this.adapter.initialize();
    this.isInitialized = true;

    console.log(
      `✅ STT Service inicializado con adaptador: ${this.adapterType}`
    );
  }

  onTranscription(callback) {
    if (!this.adapter) {
      throw new Error("STT Service no está inicializado");
    }
    this.adapter.onTranscription(callback);
  }

  async transcribeChunk(audioChunk) {
    if (!this.isInitialized || !this.adapter) {
      throw new Error(
        "STT Service no está inicializado. Llama a initialize() primero."
      );
    }

    return await this.adapter.transcribeChunk(audioChunk);
  }

  async close() {
    if (this.adapter) {
      await this.adapter.close();
      this.adapter = null;
    }
    this.isInitialized = false;
    console.log("🔌 STT Service cerrado");
  }
}

export default new STTService("deepgram");
