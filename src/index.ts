#!/usr/bin/env node

import meow from '@dylanarmstrong/meow';

import App from './app.js';
import { data as dataPath } from './utils/paths.js';

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
    * WanderingInn

  Examples:
    $ fic-gen -c cf_clearance=123 https://www.fanfiction.net/s/12345/1/story-title

  Required:
    url                   the url to retrieve

  Options:
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
    helpIndent: 0,
    importMeta: import.meta,
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
const { initialize } = flags;

if (help) {
  cli.showHelp();
}

if (version) {
  cli.showVersion();
}

if (!url) {
  // eslint-disable-next-line no-console
  console.error('Please add the URL that you are trying to retrieve.');
  cli.showHelp();
}

(async () => {
  new App({
    agent,
    cache,
    cookie,
    debugMode: debug,
    initialize,
    outputPath,
    url,
  });
})();
