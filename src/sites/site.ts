import defaults from 'defaults';
import type { AnyNode, Cheerio, CheerioAPI } from 'cheerio';

import loadHtml from '../utils/loadHtml.js';
import loadImage from '../utils/loadImage.js';
import { curl } from '../network.js';

type Author = {
  text: string;
  url: string | null;
};

type Chapter = {
  chapter: number;
  text: string | null;
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
  cover: URL | null;
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
  cookie: string;
  images: string[];
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
  ): Promise<string | null>;
  getChapterTitle($chapter: CheerioAPI): string;
  getChapterWords(content: string | null): number;
  getCover($chapter: CheerioAPI): Promise<URL | null>;
  getDescription($chapter: CheerioAPI): string;
  getFic(): Promise<Fic | null>;
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
  transformChapter($content: Cheerio<AnyNode>): Cheerio<AnyNode>;
  transformImages($content: Cheerio<AnyNode>): Promise<Cheerio<AnyNode>>;
}

const defaultChapterOptions = {
  checkCache: true,
  checkValidity: true,
} as const;

abstract class Site implements ISite {
  cookie = '';
  images: string[] = [];
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

  constructor(url: string, cookie = '') {
    this.cookie = cookie;
    this.url = new URL(url);
  }

  abstract getFic(): Promise<Fic | null>;

  getAuthor($chapter: CheerioAPI) {
    const link = $chapter(this.selectors.author);
    return {
      text: link.text().trim(),
      url: link.attr('href')?.trim() || '',
    };
  }

  async getChapter(url: URL, chapterOptions: GetChapterOptions = {}) {
    const { checkCache, checkValidity }: Required<GetChapterOptions> = defaults(
      chapterOptions,
      defaultChapterOptions,
    );

    const [chapter] = await curl(url, {
      append: this.options,
      cache: checkCache,
    });

    if (!checkValidity || (checkValidity && this.isValidChapter(chapter))) {
      return chapter;
    }

    return null;
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

  async getCover($chapter: CheerioAPI) {
    const src = $chapter(this.selectors.cover).attr('src');
    if (!src) {
      return null;
    }

    try {
      return new URL(src);
    } catch (e) {
      return null;
    }
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
    if (this.url.host.match(this.matcher)) {
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
      this.transformChapter($chapter(this.selectors.chapter)),
    );
    const text = $content.html();
    return {
      chapter: chapterNumber,
      text,
      title: this.getChapterTitle($chapter),
      url: url.href,
      words: this.getChapterWords(text),
    };
  }

  transformChapter($content: Cheerio<AnyNode>) {
    return $content;
  }

  async transformImages($content: Cheerio<AnyNode>) {
    const ps: Promise<string | null>[] = [];
    $content.find('img').each((_, img) => {
      ps.push(loadImage(img));
    });
    await Promise.all(ps).then((imgs) =>
      imgs.forEach((img) => img !== null && this.images.push(img)),
    );
    return $content;
  }
}

export type { Chapter, Fic };
export { Site };
