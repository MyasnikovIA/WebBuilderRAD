/* M2 StatGridFooter — подвал StatGrid. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.statgridfooter', tagName: 'component', cmptype: 'StatGridFooter',
        caption: 'StatGridFooter (M2)', subCategory: 'Grids', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'StatGridFooter');
            el.setAttribute('separate', 'false');
            return el;
        },
        preview: null,

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name', caption: 'Name', type: 'string', attr: true },
            { type: 'separator', caption: 'StatGridFooter' },
            { name: 'separate', caption: 'Separate', type: 'boolean', attr: true },
            { name: 'height',   caption: 'Height',   type: 'number',  attr: true }
        ],
        events: [], styles: []
    });

})(window);