// rollup.config.js
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

export default {
  input: 'src/CommandPalette.js',
  output: {
    file: 'dist/index.js',
    format: 'es'
  },
  plugins: [
      babel()
    // resolve(),
    // babel({
    //   exclude: 'node_modules/**' // 只编译我们的源代码
    // })
  ]
}