import { load as cheerioLoad } from 'cheerio';
import { parseDocument } from 'htmlparser2';

import type { CheerioAPI } from 'cheerio';

const options = {
  decodeEntities: true,
  withDomLvl1: true,
  xmlMode: true,
};

const loadHtml = (html: string): CheerioAPI =>
  cheerioLoad(
    parseDocument(
      html
        // Remove those non-space spaces before anything else has to deal with the HTML
        .replaceAll(new RegExp('&#8203;', 'g'), '')
        .replaceAll(/[\u220B-\u220F\uFEFF]/g, ''),
      options,
    ),
  );

export default loadHtml;
