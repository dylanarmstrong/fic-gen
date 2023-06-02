import { createEpub } from '@dylanarmstrong/nodepub';
import type { CoverType, Section } from '@dylanarmstrong/nodepub';
import path from 'node:path';
import sanitizeHtml from 'sanitize-html';

import normalizeHtml from '../utils/normalizeHtml.js';
import type { Fic } from '../sites/site.js';
import { curl } from '../network.js';
import { log } from '../utils/log.js';

// Add `img` to allowedTags for sanitize-html
const allowedTags = [
  'a',
  'abbr',
  'address',
  'article',
  'aside',
  'b',
  'bdi',
  'bdo',
  'blockquote',
  'br',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'data',
  'dd',
  'dfn',
  'div',
  'dl',
  'dt',
  'em',
  'figcaption',
  'figure',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hgroup',
  'hr',
  'i',
  'img',
  'kbd',
  'li',
  'main',
  'main',
  'mark',
  'nav',
  'ol',
  'p',
  'pre',
  'q',
  'rb',
  'rp',
  'rt',
  'rtc',
  'ruby',
  's',
  'samp',
  'section',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'time',
  'tr',
  'u',
  'ul',
  'var',
  'wbr',
];

const write = async (fic: Fic, outputPath: string) => {
  const { cover, title } = fic;
  let filepath = title;
  let coverType: CoverType = 'text';
  if (cover) {
    [, filepath] = await curl(cover);
    coverType = 'image';
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
  `;

  const { chapters } = fic;
  const sections: Section[] = [];
  chapters.forEach((chapter) => {
    const { text, title: chapterTitle } = chapter;
    if (text) {
      sections.push({
        content: sanitizeHtml(
          normalizeHtml(`
            <h1>${chapterTitle}</h1>
            ${text}
          `),
          {
            allowedTags,
          },
        ),
        title: chapterTitle,
      });
    }
  });

  const metadata = {
    author: fic.author.text,
    cover: filepath,
    coverType,
    css,
    id: fic.id,
    publisher: fic.publisher,
    title,
  };

  const epub = createEpub({
    css,
    images: fic.images,
    metadata,
    sections,
  });

  const outputTitle = title.replace(/[^a-zA-Z0-9!()[\]. ]/g, ' ');
  log(
    `Writing EPUB for '${title}' to '${path.join(
      outputPath,
      outputTitle,
    )}.epub'`,
  );

  await epub.write(outputPath, outputTitle);
};

export default write;
