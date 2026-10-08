/* cmpTreeColumn — колонка Tree.

   Серверный контрол: TreeCtrl.inc (class TreeColumn extends BaseCtrl).

   Атрибуты:
     field        — имя поля DataSet.
     caption      — заголовок.
     width        — ширина.
     align        — left | center | right.
     sort         — поле сортировки.
     sortorder    — asc | desc.
     filter       — поле фильтра.
     filterkind   — тип фильтра (text | numb | date | combo | unitedit | …).
     upper, condition, like — параметры фильтра.
     funit, fmethod, fcomposition, fcontent, fdataset, fdata, fdefault — для справочников.
     format       — форматирование значения (через Label onformat).
     colspanfield — если задано, ячейка может объединять несколько колонок.
     hint         — tooltip колонки.
     profile_hidden — 'true' — скрыта в профиле.
     keep         — не удалять колонку при применении профиля.
     fixed        — 'true' — не показывать resize-handle.
     not_append_ds — не добавлять фильтр к DataSet.
     excelfield   — имя поля при выгрузке.

   parentOnly: cmptree.

   В IDE: preview = null. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.treecolumn', tagName: 'cmpTreeColumn', caption: 'TreeColumn',
        parentOnly: 'cmptree',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: { field: '', caption: '' },

        create: function (doc) {
            var el = doc.createElement('cmptreecolumn');
            el.setAttribute('data-wb-tag', 'cmpTreeColumn');
            el.setAttribute('field', '');
            el.setAttribute('caption', '');
            return el;
        },

        preview: null,

        properties: [
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },
            { name: 'hint',  caption: 'Hint',  type: 'string', attr: true },

            { type: 'separator', caption: 'D3 Base' },
            { name: 'name', caption: 'Name', type: 'string', attr: true },

            { type: 'separator', caption: 'Column' },
            { name: 'field',   caption: 'Field',   type: 'string', attr: true },
            { name: 'caption', caption: 'Caption', type: 'string', attr: true },
            { name: 'width',   caption: 'Width',   type: 'string', attr: true },
            { name: 'align',   caption: 'Align',   type: 'enum',   attr: true,
                values: ['', 'left', 'center', 'right'] },
            { name: 'profile_hidden', caption: 'Profile Hidden', type: 'boolean', attr: true },

            { type: 'separator', caption: 'Sort' },
            { name: 'sort',      caption: 'Sort Field', type: 'string', attr: true },
            { name: 'sortorder', caption: 'Sort Order', type: 'enum',   attr: true,
                values: ['', 'asc', 'desc'] },

            { type: 'separator', caption: 'Filter' },
            { name: 'filter',     caption: 'Filter Field', type: 'string', attr: true },
            { name: 'filterkind', caption: 'Filter Kind',  type: 'enum',   attr: true,
                values: ['', 'text', 'numb', 'date', 'combo', 'unitedit',
                    'unitmulti', 'cmb_unit', 'perioddate', 'periodnumb',
                    'periodtime', 'speriodnum'] },
            { name: 'upper',     caption: 'Upper',     type: 'boolean', attr: true },
            { name: 'condition', caption: 'Condition', type: 'enum',    attr: true,
                values: ['', 'none', 'eq', 'neq', 'gt', 'lt', 'gteq', 'lteq', 'like'] },
            { name: 'like',      caption: 'Like',      type: 'enum',    attr: true,
                values: ['', 'none', 'left', 'right', 'both'] },
            { name: 'not_append_ds', caption: 'Not Append DS', type: 'boolean', attr: true },

            { type: 'separator', caption: 'Filter (units / combo)' },
            { name: 'funit',        caption: 'Unit',        type: 'string', attr: true },
            { name: 'fmethod',      caption: 'Method',      type: 'string', attr: true },
            { name: 'fcomposition', caption: 'Composition', type: 'string', attr: true },
            { name: 'fbeforeopen',  caption: 'BeforeOpen',  type: 'string', attr: true },
            { name: 'fcontent',     caption: 'FContent',    type: 'string', attr: true },
            { name: 'fdataset',     caption: 'FDataSet',    type: 'string', attr: true },
            { name: 'fdata',        caption: 'FData',       type: 'string', attr: true },
            { name: 'fdefault',     caption: 'FDefault',    type: 'string', attr: true },

            { type: 'separator', caption: 'Other' },
            { name: 'data',         caption: 'Data',         type: 'string',  attr: true },
            { name: 'format',       caption: 'Format',       type: 'string',  attr: true },
            { name: 'excelfield',   caption: 'ExcelField',   type: 'string',  attr: true },
            { name: 'colspanfield', caption: 'ColSpanField', type: 'string',  attr: true },
            { name: 'keep',         caption: 'Keep',         type: 'boolean', attr: true },
            { name: 'fixed',        caption: 'Fixed',        type: 'boolean', attr: true }
        ],

        events: [
            { name: 'onclick', caption: 'OnClick', type: 'code' }
        ],

        styles: CS.STYLE_FIELDS.slice()
    });

})(window);