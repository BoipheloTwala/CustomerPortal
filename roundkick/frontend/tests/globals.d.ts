/// <reference types="node" />

declare global {
  namespace NodeJS {
    interface Global {
      localStorage: Storage;
      sessionStorage: Storage;
      crypto: Crypto;
      Headers: typeof Headers;
    }
  }
}

export {};

