/* M2 Broker — вызов брокера. Невидим. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.broker', tagName: 'component', cmptype: 'Broker',
        caption: 'Broker (M2)', subCategory: 'Data', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'Broker');
            el.setAttribute('name', '');
            return el;
        },
        preview: null,

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },
            { type: 'separator', caption: 'Broker' },
            { name: 'mode',   caption: 'Mode',   type: 'enum',   attr: true, values: ['', 'post'] },
            { name: 'params', caption: 'Params', type: 'string', attr: true },
            { name: 'dbname', caption: 'DBName', type: 'string', attr: true }
        ],
        events: [], styles: []
    });

})(window);