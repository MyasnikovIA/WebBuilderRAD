/* cmpAction — процедурный блок. Невидим на сцене. */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.action', tagName: 'cmpAction', caption: 'Action',
        attrs: { name: 'ActionName' },
        cdata: 'begin\n  null;\nend;\n',
        cdataSchema: { caption: 'PL/SQL' },
        properties: [
            { name: 'name',    caption: 'Name',    type: 'string', attr: true },
            { name: 'compile', caption: 'Compile', type: 'string', attr: true }
        ]
    });

})(window);