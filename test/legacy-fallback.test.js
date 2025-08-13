import { describe, it, expect, vi } from 'vitest';
import { Project } from 'fixturify-project';
import path from 'path';

// Mock import-cwd so that importCwd('eslint') returns a legacy-like API
vi.mock('import-cwd', () => {
  const mockESLintCtor = class {
    constructor(options = {}) {
      this.options = options;
    }
    async lintFiles() {
      // minimal legacy-like result: one file with one error
      return [
        {
          filePath: path.join(this.options.cwd || process.cwd(), 'index.js'),
          errorCount: 1,
          messages: [{ ruleId: 'no-debugger' }],
        },
      ];
    }
  };
  // static method used by plugin to strip warnings
  mockESLintCtor.getErrorResults = (results) => results;

  // default export is a function(name) => module
  const importCwd = (name) => {
    if (name === 'eslint') {
      return { ESLint: mockESLintCtor };
    }
    throw new Error(`Unexpected import-cwd request: ${name}`);
  };
  return { default: importCwd };
});

import { ignoreAll } from '../main.mjs';

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

    // create node_modules structure similarly to other tests
    project.linkDevDependency('eslint', { baseDir: process.cwd() });
    await project.write();

    // Run ignoreAll against the project directory
    await ignoreAll({}, project.baseDir);

    project.readSync(project.baseDir);
    expect(project.files['index.js']).toEqual(`/* eslint-disable no-debugger */
debugger`);
  });
});


