/* M2 Module — вызов серверного модуля. Невидим. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.module', tagName: 'component', cmptype: 'Module',
        caption: 'Module (M2)', subCategory: 'Data', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'Module');
            el.setAttribute('name', '');
            el.setAttribute('module', '');
            el.setAttribute('method', 'exec');
            el.setAttribute('async', 'false');
            return el;
        },
        preview: null,

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name', caption: 'Name', type: 'string', attr: true },
            { type: 'separator', caption: 'Module' },
            { name: 'module', caption: 'Module', type: 'string',  attr: true },
            { name: 'method', caption: 'Method', type: 'string',  attr: true },
            { name: 'async',  caption: 'Async',  type: 'boolean', attr: true }
        ],
        events: [], styles: []
    });

})(window);