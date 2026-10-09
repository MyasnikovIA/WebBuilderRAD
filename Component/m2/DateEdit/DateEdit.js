/* M2 DateEdit — <component cmptype="DateEdit">. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    M2.register({
        id: 'm2.dateedit',
        tagName: 'component',
        cmptype: 'DateEdit',
        caption: 'DateEdit (M2)',
        subCategory: 'Controls',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'DateEdit');
            el.setAttribute('name', '');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-m2-dateedit';
            var inp = doc.createElement('input');
            inp.type = 'text';
            inp.readOnly = true;
            inp.disabled = true;
            inp.value = el.getAttribute('value') || 'дд.мм.гггг';
            inp.style.width = '90px';
            wrap.appendChild(inp);
            var cal = doc.createElement('span');
            cal.textContent = '📅';
            cal.style.marginLeft = '2px';
            wrap.appendChild(cal);
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

            { type: 'separator', caption: 'DateEdit' },
            { name: 'value',      caption: 'Value',      type: 'string',  attr: true },
            { name: 'readonly',   caption: 'ReadOnly',   type: 'boolean', attr: true },
            { name: 'shows_time', caption: 'Shows Time', type: 'boolean', attr: true }
        ],

        events: CS.EVENT_FIELDS.slice(),
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);