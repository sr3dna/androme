import { version } from './package.json';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';

export default [
    {
        input: '../../../../build/android/extension/widget/bottomnavigation/main.js',
        treeshake: true,
        output: {
            file: '../../../../dist/extensions/android.widget.bottomnavigation.js',
            name: 'android.widget.bottomnavigation',
            format: 'iife',
            banner: `/* android.widget ${version}\n   https://github.com/anpham6/androme */\n`
        }
    },
    {
        input: '../../../..//build/android/extension/widget/bottomnavigation/main.js',
        treeshake: true,
        output: {
            file: '../../../../dist/extensions/android.widget.bottomnavigation.min.js',
            name: 'android.widget.bottomnavigation',
            format: 'iife'
        },
        plugins: [
            babel(),
            terser({
                compress: {
                    pure_getters: true,
                    unsafe: true
                }
            })
        ]
    },
    {
        input: '../../../../build/android/extension/widget/coordinator/main.js',
        treeshake: true,
        output: {
            file: '../../../../dist/extensions/android.widget.coordinator.js',
            name: 'android.widget.coordinator',
            format: 'iife',
            banner: `/* android.widget ${version}\n   https://github.com/anpham6/androme */\n`
        }
    },
    {
        input: '../../../../build/android/extension/widget/coordinator/main.js',
        treeshake: true,
        output: {
            file: '../../../../dist/extensions/android.widget.coordinator.min.js',
            name: 'android.widget.coordinator',
            format: 'iife'
        },
        plugins: [
            babel(),
            terser({
                compress: {
                    pure_getters: true,
                    unsafe: true
                }
            })
        ]
    },
    {
        input: '../../../../build/android/extension/widget/drawer/main.js',
        treeshake: true,
        output: {
            file: '../../../../dist/extensions/android.widget.drawer.js',
            name: 'android.widget.drawer',
            format: 'iife',
            banner: `/* android.widget ${version}\n   https://github.com/anpham6/androme */\n`
        }
    },
    {
        input: '../../../../build/android/extension/widget/drawer/main.js',
        treeshake: true,
        output: {
            file: '../../../../dist/extensions/android.widget.drawer.min.js',
            name: 'android.widget.drawer',
            format: 'iife'
        },
        plugins: [
            babel(),
            terser({
                compress: {
                    pure_getters: true,
                    unsafe: true
                }
            })
        ]
    },
    {
        input: '../../../../build/android/extension/widget/floatingactionbutton/main.js',
        treeshake: true,
        output: {
            file: '../../../../dist/extensions/android.widget.floatingactionbutton.js',
            name: 'android.widget.floatingactionbutton',
            format: 'iife',
            banner: `/* android.widget ${version}\n   https://github.com/anpham6/androme */\n`
        }
    },
    {
        input: '../../../../build/android/extension/widget/floatingactionbutton/main.js',
        treeshake: true,
        output: {
            file: '../../../../dist/extensions/android.widget.floatingactionbutton.min.js',
            name: 'android.widget.floatingactionbutton',
            format: 'iife'
        },
        plugins: [
            babel(),
            terser({
                compress: {
                    pure_getters: true,
                    unsafe: true
                }
            })
        ]
    },
    {
        input: '../../../../build/android/extension/widget/menu/main.js',
        treeshake: true,
        output: {
            file: '../../../../dist/extensions/android.widget.menu.js',
            name: 'android.widget.menu',
            format: 'iife',
            banner: `/* android.widget ${version}\n   https://github.com/anpham6/androme */\n`
        }
    },
    {
        input: '../../../../build/android/extension/widget/menu/main.js',
        treeshake: true,
        output: {
            file: '../../../../dist/extensions/android.widget.menu.min.js',
            name: 'android.widget.menu',
            format: 'iife'
        },
        plugins: [
            babel(),
            terser({
                compress: {
                    pure_getters: true,
                    unsafe: true
                }
            })
        ]
    },
    {
        input: '../../../../build/android/extension/widget/toolbar/main.js',
        treeshake: true,
        output: {
            file: '../../../../dist/extensions/android.widget.toolbar.js',
            name: 'android.widget.toolbar',
            format: 'iife',
            banner: `/* android.widget ${version}\n   https://github.com/anpham6/androme */\n`
        }
    },
    {
        input: '../../../../build/android/extension/widget/toolbar/main.js',
        treeshake: true,
        output: {
            file: '../../../../dist/extensions/android.widget.toolbar.min.js',
            name: 'android.widget.toolbar',
            format: 'iife'
        },
        plugins: [
            babel(),
            terser({
                compress: {
                    pure_getters: true,
                    unsafe: true
                }
            })
        ]
    }
];