/* cmpEdit — однострочное поле ввода.

   Серверный контрол: EditCtrl.inc (class Edit).
   Клиентский контрол: Edit.js (D3Api.EditCtrl).

   Серверный Show() собирает:
     <div class="ctrl_edit editControl box-sizing-force" ...>
       <input cmpparse="Edit" type="text" value="..." maxlength=... readonly=... />
     </div>

   Атрибуты:
     type        — text | password | number | tel | email | url | search
                   (по умолчанию text)
     placeholder — подсказка внутри input
     maxlength   — максимальная длина
     readonly    — только для чтения
     trim        — trim значения (клиентское свойство)
     format      — JSON-подобная строка настроек форматирования, из которой
                   сервер генерирует onformat="D3Api.EditCtrl.format(this, {…}, arguments[0]);"
     value       — внутреннее значение
     caption     — отображаемое значение (может отличаться при форматировании)

   В IDE: input + CSS-обёртка. Реальное форматирование не запускается. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    function getValue(el) {
        return el.getAttribute('value') || '';
    }
    function setValue(el, v) {
        if (v == null || v === '') el.removeAttribute('value');
        else el.setAttribute('value', String(v));
    }

    D3.register({
        id: 'd3.edit', tagName: 'cmpEdit', caption: 'Edit',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            value: '',
            type: 'text'
        },

        create: function (doc) {
            var el = doc.createElement('cmpedit');
            el.setAttribute('data-wb-tag', 'cmpEdit');
            el.setAttribute('name', '');
            el.setAttribute('value', '');
            el.setAttribute('type', 'text');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-edit';

            var width = el.getAttribute('width') || '150px';
            wrap.style.width = width;

            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');
            if (el.getAttribute('visible') === 'false') wrap.style.display = 'none';
            if (el.getAttribute('readonly') === 'true') wrap.classList.add('readonly');

            var inp = doc.createElement('input');
            inp.type = el.getAttribute('type') || 'text';
            inp.readOnly = true;

            var v = getValue(el);
            var ph = el.getAttribute('placeholder') || '';
            var ml = parseInt(el.getAttribute('maxlength'), 10);
            if (!isNaN(ml) && ml > 0) inp.maxLength = ml;

            if (v) {
                inp.value = v;
            } else if (ph) {
                inp.value = ph;
                inp.classList.add('placeholder');
            }

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

            /* --- D3 Base --- */
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            {
                name: 'value', caption: 'Value', type: 'string', attr: true,
                get: function (el) { return getValue(el); },
                set: function (el, v) { setValue(el, v); }
            },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            /* --- Edit --- */
            { type: 'separator', caption: 'Edit' },
            { name: 'caption',     caption: 'Caption',     type: 'string',  attr: true },
            { name: 'type',        caption: 'Type',        type: 'enum',    attr: true,
                values: ['text', 'password', 'number', 'tel', 'email', 'url', 'search'] },
            { name: 'placeholder', caption: 'Placeholder', type: 'string',  attr: true },
            { name: 'maxlength',   caption: 'MaxLength',   type: 'number',  attr: true },
            { name: 'readonly',    caption: 'ReadOnly',    type: 'boolean', attr: true },
            { name: 'trim',        caption: 'Trim',        type: 'boolean', attr: true },
            { name: 'hint-autofill', caption: 'Hint AutoFill', type: 'boolean', attr: true },

            /* --- Formatting --- */
            { type: 'separator', caption: 'Formatting' },
            { name: 'format',   caption: 'Format',   type: 'string', attr: true },
            { name: 'onformat', caption: 'OnFormat', type: 'code' }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onchange',    caption: 'OnChange',    type: 'code' },
            { name: 'oninput',     caption: 'OnInput',     type: 'code' },
            { name: 'onfocus',     caption: 'OnFocus',     type: 'code' },
            { name: 'onblur',      caption: 'OnBlur',      type: 'code' },
            { name: 'onclick',     caption: 'OnClick',     type: 'code' },
            { name: 'ondblclick',  caption: 'OnDblClick',  type: 'code' },
            { name: 'onmousedown', caption: 'OnMouseDown', type: 'code' },
            { name: 'onmouseup',   caption: 'OnMouseUp',   type: 'code' },
            { name: 'onmouseover', caption: 'OnMouseOver', type: 'code' },
            { name: 'onmouseout',  caption: 'OnMouseOut',  type: 'code' },
            { name: 'onkeydown',   caption: 'OnKeyDown',   type: 'code' },
            { name: 'onkeyup',     caption: 'OnKeyUp',     type: 'code' },
            { name: 'onkeypress',  caption: 'OnKeyPress',  type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);