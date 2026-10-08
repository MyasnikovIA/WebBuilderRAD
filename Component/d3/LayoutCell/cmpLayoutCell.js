/* cmpLayoutCell — ячейка Layout-а.

   Серверный контрол: LayoutCell (в LayoutCtrl.inc).
   Рендерится как <td> внутри <tr> (LayoutRow).

   Атрибуты:
     name          — имя контрола.
     colspan       — сколько столбцов занимает ячейка.
     rowspan       — сколько строк занимает ячейка.
     align         — left | center | right.
     valign        — top | middle | bottom.
     width, height — размеры.
     class, style  — стандартные.
     enabled, visible, hint — из BaseCtrl.

   Дети: любые D3-компоненты и HTML.

   parentOnly: 'cmplayoutrow' — можно вставить только внутрь LayoutRow.

   В IDE: display: table-cell, внутри — реальные дети. Если ячейка пуста,
   показываем placeholder «(cell)». */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.layoutcell', tagName: 'cmpLayoutCell', caption: 'LayoutCell',
        parentOnly: 'cmplayoutrow',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: { name: '' },

        create: function (doc) {
            var el = doc.createElement('cmplayoutcell');
            el.setAttribute('data-wb-tag', 'cmpLayoutCell');
            el.setAttribute('name', '');
            return el;
        },

        preview: function (el, doc) {
            /* Проверяем, есть ли у ячейки «реальные» дети (не preview-узлы). */
            var kids = el.children;
            var hasReal = false;
            for (var i = 0; i < kids.length; i++) {
                var k = kids[i];
                if (!k.getAttribute) { hasReal = true; break; }
                if (k.getAttribute('data-wb-preview') === '1') continue;
                if (k.getAttribute('data-wb-ide') === '1') continue;
                hasReal = true;
                break;
            }
            /* Если есть реальные дети — placeholder не нужен. */
            if (hasReal) return null;

            var span = doc.createElement('span');
            span.className = 'd3-preview d3-preview-layoutcell-placeholder';
            span.textContent = '(cell)';
            return span;
        },

        /* ---------------- Properties ---------------- */
        properties: [
            /* --- HTML --- */
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },
            { name: 'title', caption: 'Title', type: 'string', attr: true },

            /* --- D3 Base --- */
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            /* --- Cell --- */
            { type: 'separator', caption: 'Cell' },
            { name: 'colspan', caption: 'ColSpan', type: 'number', attr: true },
            { name: 'rowspan', caption: 'RowSpan', type: 'number', attr: true },
            { name: 'align',   caption: 'Align (text)', type: 'enum', attr: true,
                values: ['', 'left', 'center', 'right', 'justify'] },
            { name: 'valign',  caption: 'VAlign',      type: 'enum', attr: true,
                values: ['', 'top', 'middle', 'bottom', 'baseline'] }
        ],

        events: [
            { name: 'onclick',    caption: 'OnClick',    type: 'code' },
            { name: 'ondblclick', caption: 'OnDblClick', type: 'code' },
            { name: 'onmouseover', caption: 'OnMouseOver', type: 'code' },
            { name: 'onmouseout',  caption: 'OnMouseOut',  type: 'code' }
        ],

        styles: CS.STYLE_FIELDS.slice()
    });

})(window);