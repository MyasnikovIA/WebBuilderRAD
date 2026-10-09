/* M2 PopupGroupItem — группа пунктов PopupMenu. Невидим. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.popupgroupitem', tagName: 'component', cmptype: 'PopupGroupItem',
        caption: 'PopupGroupItem (M2)', subCategory: 'Menus', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'PopupGroupItem');
            el.setAttribute('name', '');
            return el;
        },
        preview: null,

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { type: 'separator', caption: 'PopupGroupItem' },
            { name: 'separator', caption: 'Separator', type: 'enum', attr: true,
                values: ['', 'before', 'after'] }
        ],
        events: [], styles: []
    });

})(window);