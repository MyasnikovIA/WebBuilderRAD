/* M2 Sort — хелпер сортировки. Невидим. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.sort', tagName: 'component', cmptype: 'Sort',
        caption: 'Sort (M2)', subCategory: 'Filters', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'Sort');
            el.setAttribute('name', '');
            return el;
        },
        preview: null,

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name', caption: 'Name', type: 'string', attr: true },
            { type: 'separator', caption: 'Sort' },
            { name: 'sortvalue', caption: 'Sort Value', type: 'string', attr: true },
            { name: 'sortitems', caption: 'Sort Items', type: 'string', attr: true }
        ],
        events: [], styles: []
    });

})(window);