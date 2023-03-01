import os from 'os';
import path from 'path';

const { XDG_DATA_HOME } = process.env;
const dataPath = XDG_DATA_HOME
  ? path.join(XDG_DATA_HOME, 'fic-gen')
  : path.join(os.homedir(), '.fic-gen');

export default dataPath;
