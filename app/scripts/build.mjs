import * as esbuild from 'esbuild';
await esbuild.build({
  entryPoints: ['src/main.js'],
  bundle: true,
  outfile: 'www/app.js',
  format: 'iife',
  target: ['chrome80'],
  minify: true,
  loader: { '.woff': 'file', '.woff2': 'file', '.png': 'file' },
  assetNames: 'assets/[name]-[hash]',
  logLevel: 'info',
});
