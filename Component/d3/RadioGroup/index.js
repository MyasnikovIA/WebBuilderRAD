/* cmpRadioGroup — группа радиокнопок.

   Серверный контрол: RadioGroupCtrl.inc (class RadioGroup extends BaseCtrl).
   Клиентский контрол: RadioGroup.js (D3Api.RadioGroupCtrl).

   Серверный Show():
     <div class="ctrl_radiogroup [vertical|gorizontal]" …attrs… keyvalue="…">
       <form onsubmit="return false;">
         …дети: cmpRadioItem…
       </form>
     </div>

   Режимы:
     mode="vertical" (по умолчанию) — кнопки столбиком;
     mode="gorizontal" — кнопки в строку (именно 'gorizontal',
                          так в серверном коде и CSS).

   Атрибуты:
     name     — имя группы (для getControl / name у input).
     value    — значение выбранной радиокнопки.
     caption  — текст выбранной кнопки (синхронизируется клиентом).
     mode     — 'vertical' | 'gorizontal'.
     readonly — блокирует все кнопки.

   Дети: cmpRadioItem.

   В IDE: в canvas виден как группа кружков с подписями,
   активная кнопка подсвечена. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    /* Собирает детей cmpRadioItem в массив {el, caption, value, checked, disabled}. */
    function collectItems(el) {
        var out = [];
        var kids = el.children;
        for (var i = 0; i < kids.length; i++) {
            var k = kids[i];
            if (!k.tagName) continue;
            if (k.tagName.toLowerCase() !== 'cmpradioitem') continue;
            out.push({
                el: k,
                caption: k.getAttribute('caption') || '',
                value: k.getAttribute('value') || '',
                checked: k.getAttribute('checked') === 'true',
                disabled: k.getAttribute('enabled') === 'false'
            });
        }
        return out;
    }

    D3.register({
        id: 'd3.radiogroup', tagName: 'cmpRadioGroup', caption: 'RadioGroup',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: { name: '', mode: 'vertical' },

        create: function (doc) {
            var el = doc.createElement('cmpradiogroup');
            el.setAttribute('data-wb-tag', 'cmpRadioGroup');
            el.setAttribute('name', '');
            el.setAttribute('mode', 'vertical');
            return el;
        },

        preview: function (el, doc) {
            var mode = el.getAttribute('mode') === 'gorizontal' ? 'gorizontal' : 'vertical';
            var items = collectItems(el);
            var groupValue = el.getAttribute('value') || el.getAttribute('keyvalue') || '';

            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-radiogroup d3-preview-radiogroup-' + mode;
            if (el.getAttribute('visible') === 'false') wrap.style.display = 'none';
            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');
            if (el.getAttribute('readonly') === 'true') wrap.classList.add('readonly');

            var w = el.getAttribute('width');
            if (w) wrap.style.width = w;

            if (items.length === 0) {
                var empty = doc.createElement('div');
                empty.className = 'd3-preview-radiogroup-empty';
                empty.textContent = '(no items)';
                wrap.appendChild(empty);
                return wrap;
            }

            for (var i = 0; i < items.length; i++) {
                var it = items[i];
                var itemWrap = doc.createElement('div');
                itemWrap.className = 'd3-preview-radioitem';
                if (it.disabled) itemWrap.classList.add('disabled');

                var inp = doc.createElement('input');
                inp.type = 'radio';
                inp.name = 'preview_' + (el.getAttribute('name') || 'radiogroup');
                inp.readOnly = true;
                inp.disabled = true;   /* в IDE не кликается */
                /* Активна если:
                   - value совпадает с value группы, либо
                   - активна по флагу checked */
                if ((groupValue && groupValue === it.value) || (!groupValue && it.checked)) {
                    inp.checked = true;
                }
                itemWrap.appendChild(inp);

                var lbl = doc.createElement('span');
                lbl.className = 'd3-preview-radioitem-caption';
                lbl.textContent = it.caption || it.value || '(item)';
                itemWrap.appendChild(lbl);

                wrap.appendChild(itemWrap);
            }

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
            { name: 'name',     caption: 'Name',     type: 'string',  attr: true },
            { name: 'enabled',  caption: 'Enabled',  type: 'boolean', attr: true },
            { name: 'visible',  caption: 'Visible',  type: 'boolean', attr: true },
            { name: 'hint',     caption: 'Hint',     type: 'string',  attr: true },
            { name: 'width',    caption: 'Width',    type: 'string',  attr: true },
            { name: 'height',   caption: 'Height',   type: 'string',  attr: true },

            /* --- RadioGroup --- */
            { type: 'separator', caption: 'RadioGroup' },
            { name: 'value',    caption: 'Value',    type: 'string',  attr: true },
            { name: 'caption',  caption: 'Caption',  type: 'string',  attr: true },
            { name: 'mode',     caption: 'Mode',     type: 'enum',    attr: true,
                values: ['vertical', 'gorizontal'] },
            { name: 'readonly', caption: 'ReadOnly', type: 'boolean', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onchange',    caption: 'OnChange',    type: 'code' },
            { name: 'onfocus',     caption: 'OnFocus',     type: 'code' },
            { name: 'onblur',      caption: 'OnBlur',      type: 'code' },
            { name: 'onclick',     caption: 'OnClick',     type: 'code' },
            { name: 'ondblclick',  caption: 'OnDblClick',  type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);