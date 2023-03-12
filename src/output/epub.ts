import nodepub from 'nodepub';
import os from 'os';
import path from 'path';
import sanitizeHtml from 'sanitize-html';
import { v4 as uuidv4 } from 'uuid';

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
  let filepath = '/Users/dylan/Desktop/z.png';
  if (cover) {
    const uuid = uuidv4();
    filepath = path.join(os.tmpdir(), `${uuid}-cover.png`);
    await curl(cover, `-o "${filepath}"`);
  }

  const metadata = {
    author: fic.author.text,
    cover: filepath,
    id: fic.id,
    images: fic.images,
    publisher: fic.publisher,
    title,
  };

  const epub = nodepub.document(metadata);

  epub.addCSS(`
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
  `);

  const { chapters } = fic;
  for (const chapter of chapters) {
    const { text, title: chapterTitle } = chapter;
    if (text) {
      epub.addSection(
        chapterTitle,
        sanitizeHtml(
          normalizeHtml(`
            <header><h2>${chapterTitle}</h2></header>
            ${text}
          `),
          {
            allowedTags,
          },
        ),
      );
    }
  }

  const outputTitle = title.replace(/[^a-zA-Z0-9!()[\]. ]/g, ' ');
  log(
    `Writing EPUB for '${title}' to '${path.join(
      outputPath,
      outputTitle,
    )}.epub'`,
  );
  await epub.writeEPUB(outputPath, outputTitle);
};

export default write;
