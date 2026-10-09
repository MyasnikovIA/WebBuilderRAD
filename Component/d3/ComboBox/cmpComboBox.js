/* cmpComboBox — выпадающий список.

   Серверный контрол: ComboBoxCtrlTraits.inc
   Клиентский контрол: ComboBox.js (D3Api.ComboBoxCtrl)
   Разметка: div.ctrl_combobox + <input> + div.cmbb-button + div.cmbb-droplist > table

   Ссылка: D3Api.controlsApi['ComboBox'] */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.combobox', tagName: 'cmpComboBox', caption: 'ComboBox',
        subCategory: 'Controls',
        icon: 'images/icon.png',
        nameTemplate: 'comboBox',
        previewCss: ['css/preview.css'],
        attrs: { name: '', width: '200px' },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-combo';

            var width = el.getAttribute('width') || '200px';
            wrap.style.width = width;

            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');
            if (el.getAttribute('visible') === 'false') wrap.style.display = 'none';
            if (el.getAttribute('readonly') === 'true') wrap.classList.add('readonly');

            /* Input — closed state, показывает caption или value */
            var inp = doc.createElement('input');
            inp.type = 'text';
            inp.readOnly = true;
            inp.value = el.getAttribute('caption') || el.getAttribute('value') || '';

            /* Кнопка раскрытия (аналог div.cmbb-button) */
            var btn = doc.createElement('div');
            btn.className = 'cmbb-button';

            wrap.appendChild(inp);
            wrap.appendChild(btn);

            /* Индикация, если ни одного ComboItem нет */
            var items = el.children;
            var count = 0;
            for (var i = 0; i < items.length; i++) {
                var it = items[i];
                if (it.tagName && it.tagName.toLowerCase() === 'cmpcomboitem') count++;
            }
            if (count === 0 && !inp.value) {
                inp.value = '(no items)';
                inp.style.color = '#999';
            }

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
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            /* --- ComboBox --- */
            { type: 'separator', caption: 'ComboBox' },
            { name: 'caption',       caption: 'Caption',        type: 'string',  attr: true },
            { name: 'readonly',      caption: 'ReadOnly',       type: 'boolean', attr: true },
            { name: 'mode',          caption: 'Mode',           type: 'enum',    attr: true,
                values: ['', 'filter', 'none'] },
            { name: 'case',          caption: 'Case Sensitive', type: 'boolean', attr: true },
            { name: 'anyvalue',      caption: 'Any Value',      type: 'boolean', attr: true },
            { name: 'anychange',     caption: 'Any Change',     type: 'boolean', attr: true },
            { name: 'additem',       caption: 'Add Item',       type: 'boolean', attr: true },
            { name: 'multiselect',   caption: 'MultiSelect',    type: 'boolean', attr: true },
            { name: 'droplist',      caption: 'DropList',       type: 'enum',    attr: true,
                values: ['', 'onclick', 'onenter'] },
            { name: 'fixwidth',      caption: 'Fix Width',      type: 'boolean', attr: true },
            { name: 'defaultindex',  caption: 'Default Index',  type: 'number',  attr: true },
            { name: 'initIndex',     caption: 'Init Index',     type: 'number',  attr: true },
            { name: 'hint-autofill', caption: 'Hint AutoFill',  type: 'enum',    attr: true,
                values: ['', 'value', 'caption'] },

            /* --- Data --- */
            { type: 'separator', caption: 'Data' },
            { name: 'items_dataset',      caption: 'Items DataSet',  type: 'string', attr: true },
            { name: 'items_repeatername', caption: 'Items Repeater', type: 'string', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onchange',    caption: 'OnChange',    type: 'code' },
            { name: 'onshowlist',  caption: 'OnShowList',  type: 'code' },
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