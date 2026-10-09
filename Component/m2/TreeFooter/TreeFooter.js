/* M2 TreeFooter — подвал Tree. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.treefooter', tagName: 'component', cmptype: 'TreeFooter',
        caption: 'TreeFooter (M2)', subCategory: 'Grids', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'TreeFooter');
            el.setAttribute('separate', 'false');
            return el;
        },
        preview: null,

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name', caption: 'Name', type: 'string', attr: true },
            { type: 'separator', caption: 'TreeFooter' },
            { name: 'separate', caption: 'Separate', type: 'boolean', attr: true },
            { name: 'height',   caption: 'Height',   type: 'number',  attr: true }
        ],
        events: [], styles: []
    });

})(window);