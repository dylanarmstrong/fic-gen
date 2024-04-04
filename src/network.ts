import defaults from 'defaults';
import md5 from 'md5';
import mime from 'mime-types';
import { exec as execSync } from 'node:child_process';
import { constants } from 'node:fs';
import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { cache as cachePath, curl as curlPath } from './utils/paths.js';

import type { Config, Log } from './types.js';

const exec = promisify(execSync);

// TODO: Should cache be split into a story / chapter
const getCachePath = (url: URL) => {
  const { href, pathname, protocol } = url;
  let extension = path.extname(pathname);
  if (protocol === 'data:') {
    const split = pathname.split(';');
    if (split.length > 0) {
      const newExtension = mime.extension(split[0]);
      if (newExtension) {
        extension = `.${newExtension}`;
      }
    }
  }
  const filename = `${md5(href)}${extension}`;
  return path.join(cachePath, filename);
};

const getCache = async (file: string) => {
  try {
    await access(file, constants.R_OK);
    return String(await readFile(file));
  } catch {
    // Skip
  }
  return '';
};

type CurlOptions = Partial<{
  append: string;
  cache: boolean;
}>;

const defaultCurlOptions: Required<CurlOptions> = {
  append: '',
  cache: true,
};

// cookie is the cf_clearance cookie
const curl = async (
  url: URL,
  config: Config,
  log: Log,
  _options?: CurlOptions,
): Promise<[string, string]> => {
  const { agent, cache, cookie } = config;

  const options: Required<CurlOptions> = defaults(
    _options || {},
    defaultCurlOptions,
  );

  const { href } = url;
  const cacheFile = getCachePath(url);
  if (options.cache && cache) {
    const cached = await getCache(cacheFile);
    if (cached !== '') {
      log('debug', `Cache hit for ${href} at ${cacheFile}`);
      return [cached, cacheFile];
    }
    log('debug', `Cache miss for ${href}`);
  } else {
    log('debug', `Skip cache for ${href}`);
  }

  if (url.protocol === 'data:') {
    const matched = url.pathname.match(/^.*?;base64,(.*)$/);
    if (!matched) {
      return ['', cacheFile];
    }
    const data = Buffer.from(matched[1], 'base64');
    writeFile(cacheFile, data);
    log('debug', `Decoded base64 for ${href}`);
    return [String(data), cacheFile];
  }

  const cmd = `${curlPath} -A '${agent}'${
    cookie ? ` -H 'Cookie: ${cookie}'` : ''
  } -s -o "${cacheFile}" -L ${options.append} -- "${url}"`;

  log('debug', cmd);

  const { stderr } = await exec(cmd);
  if (stderr) {
    log('error', stderr);
  }

  return [await getCache(cacheFile), cacheFile];
};

export { curl, getCachePath };
