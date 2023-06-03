import type { CheerioAPI } from 'cheerio';

import loadHtml from '../utils/loadHtml.js';
import { Site } from './site.js';
import { error } from '../utils/log.js';

class FanFiction extends Site {
  override matcher = /^www.fanfiction.net/;
  override options = '';
  override publisher = 'FanFiction';
  override selectors = {
    author: '#profile_top a:not([title]):not([target])',
    chapter: '#storytext',
    chapterTitle: 'h1.font-white',
    cover: '#profile_top img',
    description: '#profile_top .xcontrast_txt:nth-child(8)',
    storyTitle: 'b.xcontrast_txt',
  };

  constructor(url: string, cookie?: string) {
    super(url, cookie);
  }

  async getFic() {
    let chapter = await this.getIndex(this.url);
    if (chapter === null) {
      error(`Chapter: ${this.url.href} is null`);
      return null;
    }

    let $chapter = loadHtml(chapter);
    const chapters = [await this.parseChapter($chapter, 1, this.url)];
    const byline = $chapter('#profile_top .xgray.xcontrast_txt').text().trim();
    const numberOfChapters = Number.parseInt(
      byline.replace(/.*Chapters: ([0-9]*) .*$/, '$1'),
    );

    const author = this.getAuthor($chapter);
    const description = this.getDescription($chapter);
    const tags = this.getTags($chapter);
    const title = this.getStoryTitle($chapter);
    const words = this.getWords($chapter);
    const cover = await this.getCover($chapter);

    if (!Number.isNaN(numberOfChapters)) {
      for (let i = 2, len = numberOfChapters + 1; i < len; i++) {
        const spl = this.url.href.split('/');
        spl[spl.length - 2] = String(i);
        const nextChapter = spl.join('/');
        const next = this.url;
        next.href = nextChapter;
        chapter = await this.getChapter(next);
        if (chapter !== null) {
          $chapter = loadHtml(chapter);
          const parsedChapter = await this.parseChapter($chapter, i, next);
          chapters.push(parsedChapter);
        } else {
          error(`Chapter: ${next.href} is null`);
        }
      }
    }

    return {
      author,
      chapters,
      cover,
      description,
      id: this.url.pathname.split('/')[2],
      images: this.images,
      published: '',
      publisher: this.publisher,
      tags,
      title,
      updated: '',
      words,
    };
  }

  override getAuthor($chapter: CheerioAPI) {
    const link = $chapter(this.selectors.author);
    return {
      text: link.text().trim(),
      url: `https://www.fanfiction.net${link.attr('href')?.trim() || ''}`,
    };
  }

  override async getCover($chapter: CheerioAPI) {
    const src = $chapter(this.selectors.cover).attr('src');
    if (!src) {
      return null;
    }

    try {
      return new URL(`https://www.fanfiction.net${src}/cover.jpg`);
    } catch (e) {
      return null;
    }
  }
}

export default FanFiction;
