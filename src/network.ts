import defaults from 'defaults';
import md5 from 'md5';
import mime from 'mime-types';
import { access, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { exec as execSync } from 'node:child_process';
import { extname, join } from 'node:path';
import { promisify } from 'node:util';

import type { Config, Log } from './types.js';
import { cache as cachePath, curl as curlPath } from './utils/paths.js';

const exec = promisify(execSync);

// TODO: Should cache be split into a story / chapter
const getCachePath = (url: URL) => {
  const { href, pathname, protocol } = url;
  let ext = extname(pathname);
  if (protocol === 'data:') {
    const split = pathname.split(';');
    if (split.length > 0) {
      const newExt = mime.extension(split[0]);
      if (newExt) {
        ext = `.${newExt}`;
      }
    }
  }
  const filename = `${md5(href)}${ext}`;
  return join(cachePath, filename);
};

const getCache = async (file: string) => {
  try {
    await access(file, constants.R_OK);
    return String(await readFile(file));
  } catch (e) {
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
