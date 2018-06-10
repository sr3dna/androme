export default {
    input: './build/main.js',
    treeshake: false,
    output: {
        file: './dist/androme.js',
        name: 'androme',
        format: 'umd',
        sourcemap: 'inline'
    },
    watch: {
        include: './build/**',
        clearScreen: false
    }
};