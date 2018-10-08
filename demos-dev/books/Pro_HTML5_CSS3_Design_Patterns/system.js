var lib = null;
var androme = null;

System.config({
    packages: {
        '/build': { defaultExtension: 'js' }
    },
    map: {
        'plugin-babel': '/node_modules/systemjs-plugin-babel/plugin-babel.js',
        'systemjs-babel-build': '/node_modules/systemjs-plugin-babel/systemjs-babel-browser.js'
    },
    meta: {
       '*.js': {
           babelOptions: {
               es2015: false
           }
       }
   },
   transpiler: 'plugin-babel'
});

System.import('/build/lib.js').then((result) => {
    lib = result;
    Promise.all([
        System.import('/build/core.js'),
        System.import('/build/android/main.js')
    ]).then((modules) => {
        androme = modules[0];
        androme.setFramework(modules[1]['default']);
        androme.parseDocument().then(function() {
            androme.close();
            androme.saveAllToDisk();
        });
    });
});