import { version } from './package.json';
import babel from 'rollup-plugin-babel';
import minify from 'rollup-plugin-babel-minify';

export default [
    {
        input: './build/lib.js',
        treeshake: false,
        output: {
            file: './dist/androme.lib.js',
            name: 'lib',
            format: 'iife',
            banner: `/* androme ${version}\n   https://github.com/anpham6/androme */\n`
        }
    },
    {
        input: './build/core.js',
        treeshake: true,
        output: {
            file: './dist/androme.core.js',
            name: 'androme',
            format: 'iife',
            banner: `/* androme ${version}\n   https://github.com/anpham6/androme */\n`
        }
    },
    {
        input: './build/android/main.js',
        treeshake: true,
        output: {
            file: './dist/android.framework.js',
            name: 'android',
            format: 'iife',
            banner: `/* androme ${version}\n   https://github.com/anpham6/androme */\n`
        }
    },
    {
        input: './build/lib.js',
        treeshake: false,
        output: {
            file: './dist/androme.lib.min.js',
            name: 'lib',
            format: 'iife'
        },
        plugins: [
            babel(),
            minify()
        ]
    },
    {
        input: './build/core.js',
        treeshake: true,
        output: {
            file: './dist/androme.core.min.js',
            name: 'androme',
            format: 'iife'
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
            file: './dist/android.framework.min.js',
            name: 'android',
            format: 'iife'
        },
        plugins: [
            babel(),
            minify()
        ]
    }
];