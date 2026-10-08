/* cmpLayout — табличный контейнер.

   Серверный контрол: LayoutCtrl.inc (предположительно, class Layout extends BaseCtrl).
   Клиентский контрол: Layout.js (если есть — вероятно, только focus).

   Серверный Show() собирает:
     <table class="ctrl_layout" …attrs… …events…>…дети…</table>

   Внутри — обычные HTML-строки и ячейки:
     <tr><td>…</td><td>…</td></tr>

   Дети могут содержать любые D3-компоненты (Label, Edit, CheckBox и т.д.).

   В IDE: пустая таблица с одной строкой-плейсхолдером, если детей нет.
   Пользовательские дети (TR, TD) видны как есть — их можно добавить
   через палитру, но обычно пользователь работает с ячейками прямо
   в дереве. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.layout', tagName: 'cmpLayout', caption: 'Layout',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: { name: '' },

        create: function (doc) {
            var el = doc.createElement('cmplayout');
            el.setAttribute('data-wb-tag', 'cmpLayout');
            el.setAttribute('name', '');
            return el;
        },

        /* Строим таблицу в create() — пользовательские дети (tr/td)
           добавляются через appendChild прямо в <cmpLayout>, а preview
           только обновляет chrome-обёртку, если её нет. */
        preview: function (el, doc) {
            /* Если в el уже есть настоящая структура (tr или td),
               ничего не рисуем — пусть пользователь видит её как есть. */
            var kids = el.children;
            var hasTable = false;
            for (var i = 0; i < kids.length; i++) {
                var t = kids[i].tagName ? kids[i].tagName.toLowerCase() : '';
                if (t === 'tr' || t === 'tbody' || t === 'thead' || t === 'tfoot'
                    || t === 'cmplayoutrow') {
                    hasTable = true;
                    break;
                }
            }

            /* Пустой Layout — показываем плейсхолдер с одной пустой
               строкой и двумя ячейками, чтобы пользователь видел границы. */
            if (!hasTable) {
                var tr = doc.createElement('tr');
                tr.setAttribute('data-wb-preview', '1');
                tr.setAttribute('data-part', 'placeholder');

                var td1 = doc.createElement('td');
                td1.textContent = '(cell)';
                var td2 = doc.createElement('td');
                td2.textContent = '(cell)';

                tr.appendChild(td1);
                tr.appendChild(td2);

                /* Возвращаем <tr> — он будет добавлен прямо в <cmpLayout>.
                   CSS ниже рендерит его как строку таблицы. */
                return tr;
            }

            return null;
        },

        /* ---------------- Properties ---------------- */
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
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onclick',    caption: 'OnClick',    type: 'code' },
            { name: 'ondblclick', caption: 'OnDblClick', type: 'code' },
            { name: 'onmousedown', caption: 'OnMouseDown', type: 'code' },
            { name: 'onmouseup',   caption: 'OnMouseUp',   type: 'code' },
            { name: 'onmouseover', caption: 'OnMouseOver', type: 'code' },
            { name: 'onmouseout',  caption: 'OnMouseOut',  type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);