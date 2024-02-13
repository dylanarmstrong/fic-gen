import decompress from 'decompress';
import os from 'node:os';
import { createWriteStream } from 'node:fs';
import { got } from 'got';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';

import type { Log } from './types.js';
import { curlHome as curlHomePath } from './utils/paths.js';

const getPlatform = (): string | null => {
  const { platform } = process;
  switch (platform) {
    case 'darwin':
      return 'macos';
    case 'linux':
      return 'linux';
    default:
      return null;
  }
};

const getArch = (): string | null => {
  const { arch } = process;
  switch (arch) {
    case 'x64':
      return 'x86_64';
    case 'arm64':
      return 'aarch64';
    default:
      return null;
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

  const version = 'v0.5.4';
  const url = `https://github.com/lwthiker/curl-impersonate/releases/download/${version}/curl-impersonate-${version}.${arch}-${platform}.tar.gz`;
  const destName = join(os.tmpdir(), 'curl.tar.gz');
  log('debug', `Downloading ${url} to ${destName}`);
  await pipeline(got.stream(url), createWriteStream(destName));
  await decompress(destName, curlHomePath);
};

export { setup };
