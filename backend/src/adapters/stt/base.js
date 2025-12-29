export class BaseSTTAdapter {
  constructor(config = {}) {
    if (this.constructor === BaseSTTAdapter) {
      throw new Error('BaseSTTAdapter es una clase abstracta y no puede ser instanciada directamente');
    }
    this.config = config;
    this.isInitialized = false;
  }

  async initialize() {
    throw new Error('El método initialize() debe ser implementado por la subclase');
  }

  async transcribeChunk(audioBuffer) {
    throw new Error('El método transcribeChunk() debe ser implementado por la subclase');
  }

  async close() {
    throw new Error('El método close() debe ser implementado por la subclase');
  }
}
