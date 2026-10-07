/* cmpSubAction — вложенное действие.
   Разрешено внутри cmpAction ИЛИ другого cmpSubAction. */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.subaction', tagName: 'cmpSubAction', caption: 'SubAction',
        icon: 'images/icon.png',
        parentOnly: ['cmpaction', 'cmpsubaction'],
        attrs: { name: '', repeatername: '', execon: 'each', action: '' },
        properties: [
            { name: 'name',         caption: 'Name',         type: 'string', attr: true },
            { name: 'repeatername', caption: 'RepeaterName', type: 'string', attr: true },
            { name: 'execon',       caption: 'ExecOn',       type: 'string', attr: true },
            { name: 'action',       caption: 'Action',       type: 'string', attr: true },
            { name: 'compile',      caption: 'Compile',      type: 'string', attr: true },
            D3.cdataProp('PL/SQL')
        ]
    });

})(window);