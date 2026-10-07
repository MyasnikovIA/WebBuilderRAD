/* cmpScript — JavaScript-код. Невидим на сцене, содержимое в CDATA. */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.script', tagName: 'cmpScript', caption: 'Script',
        cdata: '// JavaScript\n',
        cdataSchema: { caption: 'JavaScript' },
        properties: []
    });

})(window);