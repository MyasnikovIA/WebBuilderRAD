/* M2 CheckBox — <component cmptype="CheckBox">. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    M2.register({
        id: 'm2.checkbox',
        tagName: 'component',
        cmptype: 'CheckBox',
        caption: 'CheckBox (M2)',
        subCategory: 'Controls',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'CheckBox');
            el.setAttribute('caption', 'CheckBox');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-m2-checkbox';
            var inp = doc.createElement('input');
            inp.type = 'checkbox';
            inp.disabled = true;
            inp.checked = el.getAttribute('checked') === 'true';
            var lbl = doc.createElement('span');
            lbl.textContent = el.getAttribute('caption') || '';
            lbl.style.marginLeft = '4px';
            wrap.appendChild(inp);
            wrap.appendChild(lbl);
            return wrap;
        },

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

            { type: 'separator', caption: 'CheckBox' },
            { name: 'caption',  caption: 'Caption',  type: 'string',  attr: true },
            { name: 'value',    caption: 'Value',    type: 'string',  attr: true },
            { name: 'checked',  caption: 'Checked',  type: 'boolean', attr: true },
            { name: 'readonly', caption: 'ReadOnly', type: 'boolean', attr: true }
        ],

        events: CS.EVENT_FIELDS.slice(),
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);