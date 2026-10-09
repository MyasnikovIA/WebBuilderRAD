/* M2 Fetch — HTTP-запрос. Невидим. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.fetch', tagName: 'component', cmptype: 'Fetch',
        caption: 'Fetch (M2)', subCategory: 'Data', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'Fetch');
            el.setAttribute('name', '');
            el.setAttribute('service', '');
            el.setAttribute('uri', '');
            el.setAttribute('method', 'GET');
            return el;
        },
        preview: null,

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name', caption: 'Name', type: 'string', attr: true },
            { type: 'separator', caption: 'Fetch' },
            { name: 'service', caption: 'Service', type: 'string', attr: true },
            { name: 'uri',     caption: 'URI',     type: 'string', attr: true },
            { name: 'method',  caption: 'Method',  type: 'enum',   attr: true,
                values: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
            { type: 'separator', caption: 'Target' },
            { name: 'action',  caption: 'Action',  type: 'string', attr: true },
            { name: 'dataset', caption: 'DataSet', type: 'string', attr: true },
            { name: 'module',  caption: 'Module',  type: 'string', attr: true },
            { type: 'separator', caption: 'Handlers' },
            { name: 'preprocessor',  caption: 'Preprocessor',  type: 'string', attr: true },
            { name: 'postprocessor', caption: 'Postprocessor', type: 'string', attr: true }
        ],
        events: [], styles: []
    });

})(window);