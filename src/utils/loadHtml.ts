import type { CheerioAPI } from 'cheerio';
import { load as cheerioLoad } from 'cheerio';
import { parseDocument } from 'htmlparser2';

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
        .replace(new RegExp('&#8203;', 'g'), '')
        .replace(/[\u220b-\u220f\ufeff]/g, ''),
      options,
    ),
  );

export default loadHtml;
