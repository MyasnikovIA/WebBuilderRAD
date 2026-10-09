/* M2 PopupMenu — <component cmptype="PopupMenu">. Невидим. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    M2.register({
        id: 'm2.popupmenu',
        tagName: 'component',
        cmptype: 'PopupMenu',
        caption: 'PopupMenu (M2)',
        subCategory: 'Menus',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'PopupMenu');
            el.setAttribute('name', '');
            return el;
        },

        preview: null,

        properties: [
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },

            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },

            { type: 'separator', caption: 'PopupMenu' },
            { name: 'popupobject', caption: 'Popup Object', type: 'string', attr: true },
            { name: 'join_menu',   caption: 'Join Menu',    type: 'string', attr: true },
            { name: 'autopopup',   caption: 'Auto Popup',   type: 'boolean', attr: true }
        ],

        events: CS.EVENT_FIELDS.slice(),
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);