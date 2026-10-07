/* cmpCellLabel — счётчик разрядов (табличка из N однocимвольных ячеек).

   Ссылка: CellLabelCtrl.inc / CellLabel.js
   Контрол рендерится как <table> с одной строкой и N ячейками <td>,
   внутри каждой — <div class="ctrl_cellLabel_child"> с одним символом. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.celllabel', tagName: 'cmpCellLabel', caption: 'CellLabel',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: { caption: '', cell_count: '' },

        preview: function (el, doc) {
            var caption = el.getAttribute('caption') || '';
            var cellCount = parseInt(el.getAttribute('cell_count'), 10);
            if (!cellCount || cellCount < 1) cellCount = caption.length || 1;

            var cellSize   = el.getAttribute('cell_size')   || '';
            var cellWidth  = el.getAttribute('cell_width')  || cellSize;
            var cellHeight = el.getAttribute('cell_height') || cellSize;
            var cellStyle  = el.getAttribute('cell_style')  || '';

            /* cell_indent: "1:10;2:20" — margin-left для конкретной ячейки (индекс 1-based) */
            var indents = {};
            var ciRaw = el.getAttribute('cell_indent') || '';
            if (ciRaw) {
                var parts = ciRaw.split(';');
                for (var i = 0; i < parts.length; i++) {
                    var p = parts[i].split(':');
                    if (p.length < 2) continue;
                    var idx = parseInt(p[0], 10);
                    if (!idx || idx < 1 || idx >= cellCount) continue;
                    indents[idx] = p[1];
                }
            }

            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-celllabel';
            if (el.getAttribute('visible') === 'false') wrap.style.display = 'none';

            var table = doc.createElement('table');
            table.className = 'ctrl_cellLabel';
            table.setAttribute('cellspacing', '0');
            table.setAttribute('cellpadding', '0');

            var tr = doc.createElement('tr');
            for (var k = 0; k < cellCount; k++) {
                var td = doc.createElement('td');

                var inner = doc.createElement('div');
                inner.className = 'ctrl_cellLabel_child';

                var st = '';
                if (cellWidth) {
                    st += 'width:' + (/^\d+$/.test(cellWidth) ? cellWidth + 'px' : cellWidth) + ';';
                }
                if (cellHeight) {
                    var ch = /^\d+$/.test(cellHeight) ? cellHeight + 'px' : cellHeight;
                    st += 'height:' + ch + ';line-height:' + ch + ';';
                }
                if (cellStyle) st += cellStyle;

                if (indents[k] != null) {
                    var ind = indents[k];
                    st += 'margin-left:' + (/^\d+$/.test(ind) ? ind + 'px' : ind) + ';';
                }
                if (st) inner.setAttribute('style', st);

                inner.textContent = caption.charAt(k) || ' ';
                td.appendChild(inner);
                tr.appendChild(td);
            }
            table.appendChild(tr);
            wrap.appendChild(table);
            return wrap;
        },

        properties: [
            /* --- HTML --- */
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',       caption: 'Id',       type: 'string', attr: true },
            { name: 'class',    caption: 'Class',    type: 'string', attr: true },
            { name: 'style',    caption: 'Style',    type: 'string', attr: true },
            { name: 'title',    caption: 'Title',    type: 'string', attr: true },
            { name: 'tabindex', caption: 'TabIndex', type: 'number', attr: true },

            /* --- D3 Base --- */
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true, default: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true, default: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },

            /* --- CellLabel --- */
            { type: 'separator', caption: 'CellLabel' },
            { name: 'caption',     caption: 'Caption',    type: 'string', attr: true },
            { name: 'cell_count',  caption: 'CellCount',  type: 'number', attr: true },
            { name: 'cell_size',   caption: 'CellSize',   type: 'string', attr: true },
            { name: 'cell_width',  caption: 'CellWidth',  type: 'string', attr: true },
            { name: 'cell_height', caption: 'CellHeight', type: 'string', attr: true },
            { name: 'cell_style',  caption: 'CellStyle',  type: 'string', attr: true },
            { name: 'cell_indent', caption: 'CellIndent', type: 'string', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: CS.EVENT_FIELDS.slice(),

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);