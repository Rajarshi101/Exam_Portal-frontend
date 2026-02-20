let screenStream = null;

export const setScreenStream = (stream) => {
  screenStream = stream;
};

export const getScreenStream = () => {
  return screenStream;
};

export const clearScreenStream = () => {
  screenStream = null;
};