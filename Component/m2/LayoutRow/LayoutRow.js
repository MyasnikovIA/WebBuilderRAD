/* M2 LayoutRow — строка Layout. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.layoutrow', tagName: 'component', cmptype: 'LayoutRow',
        caption: 'LayoutRow (M2)', subCategory: 'Containers', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'LayoutRow');
            el.setAttribute('name', '');
            return el;
        },
        preview: null,

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true }
        ],
        events: [], styles: []
    });

})(window);