/* eslint-disable prettier/prettier */
const { readFileSync, writeFileSync, lstatSync } = require('fs');
const { join } = require('path');
const importCwd = require('import-cwd');
const walkSync = require('walk-sync');
const semver = require('semver');

function ignoreError(error) {
  const ruleIds = error.messages.map((message) => message.ruleId);
  let uniqueIds = [...new Set(ruleIds)];

  const file = readFileSync(error.filePath, 'utf8');

  const firstLine = file.split('\n')[0];

  // The whitespace after `eslint-disable` is important so `eslint-disable-next-line` and variants
  // aren't picked up.
  const matched = firstLine.match(/eslint-disable (.*)\*\//);

  if (matched) {
    const existing = matched[1].split(',').map((item) => item.trim());
    uniqueIds = [...new Set([...ruleIds, ...existing])];
    uniqueIds.sort((a, b) => a.localeCompare(b));

    writeFileSync(error.filePath, file.replace(/^.*\n/, `/* eslint-disable ${uniqueIds.join(', ')} */\n`));
  } else {
    uniqueIds.sort((a, b) => a.localeCompare(b));
    writeFileSync(error.filePath, `/* eslint-disable ${uniqueIds.join(', ')} */\n${file}`);
  }
}

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

async function ignoreAll(cwd = process.cwd()) {
  const currentPackageJSON = require(join(cwd, 'package.json'));

  const eslintVersion = currentPackageJSON.devDependencies.eslint;

  let cli;
  let report;
  let results;

  const eslint = importCwd('eslint');

  if (semver.intersects(eslintVersion, '8')) {
    // this won't use the version in the repo but it will still use v8 because
    // that is installed in this repo
    const { ESLint } = eslint;
    cli = new ESLint();
    results = await cli.lintFiles([cwd]);

    // remove warnings
    results = ESLint.getErrorResults(results);
  } else {
    const { CLIEngine, ESLint } = eslint;
    cli = new CLIEngine();
    report = cli.executeOnFiles([cwd]);
    results = report.results;

    // remove warnings
    results = ESLint.getErrorResults(results);
  }

  const errors = results.filter((result) => result.errorCount > 0);

  errors.forEach(ignoreError);
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
