import { describe, it, expect } from 'vitest';
import { Project } from 'fixturify-project';
import { execa } from 'execa';

describe('legacy fallback (no loadESLint)', () => {
  it('falls back to legacy ESLint constructor and writes rule-specific disable', async () => {
    const project = new Project({
      files: {
        // Legacy only project: no eslint.config.js
        '.eslintrc.json': '{"extends": "eslint:recommended"}',
        'index.js': 'debugger',
        'package.json': '{"devDependencies": {"eslint": "^7.0.0"}}',
      },
    });

    // we're linking to eslint-legacy here because that is the behaviour that we're testing
    project.linkDevDependency('eslint', { baseDir: process.cwd(), resolveName: 'eslint-legacy' });
    project.linkDevDependency('lint-to-the-future', { baseDir: process.cwd() });
    project.linkDevDependency('lint-to-the-future-eslint', { baseDir: process.cwd() });
    await project.write();

    // Run ignoreAll against the project directory
    await execa({cwd: project.baseDir})`npx lttf ignore`;

    project.readSync(project.baseDir);
    expect(project.files['index.js']).toEqual(`/* eslint-disable no-debugger */
debugger`);
  });
});


