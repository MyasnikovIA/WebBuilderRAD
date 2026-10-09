/* M2 Edit — компонент <component cmptype="Edit">.

   Регистрация через M2.register — попадает в категорию M2. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    M2.register({
        id: 'm2.edit',
        tagName: 'component',
        cmptype: 'Edit',
        caption: 'Edit (M2)',
        subCategory: 'Controls',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'Edit');
            el.setAttribute('name', '');
            return el;
        },

        preview: function (el, doc) {
            var inp = doc.createElement('input');
            inp.type = 'text';
            inp.className = 'd3-preview-m2-edit';
            inp.readOnly = true;
            inp.value = el.getAttribute('value') || '';
            inp.placeholder = el.getAttribute('placeholder') || '';

            var w = el.getAttribute('width');
            if (w) inp.style.width = /^\d+$/.test(w) ? w + 'px' : w;
            if (el.getAttribute('enabled') === 'false') inp.disabled = true;
            if (el.getAttribute('readonly') === 'true') inp.readOnly = true;
            return inp;
        },

        properties: [
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },
            { name: 'title', caption: 'Title', type: 'string', attr: true },

            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },

            { type: 'separator', caption: 'Edit' },
            { name: 'value',       caption: 'Value',       type: 'string',  attr: true },
            { name: 'width',       caption: 'Width',       type: 'string',  attr: true },
            { name: 'maxlength',   caption: 'Max Length',  type: 'number',  attr: true },
            { name: 'readonly',    caption: 'Read Only',   type: 'boolean', attr: true },
            { name: 'emptyMask',   caption: 'Empty Mask',  type: 'boolean', attr: true },
            { name: 'typeMask',    caption: 'Type Mask',   type: 'enum',    attr: true,
                values: ['', 'text', 'int', 'float', 'date', 'time'] },
            { name: 'placeholder', caption: 'Placeholder', type: 'string',  attr: true }
        ],

        events: CS.EVENT_FIELDS.slice(),

        styles: CS.STYLE_FIELDS.slice()
    });

})(window);