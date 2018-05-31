import { version } from '../package.json';
import eslint from 'rollup-plugin-eslint';
import babel from 'rollup-plugin-babel';
import minify from 'rollup-plugin-babel-minify';

export default [
    {
        input: './src/layout.js',
        treeshake: false,
        output: {
            file: './dist/androme.min.js',
            name: 'androme',
            format: 'umd',
            banner: `/* androme: ${version} */`
        },
        plugins: [
            eslint(),
            babel({
                exclude: './node_modules/**'
            }),
            minify()
        ]
    },
    {
        input: './src/layout.js',
        treeshake: false,
        output: {
            file: './dist/androme.js',
            name: 'androme',
            format: 'umd',
            banner: `/* androme: ${version}\n   https://github.com/anpham6/androme */\n`
        },
        plugins: [
            eslint()
        ]
    }
];