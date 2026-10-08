/* cmpPageControl — контейнер закладок (вкладок).

   Серверный контрол: PageControlCtrl.inc (class PageControl extends BaseCtrl).
   Клиентский контрол: PageControl.js (D3Api.PageControlCtrl).

   Серверный Show() собирает:
     mode="horizontal" (по умолчанию):
       <div class="ctrl_pageControl bg box-sizing-force" uniqid="pc…" mode="horizontal">
         <div cont="div_ul" class="div_ul">
           <ul cont="PageControl_head" class="ctrl_pageControlTabs bg">
             <li class="ctrl_pageControlTabBtn tab0_pc…" pageindex="0">…</li>
             <li class="ctrl_pageControlTabBtn tab1_pc…" pageindex="1">…</li>
           </ul>
           <div cont="ScrollNext"  class="button_scroll next_scroll"  onclick="…ScrollNext(this)"></div>
           <div cont="ScrollPrior" class="button_scroll prior_scroll" onclick="…ScrollPrior(this)"></div>
         </div>
         <div cont="page0_pc…" class="ctrl_pageControlTabPage page0_pc…">…</div>
         <div cont="page1_pc…" class="ctrl_pageControlTabPage page1_pc…">…</div>
       </div>

     mode="vertical": та же структура, но <ul> слева, страницы справа.

   Дети: cmpTabSheet.

   Атрибуты:
     mode        — 'horizontal' | 'vertical'.
     nobg        — 'true' — не рисовать фон табов / нижнюю границу.
     activeindex — индекс активной закладки.
     uniqid      — служебный, сервер генерирует автоматически (pcXXXX).

   В IDE: в canvas виден как «скелет» — панель с табами и активной
   страницей. Сами дети (cmpTabSheet) скрыты через CSS. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    /* Собирает из детей cmpTabSheet массив {caption, active, visible}. */
    function collectTabs(el) {
        var out = [];
        var kids = el.children;
        for (var i = 0; i < kids.length; i++) {
            var k = kids[i];
            if (!k.tagName) continue;
            if (k.tagName.toLowerCase() !== 'cmptabsheet') continue;
            var cap = k.getAttribute('caption') || '';
            var act = k.getAttribute('active') === 'true';
            var vis = k.getAttribute('visible') !== 'false';
            var dis = k.getAttribute('enabled') === 'false';
            out.push({ el: k, caption: cap, active: act, visible: vis, disabled: dis });
        }
        return out;
    }

    /* Определяет индекс активного таба:
       приоритет — activeindex на корне; иначе первый active="true"; иначе 0. */
    function resolveActive(el, tabs) {
        var ai = parseInt(el.getAttribute('activeindex'), 10);
        if (!isNaN(ai) && ai >= 0 && ai < tabs.length) return ai;
        for (var i = 0; i < tabs.length; i++) if (tabs[i].active) return i;
        return tabs.length ? 0 : -1;
    }

    D3.register({
        id: 'd3.pagecontrol', tagName: 'cmpPageControl', caption: 'PageControl',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: { name: '', mode: 'horizontal' },

        create: function (doc) {
            var el = doc.createElement('cmppagecontrol');
            el.setAttribute('data-wb-tag', 'cmpPageControl');
            el.setAttribute('name', '');
            el.setAttribute('mode', 'horizontal');
            el.setAttribute('activeindex', '0');
            return el;
        },

        preview: function (el, doc) {
            var mode = el.getAttribute('mode') === 'vertical' ? 'vertical' : 'horizontal';
            var tabs = collectTabs(el);
            var activeIdx = resolveActive(el, tabs);

            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-pagecontrol d3-preview-pagecontrol-' + mode;
            if (el.getAttribute('nobg') === 'true') wrap.classList.add('d3-preview-pagecontrol-nobg');
            if (el.getAttribute('visible') === 'false') wrap.style.display = 'none';
            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');

            /* Пробрасываем width / height. */
            var w = el.getAttribute('width');
            var h = el.getAttribute('height');
            if (w) wrap.style.width = w;
            if (h) wrap.style.minHeight = h;

            /* ---- Tab bar ---- */
            var bar = doc.createElement('div');
            bar.className = 'd3-preview-pagecontrol-bar';

            if (tabs.length === 0) {
                var emptyTab = doc.createElement('span');
                emptyTab.className = 'd3-preview-pagecontrol-tab d3-preview-pagecontrol-tab-empty';
                emptyTab.textContent = '(no tabs)';
                bar.appendChild(emptyTab);
            } else {
                for (var i = 0; i < tabs.length; i++) {
                    var t = tabs[i];
                    if (!t.visible) continue;
                    var tabEl = doc.createElement('span');
                    tabEl.className = 'd3-preview-pagecontrol-tab';
                    if (i === activeIdx) tabEl.classList.add('active');
                    if (t.disabled) tabEl.classList.add('disabled');
                    tabEl.textContent = t.caption || ('Tab ' + (i + 1));
                    bar.appendChild(tabEl);
                }
            }
            wrap.appendChild(bar);

            /* ---- Active page ---- */
            var body = doc.createElement('div');
            body.className = 'd3-preview-pagecontrol-body';
            if (activeIdx >= 0 && tabs[activeIdx]) {
                var activeCap = tabs[activeIdx].caption || ('Tab ' + (activeIdx + 1));
                var ph = doc.createElement('span');
                ph.className = 'd3-preview-pagecontrol-placeholder';
                ph.textContent = activeCap + ' (content)';
                body.appendChild(ph);
            } else {
                var ph0 = doc.createElement('span');
                ph0.className = 'd3-preview-pagecontrol-placeholder';
                ph0.textContent = '(empty)';
                body.appendChild(ph0);
            }
            wrap.appendChild(body);

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

            /* --- PageControl --- */
            { type: 'separator', caption: 'PageControl' },
            { name: 'mode', caption: 'Mode', type: 'enum', attr: true,
                values: ['horizontal', 'vertical'] },
            { name: 'nobg', caption: 'No Background', type: 'boolean', attr: true },
            { name: 'activeindex', caption: 'Active Index', type: 'number', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onpagechange', caption: 'OnPageChange', type: 'code' },
            { name: 'onpageshow',   caption: 'OnPageShow',   type: 'code' },
            { name: 'onpagehide',   caption: 'OnPageHide',   type: 'code' },
            { name: 'onclick',      caption: 'OnClick',      type: 'code' },
            { name: 'ondblclick',   caption: 'OnDblClick',   type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);