/* M2 FilterItem — поле фильтра. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.filteritem', tagName: 'component', cmptype: 'FilterItem',
        caption: 'FilterItem (M2)', subCategory: 'Filters', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'FilterItem');
            el.setAttribute('name', '');
            el.setAttribute('field', '');
            el.setAttribute('filterkind', 'text');
            el.setAttribute('caption', '');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-m2-filteritem';
            var cap = el.getAttribute('caption');
            if (cap) {
                var lbl = doc.createElement('span');
                lbl.textContent = cap + ':';
                lbl.style.marginRight = '4px';
                wrap.appendChild(lbl);
            }
            var inp = doc.createElement('input');
            inp.type = 'text';
            inp.readOnly = true;
            inp.disabled = true;
            inp.placeholder = el.getAttribute('filterkind') || 'text';
            wrap.appendChild(inp);
            return wrap;
        },

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string', attr: true },
            { name: 'width',   caption: 'Width',   type: 'string', attr: true },
            { name: 'height',  caption: 'Height',  type: 'string', attr: true },
            { type: 'separator', caption: 'Field' },
            { name: 'field',          caption: 'Field',          type: 'string', attr: true },
            { name: 'refreshdataset', caption: 'Refresh DataSet', type: 'string', attr: true },
            { name: 'not_append_ds',  caption: 'Not Append DS',  type: 'boolean', attr: true },
            { type: 'separator', caption: 'Filter' },
            { name: 'caption',    caption: 'Caption',    type: 'string', attr: true },
            { name: 'filterkind', caption: 'Filter Kind', type: 'enum',  attr: true,
                values: ['text', 'text_ext', 'numb', 'date', 'combo',
                    'periodnumb', 'perioddate', 'periodtime',
                    'unitedit', 'unitmulti', 'multi_hier', 'cmb_unit'] },
            { name: 'upper',      caption: 'Upper',      type: 'boolean', attr: true },
            { name: 'condition',  caption: 'Condition',  type: 'enum', attr: true,
                values: ['', 'none', 'eq', 'neq', 'gt', 'lt', 'gteq', 'lteq', 'like'] }
        ],
        events: [], styles: []
    });

})(window);