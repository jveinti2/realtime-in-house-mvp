export class BaseTTSAdapter {
  constructor(config = {}) {
    if (this.constructor === BaseTTSAdapter) {
      throw new Error("BaseTTSAdapter es una clase abstracta");
    }
    this.config = config;
    this.isInitialized = false;
  }

  async initialize() {
    throw new Error("initialize() debe ser implementado");
  }

  async *synthesizeStream(text) {
    throw new Error("synthesizeStream() debe ser implementado");
  }

  async close() {
    throw new Error("close() debe ser implementado");
  }
}
