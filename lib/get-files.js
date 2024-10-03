const { readFileSync } = require('fs');
const walkSync = require('walk-sync');
const { join } = require('path');

module.exports = function getFiles(cwd, providedGlob) {
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
};
