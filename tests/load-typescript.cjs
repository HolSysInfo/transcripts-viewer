// Load production TypeScript in isolation with explicit dependency substitutes.
// This executes the real functions, without a Mongo server or Next.js startup.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const projectRoot = path.resolve(__dirname, '..');

function loadTypeScript(relativePath, substitutes = {}) {
  const loaded = new Map();

  function load(absolutePath) {
    if (loaded.has(absolutePath)) return loaded.get(absolutePath).exports;
    const source = fs.readFileSync(absolutePath, 'utf8');
    const compiled = ts.transpileModule(source, {
      fileName: absolutePath,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText;
    const module = { exports: {} };
    loaded.set(absolutePath, module);

    function isolatedRequire(specifier) {
      if (Object.hasOwn(substitutes, specifier)) return substitutes[specifier];
      if (specifier === 'server-only') return {};
      let base;
      if (specifier.startsWith('@/')) base = path.join(projectRoot, 'src', specifier.slice(2));
      else if (specifier.startsWith('.')) base = path.resolve(path.dirname(absolutePath), specifier);
      if (base) {
        const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')];
        const resolved = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
        if (!resolved) throw new Error(`Cannot resolve production import ${specifier}`);
        return load(resolved);
      }
      return require(specifier);
    }

    const wrapper = vm.runInThisContext(
      `(function(exports, require, module, __filename, __dirname) {\n${compiled}\n})`,
      { filename: absolutePath },
    );
    wrapper(module.exports, isolatedRequire, module, absolutePath, path.dirname(absolutePath));
    return module.exports;
  }

  return load(path.join(projectRoot, relativePath));
}

module.exports = { loadTypeScript };
