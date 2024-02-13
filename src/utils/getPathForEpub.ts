import { basename, extname } from 'node:path';
import { fileTypeFromFile } from 'file-type';

// Does not correlate to the underlying cache file
// As the extension may not be present there
const getPathForEpub = async (file: string): Promise<string> => {
  if (extname(file)) {
    return basename(file);
  }
  const ext = (await fileTypeFromFile(file))?.ext;
  if (ext) {
    return basename(`${file}.${ext}`);
  }

  // No file type found
  return '';
};

export { getPathForEpub };
