#!/usr/bin/env node
/**
 * TODO
 *
 * Retry for failing curl
 * Image should have cache so they can point to same download
 * Path to curl should be moved to XDG_DATA_HOME
 *
 * Site Support:
 * Xenforo General
 * Fictionpress
 *
 */

import { ArgumentParser, RawTextHelpFormatter } from 'argparse';
import { access, mkdir } from 'fs/promises';
import { constants } from 'fs';

import ArchiveOfOurOwn from './sites/archiveofourown.js';
import FanFiction from './sites/fanfiction.js';
import RoyalRoad from './sites/royalroad.js';
import Xenforo from './sites/xenforo.js';
import dataPath from './utils/dataPath.js';
import write from './output/epub.js';
import { curlPath, setAgent, setCookie } from './network.js';
import { setDebugMode } from './utils/debugMode.js';

type Args = {
  agent: string;
  cookie: string;
  debug: boolean;
  outputPath: string;
  url: string;
};

const parser = new ArgumentParser({
  description: `ePub output for online fiction
Supports:
  * ArchiveOfOurOwn
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
parser.add_argument('-o', '--output', {
  default: dataPath,
  dest: 'outputPath',
  help: 'the output directory',
  type: String,
});
parser.add_argument('-v', '--version', { action: 'version', version: '0.0.1' });
parser.add_argument('url', { help: 'the url to retrieve', type: String });
const args: Args = parser.parse_args();

const { agent, cookie, debug, outputPath, url } = args;

(async () => {
  setAgent(agent);
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
    throw new Error(`Cannot make output directory at ${outputPath}`);
  }

  const site = [
    new ArchiveOfOurOwn(url, cookie),
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
