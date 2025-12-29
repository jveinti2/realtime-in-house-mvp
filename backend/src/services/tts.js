import { OpenAITTSAdapter } from "../adapters/tts/openai-tts.js";

export class TTSService {
  constructor() {
    this.adapter = null;
  }

  async initialize() {
    if (!this.adapter) {
      this.adapter = new OpenAITTSAdapter();
    }
    await this.adapter.initialize();
  }

  async *synthesizeStream(text) {
    for await (const chunk of this.adapter.synthesizeStream(text)) {
      yield chunk;
    }
  }

  async close() {
    await this.adapter.close();
  }
}

export default new TTSService();
