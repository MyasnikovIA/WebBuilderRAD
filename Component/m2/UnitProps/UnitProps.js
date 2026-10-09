/* M2 UnitProps — таблица дополнительных свойств. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.unitprops', tagName: 'component', cmptype: 'UnitProps',
        caption: 'UnitProps (M2)', subCategory: 'Controls', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'UnitProps');
            el.setAttribute('name', '');
            el.setAttribute('unit', '');
            el.setAttribute('unitid_varname', 'id');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-m2-unitprops';
            var t = doc.createElement('table');
            t.style.borderCollapse = 'collapse';
            for (var r = 0; r < 3; r++) {
                var tr = doc.createElement('tr');
                var td1 = doc.createElement('td');
                td1.textContent = 'Свойство ' + (r + 1) + ':';
                td1.style.border = '1px solid #ddd';
                td1.style.padding = '2px 6px';
                td1.style.background = '#f5f5f5';
                var td2 = doc.createElement('td');
                td2.innerHTML = '<input type="text" disabled placeholder="…">';
                td2.style.border = '1px solid #ddd';
                td2.style.padding = '2px 6px';
                tr.appendChild(td1);
                tr.appendChild(td2);
                t.appendChild(tr);
            }
            wrap.appendChild(t);
            return wrap;
        },

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { type: 'separator', caption: 'UnitProps' },
            { name: 'unit',           caption: 'Unit',           type: 'string', attr: true },
            { name: 'subunit',        caption: 'SubUnit',        type: 'string', attr: true },
            { name: 'unitid_varname', caption: 'UnitID Varname', type: 'string', attr: true },
            { name: 'label_width',    caption: 'Label Width',    type: 'string', attr: true },
            { name: 'value_width',    caption: 'Value Width',    type: 'string', attr: true }
        ],
        events: [], styles: []
    });

})(window);