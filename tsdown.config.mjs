/**
 * Standalone tsdown build for the cyberpunk theme plugin. Mirrors the shared
 * client-plugin preset (`packages/client/tsdown.client.ts` in the deepseek
 * harness checkout) so the artifact is compatible with the browser loader:
 *
 * - the node half emits `lib/index.js` (a valid loader entry plugin);
 * - the browser half emits `lib/client.js`, a closure-factory bundle that
 *   calls `window.__ModuleLoader__.load({ id, factory })` and resolves the
 *   platform modules (react, cordis, ui-slots, runtime/client, …) from the
 *   loader module table instead of bundling them.
 *
 * The platform-module list is pinned here (a projection of the shell's
 * `PLATFORM_MODULES` plus the runtime store exemption); keep it in sync when
 * the shell grows the table.
 */
import { defineConfig } from 'tsdown'

const PKG_ID = 'dsh-cyberpunk-theme'

/** Browser platform modules seeded into the loader module table. */
const PLATFORM_MODULES = [
  'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-attachment',
  '@deepseek-ai/dsh-client-schema-form',
]

/** Externals resolved from the loader module table (platform seed + the runtime store exemption). */
const CLIENT_EXTERNALS = [...PLATFORM_MODULES, '@deepseek-ai/dsh-client-runtime/client']

/** The node half: an ordinary ESM library the host Loader imports. */
const libConfig = {
  name: PKG_ID,
  entry: { index: 'src/host-index.js' },
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: true,
}

/** The browser half: closure-factory bundle served from `/plugins/<id>/client.js`. */
const clientConfig = {
  name: `${PKG_ID}/client`,
  entry: { client: 'src/client/index.js' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  dts: false,
  sourcemap: true,
  clean: false,
  deps: {
    // Only the loader module table stays external; anything else must inline
    // instead — a require() the table cannot answer is a runtime throw.
    neverBundle: [...CLIENT_EXTERNALS],
    alwaysBundle: (id) => !CLIENT_EXTERNALS.includes(id),
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
  },
  plugins: [{
    // Bundle purity gate (build-time mirror of the module-edge rules): only
    // platform seed entries stay external; any other @deepseek-ai value
    // import is a build error (cross-plugin collaboration goes through
    // cordis services; type-only imports are erased and never reach here).
    name: 'dsh-client-bundle-purity',
    resolveId(source) {
      if (!source.startsWith('@deepseek-ai/')) return null
      if (CLIENT_EXTERNALS.includes(source)) return null
      throw new Error(
        `client bundle purity: "${source}" is not a platform module (CLIENT_EXTERNALS) — `
        + 'cross-plugin value imports are forbidden; collaborate through cordis services '
        + '(type-only imports are erased and never reach this gate)',
      )
    },
  }],
  outputOptions: {
    entryFileNames: 'client.js',
    sourcemapPathTransform(_source, sourcemapPath) {
      return `../../../${sourcemapPath.replace(/.*\/lib\//, '').replace(/\.\.\./, '')}`
    },
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PKG_ID)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
}

export default defineConfig(() => [libConfig, clientConfig])
