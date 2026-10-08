/* cmpSelectListItem — чекбокс-элемент для SelectList.

   Серверный контрол: SelectListCtrl.inc (class SelectListItem extends BaseCtrl).
   Клиентский контрол: SelectList.js (D3Api.SelectListItemCtrl).

   Серверный код (trait):
     - printTag = 'input';
     - type = 'checkbox';
     - data = 'value:<fields[0]>;caption:<fields[1]>' (по умолчанию id,caption);
     - onchange = 'D3Api.stopEvent(event);';
     - onclick = 'D3Api.SelectListItemCtrl.onMouseClick(this);';
     - onmousedown = 'D3Api.SelectListItemCtrl.onMouseDown(this);';

   Разметка в рантайме:
     <input type="checkbox" class="SelectListItem"
            data="value:id;caption:caption"
            selectlist="<name>"
            item_value="" item_caption=""
            onchange="D3Api.stopEvent(event);"
            onclick="D3Api.SelectListItemCtrl.onMouseClick(this);"
            onmousedown="D3Api.SelectListItemCtrl.onMouseDown(this);"/>

   Связь с SelectList — через атрибут selectlist (имя контрола).
   parentOnly НЕ ограничиваем: в типовых формах SelectListItem
   встраивается в ячейку Grid Column.

   Атрибуты:
     name         — имя контрола.
     selectlist   — имя родительского SelectList.
     fields       — 'value,caption' (по умолчанию 'id,caption').
     item_value   — значение (заполняется при clone).
     item_caption — подпись (заполняется при clone).
     state        — 'true'/'false' — состояние чекбокса.
     readonly     — блокирует изменение.

   В IDE: превью — обычный чекбокс. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.selectlistitem', tagName: 'cmpSelectListItem', caption: 'SelectListItem',
        icon: 'images/icon.png',
        nameTemplate: 'selectListItem',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            selectlist: '',
            fields: 'id,caption'
        },

        create: function (doc) {
            var el = doc.createElement('cmpselectlistitem');
            el.setAttribute('data-wb-tag', 'cmpSelectListItem');
            el.setAttribute('name', '');
            el.setAttribute('selectlist', '');
            el.setAttribute('fields', 'id,caption');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-selectlistitem';

            if (el.getAttribute('visible') === 'false') wrap.style.display = 'none';
            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');
            if (el.getAttribute('readonly') === 'true') wrap.classList.add('readonly');

            var inp = doc.createElement('input');
            inp.type = 'checkbox';
            inp.className = 'SelectListItem';
            inp.disabled = true;  /* в IDE не кликается */
            inp.checked = el.getAttribute('state') === 'true';
            wrap.appendChild(inp);

            return wrap;
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

            /* --- SelectListItem --- */
            { type: 'separator', caption: 'SelectListItem' },
            { name: 'selectlist',   caption: 'SelectList Name', type: 'string',  attr: true },
            { name: 'fields',       caption: 'Fields (value,caption)', type: 'string', attr: true },
            { name: 'item_value',   caption: 'Item Value',      type: 'string',  attr: true },
            { name: 'item_caption', caption: 'Item Caption',    type: 'string',  attr: true },
            { name: 'state',        caption: 'State (checked)', type: 'boolean', attr: true },
            { name: 'readonly',     caption: 'ReadOnly',        type: 'boolean', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onclick',     caption: 'OnClick',     type: 'code' },
            { name: 'ondblclick',  caption: 'OnDblClick',  type: 'code' },
            { name: 'onmouseover', caption: 'OnMouseOver', type: 'code' },
            { name: 'onmouseout',  caption: 'OnMouseOut',  type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);