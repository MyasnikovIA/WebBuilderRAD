/* M2 ModuleVar — переменная модуля. Невидим. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.modulevar', tagName: 'component', cmptype: 'ModuleVar',
        caption: 'ModuleVar (M2)', subCategory: 'Data', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'ModuleVar');
            el.setAttribute('name', '');
            el.setAttribute('src', '');
            el.setAttribute('srctype', 'var');
            return el;
        },
        preview: null,

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string', attr: true },
            { name: 'src',     caption: 'Src',     type: 'string', attr: true },
            { name: 'srctype', caption: 'SrcType', type: 'enum',   attr: true,
                values: ['', 'var', 'ctrl', 'ctrlcaption', 'session',
                    'const', 'const_server', 'parent', 'data',
                    'exit_var', 'break_var'] },
            { type: 'separator', caption: 'Binding' },
            { name: 'get',        caption: 'Get',        type: 'string',  attr: true },
            { name: 'put',        caption: 'Put',        type: 'string',  attr: true },
            { name: 'type',       caption: 'Type',       type: 'enum',    attr: true,
                values: ['', 'string', 'integer', 'number', 'boolean', 'date'] },
            { name: 'query_type', caption: 'Query Type', type: 'enum',    attr: true,
                values: ['', 'path', 'filter', 'body'] },
            { name: 'default',    caption: 'Default',    type: 'string',  attr: true },
            { name: 'ignorenull', caption: 'Ignore Null', type: 'boolean', attr: true }
        ],
        events: [], styles: []
    });

})(window);