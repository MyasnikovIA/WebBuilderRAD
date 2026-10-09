/* M2 UnitEdit — контрол выбора из справочника. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.unitedit', tagName: 'component', cmptype: 'UnitEdit',
        caption: 'UnitEdit (M2)', subCategory: 'Controls', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'UnitEdit');
            el.setAttribute('name', '');
            el.setAttribute('unit', '');
            el.setAttribute('type', 'ButtonEdit');
            return el;
        },

        preview: function (el, doc) {
            var type = el.getAttribute('type') || 'ButtonEdit';
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-m2-unitedit';
            var inp = doc.createElement('input');
            inp.type = 'text';
            inp.readOnly = true;
            inp.disabled = true;
            inp.placeholder = type;
            inp.value = el.getAttribute('caption') || '';
            wrap.appendChild(inp);
            var badge = doc.createElement('span');
            badge.textContent = ' [' + type + ']';
            badge.style.fontSize = '10px';
            badge.style.color = '#888';
            wrap.appendChild(badge);
            return wrap;
        },

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { type: 'separator', caption: 'UnitEdit' },
            { name: 'type',        caption: 'Type',        type: 'enum',    attr: true,
                values: ['ButtonEdit', 'Edit', 'ComboBox', 'RadioGroup', 'FillingTextArea'] },
            { name: 'unit',        caption: 'Unit',        type: 'string',  attr: true },
            { name: 'method',      caption: 'Method',      type: 'string',  attr: true },
            { name: 'composition', caption: 'Composition', type: 'string',  attr: true },
            { name: 'readonly',    caption: 'ReadOnly',    type: 'boolean', attr: true },
            { name: 'multisel',    caption: 'Multi Select', type: 'boolean', attr: true }
        ],
        events: [], styles: []
    });

})(window);