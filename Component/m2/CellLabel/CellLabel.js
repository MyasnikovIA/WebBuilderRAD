/* M2 CellLabel — табличка из N ячеек. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.celllabel', tagName: 'component', cmptype: 'CellLabel',
        caption: 'CellLabel (M2)', subCategory: 'Controls', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'CellLabel');
            el.setAttribute('caption', '');
            el.setAttribute('cell_count', '');
            return el;
        },

        preview: function (el, doc) {
            var caption = el.getAttribute('caption') || '';
            var count = parseInt(el.getAttribute('cell_count'), 10);
            if (!count || count < 1) count = caption.length || 1;
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-m2-celllabel';
            var t = doc.createElement('table');
            t.className = 'ctrl_cellLabel';
            t.setAttribute('cellspacing', '0');
            t.setAttribute('cellpadding', '0');
            var tr = doc.createElement('tr');
            for (var k = 0; k < count; k++) {
                var td = doc.createElement('td');
                var inner = doc.createElement('div');
                inner.className = 'ctrl_cellLabel_child';
                inner.style.border = '1px solid #999';
                inner.style.padding = '1px 4px';
                inner.style.minWidth = '10px';
                inner.style.textAlign = 'center';
                inner.textContent = caption.charAt(k) || ' ';
                td.appendChild(inner);
                tr.appendChild(td);
            }
            t.appendChild(tr);
            wrap.appendChild(t);
            return wrap;
        },

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { type: 'separator', caption: 'CellLabel' },
            { name: 'caption',     caption: 'Caption',    type: 'string', attr: true },
            { name: 'cell_count',  caption: 'CellCount',  type: 'number', attr: true },
            { name: 'cell_size',   caption: 'CellSize',   type: 'string', attr: true },
            { name: 'cell_width',  caption: 'CellWidth',  type: 'string', attr: true },
            { name: 'cell_height', caption: 'CellHeight', type: 'string', attr: true },
            { name: 'cell_style',  caption: 'CellStyle',  type: 'string', attr: true },
            { name: 'cell_indent', caption: 'CellIndent', type: 'string', attr: true }
        ],
        events: [], styles: []
    });

})(window);