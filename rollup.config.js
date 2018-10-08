import { version } from './package.json';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';

export default [
    {
        input: './build/main.js',
        treeshake: false,
        output: {
            file: './dist/androme.js',
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
        input: './build/main.js',
        treeshake: false,
        output: {
            file: './dist/androme.min.js',
            name: 'androme',
            format: 'iife'
        },
        plugins: [
            babel(),
            terser()
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
            terser()
        ]
    }
];