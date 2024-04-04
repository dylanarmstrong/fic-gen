// Notice: this works, but I've noticed a couple of chapters that result in timeouts
// So my current solution is just to go to wayback machine and manually place them
// in the cache folder
import { Chapter, Fic, Site } from './site.js';
import loadHtml from '../utils/load-html.js';

import type { CheerioAPI } from 'cheerio';

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

  async getFic(): Promise<Fic | undefined> {
    let chapter = await this.getIndex(
      new URL('https://wanderinginn.com/table-of-contents/'),
    );
    if (chapter) {
      let $chapter = loadHtml(chapter);

      const author = this.getAuthor();
      const description = this.getDescription();
      const tags = this.getTags($chapter);
      const title = this.getStoryTitle();
      const words = this.getWords($chapter);
      const cover = await this.getCover();

      const els = $chapter('.chapter-entry a').toArray();
      const chapters: Chapter[] = [];
      for (let index = 0, { length } = els; index < length; index += 1) {
        const next = new URL(els[index].attribs['href']);
        chapter = await this.getChapter(next);
        if (chapter === null) {
          // Try one more time to get without cache
          chapter = await this.getChapter(next, { checkCache: false });
        }

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

    this.log('error', `Chapter: ${this.url.href} is null`);
    return undefined;
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

  override isValidChapter(chapter: string) {
    const html = loadHtml(chapter);
    // Patreon only chapter
    return (
      html(this.selectors.chapter).length > 0 &&
      html(`${this.selectors.chapter} form[method='post']`).length === 0
    );
  }

  override transformChapter($chapter: CheerioAPI): CheerioAPI {
    $chapter('a img').each((_, element) => {
      delete element.attribs['srcset'];
      if (element.parentNode) {
        $chapter(element.parentNode).replaceWith(element);
      }
    });

    $chapter('dl dt img').each((_, element) => {
      delete element.attribs['width'];
      delete element.attribs['height'];
      delete element.attribs['loading'];
      if (element.parentNode?.parentNode) {
        $chapter(element.parentNode.parentNode).replaceWith(element);
      }
    });

    $chapter('.entry-content a').each((_, element) => {
      const text = $chapter(element).text().trim();
      if (text === 'Previous Chapter' || text === 'Next Chapter') {
        $chapter(element).remove();
      } else {
        $chapter(element).replaceWith(text);
      }
    });

    // If you want images, it will result in a 3.4gb epub file
    // $chapter('img').remove();

    return $chapter;
  }
}

export { WanderingInn };
