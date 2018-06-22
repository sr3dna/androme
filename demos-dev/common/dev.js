let androme = null;

SystemJS.config({
    packages: {
        '/build': { defaultExtension: 'js' }
    },
    map: {
        'plugin-babel': '/node_modules/systemjs-plugin-babel/plugin-babel.js',
        'systemjs-babel-build': '/node_modules/systemjs-plugin-babel/systemjs-babel-browser.js'
    },
    transpiler: 'plugin-babel'
});

function copy(id) {
    const element = document.getElementById(id);
    const range = document.createRange();
    range.selectNode(element);
    window.getSelection().addRange(range);
    document.execCommand('copy');
    setTimeout(function() {
        window.getSelection().removeAllRanges()
    }, 100);
}