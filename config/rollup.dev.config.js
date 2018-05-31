import { version } from '../package.json';

export default {
    input: './src/layout.js',
    treeshake: false,
    output: {
        file: './dist/androme.js',
        name: 'androme',
        format: 'umd',
        sourcemap: 'inline'
    },
    watch: {
        include: './src/**',
        clearScreen: false
    }
};