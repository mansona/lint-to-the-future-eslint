import { Project } from 'fixturify-project';
import { describe, it, expect } from 'vitest';
import { execa } from 'execa';

async function runWithFlatConfig(files) {
  const project = new Project({
    files: {
      // Flat config only (no .eslintrc.*)
      'eslint.config.js': `const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  // ensure ESM syntax parses when flat config is used
  { languageOptions: { sourceType: 'module' } },
];`,
      'index.js': '',
      'package.json': `{
        "devDependencies": {
          "eslint": "^9.0.0"
        }
      }`,
      ...files,
    },
  });

  // Use the repo's devDependency version of eslint
  project.linkDevDependency('eslint', { baseDir: process.cwd() });
  project.linkDevDependency('@eslint/js', { baseDir: process.cwd() });
  project.linkDevDependency('lint-to-the-future', { baseDir: process.cwd() });
  project.linkDevDependency('lint-to-the-future-eslint', {
    baseDir: process.cwd(),
  });
  await project.write();

  // Run ignoreAll against the project directory
  await execa({ cwd: project.baseDir })`npx lttf ignore`;

  project.readSync(project.baseDir);
  return project.files;
}

describe('flat config support', () => {
  it('uses flat config when present and does not produce blanket disables', async () => {
    const files = await runWithFlatConfig({
      // Valid ESM with a real error (no-debugger)
      'index.js': `import x from 'y'
debugger`,
    });

    expect(files['index.js'])
      .toEqual(`/* eslint-disable no-debugger, no-unused-vars */
import x from 'y'
debugger`);
  });
});
