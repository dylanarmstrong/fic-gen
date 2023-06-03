import Epub from '@dylanarmstrong/nodepub';
import type { Section } from '@dylanarmstrong/nodepub';
import path from 'node:path';
import sanitizeHtml from 'sanitize-html';

import normalizeHtml from '../utils/normalizeHtml.js';
import type { Fic } from '../sites/site.js';
import { curl } from '../network.js';
import { log } from '../utils/log.js';

const write = async (fic: Fic, outputPath: string) => {
  const { cover, title } = fic;
  let filepath = title;
  let coverType: 'text' | 'image' = 'text';
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
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
            transformTags: {
              // EPUB3.3 really dislikes images with empty width and such
              // TODO: Is this safe to do as a *
              img: function (tagName, attribs) {
                const cleanAttribs = { ...attribs };

                Object.keys(cleanAttribs).forEach((key) => {
                  const value = cleanAttribs[key].trim();
                  if (value === '') {
                    delete cleanAttribs[key];
                  }
                });

                return {
                  attribs: cleanAttribs,
                  tagName,
                };
              },
            },
          },
        ),
        title: chapterTitle,
      });
    }
  });

  const metadata = {
    author: fic.author.text,
    cover: filepath,
    id: fic.id,
    publisher: fic.publisher,
    title,
  };

  const options = {
    coverType,
  };

  const epub = new Epub({
    css,
    images: fic.images,
    metadata,
    options,
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
