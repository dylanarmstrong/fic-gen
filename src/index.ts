#!/usr/bin/env node

import { ArgumentParser, RawTextHelpFormatter } from 'argparse';
import { access, mkdir } from 'node:fs/promises';
import { constants } from 'node:fs';

import ArchiveOfOurOwn from './sites/archiveofourown.js';
import BoxNovel from './sites/boxnovel.js';
import FanFiction from './sites/fanfiction.js';
import RoyalRoad from './sites/royalroad.js';
import Xenforo from './sites/xenforo.js';
import {
  cache as cachePath,
  curl as curlPath,
  data as dataPath,
} from './utils/paths.js';
import write from './output/epub.js';
import { setAgent, setCache, setCookie } from './network.js';
import { setDebugMode } from './utils/debugMode.js';

type Args = {
  agent: string;
  cache: boolean;
  cookie: string;
  debug: boolean;
  outputPath: string;
  url: string;
};

const parser = new ArgumentParser({
  description: `ePub output for online fiction
Supports:
  * ArchiveOfOurOwn
  * BoxNovel
  * FanFiction
  * RoyalRoad
  * SpaceBattles`,
  // eslint-disable-next-line camelcase
  formatter_class: RawTextHelpFormatter,
});

parser.add_argument('-a', '--agent', {
  default:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Safari/605.1.15',
  help: 'the user agent for curl',
  type: String,
});
parser.add_argument('-c', '--cookie', {
  help: 'cookie to pass to curl',
  type: String,
});
parser.add_argument('-d', '--debug', {
  action: 'store_const',
  const: true,
  default: false,
  help: 'enable debug output',
});
parser.add_argument('--no-cache', {
  action: 'store_const',
  const: false,
  default: true,
  dest: 'cache',
  help: 'disable cache',
});
parser.add_argument('-o', '--output', {
  default: dataPath,
  dest: 'outputPath',
  help: 'the output directory',
  type: String,
});
parser.add_argument('-v', '--version', { action: 'version', version: '0.0.1' });
parser.add_argument('url', { help: 'the url to retrieve', type: String });
const args: Args = parser.parse_args();

const { agent, cache, cookie, debug, outputPath, url } = args;

(async () => {
  setAgent(agent);
  setCache(cache);
  setCookie(cookie);
  setDebugMode(debug);

  try {
    await access(curlPath, constants.R_OK | constants.X_OK);
  } catch {
    throw new Error(`curl does not exist or is not executable at ${curlPath}`);
  }

  try {
    try {
      await access(outputPath, constants.W_OK);
    } catch {
      await mkdir(outputPath);
    }
  } catch {
    throw new Error(`Cannot make data directory at ${outputPath}`);
  }

  try {
    try {
      await access(cachePath, constants.W_OK);
    } catch {
      await mkdir(cachePath);
    }
  } catch {
    throw new Error(`Cannot make cache directory at ${cachePath}`);
  }

  const site = [
    new ArchiveOfOurOwn(url, cookie),
    new BoxNovel(url, cookie),
    new FanFiction(url, cookie),
    new RoyalRoad(url, cookie),
    new Xenforo(url, cookie),
  ].find((_site) => _site.isValidSite());

  if (site) {
    const fic = await site.getFic();
    if (fic) {
      await write(fic, outputPath);
    } else {
      throw new Error('Unable to write fic');
    }
  } else {
    throw new Error('Unsupported site');
  }
})();
