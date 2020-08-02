const jsdiff = require('diff');

const SEP = '\n=====================\n';

function makeDiffResult(oldStr, newStr, title) {
  const diff = jsdiff.diffChars(oldStr, newStr);
  let removedResult = '[removed]\n';
  let addedResult = '[added]\n';

  for (const i in diff) {
    if (diff[i].added === true) {
      addedResult += `+ ${diff[i].value}\n`;
    }
    if (diff[i].removed === true) {
      removedResult += `- ${diff[i].value}\n`;
    }
  }

  const diffResult = `${title + SEP + removedResult}\n${addedResult}`;
  return diffResult;
}

module.exports = {
  makeDiffResult,
};
