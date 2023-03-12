import type { AnyNode, Cheerio, CheerioAPI } from 'cheerio';

import loadHtml from '../utils/loadHtml.js';
import { Site } from './site.js';
import { error } from '../utils/log.js';

class ArchiveOfOurOwn extends Site {
  matcher = /^archiveofourown.org/;
  options = '-b "view_adult=true"';
  publisher = 'Archive of Our Own';

  selectors = {
    author: 'h3.byline.heading a',
    chapter: '[role="article"]',
    chapterTitle: 'h3.title',
    cover: '.no-element',
    description: '.summary.module blockquote',
    storyTitle: 'h2.title',
  };

  constructor(url: string, cookie?: string) {
    super(url, cookie);
  }

  async getFic() {
    let chapter = await this.getChapter(this.url.href);
    if (chapter === null) {
      error(`Chapter: ${this.url.href} is null`);
      return null;
    }

    let $chapter = loadHtml(chapter);
    const author = this.getAuthor($chapter);
    const description = this.getDescription($chapter);
    const numberOfChapters = this.getNumberOfChapters($chapter);
    const tags = this.getTags($chapter);
    const title = this.getStoryTitle($chapter);
    const words = this.getWords($chapter);
    const cover = await this.getCover($chapter);
    const chapters = [await this.parseChapter($chapter, 1, this.url)];

    for (let i = 2, len = numberOfChapters + 1; i < len; i++) {
      const nextChapter = $chapter('.chapter.next a').attr('href');
      if (typeof nextChapter !== 'undefined') {
        const next = this.url;
        next.pathname = nextChapter;
        chapter = await this.getChapter(next.href);
        if (chapter !== null) {
          $chapter = loadHtml(chapter);
          chapters.push(await this.parseChapter($chapter, i, next));
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

  // @override
  async getCover(_: CheerioAPI) {
    return null;
  }

  // @override
  getNumberOfChapters($chapter: CheerioAPI) {
    return Number.parseInt($chapter('dd.chapters').text().split('/')[0]);
  }

  // @override
  transformChapter($content: Cheerio<AnyNode>) {
    $content.find('h3.landmark').remove();
    return $content;
  }
}

export default ArchiveOfOurOwn;
