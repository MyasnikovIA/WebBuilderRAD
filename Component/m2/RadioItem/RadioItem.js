/* M2 RadioItem — <component cmptype="RadioItem">. Опция RadioGroup. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    M2.register({
        id: 'm2.radioitem',
        tagName: 'component',
        cmptype: 'RadioItem',
        caption: 'RadioItem (M2)',
        subCategory: 'Controls',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'RadioItem');
            el.setAttribute('value', '');
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

            { type: 'separator', caption: 'RadioItem' },
            { name: 'value',    caption: 'Value',    type: 'string',  attr: true },
            { name: 'caption',  caption: 'Caption',  type: 'string',  attr: true },
            { name: 'checked',  caption: 'Checked',  type: 'boolean', attr: true },
            { name: 'readonly', caption: 'ReadOnly', type: 'boolean', attr: true }
        ],

        events: CS.EVENT_FIELDS.slice(),
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);