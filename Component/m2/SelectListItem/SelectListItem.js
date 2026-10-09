/* M2 SelectListItem — чекбокс-элемент SelectList. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.selectlistitem', tagName: 'component', cmptype: 'SelectListItem',
        caption: 'SelectListItem (M2)', subCategory: 'Controls', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'SelectListItem');
            el.setAttribute('name', '');
            el.setAttribute('selectlist', '');
            el.setAttribute('fields', 'id,caption');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-m2-selectlistitem';
            var inp = doc.createElement('input');
            inp.type = 'checkbox';
            inp.disabled = true;
            inp.checked = el.getAttribute('state') === 'true';
            wrap.appendChild(inp);
            return wrap;
        },

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { type: 'separator', caption: 'SelectListItem' },
            { name: 'selectlist',   caption: 'SelectList Name', type: 'string',  attr: true },
            { name: 'fields',       caption: 'Fields',          type: 'string',  attr: true },
            { name: 'item_value',   caption: 'Item Value',      type: 'string',  attr: true },
            { name: 'item_caption', caption: 'Item Caption',    type: 'string',  attr: true },
            { name: 'state',        caption: 'State',           type: 'boolean', attr: true },
            { name: 'readonly',     caption: 'ReadOnly',        type: 'boolean', attr: true }
        ],
        events: [], styles: []
    });

})(window);