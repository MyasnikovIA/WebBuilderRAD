/* cmpScript — JavaScript-код. Невидим на сцене. */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.script', tagName: 'cmpScript', caption: 'Script',
        icon: 'images/icon.png',
        cdata: '// JavaScript\n',
        cdataSchema: { caption: 'JavaScript' },
        properties: []
    });

})(window);