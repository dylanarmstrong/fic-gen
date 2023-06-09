import type { AnyNode, Cheerio, CheerioAPI } from 'cheerio';

import loadHtml from '../utils/loadHtml.js';
import { Chapter, Site } from './site.js';
import { error } from '../utils/log.js';

const hasData = (o: unknown): o is { data: string } =>
  Object.hasOwnProperty.call(o, 'data') &&
  typeof (o as { data: unknown }).data === 'string';

class Xenforo extends Site {
  override matcher = /^(forums.spacebattles.com)/;
  override options = '';
  override publisher = 'Xenforo';
  override selectors = {
    author: '.js-threadmarkTabPanes .username',
    chapter: 'article.hasThreadmark',
    chapterTitle: '.no-element',
    cover: '.no-element',
    description: 'article.threadmarkListingHeader-extraInfoChild',
    storyTitle: 'h1.p-title-value',
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
    const chapters: Chapter[] = [];
    $chapter('.block-body--threadmarkBody .structItem--threadmark li a').each(
      (i, element) => {
        const { href } = element.attribs;
        const [child] = element.children;
        chapters.push({
          chapter: i,
          text: '',
          title: hasData(child) ? child.data : `Chapter ${i + 1}`,
          url: new URL(`${this.url.origin}${href}`).href,
          words: 0,
        });
      },
    );

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
      const next = new URL(chapters[i].url);
      chapter = await this.getChapter(new URL(next.href.replace('%23', '#')));
      if (chapter === null) {
        error(`Chapter: ${next.href} is null`);
      } else {
        $chapter = loadHtml(chapter);
        const parsedChapter = await this.parseChapter($chapter, i + 1, next);
        chapters.splice(i, 1, parsedChapter);
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
      url: '',
    };
  }

  override getStoryTitle($chapter: CheerioAPI) {
    const title = $chapter(this.selectors.storyTitle).text().trim();
    return title.slice(0, title.length - ' - Threadmarks'.length);
  }

  override async parseChapter(
    $chapter: CheerioAPI,
    chapterNumber: number,
    url: URL,
  ): Promise<Chapter> {
    const $content = await this.transformImages(
      this.transformChapter(
        $chapter(`[data-content="${url.hash.slice(1)}"] article.message-body`),
      ),
    );
    const title = $chapter(
      `[data-content="${url.hash.slice(1)}"] .threadmarkLabel`,
    )
      .text()
      .trim();

    // TODO: I don't know if I like this?
    // Idea: Compare a story that's on both SB and RR
    // const text =
    //   $content
    //     .html()
    //     ?.split('\n')
    //     .map((line) => line.trim())
    //     .filter(Boolean)
    //     .map((line) => `<p>${line}</p>`)
    //     .join('\n') || null;

    const text = $content.html();

    return {
      chapter: chapterNumber,
      text,
      title,
      url: url.href,
      words: this.getChapterWords(text),
    };
  }

  override transformChapter($content: Cheerio<AnyNode>) {
    $content.find('br').remove();
    return $content;
  }
}

export default Xenforo;
