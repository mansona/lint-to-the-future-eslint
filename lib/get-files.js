import { globbySync } from 'globby';

export default function getFiles(cwd, providedGlob) {
  let globs;

  if (providedGlob) {
    globs = [providedGlob];
  } else {
    globs = ['**/*.js', '**/*.ts'];
  }

  // globby's ignore functionality works by getting all glob matches and _then_ filtering them.
  // We always ignore node_modules here since we'll never want it and it can be a huge performance hit
  // to include it.
  globs.push('!**/node_modules');

  return globbySync(globs, {
    cwd,
    ignoreFiles: ['**/.gitignore', '**/.eslintignore'],
  });
};
