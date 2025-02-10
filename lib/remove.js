import { readFileSync, writeFileSync } from 'fs';
import getFiles from './get-files.js';
import { join } from 'path';

function removeIgnore(filePath, rulename) {
  const file = readFileSync(filePath, 'utf8');

  const splitFile = file.split('\n');
  let firstLine = splitFile[0];

  // shebang https://nodejs.org/en/learn/command-line/run-nodejs-scripts-from-the-command-line
  let shebangFile = firstLine.startsWith('#!');

  // the logical first line of the file is after the shebang
  if (shebangFile) {
    firstLine = splitFile[1];
  }

  // The whitespace after `eslint-disable` is important so `eslint-disable-next-line` and variants
  // aren't picked up.
  const matched = firstLine.match(/eslint-disable (.*)\*\//);

  if (matched) {
    const existing = matched[1]
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== rulename);

    if (existing.length) {
      splitFile.splice(
        shebangFile ? 1 : 0, // if it's a shebangFile we start at the 2nd line of the file
        1, // replacing the existing eslint-disable
        `/* eslint-disable ${existing.join(', ')} */`,
      );
    } else {
      // if we removed the last one we just remove the eslint-disable line
      splitFile.splice(
        shebangFile ? 1 : 0, // if it's a shebangFile we start at the 2nd line of the file
        1,
      );
    }

    writeFileSync(filePath, splitFile.join('\n'));
  }
}

export default function remove({ name, filter } = {}, cwd = process.cwd()) {
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
