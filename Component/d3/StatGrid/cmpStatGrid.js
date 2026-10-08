/* cmpStatGrid — аналитический Grid с группировкой.

   Серверный контрол: StatGridCtrl.inc (class StatGrid extends BaseCtrl).
   Клиентский контрол: StatGrid.js (D3Api.StatGridCtrl).

   Серверный Show() собирает крупную структуру, аналогичную Grid:
   header, groups, columns, data_cont, filters, footer.
   Дополнительно:
     - statgrid_groups — полоса активных группировок («Группировка: field1 → field2»);
     - StatGridRow — репитер строк (генерируется на сервере);
     - grouprow — строки-группы (генерируются клиентом в рантайме).

   Дети: cmpStatGridColumn, cmpStatGridFooter.

   Атрибуты:
     name               — имя контрола.
     dataset            — DataSet.
     keyfield           — ключевое поле.
     returnfield        — поле для returnvalue.
     hintfield          — поле tooltip-а.
     field              — основное поле (для Locate).
     caption            — заголовок.
     selectlist         — имя SelectList-колонки для множественного выбора.
     settings_method    — имя метода, вызываемого при клике по «шестерёнке».
     use_sort           — использовать сортировку.
     excel              — 'true' — показывать пункт меню «Выгрузить в Excel».
     activerow          — 'true' — включить подсветку активной строки.
     showfilter         — 'true' — показать панель фильтров сразу.
     extended_filter    — 'true' — расширенные фильтры в колонках.
     filter_lines       — количество строк фильтра.
     white_space_nowrap — 'true' — не переносить строки.
     limit_row          — 'true' — ограничение на количество строк.
     show_selectcount   — 'true' — показывать «Отмечено: N» в подвале.
     popupmenu          — имя PopupMenu (генерируется автоматически, если не задано).
     popupmenu_actions  — имя PopupMenu для действий (устанавливается автоматически).

   В IDE: в canvas виден как «скелет» — заголовок + шапка колонок
   + пример пустых строк + подвал. Сами дети скрыты. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    function collectColumns(el) {
        var out = [];
        var kids = el.children;
        for (var i = 0; i < kids.length; i++) {
            var k = kids[i];
            if (!k.tagName) continue;
            if (k.tagName.toLowerCase() !== 'cmpstatgridcolumn') continue;
            out.push({
                el: k,
                caption: k.getAttribute('caption') || '',
                field: k.getAttribute('field') || '',
                group: k.getAttribute('group') === 'true',
                grouporder: parseInt(k.getAttribute('grouporder'), 10) || 0,
                sort: k.getAttribute('sort') || '',
                filter: k.getAttribute('filter') || ''
            });
        }
        return out;
    }

    D3.register({
        id: 'd3.statgrid', tagName: 'cmpStatGrid', caption: 'StatGrid',
        icon: 'images/icon.png',
        nameTemplate: 'statGrid',
        previewCss: ['css/preview.css'],
        attrs: { name: '', dataset: '', caption: 'StatGrid' },

        create: function (doc) {
            var el = doc.createElement('cmpstatgrid');
            el.setAttribute('data-wb-tag', 'cmpStatGrid');
            el.setAttribute('name', '');
            el.setAttribute('dataset', '');
            el.setAttribute('caption', 'StatGrid');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-statgrid';
            if (el.getAttribute('visible') === 'false') wrap.style.display = 'none';
            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');

            var w = el.getAttribute('width');
            var h = el.getAttribute('height');
            if (w) wrap.style.width = w;
            if (h) wrap.style.minHeight = h;

            /* Header */
            var header = doc.createElement('div');
            header.className = 'd3-preview-statgrid-header';
            header.textContent = el.getAttribute('caption') || 'StatGrid';
            wrap.appendChild(header);

            /* Groups strip — если есть колонки с group=true */
            var cols = collectColumns(el);
            var groups = cols.filter(function (c) { return c.group; });
            if (groups.length > 0) {
                var groupsEl = doc.createElement('div');
                groupsEl.className = 'd3-preview-statgrid-groups';
                groupsEl.textContent = 'Группировка: ' +
                    groups.map(function (c) { return c.caption || c.field; }).join(' → ');
                wrap.appendChild(groupsEl);
            }

            /* Таблица */
            var table = doc.createElement('table');
            table.className = 'd3-preview-statgrid-table';
            var thead = doc.createElement('thead');
            var tr = doc.createElement('tr');
            if (cols.length === 0) {
                var th0 = doc.createElement('th');
                th0.textContent = '(no columns)';
                th0.className = 'd3-preview-statgrid-empty';
                tr.appendChild(th0);
            } else {
                for (var j = 0; j < cols.length; j++) {
                    var th = doc.createElement('th');
                    th.textContent = cols[j].caption || cols[j].field;
                    if (cols[j].sort) th.classList.add('sortable');
                    if (cols[j].filter) th.classList.add('filterable');
                    tr.appendChild(th);
                }
            }
            thead.appendChild(tr);
            table.appendChild(thead);

            var tbody = doc.createElement('tbody');
            if (cols.length > 0) {
                for (var r = 0; r < 3; r++) {
                    var row = doc.createElement('tr');
                    for (var c = 0; c < cols.length; c++) {
                        var td = doc.createElement('td');
                        row.appendChild(td);
                    }
                    tbody.appendChild(row);
                }
            }
            table.appendChild(tbody);
            wrap.appendChild(table);

            /* Footer */
            var footer = doc.createElement('div');
            footer.className = 'd3-preview-statgrid-footer';
            footer.textContent = 'Всего: 0';
            wrap.appendChild(footer);

            return wrap;
        },

        properties: [
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },

            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'caption', caption: 'Caption', type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            { type: 'separator', caption: 'Data' },
            { name: 'dataset',     caption: 'DataSet',      type: 'string',  attr: true },
            { name: 'field',       caption: 'Field',        type: 'string',  attr: true },
            { name: 'keyfield',    caption: 'KeyField',     type: 'string',  attr: true },
            { name: 'returnfield', caption: 'ReturnField',  type: 'string',  attr: true },
            { name: 'hintfield',   caption: 'HintField',    type: 'string',  attr: true },

            { type: 'separator', caption: 'StatGrid' },
            { name: 'selectlist',       caption: 'SelectList',        type: 'string',  attr: true },
            { name: 'settings_method',  caption: 'Settings Method',   type: 'string',  attr: true },
            { name: 'use_sort',         caption: 'Use Sort',          type: 'boolean', attr: true },
            { name: 'excel',            caption: 'Excel Export',      type: 'boolean', attr: true },
            { name: 'activerow',        caption: 'Active Row',        type: 'boolean', attr: true },
            { name: 'showfilter',       caption: 'Show Filter',       type: 'boolean', attr: true },
            { name: 'extended_filter',  caption: 'Extended Filter',   type: 'boolean', attr: true },
            { name: 'filter_lines',     caption: 'Filter Lines',      type: 'number',  attr: true },
            { name: 'white_space_nowrap', caption: 'White Space Nowrap', type: 'boolean', attr: true },
            { name: 'limit_row',        caption: 'Limit Row',         type: 'boolean', attr: true },
            { name: 'show_selectcount', caption: 'Show Select Count', type: 'boolean', attr: true },
            { name: 'popupmenu',        caption: 'PopupMenu',         type: 'string',  attr: true },
            { name: 'popupmenu_actions',caption: 'PopupMenu Actions', type: 'string',  attr: true }
        ],

        events: [
            { name: 'oncreate',         caption: 'OnCreate',         type: 'code' },
            { name: 'onshow',           caption: 'OnShow',           type: 'code' },
            { name: 'onafter_refresh',  caption: 'OnAfterRefresh',   type: 'code' },
            { name: 'onrefresh',        caption: 'OnRefresh',        type: 'code' },
            { name: 'onchange',         caption: 'OnChange',         type: 'code' },
            { name: 'onfilter',         caption: 'OnFilter',         type: 'code' },
            { name: 'onprofile_change', caption: 'OnProfileChange',  type: 'code' },
            { name: 'onclick',          caption: 'OnClick',          type: 'code' },
            { name: 'ondblclick',       caption: 'OnDblClick',       type: 'code' }
        ],

        styles: CS.STYLE_FIELDS.slice()
    });

})(window);