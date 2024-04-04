type Config = {
  agent: string;
  cache: boolean;
  cookie: string;
  debugMode: boolean;
  initialize: boolean;
  outputPath: string;
  setup: boolean;
  url: string;
};

type Log = (
  level: 'debug' | 'error' | 'info' | 'warn',
  ...message: unknown[]
) => void;

export type { Config, Log };
