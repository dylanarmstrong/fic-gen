import { Chapter, Fic, Site } from './site.js';
import { curl } from '../network.js';
import loadHtml from '../utils/load-html.js';

import type { CheerioAPI } from 'cheerio';

const hasData = (o: unknown): o is { data: string } =>
  Object.hasOwnProperty.call(o, 'data') &&
  typeof (o as { data: unknown }).data === 'string';

class BoxNovel extends Site {
  override matcher = /^boxnovel.com/;
  override options = '';
  override publisher = 'BoxNovel';
  override selectors = {
    author: '.author-content > a',
    chapter: '.reading-content',
    chapterTitle: '.reading-content p:first-child > strong',
    cover: '.summary_image img',
    description: '#editdescription',
    storyTitle: '.post-title',
  };

  async getFic(): Promise<Fic | undefined> {
    let chapter = await this.getIndex(this.url);
    if (chapter) {
      let $chapter = loadHtml(chapter);
      const chapterUrl = new URL(`${this.url.href}ajax/chapters/`);
      const [chaptersXhr] = await curl(chapterUrl, this.config, this.log, {
        append: `-H "Referer: ${this.url.href}" -H "X-Requested-With: XMLHttpRequest" -X POST`,
        cache: false,
      });
      if (chaptersXhr === null) {
        this.log('error', `Cannot get chapters list from ${chapterUrl.href}`);
        return undefined;
      }
      const $chapters = loadHtml(chaptersXhr);
      const chapters: Chapter[] = [...$chapters('ul.main li a')]
        .map((a, index) => {
          const [child] = a.children;
          return {
            chapter: index + 1,
            text: undefined,
            title: hasData(child) ? child.data : '',
            url: a.attribs['href'],
            words: 0,
          };
        })
        .reverse();

      if (chapters.length === 0) {
        return undefined;
      }

      const author = this.getAuthor($chapter);
      const description = this.getDescription($chapter);
      const tags = this.getTags($chapter);
      const title = this.getStoryTitle($chapter);
      const words = this.getWords($chapter);
      const cover = await this.getCover($chapter);

      for (let index = 0, { length } = chapters; index < length; index += 1) {
        const next = new URL(chapters[index].url);
        chapter = await this.getChapter(next);
        if (chapter) {
          $chapter = loadHtml(chapter);
          const parsedChapter = await this.parseChapter(
            $chapter,
            index + 1,
            next,
          );
          chapters.push(parsedChapter);
        } else {
          this.log('error', `Chapter: ${next.href} is null`);
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

  override async getCover($chapter: CheerioAPI): Promise<URL | undefined> {
    const source = $chapter(this.selectors.cover).attr('data-src');
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
}

export { BoxNovel };
