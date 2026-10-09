/* M2 ComboBox — <component cmptype="ComboBox">. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    M2.register({
        id: 'm2.combobox',
        tagName: 'component',
        cmptype: 'ComboBox',
        caption: 'ComboBox (M2)',
        subCategory: 'Controls',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'ComboBox');
            el.setAttribute('name', '');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-m2-combobox';
            var sel = doc.createElement('select');
            sel.disabled = true;
            var opt = doc.createElement('option');
            opt.textContent = el.getAttribute('caption') || el.getAttribute('value') || '(выбрать)';
            sel.appendChild(opt);
            var w = el.getAttribute('width');
            if (w) sel.style.width = /^\d+$/.test(w) ? w + 'px' : w;
            wrap.appendChild(sel);
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
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            { type: 'separator', caption: 'ComboBox' },
            { name: 'caption',  caption: 'Caption',  type: 'string',  attr: true },
            { name: 'value',    caption: 'Value',    type: 'string',  attr: true },
            { name: 'readonly', caption: 'ReadOnly', type: 'boolean', attr: true },
            { name: 'dataset',  caption: 'DataSet',  type: 'string',  attr: true }
        ],

        events: CS.EVENT_FIELDS.slice(),
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);