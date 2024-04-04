import { parse, serialize } from 'parse5';

const cleanHtml = (s: string | null): string => {
  if (s === null) {
    return '';
  }
  return s.replaceAll('&amp;', '&');
};

const normalizeHtml = (s: string | null) => serialize(parse(cleanHtml(s)));

export default normalizeHtml;
