import { Chapter, Fic, Site } from './site.js';
import { curl } from '../network.js';
import loadHtml from '../utils/load-html.js';

import type { CheerioAPI } from 'cheerio';

type DataChapter = {
  chapter_name: string;
  chapter_slug: string;
};

type Data = {
  author: string;
  chapters: DataChapter[];
  description: string;
  series_slug: string;
  thumbnail: string;
  title: string;
};

const isData = (a: unknown): a is Data[] =>
  Array.isArray(a) &&
  a.every(
    (o) =>
      Object.hasOwnProperty.call(o, 'author') &&
      Object.hasOwnProperty.call(o, 'chapters') &&
      Object.hasOwnProperty.call(o, 'description') &&
      Object.hasOwnProperty.call(o, 'series_slug') &&
      Object.hasOwnProperty.call(o, 'thumbnail') &&
      Object.hasOwnProperty.call(o, 'title') &&
      Array.isArray((o as Data).chapters) &&
      typeof (o as Data).author === 'string' &&
      typeof (o as Data).description === 'string' &&
      typeof (o as Data).series_slug === 'string' &&
      typeof (o as Data).thumbnail === 'string' &&
      typeof (o as Data).title === 'string' &&
      (o as Data).chapters.every(
        (chapter) =>
          Object.hasOwnProperty.call(chapter, 'chapter_name') &&
          Object.hasOwnProperty.call(chapter, 'chapter_slug') &&
          typeof (chapter as DataChapter).chapter_name === 'string' &&
          typeof (chapter as DataChapter).chapter_slug === 'string',
      ),
  );

class WeTried extends Site {
  override matcher = /^wetriedtls.com/;
  override options = '';
  override publisher = 'WeTried';
  override selectors = {
    author: '.space-y-2.rounded.p-5.bg-foreground div:nth-child(4) :last-child',
    chapter: '#reader-container',
    chapterTitle: '.no-element',
    cover: 'img.w-full',
    description: '.container > div > div > .text-secondary',
    storyTitle: 'h1',
  };

  async getFic(): Promise<Fic | undefined> {
    const seriesSlug = this.url.pathname.split('/').at(-1);
    const chapterUrl = new URL(
      'https://api.wetriedtls.com/query?adult=true&query_string=',
    );
    const [chaptersXhr] = await curl(chapterUrl, this.config, this.log, {
      append: `-H "Referer: ${this.url.href}" -X GET`,
      cache: false,
    });

    if (chaptersXhr === null) {
      this.log('error', `Cannot get chapters list from ${chapterUrl.href}`);
      return undefined;
    }

    const { data } = JSON.parse(chaptersXhr);

    if (isData(data)) {
      const story = data.find((row) => row.series_slug === seriesSlug);
      if (!story) {
        this.log('error', `Cannot find series slug from ${chapterUrl.href}`);
        return undefined;
      }

      const chapters: Chapter[] = [];
      for (let index = story.chapters.length - 1; index > -1; index -= 1) {
        const next = new URL(
          `${this.url.href}/${story.chapters[index].chapter_slug}`,
        );
        const chapter = await this.getChapter(next);
        if (chapter) {
          const $chapter = loadHtml(chapter);
          const parsedChapter = await this.parseChapter(
            $chapter,
            index + 1,
            next,
          );
          parsedChapter.title = story.chapters[index].chapter_name;
          chapters.push(parsedChapter);
        } else {
          this.log('error', `Chapter: ${next.href} is null`);
        }
      }

      const { author, description, thumbnail: cover, title } = story;

      return {
        author: { text: author, url: undefined },
        chapters,
        cover: new URL(cover),
        description,
        id: this.url.pathname.split('/')[2],
        images: this.images,
        published: '',
        publisher: this.publisher,
        tags: [],
        title,
        updated: '',
        words: Number.NaN,
      };
    }

    this.log('error', `Cannot parse data from ${chapterUrl.href}`);
    return undefined;
  }

  override transformChapter($chapter: CheerioAPI) {
    $chapter('a').remove();
    return $chapter;
  }
}

export { WeTried };
