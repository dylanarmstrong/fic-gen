import { fileTypeFromFile } from 'file-type';
import path from 'node:path';

// Does not correlate to the underlying cache file
// As the extension may not be present there
const getPathForEpub = async (file: string): Promise<string> => {
  if (path.extname(file)) {
    return path.basename(file);
  }
  const fileType = await fileTypeFromFile(file);
  const extension = fileType?.ext;
  if (extension) {
    return path.basename(`${file}.${extension}`);
  }

  // No file type found
  return '';
};

export { getPathForEpub };
