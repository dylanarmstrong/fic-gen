import type { Element } from 'cheerio';
import { sep } from 'node:path';

import { curl, getCachePath } from '../network.js';

const loadImage = async (img: Element): Promise<string | null> => {
  const { src } = img.attribs;
  if (!src) {
    return null;
  }
  try {
    const url = new URL(src);
    const srcSplit = src.split('/');
    const end = srcSplit.length > 0 ? srcSplit.at(-1) : null;
    if (end) {
      const split = getCachePath(url).split(sep);
      const filename = split[split.length - 1];
      img.attribs['src'] = `../resources/${filename}`;
      img.attribs['alt'] = img.attribs['alt'] || 'image';
      const [, filepath] = await curl(url);
      return filepath;
    }
  } catch (e) {
    // Pass
  }

  return null;
};

export default loadImage;
