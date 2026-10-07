/* cmpCheckBox — флажок (чекбокс).

   Серверный контрол: CheckBoxCtrlTraits.inc
   Клиентский контрол: CheckBox.js

   Серверный код выводит div с <label>, внутри — <input type="checkbox"> и
   <span>caption</span>. Клиентский CheckBoxCtrl читает значение через
   valuechecked / valueunchecked.

   Ссылка: D3Api.controlsApi['CheckBox'] */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.checkbox', tagName: 'cmpCheckBox', caption: 'CheckBox',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: { caption: 'CheckBox', valuechecked: '1', valueunchecked: '0' },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-checkbox';

            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');
            if (el.getAttribute('visible') === 'false') wrap.style.display = 'none';
            if (el.getAttribute('readonly') === 'true') wrap.classList.add('readonly');

            var label = doc.createElement('label');

            var inp = doc.createElement('input');
            inp.type = 'checkbox';
            inp.checked = (el.getAttribute('checked') === 'true');
            if (el.getAttribute('enabled') === 'false') inp.disabled = true;
            if (el.getAttribute('readonly') === 'true') inp.readOnly = true;

            var span = doc.createElement('span');
            span.textContent = el.getAttribute('caption') || '';

            label.appendChild(inp);
            label.appendChild(span);
            wrap.appendChild(label);
            return wrap;
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
            { name: 'value',   caption: 'Value',   type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true, default: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true, default: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            /* --- CheckBox --- */
            { type: 'separator', caption: 'CheckBox' },
            { name: 'caption',        caption: 'Caption',        type: 'string',  attr: true },
            { name: 'checked',        caption: 'Checked',        type: 'boolean', attr: true },
            { name: 'valuechecked',   caption: 'ValueChecked',   type: 'string',  attr: true },
            { name: 'valueunchecked', caption: 'ValueUnChecked', type: 'string',  attr: true },
            { name: 'readonly',       caption: 'ReadOnly',       type: 'boolean', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onchange',    caption: 'OnChange',    type: 'code' },
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