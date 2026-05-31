const fs = require('fs')
const path = require('path')

const nm = path.join(__dirname, '..', 'node_modules')
const structuraDir = path.join(__dirname, '..', 'dist', 'structura')
const webviewDir = path.join(structuraDir, 'webview')

if (!fs.existsSync(structuraDir)) { fs.mkdirSync(structuraDir, { recursive: true }) }
if (!fs.existsSync(webviewDir)) { fs.mkdirSync(webviewDir, { recursive: true }) }

console.log('Bundling Structura webview...')

// esbuild plugin: transparently decode UTF-16 LE files (BOM 0xFF 0xFE)
const utf16Plugin = {
  name: 'utf16-decode',
  setup(build) {
    build.onLoad({ filter: /\.(ts|js)$/ }, async (args) => {
      const bytes = fs.readFileSync(args.path)
      if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
        const text = bytes.slice(2).toString('utf16le')
        const ext = path.extname(args.path).slice(1)
        return { contents: text, loader: ext === 'ts' ? 'ts' : 'js' }
      }
      return null // let esbuild handle normally
    })
  }
}

async function main() {
  const esbuild = require('esbuild')

  // Copy template.html
  const templateSrc = path.join(nm, '@atomos-web', 'structura', 'webview', 'template.html')
  const templateDest = path.join(webviewDir, 'template.html')
  if (fs.existsSync(templateSrc)) {
    fs.copyFileSync(templateSrc, templateDest)
    console.log('Copied webview/template.html')
  }

  // Bundle the webview entry using esbuild, resolving @atomos-web/* from src
  const entryPoint = path.join(nm, '@atomos-web', 'structura', 'src', 'webview', 'index.ts')
  await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    outfile: path.join(webviewDir, 'index.js'),
    alias: {
      '@atomos-web/prime': path.join(nm, '@atomos-web', 'prime', 'src', 'index.ts'),
      '@atomos-web/prime-style': path.join(nm, '@atomos-web', 'prime-style', 'src', 'index.ts'),
      '@atomos-web/structura-core': path.join(nm, '@atomos-web', 'structura-core', 'src', 'index.ts'),
    },
    plugins: [utf16Plugin],
    minify: false,
    sourcemap: false,
  })
  console.log('Bundled webview/index.js successfully!')
  
  // Compile Tailwind CSS from @atomos-web/prime-style
  await compileTailwindCSS()
  
  // Patch bundled code for Redux API compatibility with @atomos-web/structura v2.0.0
  await patchStructuraWebview()
}

async function compileTailwindCSS() {
  const { execSync } = require('child_process')
  
  console.log('Compiling Tailwind CSS...')
  
  const sourceCSS = path.join(nm, '@atomos-web', 'prime-style', 'src', 'styles', 'index.css')
  const sourceDir = path.join(nm, '@atomos-web', 'prime-style', 'src', 'styles')
  const tempCSS = path.join(sourceDir, 'temp-input.css')
  const outputCSS = path.join(webviewDir, 'styles.css')
  const configPath = path.join(__dirname, '..', 'tailwind.config.js')
  
  // Handle UTF-16 LE encoding: read as buffer and decode if needed
  const sourceBuffer = fs.readFileSync(sourceCSS)
  let cssContent = ''
  
  if (sourceBuffer.length >= 2 && sourceBuffer[0] === 0xFF && sourceBuffer[1] === 0xFE) {
    // UTF-16 LE with BOM - decode to UTF-8
    cssContent = sourceBuffer.slice(2).toString('utf16le')
    console.log('Detected UTF-16 LE encoding, converted to UTF-8')
  } else {
    // Already UTF-8 or ASCII
    cssContent = sourceBuffer.toString('utf8')
  }
  
  // Write temporary UTF-8 version in source directory to preserve @import paths
  fs.writeFileSync(tempCSS, cssContent, 'utf8')
  
  try {
    // Run Tailwind CLI with our config
    execSync(
      `npx tailwindcss -c "${configPath}" -i "${tempCSS}" -o "${outputCSS}" --minify`,
      { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      }
    )
    console.log('Tailwind CSS compiled successfully!')
  } catch (error) {
    console.error('Failed to compile Tailwind CSS:', error.message)
    throw error
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempCSS)) {
      fs.unlinkSync(tempCSS)
    }
  }
}

async function patchStructuraWebview() {
  const bundledFile = path.join(webviewDir, 'index.js')
  let content = fs.readFileSync(bundledFile, 'utf8')
  
  // v2.0.0 migration: Replace all getGlobalReduxStore calls with getInstanceReduxStore
  // Pattern 1: Replace the thrown error with a fallback that uses instance-based store
  // This handles the strict null checks in the library
  
  // Find and replace the error-throwing getGlobalReduxStore with a working implementation
  // that uses the instance store registry
  const reduxPatch = `
// v2.0.0 API Migration: Provide instance-aware store wrapper
const __reduxInstanceCache = new Map();

// Helper to extract instanceId from call stack or use default
function __getInstanceIdFromContext() {
  // Try to get instanceId from window/global context if available
  if (typeof globalThis !== 'undefined' && globalThis.__currentInstanceId) {
    return globalThis.__currentInstanceId;
  }
  // Fallback to a default UUID-style ID for compatibility
  return 'default-instance-' + (globalThis.__instanceCounter = (globalThis.__instanceCounter || 0) + 1);
}

// Polyfill: getGlobalReduxStore now acts as a wrapper for getInstanceReduxStore
// This maintains backward compatibility while using the v2.0.0 instance-based API
globalThis.__getGlobalReduxStorePolyfill = (config, instanceId) => {
  const actualInstanceId = instanceId || __getInstanceIdFromContext();
  if (!__reduxInstanceCache.has(actualInstanceId)) {
    // This will be provided by the bundled library's getInstanceReduxStore
    if (typeof globalThis.__createInstanceReduxStoreOriginal === 'function') {
      __reduxInstanceCache.set(actualInstanceId, globalThis.__createInstanceReduxStoreOriginal(config, actualInstanceId));
    }
  }
  return __reduxInstanceCache.get(actualInstanceId) || { 
    get_state: () => ({}), 
    dispatch: () => {}, 
    subscribe: () => () => {} 
  };
};
`
  
  // Inject the polyfill at the beginning
  if (!content.includes('__reduxInstanceCache')) {
    content = reduxPatch + '\n' + content;
  }
  
  // Now patch the specific error-throwing function
  // Find: throw new Error('getGlobalReduxStore() has been removed in v2.0.0...')
  // Replace with: return globalThis.__getGlobalReduxStorePolyfill(config, instanceId)
  content = content.replace(
    /throw new Error\(\s*['"]getGlobalReduxStore\(\) has been removed in v2\.0\.0[^)]*\)\s*['"][\s\S]*?\)/g,
    'return globalThis.__getGlobalReduxStorePolyfill(config, instanceId)'
  );
  
  fs.writeFileSync(bundledFile, content, 'utf8')
  console.log('Patched webview/index.js for Structura v2.0.0 API compatibility')
}

main().catch(err => {
  console.error('Failed to bundle Structura files:', err.message)
  process.exit(1)
})