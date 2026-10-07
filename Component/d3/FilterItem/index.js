/* cmpFilterItem — отдельное поле фильтра.

   Серверный контрол: FilterCtrl.inc (class FilterItem).
   Клиентский контрол: Filter.js (D3Api.FilterItemCtrl).

   В рантайме рендерит разный input в зависимости от filterkind:
     text / text_ext          → <Edit>
     numb                     → <Edit mask_type="fnumber">
     date                     → <DateEdit typeMask="date">
     activedate               → <cmpDateEdit>
     combo                    → <ComboBox> с <ComboItem>
     periodnumb / speriodnum  → две <Edit> (BEGIN/END)
     perioddate               → две <DateEdit>
     periodtime               → две <Edit mask_type="time">
     unitedit / unitmulti     → <UnitEdit>
     multi_hier               → <UnitEdit multisel>
     cmb_unit                 → <UnitEdit type="ComboBox">

   parentOnly: cmpFilter — FilterItem::SetInnerText пишет <td> в родителя,
   значит вне Filter его использовать нельзя.

   Атрибуты:
     name             — имя фильтра (обязательно).
     field / fields   — поле(я) DataSet, к которым привязывается фильтр.
     refreshdataset   — DataSet(ы) для refresh после поиска (';' — список).
     filterkind       — тип фильтра (см. выше).
     caption          — подпись (в JSON-режиме сервер сам разворачивает).
     upper            — 'true' — учитывать регистр при LIKE.
     condition        — eq | neq | gt | lt | gteq | lteq | like | none.
     like             — left | right | both.
     funit            — имя справочника (для UnitEdit).
     fmethod          — метод справочника (LIST, DEFAULT).
     fcomposition     — композиция справочника.
     fcontent         — список элементов ComboBox ('1|Да;0|Нет').
     fdefault         — значение по умолчанию (';' или '|' как разделитель).
     fdataset / fdata — DataSet и поля для ComboBox ('value:id;caption:name').
     fbeforeopen      — handler перед раскрытием UnitEdit.
     width / height   — размеры.
     separator        — разделитель значений по умолчанию (по умолчанию '|').
     not_append_ds    — не добавлять фильтр к DataSet. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.filteritem', tagName: 'cmpFilterItem', caption: 'FilterItem',
        parentOnly: 'cmpfilter',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            field: '',
            filterkind: 'text',
            refreshdataset: '',
            caption: ''
        },

        create: function (doc) {
            var el = doc.createElement('cmpfilteritem');
            el.setAttribute('data-wb-tag', 'cmpFilterItem');
            el.setAttribute('name', '');
            el.setAttribute('field', '');
            el.setAttribute('filterkind', 'text');
            el.setAttribute('refreshdataset', '');
            el.setAttribute('caption', '');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-filteritem';

            var fk = el.getAttribute('filterkind') || 'text';
            wrap.setAttribute('data-filterkind', fk);

            /* Caption (виден в IDE, в рантайме — только через cmpLabel). */
            var cap = el.getAttribute('caption') || '';
            if (cap) {
                var lbl = doc.createElement('span');
                lbl.className = 'd3-preview-filteritem-caption';
                lbl.textContent = cap + ':';
                wrap.appendChild(lbl);
            }

            /* Плейсхолдер-подсказка по типу. */
            var placeholder = fk;
            if (fk === 'perioddate' || fk === 'periodtime' ||
                fk === 'periodnumb' || fk === 'speriodnum') {
                placeholder = fk + ' (с / по)';
            }

            var inp = doc.createElement('input');
            inp.type = 'text';
            inp.readOnly = true;
            inp.placeholder = placeholder;
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
            { name: 'name',  caption: 'Name',  type: 'string', attr: true },
            { name: 'width', caption: 'Width', type: 'string', attr: true },
            { name: 'height', caption: 'Height', type: 'string', attr: true },

            /* --- Field / DataSet --- */
            { type: 'separator', caption: 'Field / DataSet' },
            { name: 'field',          caption: 'Field',          type: 'string', attr: true },
            { name: 'fields',         caption: 'Fields',         type: 'string', attr: true },
            { name: 'refreshdataset', caption: 'Refresh DataSet', type: 'string', attr: true },
            { name: 'not_append_ds',  caption: 'Not Append DS',  type: 'boolean', attr: true },

            /* --- Filter --- */
            { type: 'separator', caption: 'Filter' },
            { name: 'caption',     caption: 'Caption',     type: 'string', attr: true },
            { name: 'filterkind',  caption: 'Filter Kind', type: 'enum', attr: true,
                values: ['text', 'text_ext', 'numb', 'date', 'activedate',
                    'combo', 'periodnumb', 'speriodnum',
                    'perioddate', 'periodtime',
                    'unitedit', 'unitmulti', 'multi_hier', 'cmb_unit'] },
            { name: 'upper',       caption: 'Upper',       type: 'boolean', attr: true },
            { name: 'condition',   caption: 'Condition',   type: 'enum', attr: true,
                values: ['', 'none', 'eq', 'neq', 'gt', 'lt', 'gteq', 'lteq', 'like'] },
            { name: 'like',        caption: 'Like',        type: 'enum', attr: true,
                values: ['', 'none', 'left', 'right', 'both'] },
            { name: 'separator',   caption: 'Separator',   type: 'string', attr: true },
            { name: 'fdefault',    caption: 'Default',     type: 'string', attr: true },

            /* --- UnitEdit (unitedit / unitmulti / multi_hier / cmb_unit) --- */
            { type: 'separator', caption: 'Unit (справочники)' },
            { name: 'funit',        caption: 'Unit',        type: 'string', attr: true },
            { name: 'fmethod',      caption: 'Method',      type: 'string', attr: true },
            { name: 'fcomposition', caption: 'Composition', type: 'string', attr: true },
            { name: 'fbeforeopen',  caption: 'BeforeOpen',  type: 'string', attr: true },

            /* --- ComboBox (combo) --- */
            { type: 'separator', caption: 'ComboBox (filterkind="combo")' },
            { name: 'fcontent', caption: 'Content', type: 'string', attr: true },
            { name: 'fdataset', caption: 'DataSet', type: 'string', attr: true },
            { name: 'fdata',    caption: 'Data',    type: 'string', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onchange',   caption: 'OnChange',   type: 'code' },
            { name: 'onkeypress', caption: 'OnKeyPress', type: 'code' },
            { name: 'oncreate',   caption: 'OnCreate',   type: 'code' },
            { name: 'onfocus',    caption: 'OnFocus',    type: 'code' },
            { name: 'onblur',     caption: 'OnBlur',     type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);