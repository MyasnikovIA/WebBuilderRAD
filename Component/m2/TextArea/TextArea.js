/* M2 TextArea — <component cmptype="TextArea">. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    M2.register({
        id: 'm2.textarea',
        tagName: 'component',
        cmptype: 'TextArea',
        caption: 'TextArea (M2)',
        subCategory: 'Controls',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'TextArea');
            el.setAttribute('name', '');
            el.setAttribute('rows', '3');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-m2-textarea';
            var ta = doc.createElement('textarea');
            ta.readOnly = true;
            ta.disabled = true;
            var rows = parseInt(el.getAttribute('rows'), 10);
            if (!isNaN(rows) && rows > 0) ta.rows = rows;
            ta.value = el.getAttribute('value') || '';
            ta.placeholder = el.getAttribute('placeholder') || '';
            wrap.appendChild(ta);
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

            { type: 'separator', caption: 'TextArea' },
            { name: 'value',       caption: 'Value',       type: 'string',  attr: true },
            { name: 'placeholder', caption: 'Placeholder', type: 'string',  attr: true },
            { name: 'rows',        caption: 'Rows',        type: 'number',  attr: true },
            { name: 'cols',        caption: 'Cols',        type: 'number',  attr: true },
            { name: 'readonly',    caption: 'ReadOnly',    type: 'boolean', attr: true },
            { name: 'maxlength',   caption: 'MaxLength',   type: 'number',  attr: true }
        ],

        events: CS.EVENT_FIELDS.slice(),
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);