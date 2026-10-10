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

    Canvas.prototype._injectComponentAssets = function () {
        var doc = this.getDoc();
        if (!doc) return;
        var head = this.getOrCreateHead();
        if (!head) return;

        var old = doc.querySelectorAll('[data-wb-comp-asset="1"]');
        for (var r = old.length - 1; r >= 0; r--) old[r].parentNode.removeChild(old[r]);

        if (!global.ComponentRegistry) return;
        var list = global.ComponentRegistry.all();
        for (var i = 0; i < list.length; i++) {
            var comp = list[i];
            var cssList = comp.previewCssUrls || [];
            for (var c = 0; c < cssList.length; c++) {
                var link = doc.createElement('link');
                link.rel = 'stylesheet';
                link.href = cssList[c];
                link.setAttribute('data-wb-comp-asset', '1');
                head.appendChild(link);
            }
            var jsList = comp.previewJsUrls || [];
            for (var j = 0; j < jsList.length; j++) {
                var script = doc.createElement('script');
                script.src = jsList[j];
                script.setAttribute('data-wb-comp-asset', '1');
                head.appendChild(script);
            }
        }
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

    Canvas.prototype._detectRootType = function () {
        /* В режиме создания компонента корень всегда div — независимо от того,
           какой HTML был загружен (в т.ч. при двойном клике по HTML-файлу
           проекта). Это гарантирует, что вкладка Component не исчезнет. */
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
        if (type === this._rootType) return;

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
            }
            this._rootType = type;
            this._renderPreview(existingRoot);
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
            newRoot.setAttribute('class', 'formBackground');
        }

        if (newRoot) {
            body.appendChild(newRoot);
            for (var n = 0; n < moved.length; n++) newRoot.appendChild(moved[n]);
        } else {
            for (var p = 0; p < moved.length; p++) body.appendChild(moved[p]);
        }

        this._rootType = type;
        if (newRoot) this._renderPreview(newRoot);

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

        prepared = expandSelfClosingCmpTags(prepared);
        prepared = expandSelfClosingComponentTags(prepared);

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

        /* Сразу после парсинга — подменяем пути на blob/data URL. */
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
        this._handles = null;
        this._handlesPending = false;
        $(this.iframe).removeClass('wb-design-mode');

        var body = this.getBody();
        if (body) this._renderAllPreviews(body);

        /* Ещё раз — после создания preview-узлов. */
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
    Canvas.generateComponentName = generateComponentName;

    global.Canvas = Canvas;

})(window);