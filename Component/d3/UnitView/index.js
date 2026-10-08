/* cmpUnitView — универсальный контрол отображения раздела.

   Серверный контрол: UnitViewCtrl.inc (class UnitViewBase, UnitView).
   Клиентский контрол: UnitView.js (D3Api.UnitViewCtrl, D3Api.UnitViewBaseCtrl).

   Серверный Show() читает конфигурацию из БД:
     - core.v_show_method4bld      — метод показа раздела;
     - core.v_show_method_cols4bld — колонки;
     - core.v_smc_elements4bld     — элементы ячеек (CheckBox/ImageLink/…);
     - core.v_smc_aggregations4bld — агрегаты для StatGrid.
   Дополнительно читает JSON-настройки из
   Metainf/ShowMethods/<unit>_<method>.json (filter / style / custom_filter /
   window_function / format).

   Генерирует (в зависимости от show_method):
     show_method = 1, 3, 4 → <cmpTree>   + <cmpTreeColumn>
     show_method = 2      → <cmpStatGrid> + <cmpStatGridColumn>
     иначе                → <cmpGrid>    + <cmpColumn> + <cmpGridFooter>

   Плюс всегда:
     - <cmpDataSet name="DS_<unit>_<method>"> (или указанный в dataset);
     - <cmpDataSetVar> для lpu/version/admissible_filter;
     - <cmpAction AutoDelete…> (при del_script="auto");
     - <cmpAction …AutoMove…> (при move_script="auto");
     - <cmpPopupMenu name="<name>_popup"> с пунктами Refresh/Add/Edit/…
       и Action-ом прав <name>_popup_rights;
     - <cmpScript> с Form.<name>_add_script / _edit_script / …;
     - <cmpFilter> / <cmpRepeaterStyler> / <cmpCustomFilter> — из JSON;
     - <cmpSubForm> — если popup_type=0/1 и задан popup_form.

   Атрибут settings_method (генерируется сервером) → D3Api.UnitViewCtrl.showSettings.

   В IDE: видимый контейнер, рисуется «скелет» сетки; список колонок
   недоступен без БД, поэтому показываются placeholder-заголовки. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.unitview', tagName: 'cmpUnitView', caption: 'UnitView',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            unit: '',
            show_method: '',
            width: '100%',
            height: '100%'
        },

        create: function (doc) {
            var el = doc.createElement('cmpunitview');
            el.setAttribute('data-wb-tag', 'cmpUnitView');
            el.setAttribute('name', '');
            el.setAttribute('unit', '');
            el.setAttribute('show_method', '');
            el.setAttribute('width', '100%');
            el.setAttribute('height', '100%');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-unitview';
            if (el.getAttribute('visible') === 'false') wrap.style.display = 'none';
            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');

            var w = el.getAttribute('width');
            if (w && w !== '100%') wrap.style.width = w;
            var h = el.getAttribute('height');
            if (h && h !== '100%') wrap.style.minHeight = h;

            var unit   = el.getAttribute('unit')        || '';
            var method = el.getAttribute('show_method') || '';

            /* Эвристика типа: в IDE точный show_method неизвестен.
               Но пользователь может задать его как атрибут — используем
               для заголовка-подсказки. */
            var typeLabel = 'Grid';
            if (method === '1' || method === '3' || method === '4') typeLabel = 'Tree';
            else if (method === '2') typeLabel = 'StatGrid';

            /* ---------- Шапка ---------- */
            var header = doc.createElement('div');
            header.className = 'd3-preview-unitview-header';

            var icon = doc.createElement('span');
            icon.className = 'd3-preview-unitview-icon';
            icon.textContent = '\u25A6'; /* ▦ */
            header.appendChild(icon);

            var title = doc.createElement('span');
            title.textContent = 'UnitView';
            header.appendChild(title);

            if (unit || method) {
                var hint = doc.createElement('span');
                hint.className = 'd3-preview-unitview-hint';
                hint.textContent = ' (' + (unit || '?')
                    + (method ? '.' + method : '') + ')';
                header.appendChild(hint);
            }

            var typeBadge = doc.createElement('span');
            typeBadge.className = 'd3-preview-unitview-type';
            typeBadge.textContent = typeLabel;
            header.appendChild(typeBadge);

            wrap.appendChild(header);

            /* ---------- Сетка-скелет ---------- */
            var grid = doc.createElement('div');
            grid.className = 'd3-preview-unitview-grid';

            var tbl = doc.createElement('table');
            tbl.className = 'd3-preview-unitview-table';

            var thead = doc.createElement('thead');
            var trh = doc.createElement('tr');
            var cols = ['Колонка 1', 'Колонка 2', 'Колонка 3', 'Колонка 4'];
            for (var i = 0; i < cols.length; i++) {
                var th = doc.createElement('th');
                th.textContent = cols[i];
                trh.appendChild(th);
            }
            thead.appendChild(trh);
            tbl.appendChild(thead);

            var tbody = doc.createElement('tbody');
            for (var r = 0; r < 4; r++) {
                var tr = doc.createElement('tr');
                for (var c = 0; c < cols.length; c++) {
                    var td = doc.createElement('td');
                    td.innerHTML = '&nbsp;';
                    tr.appendChild(td);
                }
                tbody.appendChild(tr);
            }
            tbl.appendChild(tbody);
            grid.appendChild(tbl);
            wrap.appendChild(grid);

            /* ---------- Футер с бейджами ---------- */
            var footer = doc.createElement('div');
            footer.className = 'd3-preview-unitview-footer';

            var dsName = 'DS_' + (unit || 'UNIT') + '_' + (method || 'method');
            var badges = ['DataSet: ' + dsName, 'Action: auto'];
            if (el.getAttribute('popupmenu')) badges.push('PopupMenu');
            if (el.getAttribute('genpopupmenu') !== 'false') badges.push('AutoMenu');
            if (el.getAttribute('show_range') === 'true') badges.push('Range');
            if (el.getAttribute('excel') === 'true')    badges.push('Excel');
            if (el.getAttribute('selectlist'))          badges.push('SelectList');

            for (var b = 0; b < badges.length; b++) {
                var bg = doc.createElement('span');
                bg.className = 'd3-preview-unitview-badge';
                bg.textContent = badges[b];
                footer.appendChild(bg);
            }
            wrap.appendChild(footer);

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
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            /* --- UnitView --- */
            { type: 'separator', caption: 'UnitView' },
            { name: 'unit',                caption: 'Unit',                type: 'string', attr: true },
            { name: 'show_method',         caption: 'Show Method',         type: 'string', attr: true },
            { name: 'default_show_method', caption: 'Default Show Method', type: 'string', attr: true },
            { name: 'parent',              caption: 'Parent',              type: 'string', attr: true },
            { name: 'calc_height',         caption: 'Calc Height',         type: 'string', attr: true },

            /* --- Display --- */
            { type: 'separator', caption: 'Display' },
            { name: 'excel',             caption: 'Excel Export',    type: 'boolean', attr: true },
            { name: 'show_hint',         caption: 'Show Hint',       type: 'boolean', attr: true },
            { name: 'show_range',        caption: 'Show Range',      type: 'boolean', attr: true },
            { name: 'line_break',        caption: 'Line Break',      type: 'boolean', attr: true },
            { name: 'filter_expand_def', caption: 'Filter Expanded', type: 'boolean', attr: true },

            /* --- Selection --- */
            { type: 'separator', caption: 'Selection' },
            { name: 'selectlist',    caption: 'Select List',    type: 'boolean', attr: true },
            { name: 'select_childs', caption: 'Select Childs',  type: 'boolean', attr: true },

            /* --- Range --- */
            { type: 'separator', caption: 'Range' },
            { name: 'range_type',       caption: 'Range Type',        type: 'string', attr: true },
            { name: 'range_show_count', caption: 'Range Show Count',  type: 'string', attr: true },
            { name: 'range_selectlist', caption: 'Range Select List', type: 'string', attr: true },
            { name: 'range_count',      caption: 'Range Count',       type: 'number', attr: true },

            /* --- Catalog --- */
            { type: 'separator', caption: 'Catalog' },
            { name: 'catalog_unitcode',  caption: 'Catalog Unit Code', type: 'string',  attr: true },
            { name: 'default_catalog',   caption: 'Default Catalog',   type: 'string',  attr: true },
            { name: 'cid_object',        caption: 'CID Object',        type: 'string',  attr: true },
            { name: 'is_container_main', caption: 'Is Container Main', type: 'boolean', attr: true },
            { name: 'detailcomponents',  caption: 'Detail Components', type: 'string',  attr: true },
            { name: 'detaildataset',     caption: 'Detail DataSets',   type: 'string',  attr: true },

            /* --- List --- */
            { type: 'separator', caption: 'List' },
            { name: 'list',       caption: 'List',         type: 'boolean', attr: true },
            { name: 'listunit',   caption: 'List Unit',    type: 'string',  attr: true },
            { name: 'listmethod', caption: 'List Method',  type: 'string',  attr: true },
            { name: 'listctrl',   caption: 'List Control', type: 'string',  attr: true },

            /* --- Popup --- */
            { type: 'separator', caption: 'Popup Menu' },
            { name: 'popupmenu',      caption: 'PopupMenu name',     type: 'string',  attr: true },
            { name: 'genpopupmenu',   caption: 'Generate PopupMenu', type: 'boolean', attr: true },
            { name: 'show_log_popup', caption: 'Show Log Popup',     type: 'boolean', attr: true },
            { name: 'use_list_btn',   caption: 'Use List Button',    type: 'string',  attr: true },

            /* --- Filters --- */
            { type: 'separator', caption: 'Filters' },
            { name: 'custom_filter',     caption: 'Custom Filter',     type: 'string', attr: true },
            { name: 'admissible_filter', caption: 'Admissible Filter', type: 'string', attr: true },

            /* --- Scripts --- */
            { type: 'separator', caption: 'Scripts' },
            { name: 'edit_script',   caption: 'Edit Script',   type: 'text', attr: true },
            { name: 'view_script',   caption: 'View Script',   type: 'text', attr: true },
            { name: 'add_script',    caption: 'Add Script',    type: 'text', attr: true },
            { name: 'copy_script',   caption: 'Copy Script',   type: 'text', attr: true },
            { name: 'del_script',    caption: 'Delete Script', type: 'text', attr: true },
            { name: 'move_script',   caption: 'Move Script',   type: 'text', attr: true },
            { name: 'report_script', caption: 'Report Script', type: 'text', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onchange', caption: 'OnChange (inline)', type: 'code' },
            { name: 'onpopup',  caption: 'OnPopup (inline)',  type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);