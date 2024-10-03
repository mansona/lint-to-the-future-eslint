/* eslint-disable prettier/prettier */
const { readFileSync, writeFileSync, lstatSync } = require('fs');
const { join } = require('path');
const walkSync = require('walk-sync');

const ignoreAll = require('./lib/ignore-all');

function removeIgnore(filePath, rulename) {
  const file = readFileSync(filePath, 'utf8');

  const firstLine = file.split('\n')[0];

  // The whitespace after `eslint-disable` is important so `eslint-disable-next-line` and variants
  // aren't picked up.
  const matched = firstLine.match(/eslint-disable (.*)\*\//);

  if (matched) {
    const existing = matched[1].split(',').map((item) => item.trim()).filter((item) => item !== rulename);

    if (existing.length) {
      writeFileSync(filePath, file.replace(/^.*\n/, `/* eslint-disable ${existing.join(', ')} */\n`));
    } else {
      writeFileSync(filePath, file.replace(/^.*\n/, ''));
    }
  }
}

function getFiles(cwd, providedGlob) {
  let ignoreFile;

  try {
    ignoreFile = readFileSync(join(cwd, '.gitignore'), 'utf8')
      .split('\n')
      .filter((line) => line.length)
      .filter((line) => !line.startsWith('#'))
      // walkSync can't handle these
      .filter((line) => !line.startsWith('!'))
      .map((line) => line.replace(/^\//, ''))
      .map((line) => line.replace(/\/$/, '/*'));
  } catch (e) {
    // noop
  }

  let globs;

  if (providedGlob) {
    globs = [providedGlob];
  } else {
    globs = ['**/*.js', '**/*.ts'];
  }

  return walkSync(cwd, {
    globs,
    ignore: ignoreFile || ['**/node_modules/*'],
    directories: false,
  });
}

function list(cwd = process.cwd()) {
  const files = getFiles(cwd);

  const output = {};

  files.forEach((relativeFilePath) => {
    const filePath = join(cwd, relativeFilePath);
    // prevent odd times when directories might end with `.js` or `.ts`;
    if (!lstatSync(filePath).isFile()) {
      return;
    }

    const file = readFileSync(filePath, 'utf8');
    const firstLine = file.split('\n')[0];
    if (!firstLine.includes('eslint-disable ')) {
      return;
    }

    const matched = firstLine.match(/eslint-disable (.*)\*\//);
    const ignoreRules = matched[1].split(',').map((item) => item.trim());

    ignoreRules.forEach((rule) => {
      if (output[rule]) {
        output[rule].push(filePath);
      } else {
        output[rule] = [filePath];
      }
    });
  });

  return output;
}

function remove({name, filter} = {}, cwd = process.cwd()) {
  if (!name) {
    throw new Error('No rulename was passed to `remove()` in lint-to-the-future-eslint plugin');
  }

  const files = getFiles(cwd, filter);

  files.forEach((relativeFilePath) => {
    removeIgnore(join(cwd, relativeFilePath), name);
  });
}

module.exports = {
  ignoreAll,
  list,
  remove,
};
