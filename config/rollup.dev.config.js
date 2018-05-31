import { version } from '../package.json';

export default {
    input: './src/layout.js',
    treeshake: false,
    output: {
        file: './dist/chrome-android-layout.js',
        name: 'android',
        format: 'umd',
        sourcemap: true,
        banner: `// chrome-android-layout: ${version}\n` +
                '// https://github.com/anpham6/chrome-android-layout\n'
    },
    watch: {
        include: './src/**',
        clearScreen: false
    }
};