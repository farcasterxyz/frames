import esbuild from 'esbuild'

esbuild.buildSync({
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  sourcemap: true,
  format: 'iife',
  target: 'esnext',
  globalName: 'frame', 
  outfile: 'dist/index.min.js'
})
