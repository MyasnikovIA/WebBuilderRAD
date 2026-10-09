/* M2 FieldSet — <component cmptype="FieldSet">. Контейнер с заголовком. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    M2.register({
        id: 'm2.fieldset',
        tagName: 'component',
        cmptype: 'FieldSet',
        caption: 'FieldSet (M2)',
        subCategory: 'Containers',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'FieldSet');
            el.setAttribute('caption', 'FieldSet');
            return el;
        },

        preview: function (el, doc) {
            var fs = doc.createElement('fieldset');
            fs.style.border = '1px solid #ccc';
            fs.style.padding = '6px';
            fs.style.margin = '4px';
            var lg = doc.createElement('legend');
            lg.textContent = el.getAttribute('caption') || 'FieldSet';
            fs.appendChild(lg);
            var ph = doc.createElement('div');
            ph.style.color = '#999';
            ph.style.fontStyle = 'italic';
            ph.textContent = '(contents)';
            fs.appendChild(ph);
            return fs;
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

            { type: 'separator', caption: 'FieldSet' },
            { name: 'caption', caption: 'Caption', type: 'string', attr: true }
        ],

        events: CS.EVENT_FIELDS.slice(),
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);