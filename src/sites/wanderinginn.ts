// Notice: this works, but I've noticed a couple of chapters that result in timeouts
// So my current solution is just to go to wayback machine and manually place them
// in the cache folder
import type { CheerioAPI } from 'cheerio';

import loadHtml from '../utils/loadHtml.js';
import { Chapter, Site } from './site.js';
import { error } from '../utils/log.js';

class WanderingInn extends Site {
  override matcher = /^wanderinginn.com/;
  override options = '';
  override publisher = 'WanderingInn';
  override selectors = {
    author: '.no-element',
    chapter: '.entry-content',
    chapterTitle: '.entry-title',
    cover: '.no-element',
    description: '.no-element',
    storyTitle: '.no-element',
  };

  constructor(url: string, cookie?: string) {
    super(url, cookie);
  }

  async getFic() {
    let chapter = await this.getIndex(
      new URL('https://wanderinginn.com/table-of-contents/'),
    );
    if (chapter === null) {
      error(`Chapter: ${this.url.href} is null`);
      return null;
    }

    let $chapter = loadHtml(chapter);

    const author = this.getAuthor();
    const description = this.getDescription();
    const tags = this.getTags($chapter);
    const title = this.getStoryTitle();
    const words = this.getWords($chapter);
    const cover = await this.getCover();

    const els = $chapter('.chapter-entry a').toArray();
    const chapters: Chapter[] = [];
    for (let i = 0, len = els.length; i < len; i += 1) {
      const next = new URL(els[i].attribs['href']);
      chapter = await this.getChapter(next);
      if (chapter === null) {
        // Try one more time to get without cache
        chapter = await this.getChapter(next, { checkCache: false });
      }

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
      id: 'the-wandering-inn',
      images: this.images,
      published: '',
      publisher: this.publisher,
      tags,
      title,
      updated: '',
      words,
    };
  }

  override getAuthor() {
    return {
      text: 'pirate aba',
      url: 'https://wanderinginn.com',
    };
  }

  override async getCover() {
    return new URL(
      'https://wanderinginn.com/wp-content/uploads/2023/06/book1-1280x2048.png',
    );
  }

  override getDescription() {
    return `“No killing Goblins.”
So reads the sign outside of The Wandering Inn, a small building run by a young woman named Erin Solstice. She serves pasta with sausage, blue fruit juice, and dead acid flies on request. And she comes from another world. Ours.

It’s a bad day when Erin finds herself transported to a fantastical world and nearly gets eaten by a Dragon. She doesn’t belong in a place where monster attacks are a fact of life, and where Humans are one species among many. But she must adapt to her new life. Or die.

In a dangerous world where magic is real and people can level up and gain classes, Erin Solstice must battle somewhat evil Goblins, deadly Rock Crabs, and hungry [Necromancers]. She is no warrior, no mage. Erin Solstice runs an inn.

She’s an [Innkeeper].`;
  }

  override getStoryTitle() {
    return 'The Wandering Inn';
  }

  override transformChapter($chapter: CheerioAPI): CheerioAPI {
    $chapter('a img').each((_, el) => {
      delete el.attribs['srcset'];
      if (el.parentNode) {
        $chapter(el.parentNode).replaceWith(el);
      }
    });

    $chapter('dl dt img').each((_, el) => {
      delete el.attribs['width'];
      delete el.attribs['height'];
      delete el.attribs['loading'];
      if (el.parentNode?.parentNode) {
        $chapter(el.parentNode.parentNode).replaceWith(el);
      }
    });

    $chapter('.entry-content a').each((_, el) => {
      const text = $chapter(el).text().trim();
      if (text === 'Previous Chapter' || text === 'Next Chapter') {
        $chapter(el).remove();
      } else {
        $chapter(el).replaceWith(text);
      }
    });

    // If you want images, it will result in a 3.4gb epub file
    // $chapter('img').remove();

    return $chapter;
  }
}

export default WanderingInn;
