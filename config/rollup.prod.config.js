import { version } from '../package.json';
import eslint from 'rollup-plugin-eslint';
import babel from 'rollup-plugin-babel';
import minify from 'rollup-plugin-babel-minify';

export default {
    input: './src/layout.js',
    treeshake: false,
    output: {
        file: './dist/chrome-android-layout.min.js',
        name: 'android',
        format: 'umd',
        banner: `/* chrome-android-layout: ${version} */`
    },
    plugins: [
        eslint(),
        babel({
            exclude: './node_modules/**'
        }),
        minify()
    ]
};