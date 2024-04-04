import { Fic, Site } from './site.js';
import loadHtml from '../utils/load-html.js';

import type { CheerioAPI } from 'cheerio';

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

  async getFic(): Promise<Fic | undefined> {
    let chapter = await this.getIndex(this.url);
    if (chapter) {
      let $chapter = loadHtml(chapter);
      const chapters = [await this.parseChapter($chapter, 1, this.url)];
      const byline = $chapter('#profile_top .xgray.xcontrast_txt')
        .text()
        .trim();
      const numberOfChapters = Number.parseInt(
        byline.replace(/.*Chapters: (\d*) .*$/, '$1'),
      );

      const author = this.getAuthor($chapter);
      const description = this.getDescription($chapter);
      const tags = this.getTags($chapter);
      const title = this.getStoryTitle($chapter);
      const words = this.getWords($chapter);
      const cover = await this.getCover($chapter);

      if (!Number.isNaN(numberOfChapters)) {
        for (
          let index = 2, length = numberOfChapters + 1;
          index < length;
          index++
        ) {
          const spl = this.url.href.split('/');
          spl[spl.length - 2] = String(index);
          const nextChapter = spl.join('/');
          const next = this.url;
          next.href = nextChapter;
          chapter = await this.getChapter(next);
          if (chapter) {
            $chapter = loadHtml(chapter);
            const parsedChapter = await this.parseChapter(
              $chapter,
              index,
              next,
            );
            chapters.push(parsedChapter);
          } else {
            this.log('error', `Chapter: ${next.href} is null`);
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

    this.log('error', `Chapter: ${this.url.href} is null`);
    return undefined;
  }

  override getAuthor($chapter: CheerioAPI) {
    const link = $chapter(this.selectors.author);
    return {
      text: link.text().trim(),
      url: `https://www.fanfiction.net${link.attr('href')?.trim() || ''}`,
    };
  }

  override async getCover($chapter: CheerioAPI): Promise<URL | undefined> {
    const source = $chapter(this.selectors.cover).attr('src');
    if (!source) {
      return undefined;
    }

    try {
      return new URL(`https://www.fanfiction.net${source}/cover.jpg`);
    } catch {
      // Pass
    }
    return undefined;
  }
}

export { FanFiction };
