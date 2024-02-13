import defaults from 'defaults';
import { access, mkdir } from 'node:fs/promises';
import { constants } from 'node:fs';

import write from './output/epub.js';
import {
  cache as cachePath,
  curl as curlPath,
  curlHome as curlHomePath,
} from './utils/paths.js';
import ArchiveOfOurOwn from './sites/archiveofourown.js';
import BoxNovel from './sites/boxnovel.js';
import FanFiction from './sites/fanfiction.js';
import RoyalRoad from './sites/royalroad.js';
import WanderingInn from './sites/wanderinginn.js';
import Xenforo from './sites/xenforo.js';
import type { Config } from './types.js';
import { setup } from './setup.js';

const sites = Object.freeze([
  ArchiveOfOurOwn,
  BoxNovel,
  FanFiction,
  RoyalRoad,
  WanderingInn,
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

const hasCode = (e: unknown): e is { code: string } =>
  Object.hasOwnProperty.call(e, 'code') &&
  typeof (e as { code: unknown }).code === 'string';

class App {
  config: Required<Config>;

  constructor(partialConfig: Partial<Config>) {
    this.config = defaults(partialConfig, defaultConfig);
    this.log = this.log.bind(this);

    this.initialize().then(() => this.writeFic());
  }

  log(level: 'debug' | 'error' | 'info' | 'warn', ...msg: unknown[]) {
    if (level !== 'debug' || (level === 'debug' && this.config.debugMode)) {
      // eslint-disable-next-line no-console
      console[level](...msg);
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
      this.log('info', `Downloading curl-impersonate to ${curlHomePath}`);
      await setup(this.log);
    }

    try {
      await access(curlPath, constants.R_OK | constants.X_OK);
    } catch {
      throw new Error(
        `curl does not exist or is not executable at ${curlPath}`,
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
  }
}

export default App;
