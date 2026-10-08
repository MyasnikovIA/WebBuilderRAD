/* cmpColumn — колонка Grid-а.

   Серверный контрол: GridCtrl.inc (class Column).
   Column::Show() не рисует собственной разметки: она пушит данные
   в родительский Grid (columns_caption[], columns[], filters[],
   windowFunction[]). SetInnerText пишет в $this->text — это может быть
   переопределённый caption (через ColumnHeader), но в типовых .frm
   ColumnHeader не используется.

   Атрибуты:
     field         — имя поля DataSet.
     caption       — заголовок колонки.
     width         — ширина.
     align         — left | center | right.
     sort          — поле сортировки (включает сортировку).
     sortorder     — начальный порядок сортировки.
     filter        — поле фильтра (включает фильтр).
     filterkind    — тип фильтра (text | numb | date | combo | …).
     upper         — учитывать регистр при LIKE.
     condition     — eq | neq | gt | lt | gteq | lteq | like | none.
     like          — left | right | both.
     funit/fmethod/fcomposition/fcontent/fdataset/fdata/fdefault — параметры фильтра.
     hint          — подсказка (title ячейки).
     format        — форматирование значения (через Label onformat).
     excelfield    — имя поля при выгрузке.
     profile_hidden — скрыта ли в профиле по умолчанию.
     keep          — не удалять колонку при применении профиля.
     data          — data-атрибут Label (обычно caption:field).
     wf / wf_field — оконные функции (count, sum, avg, max, min).

   parentOnly: cmpgrid.

   В IDE: preview = null — визуально не показывается внутри Grid,
   доступна только через дерево и инспектор. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.column', tagName: 'cmpColumn', caption: 'Column',
        parentOnly: 'cmpgrid',
        icon: 'images/icon.png',
        nameTemplate: 'column',
        previewCss: ['css/preview.css'],
        attrs: { field: '', caption: '' },

        create: function (doc) {
            var el = doc.createElement('cmpcolumn');
            el.setAttribute('data-wb-tag', 'cmpColumn');
            el.setAttribute('field', '');
            el.setAttribute('caption', '');
            return el;
        },

        /* Внутри Grid не визуализируется — Grid сам читает caption
           из children и строит шапку. */
        preview: null,

        /* ---------------- Properties ---------------- */
        properties: [
            /* --- HTML --- */
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },
            { name: 'hint',  caption: 'Hint',  type: 'string', attr: true },

            /* --- D3 Base --- */
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name', caption: 'Name', type: 'string', attr: true },

            /* --- Column --- */
            { type: 'separator', caption: 'Column' },
            { name: 'field',   caption: 'Field',   type: 'string', attr: true },
            { name: 'caption', caption: 'Caption', type: 'string', attr: true },
            { name: 'width',   caption: 'Width',   type: 'string', attr: true },
            { name: 'align',   caption: 'Align',   type: 'enum',   attr: true,
                values: ['', 'left', 'center', 'right'] },

            /* --- Sort --- */
            { type: 'separator', caption: 'Sort' },
            { name: 'sort',      caption: 'Sort Field', type: 'string', attr: true },
            { name: 'sortorder', caption: 'Sort Order', type: 'enum',   attr: true,
                values: ['', 'asc', 'desc'] },

            /* --- Filter --- */
            { type: 'separator', caption: 'Filter' },
            { name: 'filter',     caption: 'Filter Field', type: 'string', attr: true },
            { name: 'filterkind', caption: 'Filter Kind',  type: 'enum',   attr: true,
                values: ['', 'text', 'numb', 'date', 'combo', 'unitedit',
                    'unitmulti', 'cmb_unit', 'multi_hier',
                    'perioddate', 'periodnumb', 'periodtime', 'speriodnum'] },
            { name: 'upper',     caption: 'Upper',     type: 'boolean', attr: true },
            { name: 'condition', caption: 'Condition', type: 'enum',    attr: true,
                values: ['', 'none', 'eq', 'neq', 'gt', 'lt', 'gteq', 'lteq', 'like'] },
            { name: 'like',      caption: 'Like',      type: 'enum',    attr: true,
                values: ['', 'none', 'left', 'right', 'both'] },

            /* --- Filter (справочники / combo) --- */
            { type: 'separator', caption: 'Filter (units / combo)' },
            { name: 'funit',        caption: 'Unit',        type: 'string', attr: true },
            { name: 'fmethod',      caption: 'Method',      type: 'string', attr: true },
            { name: 'fcomposition', caption: 'Composition', type: 'string', attr: true },
            { name: 'fbeforeopen',  caption: 'BeforeOpen',  type: 'string', attr: true },
            { name: 'fcontent',     caption: 'FContent',    type: 'string', attr: true },
            { name: 'fdataset',     caption: 'FDataSet',    type: 'string', attr: true },
            { name: 'fdata',        caption: 'FData',       type: 'string', attr: true },
            { name: 'fdefault',     caption: 'FDefault',    type: 'string', attr: true },
            { name: 'not_append_ds', caption: 'Not Append DS', type: 'boolean', attr: true },

            /* --- Other --- */
            { type: 'separator', caption: 'Other' },
            { name: 'data',           caption: 'Data',          type: 'string',  attr: true },
            { name: 'format',         caption: 'Format',        type: 'string',  attr: true },
            { name: 'excelfield',     caption: 'ExcelField',    type: 'string',  attr: true },
            { name: 'profile_hidden', caption: 'Profile Hidden',type: 'boolean', attr: true },
            { name: 'keep',           caption: 'Keep',          type: 'boolean', attr: true },
            { name: 'fixed',          caption: 'Fixed',         type: 'boolean', attr: true },
            { name: 'wf',             caption: 'Window Funcs',  type: 'string',  attr: true },
            { name: 'wf_field',       caption: 'WF Field',      type: 'string',  attr: true },

            /* --- Parent / Value --- */
            { type: 'separator', caption: 'Parent / Value' },
            { name: 'parent_ctrl',  caption: 'Parent Ctrl',  type: 'string', attr: true },
            { name: 'parent_var',   caption: 'Parent Var',   type: 'string', attr: true },
            { name: 'parent_value', caption: 'Parent Value', type: 'string', attr: true },

            /* --- SelectList --- */
            { type: 'separator', caption: 'SelectList (внутреннее)' },
            { name: 'isSelectList', caption: 'IsSelectList', type: 'boolean', attr: true }
        ],

        events: [
            { name: 'onclick', caption: 'OnClick', type: 'code' }
        ],

        styles: CS.STYLE_FIELDS.slice()
    });

})(window);