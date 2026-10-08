/* cmpTree — иерархический Grid.

   Серверный контрол: TreeCtrl.inc (class Tree extends BaseCtrl).
   Клиентский контрол: Tree.js (D3Api.TreeCtrl).

   Серверный Show() собирает структуру, аналогичную Grid:
     tree_header, tree_columns, tree_data_cont, tree_filters, tree_footer.

   Дополнительно:
     - иерархия (parentfield/keyfield/childsfield/root);
     - кнопка btnOC у каждой строки (opened/closed/nochilds);
     - фильтр через CustomFilter + FilterItem;
     - сортировка через SortItem;
     - выгрузка в ODS (Tree::ShowXML 'export_tbs').

   Дети: cmpTreeColumn, cmpTreeFooter.

   Атрибуты:
     name               — имя контрола.
     dataset            — DataSet.
     keyfield           — ключевое поле.
     parentfield        — поле-родитель (для иерархии).
     childsfield        — поле «есть ли дети» (0/1).
     parentvar          — переменная формы для parentvalue.
     root               — значение корня (по умолчанию пусто).
     returnfield        — поле для returnvalue.
     hintfield          — поле tooltip.
     simple             — 'true' — простой режим.
     fulldata           — 'true' — все данные загружены сразу.
     opened             — 'true' — раскрывать узлы по умолчанию.
     list               — 'true' — переключатель list/дерево.
     maxlevels          — максимальный уровень вложенности.
     selectlist         — поля SelectList (множественный выбор).
     select_childs      — 'true' — при выборе родителя отмечать детей.
     excel              — 'true' — выгрузка в ODS.
     profile            — 'true' — профили.
     popupmenu          — имя PopupMenu (генерируется, если не задано).
     settings_method    — JS-метод для шестерёнки.
     showfilter         — 'true' — показать панель фильтров сразу.
     white_space_nowrap — 'true' — не переносить строки.
     max_lines          — обрезка длинного текста в колонке.
     columns_to_sum     — колонки для суммирования при выгрузке.
     limit_row          — 'true' — ограничение на количество строк.

   В IDE: в canvas видно «скелет» — заголовок + шапка колонок
   + пример иерархических строк + подвал. */
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
            if (k.tagName.toLowerCase() !== 'cmptreecolumn') continue;
            out.push({
                el: k,
                caption: k.getAttribute('caption') || '',
                field: k.getAttribute('field') || '',
                sort: k.getAttribute('sort') || '',
                filter: k.getAttribute('filter') || '',
                colspan: k.getAttribute('colspanfield') || ''
            });
        }
        return out;
    }

    D3.register({
        id: 'd3.tree', tagName: 'cmpTree', caption: 'Tree',
        icon: 'images/icon.png',
        nameTemplate: 'tree',
        previewCss: ['css/preview.css'],
        attrs: { name: '', dataset: '', caption: 'Tree' },

        create: function (doc) {
            var el = doc.createElement('cmptree');
            el.setAttribute('data-wb-tag', 'cmpTree');
            el.setAttribute('name', '');
            el.setAttribute('dataset', '');
            el.setAttribute('caption', 'Tree');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-tree';
            if (el.getAttribute('visible') === 'false') wrap.style.display = 'none';
            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');

            var w = el.getAttribute('width');
            var h = el.getAttribute('height');
            if (w) wrap.style.width = w;
            if (h) wrap.style.minHeight = h;

            var cols = collectColumns(el);

            /* Header */
            var header = doc.createElement('div');
            header.className = 'd3-preview-tree-header';
            header.textContent = el.getAttribute('caption') || 'Tree';
            wrap.appendChild(header);

            /* Таблица */
            var table = doc.createElement('table');
            table.className = 'd3-preview-tree-table';

            var thead = doc.createElement('thead');
            var tr = doc.createElement('tr');
            if (cols.length === 0) {
                var th0 = doc.createElement('th');
                th0.textContent = '(no columns)';
                th0.className = 'd3-preview-tree-empty';
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
                /* Показываем иерархический пример: корень + два ребёнка */
                var rows = [
                    { level: 0, kind: 'opened' },
                    { level: 1, kind: 'leaf'   },
                    { level: 1, kind: 'closed' },
                    { level: 0, kind: 'closed' }
                ];
                for (var r = 0; r < rows.length; r++) {
                    var row = doc.createElement('tr');
                    row.className = 'd3-preview-tree-row';
                    for (var c = 0; c < cols.length; c++) {
                        var td = doc.createElement('td');
                        if (c === 0) {
                            /* Первая колонка — с отступом и кнопкой раскрытия */
                            td.classList.add('d3-preview-tree-firstcell');
                            td.style.paddingLeft = (18 + rows[r].level * 18) + 'px';
                            if (rows[r].kind !== 'leaf') {
                                var btn = doc.createElement('span');
                                btn.className = 'd3-preview-tree-btn d3-preview-tree-btn-' + rows[r].kind;
                                td.appendChild(btn);
                            }
                        }
                        row.appendChild(td);
                    }
                    tbody.appendChild(row);
                }
            }
            table.appendChild(tbody);
            wrap.appendChild(table);

            /* Подвал (если есть TreeFooter) */
            var hasFooter = false;
            var kids = el.children;
            for (var i = 0; i < kids.length; i++) {
                if (kids[i].tagName && kids[i].tagName.toLowerCase() === 'cmptreefooter') {
                    hasFooter = true; break;
                }
            }
            if (hasFooter) {
                var f = doc.createElement('div');
                f.className = 'd3-preview-tree-footer';
                f.textContent = '(footer)';
                wrap.appendChild(f);
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
            { name: 'caption', caption: 'Caption', type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            /* --- Data --- */
            { type: 'separator', caption: 'Data' },
            { name: 'dataset',     caption: 'DataSet',     type: 'string', attr: true },
            { name: 'keyfield',    caption: 'KeyField',    type: 'string', attr: true },
            { name: 'parentfield', caption: 'ParentField', type: 'string', attr: true },
            { name: 'childsfield', caption: 'ChildsField', type: 'string', attr: true },
            { name: 'parentvar',   caption: 'ParentVar',   type: 'string', attr: true },
            { name: 'root',        caption: 'Root',        type: 'string', attr: true },
            { name: 'returnfield', caption: 'ReturnField', type: 'string', attr: true },
            { name: 'hintfield',   caption: 'HintField',   type: 'string', attr: true },

            /* --- Tree --- */
            { type: 'separator', caption: 'Tree' },
            { name: 'simple',        caption: 'Simple',        type: 'boolean', attr: true },
            { name: 'fulldata',      caption: 'Full Data',     type: 'boolean', attr: true },
            { name: 'opened',        caption: 'Opened',        type: 'boolean', attr: true },
            { name: 'list',          caption: 'List Mode',     type: 'boolean', attr: true },
            { name: 'maxlevels',     caption: 'Max Levels',    type: 'number',  attr: true },
            { name: 'selectlist',    caption: 'SelectList',    type: 'string',  attr: true },
            { name: 'select_childs', caption: 'Select Childs', type: 'boolean', attr: true },
            { name: 'excel',         caption: 'Excel Export',  type: 'boolean', attr: true },
            { name: 'profile',       caption: 'Profile',       type: 'boolean', attr: true },
            { name: 'popupmenu',     caption: 'PopupMenu',     type: 'string',  attr: true },
            { name: 'popupmenu_actions', caption: 'PopupMenu Actions', type: 'string', attr: true },
            { name: 'settings_method', caption: 'Settings Method', type: 'string', attr: true },
            { name: 'showfilter',    caption: 'Show Filter',   type: 'boolean', attr: true },
            { name: 'white_space_nowrap', caption: 'White Space Nowrap', type: 'boolean', attr: true },
            { name: 'max_lines',     caption: 'Max Lines',     type: 'number',  attr: true },
            { name: 'columns_to_sum', caption: 'Columns To Sum', type: 'string', attr: true },
            { name: 'limit_row',     caption: 'Limit Row',     type: 'boolean', attr: true },
            { name: 'popup_log_unit', caption: 'Popup Log Unit', type: 'string', attr: true }
        ],

        events: [
            { name: 'oncreate',         caption: 'OnCreate',         type: 'code' },
            { name: 'onshow',           caption: 'OnShow',           type: 'code' },
            { name: 'onafter_refresh',  caption: 'OnAfterRefresh',   type: 'code' },
            { name: 'onrefresh',        caption: 'OnRefresh',        type: 'code' },
            { name: 'onchange',         caption: 'OnChange',         type: 'code' },
            { name: 'onopen_node',      caption: 'OnOpenNode',       type: 'code' },
            { name: 'onopen_node_after',caption: 'OnOpenNodeAfter',  type: 'code' },
            { name: 'onclose_node',     caption: 'OnCloseNode',      type: 'code' },
            { name: 'onclose_node_after', caption: 'OnCloseNodeAfter', type: 'code' },
            { name: 'onprofile_change', caption: 'OnProfileChange',  type: 'code' },
            { name: 'onclick',          caption: 'OnClick',          type: 'code' },
            { name: 'ondblclick',       caption: 'OnDblClick',       type: 'code' }
        ],

        styles: CS.STYLE_FIELDS.slice()
    });

})(window);