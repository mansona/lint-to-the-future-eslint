import { readFileSync, lstatSync } from 'fs';
import { join } from 'path';
import getFiles from './get-files.js';

export default function list(cwd = process.cwd()) {
  const files = getFiles(cwd);

  const output = {};

  files.forEach((relativeFilePath) => {
    const filePath = join(cwd, relativeFilePath);
    // prevent odd times when directories might end with `.js` or `.ts`;
    if (!lstatSync(filePath).isFile()) {
      return;
    }

    const file = readFileSync(filePath, 'utf8');
    const splitFile = file.split('\n');
    let firstLine = splitFile[0];

    // shebang https://nodejs.org/en/learn/command-line/run-nodejs-scripts-from-the-command-line
    let shebangFile = firstLine.startsWith('#!');

    // the logical first line of the file is after the shebang
    if (shebangFile) {
      firstLine = splitFile[1];
    }
    if (!firstLine.includes('eslint-disable ')) {
      return;
    }

    const matched = firstLine.match(/eslint-disable (.*)\*\//);
    const ignoreRules = matched[1].split(',').map((item) => item.trim());

    ignoreRules.forEach((rule) => {
      if (output[rule]) {
        output[rule].push(relativeFilePath);
      } else {
        output[rule] = [relativeFilePath];
      }
    });
  });

  return output;
};
