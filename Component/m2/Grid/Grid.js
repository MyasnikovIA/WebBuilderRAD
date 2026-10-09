/* M2 Grid — <component cmptype="Grid">. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    M2.register({
        id: 'm2.grid',
        tagName: 'component',
        cmptype: 'Grid',
        caption: 'Grid (M2)',
        subCategory: 'Grids',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'Grid');
            el.setAttribute('name', '');
            el.setAttribute('caption', 'Grid');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-m2-grid';
            var cap = doc.createElement('div');
            cap.textContent = el.getAttribute('caption') || 'Grid';
            cap.style.fontWeight = 'bold';
            cap.style.background = '#eee';
            cap.style.padding = '4px';
            wrap.appendChild(cap);
            var table = doc.createElement('table');
            table.style.borderCollapse = 'collapse';
            table.style.width = '100%';
            var thead = doc.createElement('thead');
            var trh = doc.createElement('tr');
            ['Col1', 'Col2', 'Col3'].forEach(function (t) {
                var th = doc.createElement('th');
                th.textContent = t;
                th.style.border = '1px solid #ccc';
                th.style.padding = '2px 6px';
                th.style.background = '#f5f5f5';
                trh.appendChild(th);
            });
            thead.appendChild(trh);
            table.appendChild(thead);
            var tbody = doc.createElement('tbody');
            for (var r = 0; r < 3; r++) {
                var tr = doc.createElement('tr');
                for (var c = 0; c < 3; c++) {
                    var td = doc.createElement('td');
                    td.style.border = '1px solid #eee';
                    td.style.padding = '2px 6px';
                    td.innerHTML = '&nbsp;';
                    tr.appendChild(td);
                }
                tbody.appendChild(tr);
            }
            table.appendChild(tbody);
            wrap.appendChild(table);
            return wrap;
        },

        properties: [
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },

            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'caption', caption: 'Caption', type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            { type: 'separator', caption: 'Grid' },
            { name: 'dataset',     caption: 'DataSet',     type: 'string', attr: true },
            { name: 'keyfield',    caption: 'KeyField',    type: 'string', attr: true },
            { name: 'returnfield', caption: 'ReturnField', type: 'string', attr: true }
        ],

        events: CS.EVENT_FIELDS.slice(),
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);