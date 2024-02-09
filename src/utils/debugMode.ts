// TODO: Refactor all these
let debugMode = false;

const isDebugMode = () => debugMode;

const setDebugMode = (_debugMode: boolean) => {
  debugMode = _debugMode;
};

export { isDebugMode, setDebugMode };
