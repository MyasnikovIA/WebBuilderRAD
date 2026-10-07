/* cmpGrid — таблица данных.

   Серверный контрол: GridCtrl.inc (class Grid).
   Клиентский контрол: Grid.js (D3Api.GridCtrl).

   Серверный Show() собирает:
     <div class="grid box-sizing-force" …>
       <div class="grid_header" cont="gridcaption">
         <div class="grid_settings"…></div>
         <span cont="gridcaptioncontent">caption</span>
         <cmpButton … class="btn_actions"/>
       </div>
       <div class="grid_columns" cont="gridcolumnscont">
         <table cont="gridcolumns"><colgroup/><tbody><tr cont="gridcolumnscaption">…</tr></tbody></table>
       </div>
       <div class="grid_data_cont"><div class="grid_data" cont="griddatacont">
         <div class="grid_data_info" cont="griddatainfo"></div>
         <table class="grid_data" cont="griddata"><tbody>
           <tr cmptype="GridRow" repeatershow="true" cont="gridrow">…</tr>
         </tbody></table>
         <div class="grid_filters" cont="gridfilter">…</div>
         <div class="grid__wf" cont="gridwindowfunction">…</div>
       </div></div>
       <div class="grid_footer">…</div>
       <div class="grid_params_cont" cont="grid_params_cont"></div>
       <div class="grid_wait" cont="grid_wait"></div>
       <div class="grid_disable_cont" cont="grid_disable"></div>
     </div>

   Дети: cmpColumn и cmpGridFooter.

   В IDE в canvas видно: заголовок + шапка с колонками + пример пустых строк +
   подвал. Сами дети (cmpColumn, cmpGridFooter) визуально скрыты — их captions
   используются только для шапки. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.grid', tagName: 'cmpGrid', caption: 'Grid',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: { name: '', dataset: '', caption: 'Grid' },

        create: function (doc) {
            var el = doc.createElement('cmpgrid');
            el.setAttribute('data-wb-tag', 'cmpGrid');
            el.setAttribute('name', '');
            el.setAttribute('dataset', '');
            el.setAttribute('caption', 'Grid');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-grid';

            /* Header */
            var header = doc.createElement('div');
            header.className = 'd3-preview-grid-header';
            header.textContent = el.getAttribute('caption') || 'Grid';
            wrap.appendChild(header);

            /* Собираем дочерние Column / GridFooter */
            var cols = [];
            var hasFooter = false;
            var kids = el.children;
            for (var i = 0; i < kids.length; i++) {
                var k = kids[i];
                if (!k.tagName) continue;
                var t = k.tagName.toLowerCase();
                if (t === 'cmpcolumn') cols.push(k);
                else if (t === 'cmpgridfooter') hasFooter = true;
            }

            /* Таблица */
            var table = doc.createElement('table');
            table.className = 'd3-preview-grid-table';

            var thead = doc.createElement('thead');
            var tr = doc.createElement('tr');
            if (cols.length === 0) {
                var th = doc.createElement('th');
                th.textContent = '(no columns)';
                th.className = 'd3-preview-grid-empty';
                tr.appendChild(th);
            } else {
                for (var j = 0; j < cols.length; j++) {
                    var th2 = doc.createElement('th');
                    th2.textContent =
                        cols[j].getAttribute('caption') ||
                        cols[j].getAttribute('field') ||
                        '';
                    var al = cols[j].getAttribute('align');
                    if (al) th2.style.textAlign = al;
                    tr.appendChild(th2);
                }
            }
            thead.appendChild(tr);
            table.appendChild(thead);

            var tbody = doc.createElement('tbody');
            if (cols.length > 0) {
                for (var r = 0; r < 3; r++) {
                    var row = doc.createElement('tr');
                    for (var c2 = 0; c2 < cols.length; c2++) {
                        var td = doc.createElement('td');
                        row.appendChild(td);
                    }
                    tbody.appendChild(row);
                }
            }
            table.appendChild(tbody);
            wrap.appendChild(table);

            /* Подвал */
            if (hasFooter) {
                var f = doc.createElement('div');
                f.className = 'd3-preview-grid-footer';
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
            { name: 'dataset',     caption: 'DataSet',      type: 'string', attr: true },
            { name: 'field',       caption: 'Field',        type: 'string', attr: true },
            { name: 'keyfield',    caption: 'KeyField',     type: 'string', attr: true },
            { name: 'returnfield', caption: 'ReturnField',  type: 'string', attr: true },
            { name: 'hintfield',   caption: 'HintField',    type: 'string', attr: true },
            { name: 'groupname',   caption: 'GroupName',    type: 'string', attr: true },
            { name: 'norepeat',    caption: 'NoRepeat',     type: 'boolean', attr: true },
            { name: 'distinct',    caption: 'Distinct',     type: 'string', attr: true },

            /* --- Grid --- */
            { type: 'separator', caption: 'Grid' },
            { name: 'selectlist',       caption: 'SelectList',       type: 'string',  attr: true },
            { name: 'notrow',           caption: 'NotRow',           type: 'string',  attr: true },
            { name: 'settings_method',  caption: 'Settings Method',  type: 'string',  attr: true },
            { name: 'popupmenu',        caption: 'PopupMenu',        type: 'string',  attr: true },
            { name: 'popup_log_unit',   caption: 'Popup Log Unit',   type: 'string',  attr: true },
            { name: 'excel',            caption: 'Excel',            type: 'boolean', attr: true },
            { name: 'export_template',  caption: 'Export Template',  type: 'string',  attr: true },
            { name: 'export_header',    caption: 'Export Header',    type: 'string',  attr: true },
            { name: 'columns_to_sum',   caption: 'Columns To Sum',   type: 'string',  attr: true },
            { name: 'max_lines',        caption: 'Max Lines',        type: 'number',  attr: true },
            { name: 'show_hint',        caption: 'Show Hint',        type: 'boolean', attr: true },
            { name: 'white_space_nowrap', caption: 'White Space Nowrap', type: 'boolean', attr: true },
            { name: 'showfilter',       caption: 'Show Filter',      type: 'boolean', attr: true },
            { name: 'sort_not_append_ds', caption: 'Sort Not Append DS', type: 'boolean', attr: true },
            { name: 'profile',          caption: 'Profile',          type: 'boolean', attr: true },
            { name: 'limit_row',        caption: 'Limit Row',        type: 'boolean', attr: true },
            { name: 'noheader',         caption: 'No Header',        type: 'boolean', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'oncreate',         caption: 'OnCreate',         type: 'code' },
            { name: 'onshow',           caption: 'OnShow',           type: 'code' },
            { name: 'onafter_refresh',  caption: 'OnAfterRefresh',   type: 'code' },
            { name: 'onchange',         caption: 'OnChange',         type: 'code' },
            { name: 'onfilter',         caption: 'OnFilter',         type: 'code' },
            { name: 'onprofile_change', caption: 'OnProfileChange',  type: 'code' },
            { name: 'onclick',          caption: 'OnClick',          type: 'code' },
            { name: 'ondblclick',       caption: 'OnDblClick',       type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);