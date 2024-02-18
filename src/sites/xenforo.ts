import type { AnyNode, Cheerio, CheerioAPI, Element } from 'cheerio';
import { ElementType } from 'htmlparser2';

import loadHtml from '../utils/loadHtml.js';
import { Chapter, Site } from './site.js';

const hasData = (o: unknown): o is { data: string } =>
  Object.hasOwnProperty.call(o, 'data') &&
  typeof (o as { data: unknown }).data === 'string';

const getThreadmarkUrl = (url: URL): URL => {
  const threadmarkUrl = new URL(String(url));
  threadmarkUrl.hash = '';
  threadmarkUrl.search = '';
  const { pathname } = threadmarkUrl;
  if (!pathname.endsWith('/threadmarks')) {
    threadmarkUrl.pathname = `${pathname}/threadmarks`;
  }
  return threadmarkUrl;
};

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

  async getFic() {
    let chapter = await this.getIndex(getThreadmarkUrl(this.url));
    if (chapter === null) {
      this.log('error', `Chapter: ${this.url.href} is null`);
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
        this.log('error', `Chapter: ${next.href} is null`);
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
    return title.replace(' - Threadmarks', '');
  }

  override async parseChapter(
    $chapter: CheerioAPI,
    chapterNumber: number,
    url: URL,
  ): Promise<Chapter> {
    const $content = await this.transformImages(
      this.transformContent(
        this.transformChapter($chapter)(
          `[data-content="${url.hash.slice(1)}"] article.message-body .bbWrapper`,
        ),
      ),
    );

    const title = $chapter(
      `[data-content="${url.hash.slice(1)}"] .threadmarkLabel`,
    )
      .text()
      .trim();

    const convertToP = (element: AnyNode, depth = 0) => {
      // Just in case, but unlikely to be hit
      if (depth > 99) {
        return;
      }

      if (element.type === ElementType.Text) {
        const { data } = element;
        const $element = $content.find(element as unknown as Element);
        if (data.match(/^[\n\t\s]*$/) === null) {
          const { parent } = element;
          if (parent?.type === ElementType.Tag) {
            const parentName = parent.name.toLowerCase();
            if (!['a', 'b', 'em', 'i'].includes(parentName)) {
              $element.replaceWith(`<p>${data.trim()}</p>`);
            }
          }
        }
      }

      if (element.type === ElementType.Tag) {
        element.children.forEach((el) => convertToP(el, depth + 1));
      }
    };

    $content.each((_, el) => convertToP(el, 0));

    const text =
      $content
        .html()
        ?.split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join('\n') || null;

    return {
      chapter: chapterNumber,
      text,
      title,
      url: url.href,
      words: this.getChapterWords(text),
    };
  }

  override transformContent($content: Cheerio<AnyNode>) {
    $content.find('br').remove();
    return $content;
  }
}

export { Xenforo };
