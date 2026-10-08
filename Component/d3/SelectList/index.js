/* cmpSelectList — «мастер-чекбокс» с тремя состояниями.

   Серверный контрол: SelectListCtrl.inc (class SelectList extends BaseCtrl).
   Клиентский контрол: SelectList.js (D3Api.SelectListCtrl).

   Серверный Show():
     <div class="selectlist" [dataset="…"] [fields="…"]
          onclick="D3Api.SelectListCtrl.onMouseClick(this);"></div>

   Три состояния (CSS-классы):
     state0 — ничего не выбрано (пустая иконка);
     state1 — выбрана часть (серая галочка);
     state2 — выбрано всё (зелёная галочка).

   Логика:
     - SelectList связан с DataSet через атрибут dataset;
     - SelectList собирает выбранные значения в D3SelectList.data;
     - SelectListItem (отдельный компонент) вызывает
       addValue/delValue по клику;
     - SelectList пересчитывает state по values_count / allc.

   Атрибуты:
     name               — имя контрола (для getControl и связи с SelectListItem);
     dataset            — DataSet, с которым работает выбор;
     fields             — поля для value/caption ('id,caption');
     type               — 'tree' — поддержка иерархии;
     select_childs      — 'true' — при выборе родителя выбирать детей (при type="tree");
     usedom             — 'true' — брать значения из DOM, а не из DataSet.

   В IDE: превью — иконка галочки в state0. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.selectlist', tagName: 'cmpSelectList', caption: 'SelectList',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            dataset: '',
            fields: 'id,caption'
        },

        create: function (doc) {
            var el = doc.createElement('cmpselectlist');
            el.setAttribute('data-wb-tag', 'cmpSelectList');
            el.setAttribute('name', '');
            el.setAttribute('dataset', '');
            el.setAttribute('fields', 'id,caption');
            el.setAttribute('state', '0');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-selectlist';
            if (el.getAttribute('visible') === 'false') wrap.style.display = 'none';
            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');

            /* Состояние читаем из атрибута state (число или строка 0/1/2). */
            var st = parseInt(el.getAttribute('state'), 10);
            if (isNaN(st) || st < 0 || st > 2) st = 0;
            wrap.classList.add('d3-preview-selectlist-state' + st);

            /* Иконка галочки через CSS-псевдоэлемент. */
            var icon = doc.createElement('span');
            icon.className = 'd3-preview-selectlist-icon';
            wrap.appendChild(icon);

            return wrap;
        },

        /* ---------------- Properties ---------------- */
        properties: [
            /* --- HTML --- */
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },

            /* --- D3 Base --- */
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },

            /* --- SelectList --- */
            { type: 'separator', caption: 'SelectList' },
            { name: 'dataset',       caption: 'DataSet',        type: 'string',  attr: true },
            { name: 'fields',        caption: 'Fields (value,caption)', type: 'string',  attr: true },
            { name: 'type',          caption: 'Type',           type: 'enum',    attr: true,
                values: ['', 'tree'] },
            { name: 'select_childs', caption: 'Select Childs',  type: 'boolean', attr: true },
            { name: 'usedom',        caption: 'Use DOM',        type: 'boolean', attr: true },
            { name: 'state',         caption: 'State (0/1/2)',  type: 'number',  attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onchange',    caption: 'OnChange',    type: 'code' },
            { name: 'onupdate',    caption: 'OnUpdate',    type: 'code' },
            { name: 'onselect',    caption: 'OnSelect',    type: 'code' },
            { name: 'onunselect',  caption: 'OnUnselect',  type: 'code' },
            { name: 'onclick',     caption: 'OnClick',     type: 'code' },
            { name: 'ondblclick',  caption: 'OnDblClick',  type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);