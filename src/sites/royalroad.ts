import type { CheerioAPI } from 'cheerio';

import loadHtml from '../utils/loadHtml';
import { Chapter, Site } from './site';
import { error } from '../utils/log';

const hasData = (o: unknown): o is { data: string } =>
  Object.hasOwnProperty.call(o, 'data') &&
  typeof (o as { data: unknown }).data === 'string';

class RoyalRoad extends Site {
  override matcher = /^www.royalroad.com/;
  override options = '';
  override publisher = 'RoyalRoad';
  override selectors = {
    author: '.fic-title a',
    chapter: '.chapter-inner.chapter-content',
    chapterTitle: 'h1.font-white',
    cover: 'img.thumbnail.inline-block',
    description: '.summary.module blockquote',
    storyTitle: 'h1.font-white',
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
    let chapters: Chapter[] = [];
    $chapter('script').each((_, element) => {
      if (chapters.length === 0 && element.children.length === 1) {
        const [first] = element.children;
        if (first && hasData(first)) {
          const data = first.data
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean);
          const chapterIdx = data.findIndex((s) =>
            s.startsWith('window.chapters = [{'),
          );
          if (chapterIdx > -1) {
            chapters = JSON.parse(
              data[chapterIdx].replace(/window\.chapters =(.*);/, '$1'),
            );
          }
        }
      }
    });

    if (chapters.length === 0) {
      return null;
    }

    const author = this.getAuthor($chapter);
    const description = this.getDescription($chapter);
    const tags = this.getTags($chapter);
    const title = this.getStoryTitle($chapter);
    const words = this.getWords($chapter);
    const cover = await this.getCover($chapter);

    for (let i = 0, len = chapters.length; i < len; i++) {
      const nextChapter = chapters[i].url;
      const next = this.url;
      next.pathname = nextChapter;
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

  override getAuthor($chapter: CheerioAPI) {
    const link = $chapter(this.selectors.author);
    return {
      text: link.text().trim(),
      url: `https://www.royalroad.com${link.attr('href')?.trim() || ''}`,
    };
  }
}

export default RoyalRoad;
