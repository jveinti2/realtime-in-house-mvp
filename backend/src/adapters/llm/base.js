export class BaseLLMAdapter {
  constructor(config = {}) {
    if (this.constructor === BaseLLMAdapter) {
      throw new Error("BaseLLMAdapter es una clase abstracta");
    }
    this.config = config;
    this.isInitialized = false;
  }

  async initialize() {
    throw new Error("initialize() debe ser implementado");
  }

  async *generateStream(prompt) {
    throw new Error("generateStream() debe ser implementado");
  }

  async close() {
    throw new Error("close() debe ser implementado");
  }
}
