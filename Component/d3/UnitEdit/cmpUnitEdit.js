/* cmpUnitEdit — универсальный контрол выбора из справочника.

   Серверный контрол: UnitEditBase/UnitEditOracle/UnitEditPDO (по DBType).
   Клиентский контрол: UnitEdit.js (D3Api.UnitEditCtrl).

   В зависимости от атрибута `type` рендерится:
     ButtonEdit     — input + кнопка вызова формы-справочника (по умолчанию);
     Edit           — input с валидацией значения по справочнику;
     ComboBox       — выпадающий список;
     RadioGroup     — группа радиокнопок;
     FillingTextArea — textarea с заполнением по справочнику.

   Сервер автоматически генерирует:
     - DataSet `<name>_dataset` для списка значений;
     - Action `<name>_action` для валидации введённого значения;
     - Completer (для ButtonEdit, если не отключён);
     - ComboItem / RadioItem внутри ComboBox / RadioGroup.

   Ключевые атрибуты:
     name          — имя контрола.
     unit          — код раздела-справочника (обязательный).
     method        — код метода показа.
     composition   — код композиции (приоритетнее method).
     type          — ButtonEdit | Edit | ComboBox | RadioGroup | FillingTextArea.
     parent_ctrl   — контрол-родитель (передаётся в справочник).
     parent_var    — переменная формы-родитель.
     parent_value  — фиксированное значение parentvalue.
     multisel      — 'true' — множественный выбор.
     readonly      — 'true' — только для чтения.
     kind          — вид ButtonEdit.
     custom_filter — JSON-фильтр.
     permanent_filter — JSON-фильтр, сохраняющийся между вызовами.
     append_filter — дополнительный фильтр.
     beforeopen    — JS-код перед открытием формы.
     show_info     — 'true' — показывать информацию о выбранном.
     extradict     — код доп. справочника.
     dirdict       — код директории add_directories.
     catalog_unitcode — код каталога.
     locate_with_check — 'true' — locate с галочкой в selectlist.
     window_data   — JSON для параметров окна.
     completer_dataset — имя DataSet для Completer.
     minlength     — минимальная длина для Completer.
     addlistener   — слушатель результата.
     callback      — 'false' — отключить обратный вызов.
     add_to_request — дополнительные переменные в request.
     addlistener   — JS-функция после выбора.

   В IDE: превью зависит от `type` — input+кнопка, input, select,
   radio-группа или textarea. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    /* Хелпер: раскраска полей для превью. */
    function mkBox(doc, cls) {
        var d = doc.createElement('div');
        d.className = cls;
        return d;
    }

    /* Превью для ButtonEdit */
    function previewButtonEdit(el, doc, wrap) {
        var inp = doc.createElement('input');
        inp.type = 'text';
        inp.readOnly = true;
        inp.disabled = true;
        inp.className = 'd3-preview-unitedit-input';
        inp.value = el.getAttribute('caption') || '';
        var ph = el.getAttribute('placeholder');
        if (!inp.value && ph) {
            inp.value = ph;
            inp.classList.add('placeholder');
        }
        wrap.appendChild(inp);

        var btn = doc.createElement('span');
        btn.className = 'd3-preview-unitedit-btn';
        btn.textContent = '\u2026'; /* … */
        wrap.appendChild(btn);
    }

    /* Превью для Edit */
    function previewEdit(el, doc, wrap) {
        var inp = doc.createElement('input');
        inp.type = 'text';
        inp.readOnly = true;
        inp.disabled = true;
        inp.className = 'd3-preview-unitedit-input';
        inp.value = el.getAttribute('caption') || '';
        var ph = el.getAttribute('placeholder');
        if (!inp.value && ph) {
            inp.value = ph;
            inp.classList.add('placeholder');
        }
        wrap.appendChild(inp);
    }

    /* Превью для ComboBox */
    function previewComboBox(el, doc, wrap) {
        var sel = doc.createElement('select');
        sel.disabled = true;
        sel.className = 'd3-preview-unitedit-select';
        var opt = doc.createElement('option');
        opt.textContent = el.getAttribute('caption') || '(выбрать)';
        sel.appendChild(opt);
        wrap.appendChild(sel);
    }

    /* Превью для RadioGroup */
    function previewRadioGroup(el, doc, wrap) {
        var g = doc.createElement('span');
        g.className = 'd3-preview-unitedit-radio';
        ['A', 'B', 'C'].forEach(function (cap, i) {
            var lbl = doc.createElement('label');
            var inp = doc.createElement('input');
            inp.type = 'radio';
            inp.name = 'unitedit_preview_' + (el.getAttribute('name') || 'x');
            inp.disabled = true;
            inp.checked = (i === 0);
            lbl.appendChild(inp);
            var s = doc.createElement('span');
            s.textContent = cap;
            lbl.appendChild(s);
            g.appendChild(lbl);
        });
        wrap.appendChild(g);
    }

    /* Превью для FillingTextArea */
    function previewFillingTextArea(el, doc, wrap) {
        var ta = doc.createElement('textarea');
        ta.readOnly = true;
        ta.disabled = true;
        ta.rows = 3;
        ta.className = 'd3-preview-unitedit-textarea';
        ta.value = el.getAttribute('caption') || '';
        var ph = el.getAttribute('placeholder');
        if (!ta.value && ph) {
            ta.value = ph;
            ta.classList.add('placeholder');
        }
        wrap.appendChild(ta);
    }

    D3.register({
        id: 'd3.unitedit', tagName: 'cmpUnitEdit', caption: 'UnitEdit',
        subCategory: 'Controls',
        icon: 'images/icon.png',
        nameTemplate: 'unitEdit',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            unit: '',
            type: 'ButtonEdit'
        },

        create: function (doc) {
            var el = doc.createElement('cmpunitedit');
            el.setAttribute('data-wb-tag', 'cmpUnitEdit');
            el.setAttribute('name', '');
            el.setAttribute('unit', '');
            el.setAttribute('type', 'ButtonEdit');
            return el;
        },

        preview: function (el, doc) {
            var type = el.getAttribute('type') || 'ButtonEdit';
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-unitedit';
            wrap.classList.add('d3-preview-unitedit-' + type.toLowerCase());

            if (el.getAttribute('visible') === 'false') wrap.style.display = 'none';
            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');
            if (el.getAttribute('readonly') === 'true') wrap.classList.add('readonly');

            var w = el.getAttribute('width');
            var h = el.getAttribute('height');
            if (w) wrap.style.width = w;
            if (h) wrap.style.minHeight = h;

            switch (type) {
                case 'Edit':            previewEdit(el, doc, wrap); break;
                case 'ComboBox':        previewComboBox(el, doc, wrap); break;
                case 'RadioGroup':      previewRadioGroup(el, doc, wrap); break;
                case 'FillingTextArea': previewFillingTextArea(el, doc, wrap); break;
                case 'ButtonEdit':
                default:                previewButtonEdit(el, doc, wrap);
            }

            /* Бейдж с типом */
            var badge = doc.createElement('span');
            badge.className = 'd3-preview-unitedit-badge';
            badge.textContent = type;
            wrap.appendChild(badge);

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
            { name: 'caption', caption: 'Caption', type: 'string',  attr: true },
            { name: 'value',   caption: 'Value',   type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            /* --- UnitEdit --- */
            { type: 'separator', caption: 'UnitEdit' },
            { name: 'type',        caption: 'Type',        type: 'enum',    attr: true,
                values: ['ButtonEdit', 'Edit', 'ComboBox', 'RadioGroup', 'FillingTextArea'] },
            { name: 'unit',        caption: 'Unit',        type: 'string',  attr: true },
            { name: 'method',      caption: 'Method',      type: 'string',  attr: true },
            { name: 'composition', caption: 'Composition', type: 'string',  attr: true },
            { name: 'readonly',    caption: 'ReadOnly',    type: 'boolean', attr: true },
            { name: 'multisel',    caption: 'Multi Select', type: 'boolean', attr: true },
            { name: 'kind',        caption: 'Kind',        type: 'string',  attr: true },
            { name: 'placeholder', caption: 'Placeholder', type: 'string',  attr: true },
            { name: 'show_info',   caption: 'Show Info',   type: 'boolean', attr: true },

            /* --- Parent --- */
            { type: 'separator', caption: 'Parent' },
            { name: 'parent_ctrl',  caption: 'Parent Ctrl',  type: 'string', attr: true },
            { name: 'parent_var',   caption: 'Parent Var',   type: 'string', attr: true },
            { name: 'parent_value', caption: 'Parent Value', type: 'string', attr: true },

            /* --- Dictionaries --- */
            { type: 'separator', caption: 'Dictionaries' },
            { name: 'extradict',   caption: 'ExtraDict',   type: 'string', attr: true },
            { name: 'dirdict',     caption: 'DirDict',     type: 'string', attr: true },
            { name: 'return_note', caption: 'Return Note', type: 'boolean', attr: true },
            { name: 'catalog_unitcode', caption: 'Catalog UnitCode', type: 'string', attr: true },

            /* --- Handlers --- */
            { type: 'separator', caption: 'Handlers' },
            { name: 'beforeopen',     caption: 'BeforeOpen',     type: 'code', attr: true },
            { name: 'onbuttonclick',  caption: 'OnButtonClick',  type: 'code', attr: true },
            { name: 'onblur',         caption: 'OnBlur',         type: 'code', attr: true },
            { name: 'addlistener',    caption: 'AddListener',    type: 'code', attr: true },
            { name: 'window_data',    caption: 'Window Data',    type: 'code', attr: true },
            { name: 'custom_filter',  caption: 'CustomFilter',   type: 'code', attr: true },
            { name: 'permanent_filter', caption: 'PermanentFilter', type: 'code', attr: true },
            { name: 'append_filter',  caption: 'AppendFilter',   type: 'string', attr: true },
            { name: 'add_to_request', caption: 'Add To Request', type: 'code', attr: true },

            /* --- Completer --- */
            { type: 'separator', caption: 'Completer' },
            { name: 'completer_dataset', caption: 'Completer DataSet', type: 'string', attr: true },
            { name: 'minlength',  caption: 'Min Length',  type: 'number',  attr: true },
            { name: 'callback',   caption: 'Callback',    type: 'boolean', attr: true },
            { name: 'notnode',    caption: 'Not Node',    type: 'string',  attr: true },
            { name: 'locate_with_check', caption: 'Locate With Check', type: 'boolean', attr: true },
            { name: 'repeatername', caption: 'Repeater Name', type: 'string', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onchange',    caption: 'OnChange',    type: 'code' },
            { name: 'onselect',    caption: 'OnSelect',    type: 'code' },
            { name: 'onopen',      caption: 'OnOpen',      type: 'code' },
            { name: 'onclose',     caption: 'OnClose',     type: 'code' },
            { name: 'onfocus',     caption: 'OnFocus',     type: 'code' },
            { name: 'onblur',      caption: 'OnBlur',      type: 'code' },
            { name: 'onclick',     caption: 'OnClick',     type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);