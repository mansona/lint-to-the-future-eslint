const { readFileSync, writeFileSync } = require('fs');
const getFiles = require('./get-files');
const { join } = require('path');

function removeIgnore(filePath, rulename) {
  const file = readFileSync(filePath, 'utf8');

  const firstLine = file.split('\n')[0];

  // The whitespace after `eslint-disable` is important so `eslint-disable-next-line` and variants
  // aren't picked up.
  const matched = firstLine.match(/eslint-disable (.*)\*\//);

  if (matched) {
    const existing = matched[1]
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== rulename);

    if (existing.length) {
      writeFileSync(
        filePath,
        file.replace(/^.*\n/, `/* eslint-disable ${existing.join(', ')} */\n`),
      );
    } else {
      writeFileSync(filePath, file.replace(/^.*\n/, ''));
    }
  }
}

module.exports = function remove({ name, filter } = {}, cwd = process.cwd()) {
  if (!name) {
    throw new Error(
      'No rulename was passed to `remove()` in lint-to-the-future-eslint plugin',
    );
  }

  const files = getFiles(cwd, filter);

  files.forEach((relativeFilePath) => {
    removeIgnore(join(cwd, relativeFilePath), name);
  });
};
