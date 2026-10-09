/* M2 Mask — <component cmptype="Mask">. Служебный, невидим. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    M2.register({
        id: 'm2.mask',
        tagName: 'component',
        cmptype: 'Mask',
        caption: 'Mask (M2)',
        subCategory: 'Controls',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'Mask');
            el.setAttribute('name', '');
            el.setAttribute('controls', '');
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

            { type: 'separator', caption: 'Mask' },
            { name: 'controls', caption: 'Controls (names via ;)', type: 'string', attr: true }
        ],

        events: [],
        styles: []
    });

})(window);