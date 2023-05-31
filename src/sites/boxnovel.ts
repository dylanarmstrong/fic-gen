import type { CheerioAPI } from 'cheerio';

import loadHtml from '../utils/loadHtml';
import { Chapter, Site } from './site';
import { curl } from '../network';
import { error } from '../utils/log';

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

  constructor(url: string, cookie?: string) {
    super(url, cookie);
  }

  async getFic() {
    let chapter = await this.getChapter(this.url, false);
    if (chapter === null) {
      error(`Chapter: ${this.url.href} is null`);
      return null;
    }

    let $chapter = loadHtml(chapter);
    const chapterUrl = new URL(`${this.url.href}ajax/chapters/`);
    const [chaptersXhr] = await curl(chapterUrl, {
      append: `-H "Referer: ${this.url.href}" -H "X-Requested-With: XMLHttpRequest" -X POST`,
      cache: false,
    });
    if (chaptersXhr === null) {
      error(`Cannot get chapters list from ${chapterUrl.href}`);
      return null;
    }
    const $chapters = loadHtml(chaptersXhr);
    const chapters: Chapter[] = Array.from($chapters('ul.main li a'))
      .map((a, index) => {
        const [child] = a.children;
        return {
          chapter: index + 1,
          text: null,
          title: hasData(child) ? child.data : '',
          url: a.attribs['href'],
          words: 0,
        };
      })
      .reverse();

    if (chapters.length === 0) {
      return null;
    }

    const author = this.getAuthor($chapter);
    const description = this.getDescription($chapter);
    const tags = this.getTags($chapter);
    const title = this.getStoryTitle($chapter);
    const words = this.getWords($chapter);
    const cover = await this.getCover($chapter);

    for (let i = 0, len = chapters.length; i < len; i += 1) {
      const next = new URL(chapters[i].url);
      chapter = await this.getChapter(next);
      if (chapter === null) {
        error(`Chapter: ${next.href} is null`);
      } else {
        $chapter = loadHtml(chapter);
        const parsedChapter = await this.parseChapter($chapter, i + 1, next);
        chapters.push(parsedChapter);
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

  override async getCover($chapter: CheerioAPI) {
    const src = $chapter(this.selectors.cover).attr('data-src');
    if (!src) {
      return null;
    }

    try {
      return new URL(src);
    } catch (e) {
      return null;
    }
  }
}

export default BoxNovel;
