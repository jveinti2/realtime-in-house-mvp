import { OpenAIGPT4Adapter } from "../adapters/llm/openai-gpt4o.js";

export class LLMService {
  constructor() {
    this.adapter = null;
  }

  async initialize() {
    if (!this.adapter) {
      this.adapter = new OpenAIGPT4Adapter();
    }
    await this.adapter.initialize();
  }

  async *generateStream(prompt) {
    for await (const token of this.adapter.generateStream(prompt)) {
      yield token;
    }
  }

  async close() {
    await this.adapter.close();
  }
}

export default new LLMService();
