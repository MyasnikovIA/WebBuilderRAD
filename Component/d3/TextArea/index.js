/* cmpTextArea — многострочное поле ввода.

   Серверный контрол: TextAreaCtrl.inc (class TextArea extends BaseCtrl).
   Клиентский контрол: TextArea.js (D3Api.TextAreaCtrl).

   Серверный Show():
     <div class="textArea box-sizing-force editControl" …attrs…>
       <textarea cmpparse="TextArea"
                 [maxlength="…"]
                 [placeholder="…"]
                 [readonly="readonly"]
                 [disabled="disabled"]
                 …events…>value или text</textarea>
     </div>

   Атрибуты:
     name        — имя контрола.
     value       — значение textarea.
     caption     — (не используется; значение берётся из value).
     placeholder — подсказка внутри поля.
     maxlength   — максимальная длина.
     readonly    — 'true' — только для чтения.
     trim        — 'true' — обрезать пробелы при чтении value.
     hint-autofill — 'true' — автоматическая подсказка по значению.

   В IDE: в canvas отображается textarea с placeholder или
   значением. */
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
        id: 'd3.textarea', tagName: 'cmpTextArea', caption: 'TextArea',
        icon: 'images/icon.png',
        nameTemplate: 'textArea',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            value: '',
            placeholder: '',
            rows: '4'
        },

        create: function (doc) {
            var el = doc.createElement('cmptextarea');
            el.setAttribute('data-wb-tag', 'cmpTextArea');
            el.setAttribute('name', '');
            el.setAttribute('value', '');
            el.setAttribute('placeholder', '');
            el.setAttribute('rows', '4');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-textarea';

            var w = el.getAttribute('width');
            var h = el.getAttribute('height');
            if (w) wrap.style.width = w;
            if (h) wrap.style.minHeight = h;

            if (el.getAttribute('visible') === 'false') wrap.style.display = 'none';
            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');
            if (el.getAttribute('readonly') === 'true') wrap.classList.add('readonly');

            var ta = doc.createElement('textarea');
            ta.className = 'd3-preview-textarea-inner';
            ta.readOnly = true;
            ta.disabled = true;   /* не кликается в IDE */

            var rows = parseInt(el.getAttribute('rows'), 10);
            if (!isNaN(rows) && rows > 0) ta.rows = rows;

            var ml = parseInt(el.getAttribute('maxlength'), 10);
            if (!isNaN(ml) && ml > 0) ta.maxLength = ml;

            var v = getValue(el);
            var ph = el.getAttribute('placeholder') || '';
            if (v) {
                ta.value = v;
            } else if (ph) {
                ta.value = ph;
                ta.classList.add('placeholder');
            }

            wrap.appendChild(ta);
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

            /* --- TextArea --- */
            { type: 'separator', caption: 'TextArea' },
            { name: 'placeholder', caption: 'Placeholder', type: 'string',  attr: true },
            { name: 'maxlength',   caption: 'MaxLength',   type: 'number',  attr: true },
            { name: 'rows',        caption: 'Rows',        type: 'number',  attr: true },
            { name: 'cols',        caption: 'Cols',        type: 'number',  attr: true },
            { name: 'readonly',    caption: 'ReadOnly',    type: 'boolean', attr: true },
            { name: 'trim',        caption: 'Trim',        type: 'boolean', attr: true },
            { name: 'hint-autofill', caption: 'Hint AutoFill', type: 'boolean', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onchange',    caption: 'OnChange',    type: 'code' },
            { name: 'oninput',     caption: 'OnInput',     type: 'code' },
            { name: 'onfocus',     caption: 'OnFocus',     type: 'code' },
            { name: 'onblur',      caption: 'OnBlur',      type: 'code' },
            { name: 'onclick',     caption: 'OnClick',     type: 'code' },
            { name: 'ondblclick',  caption: 'OnDblClick',  type: 'code' },
            { name: 'onkeydown',   caption: 'OnKeyDown',   type: 'code' },
            { name: 'onkeyup',     caption: 'OnKeyUp',     type: 'code' },
            { name: 'onkeypress',  caption: 'OnKeyPress',  type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);