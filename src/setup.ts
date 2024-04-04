import decompress from 'decompress';
import { got } from 'got';
import { createWriteStream } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

import { curlHome as curlHomePath } from './utils/paths.js';

import type { Log } from './types.js';

const getPlatform = (): string | undefined => {
  const { platform } = process;
  switch (platform) {
    case 'darwin': {
      return 'macos';
    }
    case 'linux': {
      return 'linux';
    }
    default: {
      return undefined;
    }
  }
};

const getArch = (): string | undefined => {
  const { arch } = process;
  switch (arch) {
    case 'x64': {
      return 'x86_64';
    }
    case 'arm64': {
      return 'aarch64';
    }
    default: {
      return undefined;
    }
  }
};

const setup = async (log: Log): Promise<void> => {
  const platform = getPlatform();
  const arch = getArch();
  if (platform === null) {
    throw new Error('process.platform is not valid for curl-impersonate');
  }

  if (arch === null) {
    throw new Error('process.arch is not valid for curl-impersonate');
  }

  const version = 'v0.6.0';
  const url = `https://github.com/lwthiker/curl-impersonate/releases/download/${version}/curl-impersonate-${version}.${arch}-${platform}.tar.gz`;
  const destinationName = path.join(os.tmpdir(), 'curl.tar.gz');
  log('debug', `Downloading ${url} to ${destinationName}`);
  await pipeline(got.stream(url), createWriteStream(destinationName));
  await decompress(destinationName, curlHomePath);
};

export { setup };
