/* M2 StatGrid — аналитический Grid. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.statgrid', tagName: 'component', cmptype: 'StatGrid',
        caption: 'StatGrid (M2)', subCategory: 'Grids', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'StatGrid');
            el.setAttribute('name', '');
            el.setAttribute('dataset', '');
            el.setAttribute('caption', 'StatGrid');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-m2-statgrid';
            var cap = doc.createElement('div');
            cap.textContent = el.getAttribute('caption') || 'StatGrid';
            cap.style.fontWeight = 'bold';
            cap.style.background = '#eee';
            cap.style.padding = '4px';
            wrap.appendChild(cap);
            var t = doc.createElement('table');
            t.style.borderCollapse = 'collapse';
            t.style.width = '100%';
            var trh = doc.createElement('tr');
            ['G1', 'V1', 'V2', 'Σ'].forEach(function (h) {
                var th = doc.createElement('th');
                th.textContent = h;
                th.style.border = '1px solid #ccc';
                th.style.padding = '2px 6px';
                th.style.background = '#f5f5f5';
                trh.appendChild(th);
            });
            t.appendChild(trh);
            for (var r = 0; r < 2; r++) {
                var tr = doc.createElement('tr');
                for (var c = 0; c < 4; c++) {
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
            { name: 'caption', caption: 'Caption', type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },
            { type: 'separator', caption: 'Data' },
            { name: 'dataset',     caption: 'DataSet',     type: 'string', attr: true },
            { name: 'keyfield',    caption: 'KeyField',    type: 'string', attr: true },
            { name: 'returnfield', caption: 'ReturnField', type: 'string', attr: true },
            { type: 'separator', caption: 'StatGrid' },
            { name: 'excel',      caption: 'Excel Export', type: 'boolean', attr: true },
            { name: 'activerow',  caption: 'Active Row',   type: 'boolean', attr: true },
            { name: 'showfilter', caption: 'Show Filter',  type: 'boolean', attr: true },
            { name: 'use_sort',   caption: 'Use Sort',     type: 'boolean', attr: true }
        ],
        events: [], styles: []
    });

})(window);