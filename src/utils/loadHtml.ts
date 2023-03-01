import { load as cheerioLoad } from 'cheerio';
import { parseDocument } from 'htmlparser2';

const options = {
  decodeEntities: true,
  normalizeWhitespace: false,
  withDomLvl1: true,
  xmlMode: true,
};

const loadHtml = (html: string) => cheerioLoad(parseDocument(html, options));

export default loadHtml;
