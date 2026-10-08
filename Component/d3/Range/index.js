/* cmpRange — пагинация (постраничная навигация).

   Серверный контрол: RangeCtrl.inc (class Range extends BaseCtrl).
   Клиентский контрол: Range.js (D3Api.RangeCtrl).

   Серверный Show() собирает:
     <div class="ctrl_range" uniqid="…" …attrs…>
       <div class="ctrl_range_go_prior" onclick="D3Api.RangeCtrl.go(this,-1)"></div>
       <ul class="ctrl_range_pages" cont="btnpagecont">
         <li class="ctrl_range_page" cont="btnpage"></li>
       </ul>
       <div class="ctrl_range_go_next [ctrl_range_last_bt]"
            onclick="D3Api.RangeCtrl.go(this,1)"></div>
       [<div class="ctrl_range_go_last ctrl_range_last_bt"
             onclick="D3Api.RangeCtrl.goLastPage(this);"
             cont="range_go_last"></div>]
       <div class="ctrl_range_cont" name="range_count_<uid>"></div>
       <div class="ctrl_range_cont" name="range_select_<uid>"></div>
       <div class="ctrl_range_nav">
         по&nbsp;<div class="ctrl_range_amount" cont="range_amount">
           <span>…</span>
           <div class="ctrl_range_amount_tip">
             [<div class="ctrl_range_amount_item" …>10</div>…]
             <cmpEdit name="range_amount_<uid>"/>
           </div>
         </div>&nbsp;записей
         стр.&nbsp;<div class="ctrl_range_go" cont="range_go">
           <span>…</span>
           <div class="ctrl_range_go_tip">
             <cmpEdit name="range_page_<uid>"/>
           </div>
         </div>&nbsp;из <span cont="range_pages"></span>
       </div>
     </div>

   В IDE: рисуем статичный «скелет» пагинатора — кнопки, номера
   страниц, «по N записей», «стр. X из Y». */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.range', tagName: 'cmpRange', caption: 'Range',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            dataset: '',
            default_amount: '10',
            pages: '3',
            count: 'true'
        },

        create: function (doc) {
            var el = doc.createElement('cmprange');
            el.setAttribute('data-wb-tag', 'cmpRange');
            el.setAttribute('name', '');
            el.setAttribute('dataset', '');
            el.setAttribute('default_amount', '10');
            el.setAttribute('pages', '3');
            el.setAttribute('count', 'true');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-range';
            if (el.getAttribute('visible') === 'false') wrap.style.display = 'none';
            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');

            /* Пробрасываем width. */
            var w = el.getAttribute('width');
            if (w) wrap.style.width = w;

            var amount = el.getAttribute('default_amount') || '10';
            var showCount = el.getAttribute('count') !== 'false';
            var showLast = el.getAttribute('count') === 'false';

            /* Кнопка «назад» */
            var prior = doc.createElement('span');
            prior.className = 'd3-preview-range-btn d3-preview-range-prior';
            prior.textContent = '\u2039'; /* ‹ */
            wrap.appendChild(prior);

            /* Кнопки страниц */
            var pagesWrap = doc.createElement('span');
            pagesWrap.className = 'd3-preview-range-pages';
            var totalPages = 5;
            for (var i = 1; i <= totalPages; i++) {
                var p = doc.createElement('span');
                p.className = 'd3-preview-range-page';
                if (i === 1) p.classList.add('active');
                p.textContent = String(i);
                pagesWrap.appendChild(p);
            }
            wrap.appendChild(pagesWrap);

            /* Кнопка «вперёд» */
            var next = doc.createElement('span');
            next.className = 'd3-preview-range-btn d3-preview-range-next';
            next.textContent = '\u203A'; /* › */
            wrap.appendChild(next);

            /* Кнопка «в конец» — если count="false" */
            if (showLast) {
                var last = doc.createElement('span');
                last.className = 'd3-preview-range-btn d3-preview-range-last';
                last.textContent = '\u00BB'; /* » */
                wrap.appendChild(last);
            }

            /* Навигация «по N записей / стр. X из Y» */
            var nav = doc.createElement('span');
            nav.className = 'd3-preview-range-nav';

            var amountText = doc.createElement('span');
            amountText.className = 'd3-preview-range-amount';
            amountText.textContent = 'по ' + amount + ' записей';
            nav.appendChild(amountText);

            var pageText = doc.createElement('span');
            pageText.className = 'd3-preview-range-pageinfo';
            pageText.textContent = 'стр. 1 из ' + totalPages;
            nav.appendChild(pageText);

            wrap.appendChild(nav);

            /* Метка «range» — отличает от обычной кнопки */
            var badge = doc.createElement('span');
            badge.className = 'd3-preview-range-badge';
            badge.textContent = 'range';
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

            /* --- D3 Base --- */
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            /* --- Range --- */
            { type: 'separator', caption: 'Range' },
            { name: 'dataset',        caption: 'DataSet',         type: 'string',  attr: true },
            { name: 'default_amount', caption: 'Default Amount',  type: 'number',  attr: true },
            { name: 'amounts',        caption: 'Amounts (1,2,3)', type: 'string',  attr: true },
            { name: 'pages',          caption: 'Visible Pages',   type: 'number',  attr: true },
            { name: 'count',          caption: 'Count (total)',   type: 'boolean', attr: true },
            { name: 'show_count',     caption: 'Show Count',      type: 'boolean', attr: true },
            { name: 'selectlist',     caption: 'SelectList',      type: 'string',  attr: true },
            { name: 'keyfield',       caption: 'KeyField',        type: 'string',  attr: true },
            { name: 'not_append_ds',  caption: 'Not Append DS',   type: 'boolean', attr: true },
            { name: 'locate',         caption: 'Locate (f:c:p)',  type: 'string',  attr: true },

            /* --- Tree --- */
            { type: 'separator', caption: 'Tree (для иерархии)' },
            { name: 'tree_dataset', caption: 'Tree DataSet', type: 'string', attr: true },
            { name: 'parentfield',  caption: 'Parent Field', type: 'string', attr: true },
            { name: 'childsfield',  caption: 'Childs Field', type: 'string', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onamount',    caption: 'OnAmount',    type: 'code' },
            { name: 'onclick',     caption: 'OnClick',     type: 'code' },
            { name: 'ondblclick',  caption: 'OnDblClick',  type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);