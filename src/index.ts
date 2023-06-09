#!/usr/bin/env node

import { access, mkdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import meow from 'meow';

import ArchiveOfOurOwn from './sites/archiveofourown.js';
import BoxNovel from './sites/boxnovel.js';
import FanFiction from './sites/fanfiction.js';
import RoyalRoad from './sites/royalroad.js';
import Xenforo from './sites/xenforo.js';
import {
  cache as cachePath,
  curl as curlPath,
  curlHome as curlHomePath,
  data as dataPath,
} from './utils/paths.js';
import write from './output/epub.js';
import { error, log } from './utils/log.js';
import { setAgent, setCache, setCookie } from './network.js';
import { setDebugMode } from './utils/debugMode.js';
import { setup } from './setup.js';

const cli = meow(
  `
  Usage:
    $ fic-gen url

  Supports:
    * ArchiveOfOurOwn
    * BoxNovel
    * FanFiction
    * RoyalRoad
    * SpaceBattles

  required argument:
    url                   the url to retrieve

  optional arguments:
    -h, --help            show this help message and exit
    -a, --agent  <agent>
                          the user agent for curl
    -c, --cookie <cookie>
                          cookie to pass to curl
    -d, --debug           enable debug output
    --no-cache            disable cache
    -o, --output <output path>
                          the output directory
    -v, --version         show program's version number and exit`,
  {
    allowUnknownFlags: false,
    flags: {
      agent: {
        default:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
        shortFlag: 'a',
        type: 'string',
      },
      cache: {
        default: true,
        shortFlag: 'c',
        type: 'boolean',
      },
      cookie: {
        default: '',
        shortFlag: 'c',
        type: 'string',
      },
      debug: {
        default: false,
        shortFlag: 'd',
        type: 'boolean',
      },
      help: {
        default: false,
        shortFlag: 'h',
        type: 'boolean',
      },
      initialize: {
        default: false,
        shortFlag: 'i',
        type: 'boolean',
      },
      output: {
        default: dataPath,
        shortFlag: 'o',
        type: 'string',
      },
      version: {
        default: false,
        shortFlag: 'v',
        type: 'boolean',
      },
    },
    importMeta: import.meta,
    // Requires: https://github.com/sindresorhus/meow/pull/241
    // indent: 0,
  },
);

const { flags, input } = cli;
const [url] = input;
const {
  agent,
  cache,
  cookie,
  debug,
  help,
  output: outputPath,
  version,
} = flags;
let { initialize } = flags;

if (help) {
  cli.showHelp();
}

if (version) {
  cli.showVersion();
}

if (!url) {
  error('Please add the URL that you are trying to retrieve.');
  cli.showHelp();
}

const hasCode = (e: unknown): e is { code: string } =>
  Object.hasOwnProperty.call(e, 'code') &&
  typeof (e as { code: unknown }).code === 'string';

(async () => {
  setAgent(agent);
  setCache(cache);
  setCookie(cookie);
  setDebugMode(debug);

  try {
    await access(curlPath, constants.R_OK | constants.X_OK);
  } catch {
    initialize = true;
  }

  if (initialize) {
    try {
      await mkdir(curlHomePath);
    } catch (e) {
      // If directory already exists, that's fine
      if ((hasCode(e) && e.code !== 'EEXIST') || !hasCode(e)) {
        throw new Error(
          `Unable to create curl-impersonate directory at ${curlHomePath}`,
        );
      }
    }
    log(`Downloading curl-impersonate to ${curlHomePath}`);
    await setup();
  }

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
