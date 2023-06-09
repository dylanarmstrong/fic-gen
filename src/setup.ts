import decompress from 'decompress';
import { got } from 'got';
import os from 'node:os';
import { createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';

import { curlHome as curlHomePath } from './utils/paths.js';
import { debug } from './utils/log.js';

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

const setup = async (): Promise<boolean> => {
  const platform = getPlatform();
  const arch = getArch();
  if (platform === null || arch === null) {
    return false;
  }
  const version = 'v0.5.4';
  const url = `https://github.com/lwthiker/curl-impersonate/releases/download/${version}/curl-impersonate-${version}.${arch}-${platform}.tar.gz`;
  const destName = join(os.tmpdir(), 'curl.tar.gz');
  debug(`Downloading ${url} to ${destName}`);
  await pipeline(got.stream(url), createWriteStream(destName));
  await decompress(destName, curlHomePath);
  return false;
};

export { setup };
