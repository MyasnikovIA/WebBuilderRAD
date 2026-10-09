/* M2 FetchVar — переменная Fetch. Невидим. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.fetchvar', tagName: 'component', cmptype: 'FetchVar',
        caption: 'FetchVar (M2)', subCategory: 'Data', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'FetchVar');
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
                    'data', 'const', 'const_server'] },
            { type: 'separator', caption: 'Binding' },
            { name: 'get',        caption: 'Get',        type: 'string',  attr: true },
            { name: 'put',        caption: 'Put',        type: 'string',  attr: true },
            { name: 'type',       caption: 'Type',       type: 'enum',    attr: true,
                values: ['', 'string', 'integer', 'number', 'boolean', 'date', 'path'] },
            { name: 'query_type', caption: 'Query Type', type: 'enum',    attr: true,
                values: ['', 'path', 'filter', 'body'] },
            { name: 'default',    caption: 'Default',    type: 'string',  attr: true },
            { name: 'ignorenull', caption: 'Ignore Null', type: 'boolean', attr: true },
            { name: 'len',        caption: 'Length',     type: 'number',  attr: true }
        ],
        events: [], styles: []
    });

})(window);