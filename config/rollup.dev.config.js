import { version } from '../package.json';

export default {
    input: './src/main.js',
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