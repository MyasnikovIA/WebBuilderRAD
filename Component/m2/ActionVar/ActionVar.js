/* M2 ActionVar — переменная действия. Невидим. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    M2.register({
        id: 'm2.actionvar', tagName: 'component', cmptype: 'ActionVar',
        caption: 'ActionVar (M2)', subCategory: 'Data', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'ActionVar');
            el.setAttribute('name', '');
            el.setAttribute('src', '');
            el.setAttribute('srctype', 'var');
            return el;
        },
        preview: null,

        properties: [
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name', caption: 'Name', type: 'string', attr: true },
            { type: 'separator', caption: 'ActionVar' },
            { name: 'srctype', caption: 'SrcType', type: 'enum', attr: true,
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