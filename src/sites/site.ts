import defaults from 'defaults';
import { accessSync, constants } from 'node:fs';

import { curl, getCachePath } from '../network.js';
import { getPathForEpub } from '../utils/get-path-for-epub.js';
import loadHtml from '../utils/load-html.js';

import type { Config, Log } from '../types.js';
import type { AnyNode, Cheerio, CheerioAPI } from 'cheerio';

type Author = {
  text: string;
  url: string | undefined;
};

type Chapter = {
  chapter: number;
  text: string | undefined;
  title: string;
  url: string;
  words: number;
};

type GetChapterOptions = Partial<{
  checkValidity: boolean;
  checkCache: boolean;
}>;

type Fic = {
  author: Author;
  chapters: Chapter[];
  cover: URL | undefined;
  description: string;
  id: string;
  images: string[];
  published: string;
  publisher: string;
  tags: string[];
  title: string;
  updated: string;
  words: number;
};

interface ISite {
  config: Required<Config>;
  images: string[];
  log: Log;
  matcher: RegExp;
  options: string;
  publisher: string;
  url: URL;

  selectors: {
    author: string;
    chapter: string;
    chapterTitle: string;
    cover: string;
    description: string;
    storyTitle: string;
  };

  getAuthor($chapter: CheerioAPI): Author;
  getChapter(
    url: URL,
    chapterOptions: GetChapterOptions,
  ): Promise<string | undefined>;
  // TODO: getChapterList, refactor getFic to use it
  getChapterTitle($chapter: CheerioAPI): string;
  getChapterWords(content: string | null): number;
  getCover($chapter: CheerioAPI): Promise<URL | undefined>;
  getDescription($chapter: CheerioAPI): string;
  getFic(): Promise<Fic | undefined>;
  getIndex(url: URL): ReturnType<ISite['getChapter']>;
  getNumberOfChapters($chapter: CheerioAPI): number;
  getStoryTitle($chapter: CheerioAPI): string;
  getTags($chapter: CheerioAPI): string[];
  getWords($chapter: CheerioAPI): number;
  isValidChapter(chapter: string): boolean;
  isValidSite(): boolean;
  parseChapter(
    $chapter: CheerioAPI,
    chapterNumber: number,
    url: URL,
  ): Promise<Chapter>;
  transformChapter($chapter: CheerioAPI): CheerioAPI;
  transformContent($content: Cheerio<AnyNode>): Cheerio<AnyNode>;
  transformImages($content: Cheerio<AnyNode>): Promise<Cheerio<AnyNode>>;
}

const defaultChapterOptions = {
  checkCache: true,
  checkValidity: true,
} as const;

abstract class Site implements ISite {
  config: Required<Config>;
  images: string[] = [];
  log: Log;
  matcher = /not going to match/;
  options = '';
  publisher = 'unknown';
  url: URL;

  selectors = {
    author: '.no-element',
    chapter: '.no-element',
    chapterTitle: '.no-element',
    cover: '.no-element',
    description: '.no-element',
    storyTitle: '.no-element',
  };

  constructor(config: Required<Config>, log: Log) {
    this.config = config;
    this.log = log.bind(this);
    this.url = new URL(config.url);
  }

  abstract getFic(): Promise<Fic | undefined>;

  getAuthor($chapter: CheerioAPI) {
    const link = $chapter(this.selectors.author);
    return {
      text: link.text().trim(),
      url: link.attr('href')?.trim() || '',
    };
  }

  async getChapter(
    url: URL,
    chapterOptions: GetChapterOptions = {},
  ): Promise<string | undefined> {
    const { checkCache, checkValidity }: Required<GetChapterOptions> = defaults(
      chapterOptions,
      defaultChapterOptions,
    );

    const [chapter] = await curl(url, this.config, this.log, {
      append: this.options,
      cache: checkCache,
    });

    if (!checkValidity || (checkValidity && this.isValidChapter(chapter))) {
      return chapter;
    }

    return undefined;
  }

  async getIndex(url: URL) {
    return this.getChapter(url, { checkCache: false, checkValidity: false });
  }

  getChapterTitle($chapter: CheerioAPI) {
    return $chapter(this.selectors.chapterTitle).text().trim();
  }

  getChapterWords(content: string | null) {
    return (content || '').split(' ').length;
  }

  async getCover($chapter: CheerioAPI): Promise<URL | undefined> {
    const source = $chapter(this.selectors.cover).attr('src');
    if (!source) {
      return undefined;
    }

    try {
      return new URL(source);
    } catch {
      // Pass
    }

    return undefined;
  }

  getDescription($chapter: CheerioAPI) {
    return $chapter(this.selectors.description).text().trim();
  }

  getNumberOfChapters(_: CheerioAPI) {
    return 0;
  }

  getStoryTitle($chapter: CheerioAPI) {
    return $chapter(this.selectors.storyTitle).text().trim();
  }

  getTags(_: CheerioAPI) {
    return [];
  }

  getWords(_: CheerioAPI) {
    return 0;
  }

  isValidChapter(chapter: string) {
    return loadHtml(chapter)(this.selectors.chapter).length > 0;
  }

  isValidSite() {
    if (this.matcher.test(this.url.host)) {
      return true;
    }
    return false;
  }

  async parseChapter(
    $chapter: CheerioAPI,
    chapterNumber: number,
    url: URL,
  ): Promise<Chapter> {
    const $content = await this.transformImages(
      this.transformContent(
        this.transformChapter($chapter)(this.selectors.chapter),
      ),
    );
    const text = $content.html();
    return {
      chapter: chapterNumber,
      text: text === null ? undefined : text,
      title: this.getChapterTitle($chapter) || `Chapter ${chapterNumber}`,
      url: url.href,
      words: this.getChapterWords(text),
    };
  }

  transformChapter($chapter: CheerioAPI) {
    return $chapter;
  }

  transformContent($content: Cheerio<AnyNode>) {
    return $content;
  }

  async transformImages($content: Cheerio<AnyNode>) {
    const images = $content.find('img').toArray();
    for (let index = 0, { length } = images; index < length; index += 1) {
      const img = images[index];
      const { src } = img.attribs;
      let filepath = '';
      if (src) {
        try {
          const url = new URL(src);
          const filename = await getPathForEpub(getCachePath(url));
          if (filename) {
            img.attribs['alt'] = img.attribs['alt'] || 'image';
            img.attribs['src'] = `../resources/${filename}`;
            [, filepath] = await curl(url, this.config, this.log);
          }
        } catch {
          // Pass
        }
      }

      if (filepath) {
        try {
          accessSync(filepath, constants.R_OK);
          this.images.push(filepath);
        } catch {
          // Pass
        }
      } else {
        img.attribs['src'] = '';
      }
    }
    $content.remove('img[src=""]');
    return $content;
  }
}

export type { Chapter, Fic };
export { Site };
