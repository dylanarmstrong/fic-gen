import defaults from 'defaults';
import { constants } from 'node:fs';
import { access, mkdir } from 'node:fs/promises';

import write from './output/epub.js';
import { setup } from './setup.js';
import { ArchiveOfOurOwn } from './sites/archiveofourown.js';
import { BoxNovel } from './sites/boxnovel.js';
import { FanFiction } from './sites/fanfiction.js';
import { RoyalRoad } from './sites/royalroad.js';
import { WanderingInn } from './sites/wanderinginn.js';
import { WeTried } from './sites/wetried.js';
import { Xenforo } from './sites/xenforo.js';
import {
  cache as cachePath,
  curlHome as curlHomePath,
  curl as curlPath,
} from './utils/paths.js';

import type { Config } from './types.js';

const sites = Object.freeze([
  ArchiveOfOurOwn,
  BoxNovel,
  FanFiction,
  RoyalRoad,
  WanderingInn,
  WeTried,
  Xenforo,
]);

const defaultConfig = {
  agent: '',
  cache: true,
  cookie: '',
  debugMode: false,
  initialize: false,
  outputPath: '',
  url: '',
};

const hasCode = (error: unknown): error is { code: string } =>
  Object.hasOwnProperty.call(error, 'code') &&
  typeof (error as { code: unknown }).code === 'string';

class App {
  config: Required<Config>;

  constructor(partialConfig: Partial<Config>) {
    this.config = defaults(partialConfig, defaultConfig);
    this.log = this.log.bind(this);

    this.initialize().then(() => this.writeFic());
  }

  log(level: 'debug' | 'error' | 'info' | 'warn', ...message: unknown[]) {
    if (level !== 'debug' || (level === 'debug' && this.config.debugMode)) {
      // eslint-disable-next-line no-console
      console[level](...message);
    }
  }

  async writeFic() {
    const site = sites
      .map((SpecificSite) => new SpecificSite(this.config, this.log))
      .find((_site) => _site.isValidSite());

    if (site) {
      const fic = await site.getFic();
      if (fic) {
        await write(fic, this.config, this.log);
      }
    }
  }

  async initialize() {
    let { initialize } = this.config;
    try {
      await access(curlPath, constants.R_OK | constants.X_OK);
    } catch {
      initialize = true;
    }

    // Don't download without user explicitly okaying it
    if (initialize && !this.config.setup) {
      throw new Error(
        `Please run with --setup to automatically download the latest release from 'https://github.com/lwthiker/curl-impersonate/releases' to '${curlHomePath}'`,
      );
    }

    if (initialize) {
      try {
        await mkdir(curlHomePath);
      } catch (error) {
        // If directory already exists, that's fine
        if ((hasCode(error) && error.code !== 'EEXIST') || !hasCode(error)) {
          throw new Error(
            `Unable to create curl-impersonate directory at '${curlHomePath}'`,
          );
        }
      }
      this.log('info', `Downloading curl-impersonate to ${curlHomePath}`);
      await setup(this.log);
    }

    try {
      await access(curlPath, constants.R_OK | constants.X_OK);
    } catch {
      throw new Error(
        `curl does not exist or is not executable at '${curlPath}'`,
      );
    }

    const { outputPath } = this.config;
    try {
      try {
        await access(outputPath, constants.W_OK);
      } catch {
        await mkdir(outputPath);
      }
    } catch {
      throw new Error(`Cannot make data directory at '${outputPath}'`);
    }

    try {
      try {
        await access(cachePath, constants.W_OK);
      } catch {
        await mkdir(cachePath);
      }
    } catch {
      throw new Error(`Cannot make cache directory at '${cachePath}'`);
    }
  }
}

export default App;
