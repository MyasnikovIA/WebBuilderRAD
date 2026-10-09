/* M2 SubActionVar — переменная SubAction. Невидим. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.subactionvar', tagName: 'component', cmptype: 'SubActionVar',
        caption: 'SubActionVar (M2)', subCategory: 'Data', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'SubActionVar');
            el.setAttribute('name', '');
            el.setAttribute('src', '');
            el.setAttribute('srctype', 'var');
            return el;
        },
        preview: null,

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name', caption: 'Name', type: 'string', attr: true },
            { type: 'separator', caption: 'SubActionVar' },
            { name: 'srctype',    caption: 'SrcType',    type: 'enum',    attr: true,
                values: ['', 'var', 'session', 'parent', 'const', 'const_server', 'exit_var', 'break_var'] },
            { name: 'src',        caption: 'Src',        type: 'string',  attr: true },
            { name: 'default',    caption: 'Default',    type: 'string',  attr: true },
            { name: 'get',        caption: 'Get',        type: 'string',  attr: true },
            { name: 'put',        caption: 'Put',        type: 'string',  attr: true },
            { name: 'property',   caption: 'Property',   type: 'string',  attr: true },
            { name: 'type',       caption: 'Type',       type: 'string',  attr: true },
            { name: 'len',        caption: 'Len',        type: 'number',  attr: true },
            { name: 'ignorenull', caption: 'IgnoreNull', type: 'boolean', attr: true }
        ],
        events: [], styles: []
    });

})(window);