/* Canvas core: конструктор, жизненный цикл, работа с корнем документа,
   design mode, константы и утилиты, разделяемые между модулями Canvas.

   Модуль Canvas разбит на пять файлов (в порядке загрузки):
     1. canvas-core.js      — конструктор, константы, lifecycle, root, design mode
     2. canvas-events.js    — обработчики мыши/клавиатуры, контекстное меню
     3. canvas-selection.js — выделение, resize-handles, перемещение
     4. canvas-insert.js    — вставка компонентов, preview
     5. canvas-format.js    — сериализация HTML (cleanHtml и т.п.)

   Все файлы дополняют один и тот же global.Canvas, определённый в этом
   (первом) файле. Загружать строго в указанном порядке. */
(function (global) {
    'use strict';
    var bus = global.EventBus;

    /* ============================================================
       Константы
       ============================================================ */
    var SEL = 'wb-selected';
    var HOV = 'wb-hover';

    var VOID = { IMG:1, INPUT:1, BR:1, HR:1, META:1, LINK:1, AREA:1, BASE:1,
        COL:1, EMBED:1, SOURCE:1, TRACK:1, WBR:1, PARAM:1 };

    var VOID_LOWER = { img:1, input:1, br:1, hr:1, meta:1, link:1, area:1, base:1,
        col:1, embed:1, source:1, track:1, wbr:1, param:1 };

    var RAW_TAGS = { script:1, style:1, pre:1, textarea:1 };

    var CDATA_CONTAINERS = {
        cmpaction:1, cmpdataset:1, cmpscript:1, cmpsubaction:1,
        cmprepeaterstyler:1, cmpserverscript:1,
        cmpstatgridcolumnheader:1
    };

    var XML_SELF_CLOSE = {
        cmpactionvar:1, cmpdatasetvar:1, cmpcomboitem:1, cmpsubactionvar:1,
        cmpfetchvar:1, cmpsubfetchvar:1, cmpmodulevar:1,
        cmpimage:1,
        'wb-image':1, cmptagitem:1
    };

    var INDENT = '    ';
    var RESIZE_DIRS = ['nw','n','ne','e','se','s','sw','w'];
    var MOVE_THRESHOLD = 3;

    var CDATA_PH_OPEN  = '\u0001WB_CDATA_PH_';
    var CDATA_PH_CLOSE = '_\u0001';

    var PARENT_FALLBACK = {
        cmpselectlistitem: 'cmpselectlist'
    };

    var CMP_SELF_CLOSE_RE = /<(cmp[a-zA-Z0-9]+)((?:\s+[^<>]*?)?)\s*\/>/g;
    function expandSelfClosingCmpTags(str) {
        return String(str).replace(CMP_SELF_CLOSE_RE, function (m, tag, attrs) {
            return '<' + tag + (attrs || '') + '></' + tag + '>';
        });
    }

    var COMPONENT_SELF_CLOSE_RE = /<component((?:\s+[^<>]*?)?)\s*\/>/g;
    function expandSelfClosingComponentTags(str) {
        return String(str).replace(COMPONENT_SELF_CLOSE_RE, function (m, attrs) {
            return '<component' + (attrs || '') + '></component>';
        });
    }

    /* ------------------------------------------------------------------
       expandSelfClosingHtmlTags

       Разворачивает самозакрытые СТАНДАРТНЫЕ HTML-теги (<div/>, <span/>, …)
       в <tag></tag> ДО того, как HTML попадёт в doc.write().

       В text/html браузер трактует <div .../> как ОТКРЫВАЮЩИЙ тег —
       следующий элемент становится вложенным. Для user-компонентов
       (<div data-wb-user-comp cmptype="…"/>) это визуально ломает сцену:
       верхний div «съедает» нижний и остаётся пустым.

       Void-теги (<br>, <img>, …) не трогаем — они самозакрываются корректно.
       Custom-теги (cmp*, component) тоже не трогаем — их обрабатывают
       отдельные expandSelfClosing* функции. */
    var HTML_VOID_TAGS = {
        area:1, base:1, br:1, col:1, embed:1, hr:1, img:1, input:1,
        link:1, meta:1, param:1, source:1, track:1, wbr:1
    };
    var HTML_SELF_CLOSE_RE = /<([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^<>]*?)?)\/>/g;
    function expandSelfClosingHtmlTags(str) {
        return String(str).replace(HTML_SELF_CLOSE_RE, function (m, tag, attrs) {
            var t = tag.toLowerCase();
            if (HTML_VOID_TAGS[t]) return m;
            if (t.indexOf('cmp') === 0) return m;
            if (t === 'component') return m;
            return '<' + tag + (attrs || '') + '></' + tag + '>';
        });
    }

    function generateComponentName(doc, tagName, nameTemplate) {
        if (!doc || !nameTemplate) return '';
        var tagLower = String(tagName).toLowerCase();
        var esc = String(nameTemplate).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var re = new RegExp('^' + esc + '(\\d+)$');
        var maxN = 0;
        var all = doc.getElementsByTagName(tagLower);
        for (var i = 0; i < all.length; i++) {
            var nm = all[i].getAttribute && all[i].getAttribute('name');
            if (!nm) continue;
            var m = nm.match(re);
            if (m) {
                var n = parseInt(m[1], 10);
                if (!isNaN(n) && n > maxN) maxN = n;
            }
        }
        return nameTemplate + (maxN + 1);
    }

    var CMP_TAGS = {
        'cmpaction':      'cmpAction',
        'cmpactionvar':   'cmpActionVar',
        'cmpcomment':     'cmpComment',
        'cmpdataset':     'cmpDataSet',
        'cmpdatasetvar':  'cmpDataSetVar',
        'cmpscript':      'cmpScript',
        'cmpfilter':     'cmpFilter',
        'cmpinfobox': 'cmpInfoBox',
        'cmpinfoaboutrecord': 'cmpInfoAboutRecord',
        'cmpimage':       'cmpImage',
        'cmpfilteritem': 'cmpFilterItem',
        'cmpform':        'cmpForm',
        'cmpsubform':     'cmpSubForm',
        'cmpbutton':      'cmpButton',
        'cmpedit':        'cmpEdit',
        'cmpdateedit':    'cmpDateEdit',
        'cmpcombobox':    'cmpComboBox',
        'cmpcomboitem':   'cmpComboItem',
        'cmpunitedit':    'cmpUnitEdit',
        'cmphyperlink':   'cmpHyperLink',
        'cmpdependences': 'cmpDependences',
        'cmpmask':        'cmpMask',
        'cmpsubaction':   'cmpSubAction',
        'cmpfieldset':    'cmpFieldSet',
        'cmpsubactionvar':'cmpSubActionVar',
        'cmpbroker':      'cmpBroker',
        'cmpbuttonedit':  'cmpButtonEdit',
        'cmptagitem':     'cmpTagItem',
        'cmpserverscript': 'cmpServerScript',
        'cmpuniteditgenerate': 'cmpUnitEditGenerate',
        'cmpunitview': 'cmpUnitView',
        'cmpunitprops': 'cmpUnitProps',
        'cmptextarea': 'cmpTextArea',
        'cmpstoredvalues': 'cmpStoredValues',
        'cmpsort':     'cmpSort',
        'cmpsortitem': 'cmpSortItem',
        'cmpstatgrid':             'cmpStatGrid',
        'cmpstatgridcolumn':       'cmpStatGridColumn',
        'cmpstatgridcolumnheader': 'cmpStatGridColumnHeader',
        'cmpstatgridfooter':       'cmpStatGridFooter',
        'cmpstatsumm':             'cmpStatSumm',
        'cmptree':       'cmpTree',
        'cmptreecolumn': 'cmpTreeColumn',
        'cmptreefooter': 'cmpTreeFooter',
        'cmpcelllabel':   'cmpCellLabel',
        'cmpcharts':      'cmpCharts',
        'cmpcompleter':   'cmpCompleter',
        'cmpcustomfilter': 'cmpCustomFilter',
        'cmpdialog ': 'cmpDialog ',
        'cmpexpander ': 'cmpExpander ',
        'cmpfetch':       'cmpFetch',
        'cmpgrid':       'cmpGrid',
        'cmpcolumn':     'cmpColumn',
        'cmpselectlist':     'cmpSelectList',
        'cmpselectlistitem': 'cmpSelectListItem',
        'cmplabel': 'cmpLabel',
        'cmplayout': 'cmpLayout',
        'cmplayoutrow':  'cmpLayoutRow',
        'cmplayoutcell': 'cmpLayoutCell',
        'cmplinksviewer': 'cmpLinksViewer',
        'cmplocate': 'cmpLocate',
        'cmpmodule':    'cmpModule',
        'cmpmodulevar': 'cmpModuleVar',
        'cmppagecontrol': 'cmpPageControl',
        'cmptabsheet':    'cmpTabSheet',
        'cmppopupmenu':      'cmpPopupMenu',
        'cmppopupitem':      'cmpPopupItem',
        'cmppopupgroupitem': 'cmpPopupGroupItem',
        'cmpradiogroup': 'cmpRadioGroup',
        'cmpradioitem':  'cmpRadioItem',
        'cmprange': 'cmpRange',
        'cmprepeaterstyler': 'cmpRepeaterStyler',
        'cmpgridfooter': 'cmpGridFooter',
        'cmpfetchvar':    'cmpFetchVar',
        'cmpcheckbox':    'cmpCheckBox'
    };

    var RUNTIME_CMPTYPE_TO_TAG = {
        'Form':         'cmpform',
        'SubForm':      'cmpsubform',
        'Button':       'cmpbutton',
        'Edit':         'cmpedit',
        'DataSet':      'cmpdataset',
        'Script':       'cmpscript',
        'Action':       'cmpaction',
        'ComboBox':     'cmpcombobox',
        'Grid':         'cmpgrid',
        'Tree':         'cmptree'
    };

    /* ============================================================
       Конструктор
       ============================================================ */
    function Canvas(iframeEl) {
        this.iframe = iframeEl;
        this.pending = null;
        this.designMode = false;
        this._rootType = 'html';
        this._handles = null;
        this._handlesPending = false;
        this._handlers = null;
        this._boundDoc = null;
        this._assetGen = 0;
        this._init();
    }

    /* ============================================================
       Утилиты / lifecycle
       ============================================================ */

    Canvas.prototype._cleanClass = function (el) {
        if (!el || el.nodeType !== 1) return;
        if (typeof el.className === 'string' && el.className.trim() === '') {
            el.removeAttribute('class');
        }
    };

    Canvas.prototype._pageCoordsFromIframeEvent = function (e) {
        var rect = this.iframe.getBoundingClientRect();
        var scrollX = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
        var scrollY = window.pageYOffset || document.documentElement.scrollTop  || document.body.scrollTop  || 0;
        return {
            x: rect.left + scrollX + (e.clientX || 0),
            y: rect.top  + scrollY + (e.clientY || 0)
        };
    };

    Canvas.prototype._templateHtml = function () {
        return '<!DOCTYPE html>' +
            '<html lang="ru">' +
            '<head>' +
            '<meta charset="UTF-8">' +
            '</head>' +
            '<body></body>' +
            '</html>';
    };

    Canvas.prototype._currentTheme = function () {
        try {
            return document.documentElement.getAttribute('data-wb-theme') || 'light';
        } catch (e) {
            return 'light';
        }
    };

    /* ------------------------------------------------------------------
       _preResolveLibPaths

       Заменяет пути `lib/wb-component/*` в src/href тегов <script> /
       <link> на blob-URL ДО того, как HTML будет записан в iframe
       через document.write().

       Зачем: по HTML-спецификации, если у <script> уже началась
       загрузка, смена src НЕ перезапускает её. Если оставить
       src="lib/wb-component/core.js", браузер начнёт грузить его
       по HTTP из корня IDE, получит 404 и не перезапустит загрузку
       по blob-URL, который подставляет ProjectResolver.

       Одновременно перед src/href вставляется атрибут
       data-wb-orig-<attr>="…", чтобы последующая сериализация
       (cleanHtml) и ProjectResolver могли восстановить исходный путь. */
    Canvas.prototype._preResolveLibPaths = function (html) {
        if (!html) return html;
        if (!global.ProjectResolver ||
            !global.ProjectResolver.resolve ||
            !global.ProjectResolver.isProjectPath) {
            return html;
        }
        return String(html).replace(
            /<(script|link)\b([^>]*?)\b(src|href)\s*=\s*(["'])([^"']+)\4([^>]*)>/gi,
            function (m, tag, before, attr, quote, url, after) {
                if (url.indexOf('lib/wb-component/') !== 0) return m;
                try {
                    if (!global.ProjectResolver.isProjectPath(url)) return m;
                } catch (e) { return m; }

                var resolved;
                try { resolved = global.ProjectResolver.resolve(url); }
                catch (e) { return m; }
                if (resolved === url) return m;

                if (/\bdata-wb-orig-/i.test(before) ||
                    /\bdata-wb-orig-/i.test(after)) {
                    return '<' + tag + before +
                        attr + '=' + quote + resolved + quote +
                        after + '>';
                }
                return '<' + tag + before +
                    'data-wb-orig-' + attr + '=' + quote + url + quote +
                    ' ' + attr + '=' + quote + resolved + quote +
                    after + '>';
            }
        );
    };

    Canvas.prototype._injectIdeStyle = function () {
        var doc = this.getDoc();
        if (!doc) return;
        var old = doc.querySelector('style[data-wb-ide="1"]');
        if (old) old.parentNode.removeChild(old);

        var dark = (this._currentTheme() === 'dark');
        var bodyBg    = dark ? '#1e1e1e' : '#ffffff';
        var bodyColor = dark ? '#d4d4d4' : '#1a1a1a';

        var style = doc.createElement('style');
        style.setAttribute('data-wb-ide', '1');
        style.textContent =
            'html, body { min-height: 100%; }' +
            'html { height: 100%; background: ' + bodyBg + '; }' +
            'body { min-height: 100vh; margin: 0; box-sizing: border-box; position: relative;' +
            '       background: ' + bodyBg + '; color: ' + bodyColor + '; }' +

            'cmpForm, cmpSubForm, [data-wb-tag="cmpForm"], [data-wb-root="1"], component[cmptype="tmp"], component[cmptype="Form"], div[cmptype="Form"] { position: relative; }' +

            'component[cmptype] { display: inline-block; vertical-align: top; box-sizing: border-box; }' +
            'component[cmptype="Form"], component[cmptype="tmp"], component[cmptype="SubForm"], component[cmptype="PageControl"], component[cmptype="TabSheet"] { display: block; }' +

            'cmpaction, cmpcomment, cmpdataset, cmpscript, cmpmask, cmpbroker, cmpcompleter, cmpdependences, cmpfetch, cmpfetchvar, cmplocate, cmpmodule, cmpmodulevar, cmppopupmenu, cmprepeaterstyler, cmpserverscript, cmpsort {' +
            '  display: none !important; visibility: hidden !important;' +
            '  pointer-events: none !important; user-select: none !important;' +
            '}' +

            'component[cmptype="Script"], component[cmptype="Action"], component[cmptype="ActionVar"], component[cmptype="DataSet"], component[cmptype="Variable"], component[cmptype="MaskInspector"], component[cmptype="DepControls"], component[cmptype="Broker"], component[cmptype="Comment"], component[cmptype="Completer"], component[cmptype="Dependences"], component[cmptype="Fetch"], component[cmptype="FetchVar"], component[cmptype="Locate"], component[cmptype="Module"], component[cmptype="ModuleVar"], component[cmptype="RepeaterStyler"], component[cmptype="ServerScript"], component[cmptype="Sort"], component[cmptype="SubAction"], component[cmptype="SubActionVar"] {' +
            '  display: none !important; visibility: hidden !important;' +
            '  pointer-events: none !important; user-select: none !important;' +
            '}' +

            'wb-cdata { display: none !important; }' +
            'wb-images, wb-image { display: none !important; }' +

            '[data-wb-preview] { display: inline-block; outline: 1px dotted #b0bec5;' +
            '  outline-offset: 2px; padding: 1px 2px; margin: 1px; min-width: 12px; min-height: 12px; }' +
            '[data-wb-preview]:empty::before { content: "?"; color: #b0bec5; font-size: 10px; }' +

            /* Обёртка user-компонента.
               position: relative — контекст для position:absolute у детей
               (кнопки jQuery UI и пр.). overflow у неё самой — visible:
               сдвиг через margin-left/top (см. _fitUserComponentToContent)
               может увести часть содержимого левее/выше нуля — обрезка
               делается на самом el через inline overflow:hidden. */
            '.wb-user-comp-preview[data-wb-preview] {' +
            '  display: block;' +
            '  position: relative;' +
            '  width: 100%;' +
            '  height: 100%;' +
            '  box-sizing: border-box;' +
            '  margin: 0;' +
            '  padding: 0;' +
            '  min-width: 0;' +
            '  min-height: 0;' +
            '  outline: none;' +
            '}' +

            /* Сам контейнер user-компонента обрезает содержимое —
               иначе сдвинутая обёртка «вылезет» за рамку. */
            '[data-wb-user-comp] {' +
            '  overflow: hidden;' +
            '}' +

            '.' + SEL + '{outline:1px dashed #1e88e5 !important;outline-offset:-1px;}' +
            '.' + HOV + '{outline:1px dotted #90caf9 !important;outline-offset:-1px;}' +

            '.wb-resize-handle {' +
            '  position: absolute;' +
            '  width: 7px; height: 7px;' +
            '  margin: 0; padding: 0;' +
            '  background: #ffffff;' +
            '  border: 1px solid #1e88e5;' +
            '  border-radius: 1px;' +
            '  box-sizing: border-box;' +
            '  transform: translate(-50%, -50%);' +
            '  z-index: 99999;' +
            '  pointer-events: auto;' +
            '  user-select: none; -webkit-user-select: none;' +
            '}' +
            '.wb-resize-handle:hover, .wb-resize-handle.wb-resize-active { background: #1e88e5; }' +

            '.wb-move-handle {' +
            '  width: 16px !important; height: 16px !important;' +
            '  background: #1e88e5 !important;' +
            '  border: 2px solid #ffffff !important;' +
            '  border-radius: 50% !important;' +
            '  box-shadow: 0 0 0 1px #1e88e5;' +
            '  cursor: move !important;' +
            '}' +
            '.wb-move-handle:hover {' +
            '  background: #1565c0 !important;' +
            '}' +

            '.wb-moving { cursor: move !important; }';
        var head = this.getOrCreateHead();
        if (head) head.appendChild(style);
    };

    /* ------------------------------------------------------------------
       _collectKnownLibUrls

       Возвращает { js: {url:1}, css: {url:1} } — все внешние URL
       библиотек, которые считаются «сервисными»:
         • jsLibs / cssLibs всех palette-компонентов;
         • jsLibs / cssLibs активной ComponentTab (Root: component).

       Используется в _injectComponentAssets, чтобы пометить «голые»
       lib-теги, уже находящиеся в <head> iframe (например, из файла
       проекта), как сервисные. */
    Canvas.prototype._collectKnownLibUrls = function () {
        var out = { js: {}, css: {} };
        if (!global.ComponentStorage) return out;

        var comps = global.ComponentStorage.listComponents();
        for (var i = 0; i < comps.length; i++) {
            var libs = global.ComponentStorage.getComponentLibs(comps[i]);
            for (var j = 0; j < libs.jsLibs.length; j++) {
                var ju = libs.jsLibs[j].value;
                if (ju) out.js[ju] = 1;
            }
            for (var k = 0; k < libs.cssLibs.length; k++) {
                var cu = libs.cssLibs[k].value;
                if (cu) out.css[cu] = 1;
            }
        }

        if (global.App && global.App._componentMode &&
            global.componentTab && global.componentTab.getFormData) {
            try {
                var cd = global.componentTab.getFormData();
                var cLibs = cd.cssLibs || [];
                for (var ci = 0; ci < cLibs.length; ci++) {
                    var ce = cLibs[ci];
                    var cu2 = ce && (typeof ce === 'string' ? ce : ce.value);
                    if (cu2) out.css[cu2] = 1;
                }
                var jLibs = cd.jsLibs || [];
                for (var ji = 0; ji < jLibs.length; ji++) {
                    var je = jLibs[ji];
                    var ju2 = je && (typeof je === 'string' ? je : je.value);
                    if (ju2) out.js[ju2] = 1;
                }
            } catch (e) { /* ignore */ }
        }

        return out;
    };

    /* ------------------------------------------------------------------
       _injectInlineScript

       Вставляет inline-<script> в <head> iframe. Тег помечается
       data-wb-comp-asset="1" и data-wb-comp-owned="1", чтобы:
         • он не сериализовался cleanHtml() и не появлялся в Structure/Code;
         • при следующем вызове _injectComponentAssets удалялся только он
           (а не adopted-теги из файла проекта). */
    Canvas.prototype._injectInlineScript = function (head, doc, code) {
        if (!head || !doc || !code) return;
        var s = doc.createElement('script');
        s.setAttribute('data-wb-comp-asset', '1');
        s.setAttribute('data-wb-comp-owned', '1');
        s.textContent = code;
        head.appendChild(s);
    };

    /* ============================================================
       _injectComponentAssets

       Инжектит в <head> iframe:

         1. CSS / JS из ComponentRegistry (D3 / M2 / HTML).

         2. Для каждого user-компонента, реально присутствующего
            на сцене ([data-wb-user-comp]):

              • внешние jsLibs / cssLibs (jQuery, jQuery UI) — как
                <script src> / <link href>;

              • после их загрузки:

                  – CORE_SOURCE            — inline <script>;
                  – пользовательский CSS   — inline <style>;
                  – <cmptype>.js           — inline <script>, но
                                             с УРЕЗАННЫМ дефом
                                             (jsLibs/cssLibs пустые,
                                             т.к. уже подгружены выше —
                                             иначе WbComponent.applyLibs
                                             начнёт грузить их второй раз);
                  – пользовательский JS    — inline <script>.

         3. Root: component — дополнительно из активной ComponentTab
            (jsLibs / cssLibs / js).

       Всё, что мы создаём, помечается двумя маркерами:
         • data-wb-comp-asset="1"  — скрыто из Code и Structure;
         • data-wb-comp-owned="1"  — «наш» тег, удаляем только его.

       Теги, «принятые» из файла проекта (jQuery / jQuery UI / …),
       остаются в head нетронутыми — благодаря этому jQuery и jQuery UI
       гарантированно сохраняют порядок загрузки и не перезагружаются. */
    Canvas.prototype._injectComponentAssets = function () {
        var self = this;
        var doc = this.getDoc();
        if (!doc) return;
        var head = this.getOrCreateHead();
        if (!head) return;

        var gen = ++this._assetGen;

        /* 1. Удаляем ТОЛЬКО наши теги (owned). Adopted — не трогаем. */
        var old = doc.querySelectorAll('[data-wb-comp-asset="1"][data-wb-comp-owned="1"]');
        for (var r = old.length - 1; r >= 0; r--) old[r].parentNode.removeChild(old[r]);

        /* 2. Помечаем «голые» lib-теги (из файла проекта). */
        var known = this._collectKnownLibUrls();

        var headLinks = head.querySelectorAll('link[href]');
        for (var li = 0; li < headLinks.length; li++) {
            var lEl = headLinks[li];
            if (lEl.getAttribute('data-wb-comp-asset') === '1') continue;
            var hv    = lEl.getAttribute('href') || '';
            var hOrig = lEl.getAttribute('data-wb-orig-href') || '';
            if (known.css[hv] || known.css[hOrig] ||
                hv.indexOf('lib/wb-component/') === 0 ||
                hOrig.indexOf('lib/wb-component/') === 0) {
                lEl.setAttribute('data-wb-comp-asset', '1');
            }
        }
        var headScripts = head.querySelectorAll('script[src]');
        for (var si = 0; si < headScripts.length; si++) {
            var sEl = headScripts[si];
            if (sEl.getAttribute('data-wb-comp-asset') === '1') continue;
            var sv    = sEl.getAttribute('src') || '';
            var sOrig = sEl.getAttribute('data-wb-orig-src') || '';
            if (known.js[sv] || known.js[sOrig] ||
                sv.indexOf('lib/wb-component/') === 0 ||
                sOrig.indexOf('lib/wb-component/') === 0) {
                sEl.setAttribute('data-wb-comp-asset', '1');
            }
        }

        /* 3. Собираем URL, уже присутствующие в head (и blob, и оригинал). */
        var seenCss = {};
        var seenJs  = {};
        var linkNow = head.querySelectorAll('link[href]');
        for (var L = 0; L < linkNow.length; L++) {
            var lL = linkNow[L];
            var hh  = lL.getAttribute('href') || '';
            var hho = lL.getAttribute('data-wb-orig-href') || '';
            if (hh)  seenCss[hh]  = true;
            if (hho) seenCss[hho] = true;
        }
        var scriptNow = head.querySelectorAll('script[src]');
        for (var S = 0; S < scriptNow.length; S++) {
            var sS = scriptNow[S];
            var ss  = sS.getAttribute('src') || '';
            var sso = sS.getAttribute('data-wb-orig-src') || '';
            if (ss)  seenJs[ss]  = true;
            if (sso) seenJs[sso] = true;
        }

        var pendingJs = [];
        var userJsQueue = [];
        var cmptypeComponents = {};   /* cmptype → component */
        var coreNeeded = false;

        function addCss(url) {
            if (!url) return;
            if (/\.js(\?|#|$)/i.test(url)) { addJs(url); return; }
            if (seenCss[url]) return;
            seenCss[url] = true;
            var lk = doc.createElement('link');
            lk.rel = 'stylesheet';
            lk.href = url;
            lk.setAttribute('data-wb-comp-asset', '1');
            lk.setAttribute('data-wb-comp-owned', '1');
            head.appendChild(lk);
        }
        function addJs(url) {
            if (!url) return;
            if (/\.css(\?|#|$)/i.test(url)) { addCss(url); return; }
            if (seenJs[url]) return;
            seenJs[url] = true;
            pendingJs.push(new Promise(function (resolve) {
                var s = doc.createElement('script');
                s.src = url;
                s.async = false;
                s.setAttribute('data-wb-comp-asset', '1');
                s.setAttribute('data-wb-comp-owned', '1');
                s.onload  = resolve;
                s.onerror = resolve;
                head.appendChild(s);
            }));
        }

        /* 1. Ассеты из ComponentRegistry (D3 / M2 / HTML). */
        if (global.ComponentRegistry) {
            var list = global.ComponentRegistry.all();
            for (var i = 0; i < list.length; i++) {
                var comp = list[i];
                var cssList = comp.previewCssUrls || [];
                for (var c = 0; c < cssList.length; c++) addCss(cssList[c]);
                var jsList = comp.previewJsUrls || [];
                for (var j = 0; j < jsList.length; j++) addJs(jsList[j]);
            }
        }

        /* 2. User-компоненты, реально использованные на сцене. */
        if (global.ComponentStorage) {
            var userEls = doc.querySelectorAll('[data-wb-user-comp]');
            for (var u = 0; u < userEls.length; u++) {
                var ct = userEls[u].getAttribute('cmptype');
                if (!ct || cmptypeComponents[ct]) continue;
                var found = global.ComponentStorage.findByCmptype(ct);
                if (found) cmptypeComponents[ct] = found;
            }

            for (var ctName in cmptypeComponents) {
                if (!cmptypeComponents.hasOwnProperty(ctName)) continue;
                var cData = cmptypeComponents[ctName];
                var libs = global.ComponentStorage.getComponentLibs(cData);
                for (var cc = 0; cc < libs.cssLibs.length; cc++) {
                    addCss(libs.cssLibs[cc].value);
                }
                for (var jj = 0; jj < libs.jsLibs.length; jj++) {
                    addJs(libs.jsLibs[jj].value);
                }
                if (cData.js) userJsQueue.push(cData.js);
                coreNeeded = true;
            }
        }

        /* 3. Root: component — libs и JS из активной ComponentTab. */
        var userJsCode = '';
        if (global.App && global.App._componentMode &&
            global.componentTab && global.componentTab.getFormData) {
            try {
                var cd = global.componentTab.getFormData();
                if (cd) {
                    var cLibs = cd.cssLibs || [];
                    for (var ci = 0; ci < cLibs.length; ci++) {
                        var cle = cLibs[ci];
                        var cu  = cle && (typeof cle === 'string' ? cle : cle.value);
                        var cty = cle && cle.type ? cle.type : 'url';
                        if (cu && cty !== 'project') addCss(cu);
                    }
                    var jLibs = cd.jsLibs || [];
                    for (var ji = 0; ji < jLibs.length; ji++) {
                        var jle = jLibs[ji];
                        var ju  = jle && (typeof jle === 'string' ? jle : jle.value);
                        var jty = jle && jle.type ? jle.type : 'url';
                        if (ju && jty !== 'project') addJs(ju);
                    }
                    userJsCode = cd.js || '';
                }
            } catch (e) { /* ignore */ }
        }

        /* 4. После загрузки внешних libs — инжектим служебные скрипты
              (core.js, per-cmptype JS/CSS) и пользовательский JS.
              Порядок: core.js → <cmptype>.js → user JS. */
        Promise.all(pendingJs).then(function () {
            if (gen !== self._assetGen) return;
            var docNow = self.getDoc();
            if (!docNow) return;
            var headNow = self.getOrCreateHead();
            if (!headNow) return;

            var Comp = global.ComponentStorage;

            /* 4a. CORE_SOURCE — один раз, если на сцене есть user-comps. */
            if (coreNeeded && Comp && Comp.CORE_SOURCE) {
                self._injectInlineScript(headNow, docNow, Comp.CORE_SOURCE);
            }

            /* 4b. Пользовательский CSS каждого cmptype — inline <style>. */
            for (var ctCss in cmptypeComponents) {
                if (!cmptypeComponents.hasOwnProperty(ctCss)) continue;
                var cCss = cmptypeComponents[ctCss];
                if (!cCss.css) continue;
                var st = docNow.createElement('style');
                st.setAttribute('data-wb-comp-asset', '1');
                st.setAttribute('data-wb-comp-owned', '1');
                st.textContent =
                    '/* WbComponent: ' + (cCss.name || ctCss) +
                    ' (' + ctCss + ') — user css */\n' + cCss.css;
                headNow.appendChild(st);
            }

            /* 4c. Per-cmptype JS — inline, с урезанным деф-ом:
                   jsLibs/cssLibs уже загружены выше, повторно их
                   подгружать не нужно. Иначе WbComponent.applyLibs()
                   начнёт грузить jQuery второй раз. */
            for (var ctJs in cmptypeComponents) {
                if (!cmptypeComponents.hasOwnProperty(ctJs)) continue;
                var cJs = cmptypeComponents[ctJs];
                if (!cJs || !Comp || typeof Comp._buildCmptypeJs !== 'function') continue;

                var stripped = {
                    id: cJs.id,
                    cmptype: cJs.cmptype,
                    name: cJs.name,
                    html: cJs.previewIdeHtml || cJs.html || '',
                    jsLibs: [],
                    cssLibs: [],
                    customProperties: cJs.customProperties || [],
                    customEvents: cJs.customEvents || [],
                    js: cJs.js || '',
                    css: cJs.css || ''
                };
                try {
                    var jsCode = Comp._buildCmptypeJs(stripped);
                    if (jsCode) self._injectInlineScript(headNow, docNow, jsCode);
                } catch (e) {
                    console.error('[Canvas] build cmptype JS', ctJs, e);
                }
            }

            /* 4d. Пользовательский JS palette-компонентов. */
            for (var qi = 0; qi < userJsQueue.length; qi++) {
                self._injectInlineScript(headNow, docNow, userJsQueue[qi]);
            }

            /* 4e. JS активной ComponentTab (Root: component). */
            if (userJsCode) {
                self._injectInlineScript(headNow, docNow, userJsCode);
            }
        });
    };

    /* Перезагружает сцену из текущего DOM — чтобы заново выполнились
       libs и пользовательский JS компонента. Применяется при правках
       в ComponentTab (Root: component). */
    Canvas.prototype._reloadComponentCanvas = function () {
        try {
            var html = this.cleanHtml();
            if (html && html.replace(/\s+/g, '')) {
                this.loadHtml(html);
            }
        } catch (e) { console.error('[Canvas] reload component canvas', e); }
    };

    Canvas.prototype._init = function () {
        var self = this;
        var doc = this.getDoc();
        doc.open();
        doc.write(this._templateHtml());
        doc.close();

        this._injectIdeStyle();
        this._injectComponentAssets();
        this._bind();
        this._cleanClass(this.getBody());

        this._rootType = this._detectRootType();

        if (global.IDE) global.IDE._canvas = this;

        if (global.MutationObserver) {
            this._mo = new global.MutationObserver(function (muts) {
                for (var i = 0; i < muts.length; i++) {
                    var m = muts[i];
                    if (m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length)) {
                        bus.emit('canvas:changed');
                        return;
                    }
                    if (m.type === 'characterData') {
                        bus.emit('canvas:changed');
                        return;
                    }
                }
            });
            var html = this.getHtml();
            if (html) this._mo.observe(html, {
                childList: true, subtree: true, characterData: true
            });
        }

        bus.on('canvas:changed', function () {
            if (self._handlesPending) return;
            self._handlesPending = true;
            setTimeout(function () {
                self._handlesPending = false;
                if (self.designMode) return;
                if (!self._handles || !self._handles.length) return;
                var sel = self.getSelected();
                if (sel) self._positionResizeHandles(sel);
                else     self._removeResizeHandles();
            }, 0);
        });

        bus.on('theme:changed', function () {
            self._injectIdeStyle();
        });

        /* Перезагрузка сцены при изменении данных компонента
           в активной ComponentTab (Root: component):
             • js-changed       — пользователь дописал/изменил JS;
             • libs-changed     — пользователь добавил/удалил lib;
             • preview-changed  — пользователь правит PreViewIDE(html). */
        bus.on('component:js-changed', function () {
            if (global.App && global.App._componentMode) {
                self._reloadComponentCanvas();
            }
        });
        bus.on('component:libs-changed', function () {
            if (global.App && global.App._componentMode) {
                self._reloadComponentCanvas();
            }
        });
        bus.on('component:preview-changed', function () {
            if (global.App && global.App._componentMode) {
                self._reloadComponentCanvas();
            }
        });

        bus.emit('canvas:ready', this);

        setTimeout(function () {
            self._reobserve();
            self._cleanClass(self.getBody());
            bus.emit('canvas:changed');
        }, 0);
    };

    /* ============================================================
       Доступ к документу
       ============================================================ */

    Canvas.prototype.getDoc = function () {
        return this.iframe.contentDocument || this.iframe.contentWindow.document;
    };
    Canvas.prototype.getHtml = function () {
        var d = this.getDoc();
        return d ? d.documentElement : null;
    };
    Canvas.prototype.getHead = function () {
        var d = this.getDoc();
        return d ? d.head : null;
    };
    Canvas.prototype.getOrCreateHead = function () {
        var doc = this.getDoc();
        if (!doc) return null;
        if (doc.head) return doc.head;
        var head = doc.createElement('head');
        var html = doc.documentElement;
        if (html) html.insertBefore(head, html.firstChild);
        return head;
    };
    Canvas.prototype.getBody = function () {
        var d = this.getDoc();
        return d ? d.body : null;
    };
    Canvas.prototype.getOrCreateBody = function () {
        var doc = this.getDoc();
        if (doc.body) return doc.body;
        var body = doc.createElement('body');
        var html = doc.documentElement;
        if (html) html.appendChild(body);
        return body;
    };

    /* ============================================================
       Корневой контейнер
       ============================================================ */

    Canvas.prototype.getRootType = function () { return this._rootType; };

    Canvas.prototype.getRootContainer = function () {
        if (this._rootType === 'html') return this.getHtml();
        var body = this.getBody();
        if (!body) return null;
        var kids = body.children;
        for (var i = 0; i < kids.length; i++) {
            var k = kids[i];
            var tag = k.tagName.toLowerCase();
            var wbTag = k.getAttribute && k.getAttribute('data-wb-tag');
            var ctype = k.getAttribute && k.getAttribute('cmptype');
            if (this._rootType === 'cmpForm' &&
                (tag === 'cmpform' || wbTag === 'cmpForm')) return k;
            if (this._rootType === 'm2Form' &&
                tag === 'div' && ctype === 'Form') return k;
            if (this._rootType === 'div' &&
                tag === 'div' && k.getAttribute('data-wb-root') === '1') return k;
        }
        return null;
    };

    Canvas.prototype._ensureRootDivMarkers = function () {
        if (this._rootType !== 'div') return null;
        var body = this.getBody();
        if (!body) return null;

        var bKids = body.children;
        var i, bk;
        for (i = 0; i < bKids.length; i++) {
            bk = bKids[i];
            if (bk.tagName && bk.tagName.toLowerCase() === 'div' &&
                bk.getAttribute('data-wb-root') === '1') {
                return bk;
            }
        }

        var onlyDiv = null;
        var divCount = 0;
        for (i = 0; i < bKids.length; i++) {
            bk = bKids[i];
            if (bk.getAttribute && bk.getAttribute('data-wb-ide') === '1') continue;
            if (bk.getAttribute && bk.getAttribute('data-wb-preview') === '1') continue;
            if (bk.tagName && bk.tagName.toLowerCase() === 'div') {
                onlyDiv = bk;
                divCount++;
            } else {
                return null;
            }
        }
        if (divCount !== 1 || !onlyDiv) return null;

        if (!onlyDiv.getAttribute('data-wb-root')) {
            onlyDiv.setAttribute('data-wb-root', '1');
        }
        if (!onlyDiv.getAttribute('data-cmptype')) {
            onlyDiv.setAttribute('data-cmptype', 'd3.rootdiv');
        }
        if (!onlyDiv.getAttribute('class')) {
            onlyDiv.setAttribute('class', 'formBackground');
        }
        return onlyDiv;
    };

    Canvas.prototype._detectRootType = function () {
        if (global.App && global.App._componentMode) return 'div';

        var body = this.getBody();
        if (!body) return 'html';
        var kids = body.children;
        for (var i = 0; i < kids.length; i++) {
            var k = kids[i];
            var tag = k.tagName.toLowerCase();
            var wbTag = k.getAttribute && k.getAttribute('data-wb-tag');
            var ctype = k.getAttribute && k.getAttribute('cmptype');
            if (tag === 'cmpform' || wbTag === 'cmpForm') return 'cmpForm';
            if (tag === 'div' && ctype === 'Form') return 'm2Form';
            if (tag === 'div' && k.getAttribute('data-wb-root') === '1') return 'div';
        }
        return 'html';
    };

    Canvas.prototype.setRootType = function (type) {
        if (['html', 'cmpForm', 'm2Form', 'div'].indexOf(type) < 0) return;

        if (type === this._rootType) {
            this._injectComponentAssets();
            return;
        }

        var doc = this.getDoc();
        var body = this.getBody();
        if (!body) return;

        var existingRoot = null;
        var bKids0 = body.children;
        for (var e = 0; e < bKids0.length; e++) {
            var be = bKids0[e];
            var bTag = be.tagName.toLowerCase();
            var bWbTag = be.getAttribute && be.getAttribute('data-wb-tag');
            var bCmptype = be.getAttribute && be.getAttribute('cmptype');
            if (type === 'cmpForm') {
                if (bTag === 'cmpform' || bWbTag === 'cmpForm' ||
                    (bTag === 'div' && bCmptype === 'Form')) {
                    existingRoot = be;
                    break;
                }
            }
            if (type === 'm2Form' &&
                bTag === 'div' && bCmptype === 'Form') {
                existingRoot = be;
                break;
            }
            if (type === 'div' && bTag === 'div' &&
                be.getAttribute('data-wb-root') === '1') {
                existingRoot = be;
                break;
            }
        }

        if (!existingRoot && type === 'div' && bKids0.length === 1) {
            var onlyChild = bKids0[0];
            if (onlyChild.tagName && onlyChild.tagName.toLowerCase() === 'div') {
                existingRoot = onlyChild;
            }
        }

        if (existingRoot) {
            if (type === 'cmpForm') {
                existingRoot.setAttribute('data-wb-tag', 'cmpForm');
                if (!existingRoot.getAttribute('data-cmptype')) {
                    existingRoot.setAttribute('data-cmptype', 'd3.form');
                }
                if (!existingRoot.getAttribute('class')) {
                    existingRoot.setAttribute('class', 'd3form formBackground');
                }
            } else if (type === 'm2Form') {
                if (!existingRoot.getAttribute('cmptype')) {
                    existingRoot.setAttribute('cmptype', 'Form');
                }
                if (!existingRoot.getAttribute('class')) {
                    existingRoot.setAttribute('class', 'formBackground');
                }
            } else if (type === 'div') {
                if (!existingRoot.getAttribute('data-wb-root')) {
                    existingRoot.setAttribute('data-wb-root', '1');
                }
                if (!existingRoot.getAttribute('data-cmptype')) {
                    existingRoot.setAttribute('data-cmptype', 'd3.rootdiv');
                }
                if (!existingRoot.getAttribute('class')) {
                    existingRoot.setAttribute('class', 'formBackground');
                }
            }
            this._rootType = type;
            this._renderPreview(existingRoot);
            this._injectComponentAssets();
            bus.emit('canvas:changed');
            bus.emit('canvas:rootType:changed', { rootType: type });
            bus.emit('selection:changed', { element: existingRoot });
            return;
        }

        var oldRoot = (this._rootType === 'html') ? null : this.getRootContainer();
        var source = oldRoot || body;
        var moved = [];
        var kids = source.children;
        for (var i = 0; i < kids.length; i++) {
            var k = kids[i];
            if (k.getAttribute && k.getAttribute('data-wb-ide') === '1') continue;
            if (k.getAttribute && k.getAttribute('data-wb-preview') === '1') continue;
            moved.push(k);
        }
        for (var j = 0; j < moved.length; j++) {
            if (moved[j].parentNode) moved[j].parentNode.removeChild(moved[j]);
        }
        if (oldRoot && oldRoot.parentNode) oldRoot.parentNode.removeChild(oldRoot);
        var bKids = body.children;
        for (var m = bKids.length - 1; m >= 0; m--) {
            var bk = bKids[m];
            if (bk.getAttribute && bk.getAttribute('data-wb-ide') === '1') continue;
            bk.parentNode.removeChild(bk);
        }

        var newRoot = null;
        if (type === 'cmpForm') {
            newRoot = doc.createElement('cmpform');
            newRoot.setAttribute('data-wb-tag', 'cmpForm');
            newRoot.setAttribute('data-cmptype', 'd3.form');
            newRoot.setAttribute('class', 'd3form formBackground');
        } else if (type === 'm2Form') {
            newRoot = doc.createElement('div');
            newRoot.setAttribute('cmptype', 'Form');
            newRoot.setAttribute('class', 'formBackground');
        } else if (type === 'div') {
            newRoot = doc.createElement('div');
            newRoot.setAttribute('data-cmptype', 'd3.rootdiv');
            newRoot.setAttribute('data-wb-root', '1');
        }

        if (newRoot) {
            body.appendChild(newRoot);
            for (var n = 0; n < moved.length; n++) newRoot.appendChild(moved[n]);
        } else {
            for (var p = 0; p < moved.length; p++) body.appendChild(moved[p]);
        }

        this._rootType = type;
        if (newRoot) this._renderPreview(newRoot);
        this._injectComponentAssets();

        bus.emit('canvas:changed');
        bus.emit('canvas:rootType:changed', { rootType: type });
        if (newRoot) bus.emit('selection:changed', { element: newRoot });
        else bus.emit('canvas:selection:reset');
    };

    /* ============================================================
       Reset / Load / Render all / Restore Cmp Tags
       ============================================================ */

    Canvas.prototype._reobserve = function () {
        if (!this._mo) return;
        this._mo.disconnect();
        var html = this.getHtml();
        if (html) this._mo.observe(html, {
            childList: true, subtree: true, characterData: true
        });
    };

    Canvas.prototype.reset = function () {
        var doc = this.getDoc();
        this._removeResizeHandles();
        doc.open();
        doc.write(this._templateHtml());
        doc.close();

        this._injectIdeStyle();
        this._injectComponentAssets();
        this._bind();
        this.pending = null;
        this.designMode = false;
        this._rootType = 'html';
        this._handles = null;
        this._handlesPending = false;
        $(this.iframe).removeClass('wb-design-mode');

        this._cleanClass(this.getBody());

        if (global.IDE) global.IDE._canvas = this;
        this._reobserve();

        bus.emit('canvas:refreshed', { collapseTree: true });
        bus.emit('canvas:changed');
        var self = this;
        setTimeout(function () {
            self._cleanClass(self.getBody());
            bus.emit('canvas:changed');
        }, 0);
    };

    Canvas.prototype.loadHtml = function (html, opts) {
        var self = this;
        var doc = this.getDoc();
        if (!doc) return;

        var str = String(html == null ? '' : html);
        if (!str.replace(/\s+/g, '')) return;

        var cdataStore = [];
        var prepared = str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, function (m, body) {
            var idx = cdataStore.length;
            cdataStore.push(body);
            return CDATA_PH_OPEN + idx + CDATA_PH_CLOSE;
        });

        prepared = expandSelfClosingHtmlTags(prepared);
        prepared = expandSelfClosingCmpTags(prepared);
        prepared = expandSelfClosingComponentTags(prepared);

        /* Разрешаем lib/wb-component/* в blob-URL ДО doc.write().
           Иначе браузер попытается загрузить их по HTTP из корня IDE
           (404), и, поскольку смена src уже после старта загрузки не
           перезапускает её, скрипты не будут исполнены. */
        prepared = this._preResolveLibPaths(prepared);

        var isFullDoc = /<!DOCTYPE/i.test(prepared)
            || /<html[\s>]/i.test(prepared)
            || /<body[\s>]/i.test(prepared);
        if (!isFullDoc) {
            prepared = this._templateHtml().replace('</body>', prepared + '</body>');
        }

        this._removeResizeHandles();

        doc.open();
        doc.write(prepared);
        doc.close();

        if (global.ProjectResolver) {
            try { global.ProjectResolver.applyTree(doc.documentElement); } catch (e) {}
        }

        if (cdataStore.length) {
            var re = new RegExp('\u0001WB_CDATA_PH_(\\d+)_\u0001', 'g');
            (function walk(n) {
                var kids = [];
                for (var i = 0; i < n.childNodes.length; i++) kids.push(n.childNodes[i]);
                for (var i = 0; i < kids.length; i++) {
                    var c = kids[i];
                    if (c.nodeType === 3) {
                        var v = c.nodeValue || '';
                        if (v.indexOf('\u0001WB_CDATA_PH_') < 0) continue;
                        var parts = [];
                        var last = 0;
                        var mm;
                        re.lastIndex = 0;
                        while ((mm = re.exec(v)) !== null) {
                            if (mm.index > last) parts.push({ t: 'txt', s: v.slice(last, mm.index) });
                            parts.push({ t: 'cdata', i: parseInt(mm[1], 10) });
                            last = mm.index + mm[0].length;
                        }
                        if (last < v.length) parts.push({ t: 'txt', s: v.slice(last) });
                        if (!parts.length) continue;
                        var parent = c.parentNode;
                        for (var p = 0; p < parts.length; p++) {
                            var pt = parts[p];
                            var newNode = (pt.t === 'cdata')
                                ? doc.createTextNode('<![CDATA[' + cdataStore[pt.i] + ']]>')
                                : doc.createTextNode(pt.s);
                            parent.insertBefore(newNode, c);
                        }
                        parent.removeChild(c);
                    } else if (c.nodeType === 1) {
                        walk(c);
                    }
                }
            })(doc.documentElement);
        }

        var bodyEl = this.getBody();
        if (bodyEl) {
            var comments = [];
            (function collect(node) {
                for (var i = 0; i < node.childNodes.length; i++) {
                    var cn = node.childNodes[i];
                    if (cn.nodeType === 8) {
                        comments.push(cn);
                    } else if (cn.nodeType === 1) {
                        collect(cn);
                    }
                }
            })(bodyEl);
            for (var ci = 0; ci < comments.length; ci++) {
                var cNode = comments[ci];
                var cEl = doc.createElement('cmpcomment');
                cEl.setAttribute('data-wb-tag', 'cmpComment');
                cEl.textContent = cNode.nodeValue || '';
                cNode.parentNode.replaceChild(cEl, cNode);
            }
        }

        var servs = doc.querySelectorAll('[data-wb-ide="1"], [data-wb-preview="1"]');
        for (var s = servs.length - 1; s >= 0; s--) {
            var sn = servs[s];
            if (sn.parentNode) sn.parentNode.removeChild(sn);
        }

        this._restoreCmpTags(doc.documentElement);

        (function strip(node) {
            if (!node || node.nodeType !== 1) return;
            self._stripServiceClasses(node);
            var kids = node.children;
            for (var i = 0; i < kids.length; i++) strip(kids[i]);
        })(doc.documentElement);

        this._injectIdeStyle();
        this._injectComponentAssets();
        this._bind();

        this.pending = null;
        this.designMode = false;
        this._rootType = this._detectRootType();

        if (this._rootType === 'div') {
            this._ensureRootDivMarkers();
        }

        this._handles = null;
        this._handlesPending = false;
        $(this.iframe).removeClass('wb-design-mode');

        var body = this.getBody();
        if (body) this._renderAllPreviews(body);

        if (global.ProjectResolver) {
            try { global.ProjectResolver.applyTree(doc.documentElement); } catch (e) {}
        }

        this._cleanClass(this.getBody());
        this._reobserve();

        var collapseTree = !opts || opts.collapseTree !== false;
        bus.emit('canvas:refreshed', { collapseTree: collapseTree });
        bus.emit('canvas:changed');
        bus.emit('canvas:selection:reset');

        setTimeout(function () {
            self._cleanClass(self.getBody());
            bus.emit('canvas:changed');
        }, 0);

        /* Автоподгонка user-компонентов — применяем размеры по
           фактическому содержимому. См. _fitAllUserComponents ниже. */
        this._fitAllUserComponents();
    };

    Canvas.prototype._renderAllPreviews = function (root) {
        if (!root || root.nodeType !== 1) return;
        if (root.getAttribute && root.getAttribute('data-wb-tag')) {
            this._renderPreview(root);
        }
        else if (root.getAttribute && root.getAttribute('cmptype')) {
            this._renderPreview(root);
        }
        var kids = root.children;
        for (var i = 0; i < kids.length; i++) {
            var c = kids[i];
            if (c.getAttribute && c.getAttribute('data-wb-preview') === '1') continue;
            if (c.getAttribute && c.getAttribute('data-wb-ide') === '1') continue;
            this._renderAllPreviews(c);
        }
    };

    /* ------------------------------------------------------------------
       _fitAllUserComponents

       Прогоняет автоподгонку по всем user-компонентам сцены:
         • ставит inline overflow:hidden на контейнер (см. _injectIdeStyle
           — там продублировано глобально, здесь страхуемся на случай
           приоритетов пользовательских стилей);
         • отложенно вызывает _fitUserComponentToContent (определён в
           canvas-insert.js) — он замеряет extents содержимого, ставит
           размеры el и сдвигает обёртку так, чтобы содержимое
           прижалось к (0,0) контейнера.

       Вызывается из loadHtml — чтобы уже сохранённые в проекте
       компоненты при загрузке тоже пришли к правильному виду. */
    Canvas.prototype._fitAllUserComponents = function () {
        var doc = this.getDoc();
        if (!doc) return;
        if (typeof this._fitUserComponentToContent !== 'function') return;

        var els = doc.querySelectorAll('[data-wb-user-comp]');
        var self = this;
        for (var i = 0; i < els.length; i++) {
            (function (el) {
                el.style.overflow = 'hidden';
                setTimeout(function () {
                    self._fitUserComponentToContent(el, 1);
                }, 120);
            })(els[i]);
        }
    };

    Canvas.prototype._restoreCmpTags = function (root) {
        if (!root || root.nodeType !== 1) return;
        var lower = root.tagName.toLowerCase();
        var wbTag = null;

        if (CMP_TAGS[lower]) {
            wbTag = CMP_TAGS[lower];
        } else if (lower !== 'component') {
            var cmptype = root.getAttribute && root.getAttribute('cmptype');
            if (cmptype && RUNTIME_CMPTYPE_TO_TAG[cmptype]) {
                var mappedTag = RUNTIME_CMPTYPE_TO_TAG[cmptype];
                if (CMP_TAGS[mappedTag]) wbTag = CMP_TAGS[mappedTag];
            }
        }

        if (wbTag) root.setAttribute('data-wb-tag', wbTag);

        var kids = root.children;
        for (var i = 0; i < kids.length; i++) this._restoreCmpTags(kids[i]);
    };

    /* ============================================================
       Design mode
       ============================================================ */

    Canvas.prototype.setDesignMode = function (on) {
        var doc = this.getDoc();
        this.designMode = !!on;
        try { doc.designMode = this.designMode ? 'on' : 'off'; } catch (e) {}

        if (this.designMode) {
            this.pending = null;
            this._removeResizeHandles();
            var sel = doc.querySelectorAll('.' + SEL);
            for (var i = 0; i < sel.length; i++) {
                sel[i].classList.remove(SEL);
                this._cleanClass(sel[i]);
            }
            var hov = doc.querySelectorAll('.' + HOV);
            for (var j = 0; j < hov.length; j++) {
                hov[j].classList.remove(HOV);
                this._cleanClass(hov[j]);
            }
            try { this.iframe.contentWindow.focus(); } catch (ex) {}
        }

        if (this.designMode) $(this.iframe).addClass('wb-design-mode');
        else $(this.iframe).removeClass('wb-design-mode');

        bus.emit('canvas:changed');
        bus.emit('canvas:selection:reset');
    };

    Canvas.prototype.toggleDesignMode = function () {
        this.setDesignMode(!this.designMode);
    };

    /* ============================================================
       Экспорт констант / утилит как статических свойств Canvas
       ============================================================ */
    Canvas.SEL = SEL;
    Canvas.HOV = HOV;
    Canvas.VOID = VOID;
    Canvas.VOID_LOWER = VOID_LOWER;
    Canvas.RAW_TAGS = RAW_TAGS;
    Canvas.CDATA_CONTAINERS = CDATA_CONTAINERS;
    Canvas.XML_SELF_CLOSE = XML_SELF_CLOSE;
    Canvas.INDENT = INDENT;
    Canvas.RESIZE_DIRS = RESIZE_DIRS;
    Canvas.MOVE_THRESHOLD = MOVE_THRESHOLD;
    Canvas.CDATA_PH_OPEN = CDATA_PH_OPEN;
    Canvas.CDATA_PH_CLOSE = CDATA_PH_CLOSE;
    Canvas.PARENT_FALLBACK = PARENT_FALLBACK;
    Canvas.CMP_TAGS = CMP_TAGS;
    Canvas.RUNTIME_CMPTYPE_TO_TAG = RUNTIME_CMPTYPE_TO_TAG;
    Canvas.expandSelfClosingCmpTags = expandSelfClosingCmpTags;
    Canvas.expandSelfClosingComponentTags = expandSelfClosingComponentTags;
    Canvas.expandSelfClosingHtmlTags = expandSelfClosingHtmlTags;
    Canvas.generateComponentName = generateComponentName;

    global.Canvas = Canvas;

})(window);