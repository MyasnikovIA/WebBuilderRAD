/* cmpUnitEdit — поле выбора из справочника. */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.unitedit', tagName: 'cmpUnitEdit', caption: 'UnitEdit',
        icon: 'images/icon.png',
        attrs: { name: '', unit: '', width: '100%' },
        preview: function (el, doc) {
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-unitedit';
            var inp = doc.createElement('input');
            inp.type = 'text';
            inp.readOnly = true;
            inp.value = el.getAttribute('unit') || '';
            inp.style.width = el.getAttribute('width') || '100%';
            wrap.appendChild(inp);
            return wrap;
        },
        properties: [
            { name: 'name',          caption: 'Name',         type: 'string', attr: true },
            { name: 'unit',          caption: 'Unit',         type: 'string', attr: true },
            { name: 'composition',   caption: 'Composition',  type: 'string', attr: true },
            { name: 'width',         caption: 'Width',        type: 'string', attr: true },
            { name: 'multisel',      caption: 'MultiSel',     type: 'string', attr: true },
            { name: 'readonly',      caption: 'ReadOnly',     type: 'string', attr: true },
            { name: 'clearbutton',   caption: 'ClearButton',  type: 'string', attr: true },
            { name: 'is_mis',        caption: 'IsMis',        type: 'string', attr: true },
            { name: 'type',          caption: 'Type',         type: 'string', attr: true },
            { name: 'custom_filter', caption: 'CustomFilter', type: 'string', attr: true }
        ]
    });

})(window);