import { v4 as uuidv4 } from 'uuid';
import type { Element } from 'cheerio';

import { curl } from '../network.js';

const loadImage = async (img: Element): Promise<string | null> => {
  const { src } = img.attribs;
  if (!src) {
    return null;
  }
  try {
    const url = new URL(src);
    const srcSplit = src.split('/');
    const end = srcSplit.length > 0 ? srcSplit[srcSplit.length - 1] : null;
    if (end) {
      const filename = `${uuidv4()}-${end}`;
      img.attribs.src = `../images/${filename}`;
      img.attribs.alt = img.attribs.alt || 'image';
      const [, filepath] = await curl(url);
      return filepath;
    }
  } catch (e) {
    // Pass
  }

  return null;
};

export default loadImage;
