import Epub from '@dylanarmstrong/nodepub';
import sanitizeHtml from 'sanitize-html';
import type { Resource, Section } from '@dylanarmstrong/nodepub';
import { extname, join } from 'node:path';
import { readFile } from 'node:fs/promises';

import normalizeHtml from '../utils/normalizeHtml.js';
import type { Fic } from '../sites/site.js';
import { curl } from '../network.js';
import { log } from '../utils/log.js';

const write = async (fic: Fic, outputPath: string) => {
  const { cover, title } = fic;
  let filepath = title;
  let coverType: 'text' | 'image' = 'text';
  let coverData: Resource = {
    data: Buffer.from([0]),
    name: 'cover.jpg',
  };

  if (cover) {
    [, filepath] = await curl(cover);
    coverType = 'image';
    coverData = {
      data: await readFile(filepath),
      name: `cover.${extname(filepath) || 'jpg'}`,
    };
  }

  const css = `
    table {
      border: 3px double #ccc;
      margin-left: auto;
      margin-right: auto;
      padding: 0.5em;
    }
    th {
      font-weight: bold;
      text-align: right;
      text-decoration: underline;
      vertical-align: top;
      white-space: nowrap;
    }
    th:after {
      content: ":";
    }
    .title {
      display: block;
      font-kerning: auto;
      font-size: 1.25em;
      font-style: normal;
      font-weight: 600;
      letter-spacing: 0.05em;
      line-height: 1.2;
      margin: 0 0 0.3em
      page-break-inside: avoid;
      text-align: center;
    }
    .title + *::first-letter {
      font-size: 300%;
    }
  `;

  const { chapters } = fic;
  const sections: Section[] = [];
  chapters.forEach((chapter) => {
    const { text, title: chapterTitle } = chapter;
    if (text) {
      const content = sanitizeHtml(
        normalizeHtml(`
          <h1 class='title'>${chapterTitle}</h1>
          ${text}
        `),
        {
          allowedAttributes: {
            a: ['href', 'name', 'target'],
            h1: ['class'],
            img: [
              'src',
              'srcset',
              'alt',
              'title',
              'width',
              'height',
              'loading',
            ],
          },
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
          exclusiveFilter: (frame) => {
            const { tag, attribs } = frame;
            if (tag === 'img') {
              return !attribs['src'];
            }
            return false;
          },
          nonBooleanAttributes: ['*'],
        },
      );
      sections.push({
        content,
        title: chapterTitle,
      });
    }
  });

  const cleanTitle = sanitizeHtml(title);
  if (coverType === 'text') {
    filepath = cleanTitle;
  }

  const metadata = {
    author: fic.author.text,
    cover: coverType === 'text' ? cleanTitle : coverData,
    id: fic.id,
    publisher: fic.publisher,
    title: cleanTitle,
  };

  const options = {
    coverType,
  };

  const resources = await Promise.all(
    fic.images.map(async (image) => ({
      data: await readFile(image),
      name: image,
    })),
  );

  const epub = new Epub({
    css,
    metadata,
    options,
    resources,
    sections,
  });

  const outputTitle = title.replace(/[^a-zA-Z0-9!()[\]. ]/g, ' ');
  log(`Writing EPUB for '${title}' to '${join(outputPath, outputTitle)}.epub'`);

  await epub.write(outputPath, outputTitle);
};

export default write;
