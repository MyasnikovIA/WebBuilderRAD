/* cmpSubActionVar — переменная вложенного действия.
   Разрешена ТОЛЬКО внутри cmpSubAction. */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.subactionvar', tagName: 'cmpSubActionVar', caption: 'SubActionVar',
        parentOnly: ['cmpsubaction'],
        attrs: { name: '', src: '', srctype: 'var' },
        properties: [
            { name: 'name',     caption: 'Name',     type: 'string', attr: true },
            { name: 'src',      caption: 'Src',      type: 'string', attr: true },
            { name: 'srctype',  caption: 'SrcType',  type: 'string', attr: true },
            { name: 'property', caption: 'Property', type: 'string', attr: true },
            { name: 'get',      caption: 'Get',      type: 'string', attr: true },
            { name: 'put',      caption: 'Put',      type: 'string', attr: true },
            { name: 'len',      caption: 'Len',      type: 'string', attr: true }
        ]
    });

})(window);