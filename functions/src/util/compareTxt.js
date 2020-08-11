const jsdiff = require('diff');

const SEP = '\n=====================\n';

function makeDiffResult(oldStr, newStr, title) {
  const diff = jsdiff.diffChars(oldStr, newStr);
  let removedResult = '[removed]\n';
  let addedResult = '[added]\n';

  diff.forEach((onediff) => {
    if (onediff.added === true) {
      addedResult += `+ ${onediff.value}\n`;
    }
    if (onediff.removed === true) {
      removedResult += `- ${onediff.value}\n`;
    }
  });

  const diffResult = `${title + SEP + removedResult}\n${addedResult}`;
  return diffResult;
}

module.exports = {
  makeDiffResult,
};
