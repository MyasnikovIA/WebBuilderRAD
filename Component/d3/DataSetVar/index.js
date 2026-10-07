/* cmpDataSetVar — переменная выборки. Только внутри cmpDataSet. */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.datasetvar', tagName: 'cmpDataSetVar', caption: 'DataSetVar',
        icon: 'images/icon.png',
        parentOnly: 'cmpdataset',
        attrs: { name: '', src: '', srctype: 'var' },
        properties: [
            { name: 'name',    caption: 'Name',    type: 'string', attr: true },
            { name: 'src',     caption: 'Src',     type: 'string', attr: true },
            { name: 'srctype', caption: 'SrcType', type: 'string', attr: true }
        ]
    });

})(window);