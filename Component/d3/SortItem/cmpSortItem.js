/* cmpSortItem — индикатор сортировки в колонке Grid.

   Серверный контрол: SortCtrl.inc (class SortItem extends BaseCtrl).
   Клиентский контрол: Sort.js (D3Api.SortItemCtrl).

   Разметка в рантайме:
     <div class="sort_item sort-ordernone" [style="display:none"]
          name="<name>" field="<field>"
          refreshdataset="<ds>"
          [constant="true"]
          title="Сортировать колонку: <caption>"
          onclick="D3Api.SortItemCtrl.setSort(this);">
       <div class="sort_block">
         <cmpLabel name="<name>_level" class="sort_level"
                   style="position:absolute;"/>
       </div>
     </div>

   Состояния (CSS-класс на корне):
     sort-ordernone  — сортировка не активна;
     sort-nextsort   — промежуточное (обычно не используется);
     sort-orderasc   — сортировка по возрастанию (стрелка вверх);
     sort-orderdesc  — сортировка по убыванию (стрелка вниз).

   Номер уровня (1, 2, 3, …) показывается в <cmpLabel class="sort_level">,
   когда полей сортировки несколько. CSS отображает level только при
   активной сортировке (sort-orderasc / sort-orderdesc).

   Атрибуты:
     name             — имя контрола. Если не задано — сервер формирует
                        '<refreshdataset>_<field>_SortItem'.
     field            — поле сортировки (обязательное).
     refreshdataset   — DataSet, который пересортировывается по клику.
                        Если не задано — берётся через getDataSet($this).
     sortorder        — текущее состояние: null | 1 (asc) | -1 (desc) | N (уровень).
     constant         — 'true' — скрыть элемент (display:none). Используется
                        для константной сортировки.
     use_in_view      — 'true' — добавить title-подсказку про сортировку колонки.

   parentOnly: обычно внутри cmpColumn (Grid). Но IDE не ограничивает.

   В IDE: превью — иконка сортировки, меняющая вид по sortorder. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    /* Возвращает CSS-класс состояния по значению sortorder. */
    function stateClass(sortorder) {
        var n = parseInt(sortorder, 10);
        if (isNaN(n) || n === 0) return 'sort-ordernone';
        if (n > 0) return 'sort-orderasc';
        return 'sort-orderdesc';
    }

    /* Возвращает уровень сортировки (число без знака) или пусто. */
    function levelValue(sortorder) {
        var n = parseInt(sortorder, 10);
        if (isNaN(n) || n === 0) return '';
        return String(Math.abs(n));
    }

    D3.register({
        id: 'd3.sortitem', tagName: 'cmpSortItem', caption: 'SortItem',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: { name: '', field: '', refreshdataset: '' },

        create: function (doc) {
            var el = doc.createElement('cmpsortitem');
            el.setAttribute('data-wb-tag', 'cmpSortItem');
            el.setAttribute('name', '');
            el.setAttribute('field', '');
            el.setAttribute('refreshdataset', '');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-sortitem';

            /* Состояние */
            var st = stateClass(el.getAttribute('sortorder'));
            wrap.classList.add('d3-preview-sortitem-' + st);

            if (el.getAttribute('visible') === 'false') wrap.style.display = 'none';
            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');
            if (el.getAttribute('constant') === 'true') wrap.classList.add('is-constant');

            /* Две стрелки (вверх / вниз) — в одной иконке. */
            var icon = doc.createElement('span');
            icon.className = 'd3-preview-sortitem-icon';
            wrap.appendChild(icon);

            /* Номер уровня — показываем, если sortorder задан. */
            var lvl = levelValue(el.getAttribute('sortorder'));
            if (lvl) {
                var lv = doc.createElement('span');
                lv.className = 'd3-preview-sortitem-level';
                lv.textContent = lvl;
                wrap.appendChild(lv);
            }

            /* Тултип для наглядности. */
            var field = el.getAttribute('field') || '';
            var ds = el.getAttribute('refreshdataset') || '';
            if (field) {
                wrap.title = 'field: ' + field + (ds ? ', ds: ' + ds : '');
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
            { name: 'title', caption: 'Title', type: 'string', attr: true },

            /* --- D3 Base --- */
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },

            /* --- SortItem --- */
            { type: 'separator', caption: 'SortItem' },
            { name: 'field',          caption: 'Field',           type: 'string',  attr: true },
            { name: 'refreshdataset', caption: 'Refresh DataSet', type: 'string',  attr: true },
            {
                name: 'sortorder',
                caption: 'Sort Order (1=asc, -1=desc, N=level)',
                type: 'number',
                attr: true
            },
            { name: 'constant',  caption: 'Constant (скрыть)', type: 'boolean', attr: true },
            { name: 'use_in_view', caption: 'Use In View',     type: 'boolean', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onclick',    caption: 'OnClick',    type: 'code' },
            { name: 'ondblclick', caption: 'OnDblClick', type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);