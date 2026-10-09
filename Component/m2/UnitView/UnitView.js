/* M2 UnitView — контрол отображения раздела. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.unitview', tagName: 'component', cmptype: 'UnitView',
        caption: 'UnitView (M2)', subCategory: 'Controls', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'UnitView');
            el.setAttribute('name', '');
            el.setAttribute('unit', '');
            el.setAttribute('show_method', '');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-m2-unitview';
            wrap.style.border = '1px solid #ccc';
            wrap.style.padding = '6px';
            var cap = doc.createElement('div');
            cap.textContent = 'UnitView: ' + (el.getAttribute('unit') || '?') +
                '.' + (el.getAttribute('show_method') || '?');
            cap.style.fontWeight = 'bold';
            cap.style.marginBottom = '4px';
            wrap.appendChild(cap);
            var t = doc.createElement('table');
            t.style.borderCollapse = 'collapse';
            t.style.width = '100%';
            var trh = doc.createElement('tr');
            ['Col1', 'Col2', 'Col3'].forEach(function (h) {
                var th = doc.createElement('th');
                th.textContent = h;
                th.style.border = '1px solid #ddd';
                th.style.padding = '2px 6px';
                th.style.background = '#f0f0f0';
                trh.appendChild(th);
            });
            t.appendChild(trh);
            for (var r = 0; r < 3; r++) {
                var tr = doc.createElement('tr');
                for (var c = 0; c < 3; c++) {
                    var td = doc.createElement('td');
                    td.style.border = '1px solid #eee';
                    td.style.padding = '2px 6px';
                    td.innerHTML = '&nbsp;';
                    tr.appendChild(td);
                }
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
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },
            { type: 'separator', caption: 'UnitView' },
            { name: 'unit',        caption: 'Unit',        type: 'string', attr: true },
            { name: 'show_method', caption: 'Show Method', type: 'string', attr: true },
            { name: 'excel',       caption: 'Excel',       type: 'boolean', attr: true },
            { name: 'selectlist',  caption: 'SelectList',  type: 'boolean', attr: true }
        ],
        events: [], styles: []
    });

})(window);