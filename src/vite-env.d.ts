/// <reference types="vite/client" />

interface Window {
  puter?: {
    ai?: {
      txt2speech: (text: string, options?: {
        engine?: "standard" | "neural" | "generative";
        language?: string;
        voice?: string;
      }) => Promise<HTMLAudioElement>;
    };
  };
}
