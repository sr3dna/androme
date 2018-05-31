export default {
    input: './src/layout.js',
    treeshake: false,
    output: {
        file: './dist/chrome-android-layout.js',
        name: 'android',
        format: 'umd',
        sourcemap: true
    },
    watch: {
        include: './src/**',
        clearScreen: false
    }
};