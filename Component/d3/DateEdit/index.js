/* cmpDateEdit — поле ввода даты (и опционально времени) с календарём.

   Серверный контрол: DateEditCtrl.inc (class DateEdit).
   Клиентский контрол: DateEdit.js (D3Api.DateEditCtrl + TCalendar).

   Серверный код выводит:
     <div class="ctrl_dateEdit editControl" ... mask_type="date">
       <div class="editControlInner"><input type="text" .../></div>
       <div cmpparse="DateEdit" class="img-calendar" title="Выбрать из календаря"></div>
       [опционально: <div class="ctrl_dateEditBtnClear">…</div>]
       <div cmptype="Base" name="<name>_showCalendar"></div>
     </div>

   Календарь — это popup TCalendar, создаётся клиентом по клику на
   .img-calendar (showCalendar).

   В IDE: input + CSS-кнопки; реальный календарь не запускается. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    /* ---------- helpers ---------- */

    /* Значение в input — это значение компонента, а не заголовок.
       Свойство `value` в инспекторе читаем/пишем через атрибут value. */
    function getValue(el) {
        return el.getAttribute('value') || '';
    }
    function setValue(el, v) {
        if (v == null || v === '') el.removeAttribute('value');
        else el.setAttribute('value', String(v));
    }

    /* ---------- registration ---------- */

    D3.register({
        id: 'd3.dateedit', tagName: 'cmpDateEdit', caption: 'DateEdit',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            value: '',
            hint: 'Выбрать из календаря'
        },

        create: function (doc) {
            var el = doc.createElement('cmpdateedit');
            el.setAttribute('data-wb-tag', 'cmpDateEdit');
            el.setAttribute('name', '');
            el.setAttribute('value', '');
            el.setAttribute('hint', 'Выбрать из календаря');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-dateedit';

            var width = el.getAttribute('width') || '120px';
            wrap.style.width = width;

            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');
            if (el.getAttribute('visible') === 'false') wrap.style.display = 'none';
            if (el.getAttribute('readonly') === 'true') wrap.classList.add('readonly');

            var showsTime    = el.getAttribute('shows_time') === 'true';
            var clearButton  = el.getAttribute('clearbutton') === 'true';
            if (clearButton) wrap.classList.add('withClearButton');

            /* Input */
            var inner = doc.createElement('div');
            inner.className = 'editControlInner';

            var inp = doc.createElement('input');
            inp.type = 'text';
            inp.readOnly = true;
            var v = getValue(el);
            inp.value = v || (showsTime ? 'дд.мм.гггг чч:мм' : 'дд.мм.гггг');
            if (!v) inp.classList.add('placeholder');
            var ph = el.getAttribute('placeholder');
            if (ph && !v) { inp.value = ph; inp.classList.add('placeholder'); }
            inner.appendChild(inp);

            /* Кнопка календаря */
            var cal = doc.createElement('div');
            cal.className = 'img-calendar';
            cal.title = el.getAttribute('hint') || 'Выбрать из календаря';

            /* Кнопка очистки — только если clearbutton=true */
            if (clearButton) {
                var clr = doc.createElement('div');
                clr.className = 'ctrl_dateEditBtnClear';
                clr.title = 'Очистить дату';
                var clrIcon = doc.createElement('div');
                clrIcon.className = 'ctrl_dateEditBtnClearIcon';
                clr.appendChild(clrIcon);
                wrap.appendChild(inner);
                wrap.appendChild(clr);
                wrap.appendChild(cal);
            } else {
                wrap.appendChild(inner);
                wrap.appendChild(cal);
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

            /* --- DateEdit --- */
            { type: 'separator', caption: 'DateEdit' },
            { name: 'caption',      caption: 'Caption',       type: 'string',  attr: true },
            { name: 'readonly',     caption: 'ReadOnly',      type: 'boolean', attr: true },
            { name: 'placeholder',  caption: 'Placeholder',   type: 'string',  attr: true },
            { name: 'shows_time',   caption: 'Shows Time',    type: 'boolean', attr: true },
            { name: 'clearbutton',  caption: 'Clear Button',  type: 'boolean', attr: true },
            { name: 'today',        caption: 'Today',         type: 'boolean', attr: true },
            { name: 'mask',         caption: 'Mask',          type: 'string',  attr: true },
            { name: 'mask_type',    caption: 'Mask Type',     type: 'enum',    attr: true,
                values: ['', 'date', 'datetime'] }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onchange',   caption: 'OnChange',   type: 'code' },
            { name: 'onfocus',    caption: 'OnFocus',    type: 'code' },
            { name: 'onblur',     caption: 'OnBlur',     type: 'code' },
            { name: 'onclick',    caption: 'OnClick',    type: 'code' },
            { name: 'ondblclick', caption: 'OnDblClick', type: 'code' },
            { name: 'onkeydown',  caption: 'OnKeyDown',  type: 'code' },
            { name: 'onkeyup',    caption: 'OnKeyUp',    type: 'code' },
            { name: 'onkeypress', caption: 'OnKeyPress', type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);