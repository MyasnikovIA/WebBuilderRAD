/* M2 PopupItem — <component cmptype="PopupItem">. Пункт меню. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    M2.register({
        id: 'm2.popupitem',
        tagName: 'component',
        cmptype: 'PopupItem',
        caption: 'PopupItem (M2)',
        subCategory: 'Menus',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'PopupItem');
            el.setAttribute('name', '');
            el.setAttribute('caption', '');
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
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },

            { type: 'separator', caption: 'PopupItem' },
            { name: 'caption',  caption: 'Caption («-» = separator)', type: 'string',  attr: true },
            { name: 'icon',     caption: 'Icon URL',                  type: 'string',  attr: true },
            { name: 'std_icon', caption: 'Std Icon',                  type: 'string',  attr: true },
            { name: 'default',  caption: 'Default',                   type: 'boolean', attr: true }
        ],

        events: CS.EVENT_FIELDS.slice(),
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);