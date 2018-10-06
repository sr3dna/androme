import { version } from './package.json';
import babel from 'rollup-plugin-babel';
import minify from 'rollup-plugin-babel-minify';

export default [
    {
        input: './build/main.js',
        treeshake: true,
        output: {
            file: './dist/androme.min.js',
            name: 'androme',
            format: 'umd',
            banner: `/* androme ${version} https://github.com/anpham6/androme */`
        },
        plugins: [
            babel(),
            minify()
        ]
    },
    {
        input: './build/main.js',
        treeshake: true,
        output: {
            file: './dist/androme.js',
            name: 'androme',
            format: 'umd',
            banner: `/* androme ${version}\n   https://github.com/anpham6/androme */\n`
        }
    },
    {
        input: './build/android/main.js',
        treeshake: true,
        output: {
            file: './dist/android.framework.min.js',
            name: 'android',
            format: 'umd'
        },
        plugins: [
            babel(),
            minify()
        ]
    },
    {
        input: './build/android/main.js',
        treeshake: true,
        output: {
            file: './dist/android.framework.js',
            name: 'android',
            format: 'umd'
        }
    }
];