/* Canvas: iframe-холст, выбор элементов, размещение компонентов, Design Mode.
   Поддерживает:
     - четыре режима корневого контейнера: 'html', 'cmpForm', 'm2Form', 'div';
     - D3-компоненты (<cmpButton>) и M2-компоненты (<component cmptype="Button">);
     - CDATA-контейнеры в обоих форматах;
     - nameTemplate для авто-присвоения имён;
     - тёмную/светлую тему сцены (синхронно с IDE). */
(function (global) {
    'use strict';
    var bus = global.EventBus;

    var SEL = 'wb-selected', HOV = 'wb-hover';
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

    var CMP_SELF_CLOSE_RE = /<(cmp[a-zA-Z0-9]+)((?:\s+[^<>]*?)?)\s*\/>/g;
    function expandSelfClosingCmpTags(str) {
        return String(str).replace(CMP_SELF_CLOSE_RE, function (m, tag, attrs) {
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

    var PARENT_FALLBACK = {
        cmpselectlistitem: 'cmpselectlist'
    };

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

    var INDENT = '    ';
    var RESIZE_DIRS = ['nw','n','ne','e','se','s','sw','w'];
    var MOVE_THRESHOLD = 3;

    var CDATA_PH_OPEN  = '\u0001WB_CDATA_PH_';
    var CDATA_PH_CLOSE = '_\u0001';

    function Canvas(iframeEl) {
        this.iframe = iframeEl;
        this.pending = null;
        this.designMode = false;
        this._rootType = 'html';
        this._handles = null;
        this._handlesPending = false;
        /* Массив навешанных обработчиков и документ, на который они навешаны.
           Позволяет корректно снять их при повторном _bind(). */
        this._handlers = null;
        this._boundDoc = null;
        this._init();
    }

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
        if (newRoot) bus.emit('selection:changed', { element: newRoot });
        else bus.emit('canvas:selection:reset');
    };

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
        this._bind();                     /* FIX: обработчики потеряны при doc.write — навешиваем заново. */
        this.pending = null;
        this.designMode = false;
        this._rootType = 'html';
        this._handles = null;
        this._handlesPending = false;
        $(this.iframe).removeClass('wb-design-mode');

        this._cleanClass(this.getBody());

        if (global.IDE) global.IDE._canvas = this;
        this._reobserve();

        bus.emit('canvas:refreshed');
        bus.emit('canvas:changed');
        var self = this;
        setTimeout(function () {
            self._cleanClass(self.getBody());
            bus.emit('canvas:changed');
        }, 0);
    };

    Canvas.prototype.loadHtml = function (html) {
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
        this._bind();                     /* FIX: обработчики потеряны при doc.write — навешиваем заново. */

        this.pending = null;
        this.designMode = false;
        this._rootType = this._detectRootType();
        this._handles = null;
        this._handlesPending = false;
        $(this.iframe).removeClass('wb-design-mode');

        var body = this.getBody();
        if (body) this._renderAllPreviews(body);

        this._cleanClass(this.getBody());
        this._reobserve();

        bus.emit('canvas:refreshed');
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

    Canvas.prototype._getOffsetParent = function (el) {
        var doc = this.getDoc();
        if (!el || el.nodeType !== 1) return doc.body;
        var op = el.offsetParent;
        if (op && op !== doc.documentElement) return op;
        var p = el.parentNode;
        while (p && p.nodeType === 1) {
            var cs = doc.defaultView.getComputedStyle(p);
            if (cs.position !== 'static') return p;
            p = p.parentNode;
        }
        return doc.body;
    };

    Canvas.prototype._resolveSelection = function (eTarget) {
        if (!eTarget || eTarget.nodeType !== 1) return null;
        var doc = this.getDoc();

        var cur = eTarget;
        while (cur && cur !== doc.body && cur !== doc.documentElement) {
            if (cur.getAttribute && cur.getAttribute('data-wb-preview') === '1') {
                var owner = cur.parentNode;
                while (owner && owner !== doc.body) {
                    if (owner.getAttribute && owner.getAttribute('data-wb-tag')) return owner;
                    if (owner.getAttribute && owner.getAttribute('cmptype')) return owner;
                    owner = owner.parentNode;
                }
                return eTarget;
            }
            if (cur.getAttribute && cur.getAttribute('data-wb-ide') === '1') {
                var p = cur.parentNode;
                while (p && p !== doc.body) {
                    if (p.getAttribute && p.getAttribute('data-wb-tag')) return p;
                    if (p.getAttribute && p.getAttribute('cmptype')) return p;
                    p = p.parentNode;
                }
                return null;
            }
            cur = cur.parentNode;
        }
        return eTarget;
    };

    /* Снять ранее навешанные обработчики (если есть). */
    Canvas.prototype._unbind = function () {
        if (!this._handlers) return;
        var doc = this._boundDoc || this.getDoc();
        if (!doc) { this._handlers = null; this._boundDoc = null; return; }
        for (var i = 0; i < this._handlers.length; i++) {
            var h = this._handlers[i];
            try { doc.removeEventListener(h.type, h.fn, h.capture); } catch (e) {}
        }
        this._handlers = null;
        this._boundDoc = null;
    };

    Canvas.prototype._bind = function () {
        /* FIX: идемпотентность. После doc.write обработчики могли быть
           потеряны, поэтому просто навешиваем заново. Если старые всё
           ещё живы — снимаем их через _unbind. */
        this._unbind();

        var self = this, doc = this.getDoc();
        this._boundDoc = doc;
        this._handlers = [];

        function on(type, fn, capture) {
            doc.addEventListener(type, fn, capture);
            self._handlers.push({ type: type, fn: fn, capture: capture });
        }

        on('mousedown', function (e) {
            bus.emit('contextmenu:hide');
            if (self.designMode) return;

            /* FIX: сначала проверяем pending — если пользователь выбрал
               компонент в палитре, любой клик по сцене должен вставить.
               Проверка resize-handle идёт после, чтобы клик по handle
               тоже вставлял компонент, если pending установлен. */
            if (self.pending) {
                var target0 = self._placementTarget(e.target);
                self._place(self.pending, target0);
                e.preventDefault(); e.stopPropagation();
                return;
            }

            if (e.target && e.target.classList &&
                e.target.classList.contains('wb-resize-handle')) {
                return;
            }

            var target = self._resolveSelection(e.target);
            if (!target) return;
            if (target === doc.body || target === doc.documentElement) return;

            var current = self.getSelected();
            if (current !== target) self.select(target);
            else if (!self._handles) self._addResizeHandles(target);

            self._startMove(e, target);
            e.preventDefault();
        }, true);

        on('mouseover', function (e) {
            if (self.designMode) return;
            if (e.target && e.target.nodeType === 1 && !e.target.classList.contains(SEL))
                e.target.classList.add(HOV);
        }, true);

        on('mouseout', function (e) {
            if (self.designMode) return;
            if (e.target && e.target.nodeType === 1) {
                e.target.classList.remove(HOV);
                self._cleanClass(e.target);
            }
        }, true);

        on('keydown', function (e) {
            if (self.designMode) return;
            if (e.keyCode === 46) { bus.emit('command:delete'); e.preventDefault(); }
            else if (e.keyCode >= 37 && e.keyCode <= 40) {
                bus.emit('command:move', {
                    dx: e.keyCode === 37 ? -1 : e.keyCode === 39 ? 1 : 0,
                    dy: e.keyCode === 38 ? -1 : e.keyCode === 40 ? 1 : 0,
                    resize: e.ctrlKey || e.shiftKey
                });
                e.preventDefault();
            } else if (e.ctrlKey && e.keyCode === 90) { bus.emit('command:undo'); e.preventDefault(); }
            else if (e.ctrlKey && e.keyCode === 89) { bus.emit('command:redo'); e.preventDefault(); }
        });

        on('contextmenu', function (e) {
            if (self.pending) { self.pending = null; bus.emit('palette:cancelled'); }
            if (!self.designMode && e.target && e.target.nodeType === 1) {
                var target = self._resolveSelection(e.target);
                if (target) self.select(target);
            }
            var pt = self._pageCoordsFromIframeEvent(e);
            bus.emit('contextmenu:element', { x: pt.x, y: pt.y });
            e.preventDefault();
        });

        on('click', function (e) {
            if (self.designMode) return;
            e.preventDefault();
            e.stopPropagation();
        }, true);
    };

    Canvas.prototype._placementTarget = function (el) {
        var html = this.getHtml();
        var body = this.getBody() || this.getOrCreateBody();
        var head = this.getHead();
        if (!html) return null;
        if (!el || el.nodeType !== 1) return body;

        /* FIX: fallback — если корневой контейнер определён, но target
           вне него, всегда используем корневой контейнер. */
        if (this._rootType !== 'html') {
            var rc = this.getRootContainer();
            if (rc && el !== rc && !rc.contains(el)) return rc;
        }

        if (el !== html && !html.contains(el)) return body;

        var n = el;
        while (n && n !== body && n !== head && n !== html) {
            if (n.getAttribute && n.getAttribute('data-wb-preview') === '1') {
                n = n.parentNode;
                continue;
            }
            if (!VOID[n.tagName]) return n;
            n = n.parentNode;
        }
        if (n === head) return head;

        /* FIX: если не нашли внутри — используем корневой контейнер
           или body, чтобы вставка всегда была возможна. */
        if (this._rootType !== 'html') {
            var rc2 = this.getRootContainer();
            if (rc2) return rc2;
        }
        return body;
    };

    Canvas.prototype._findParentFor = function (parentOnly, target) {
        var doc = this.getDoc();
        var html = this.getHtml();

        var wanted;
        if (Array.isArray(parentOnly)) {
            wanted = parentOnly.map(function (t) { return String(t).toLowerCase(); });
        } else {
            wanted = [String(parentOnly).toLowerCase()];
        }

        var t = target;
        while (t && t !== html) {
            if (t.tagName) {
                var tag = t.tagName.toLowerCase();
                if (wanted.indexOf(tag) >= 0) return t;
            }
            t = t.parentNode;
        }
        for (var i = 0; i < wanted.length; i++) {
            var all = doc.querySelectorAll(wanted[i]);
            if (all.length > 0) return all[0];
        }
        return null;
    };

    Canvas.prototype.insertComponent = function (def, target, zone) {
        var doc  = this.getDoc();
        var html = this.getHtml();
        if (!html) return null;

        if (def.unique) {
            var existing = doc.querySelector(def.tagName);
            if (existing) {
                this.pending = null;
                bus.emit('palette:placed');
                this.select(existing);
                return existing;
            }
        }

        var el = def.create ? def.create(doc) : doc.createElement(def.tagName);
        if (def.cmptype && !el.getAttribute('cmptype')) {
            el.setAttribute('cmptype', def.cmptype);
        }
        if (def.cmptypeId) el.setAttribute('data-cmptype', def.cmptypeId);
        if (def.xmlTag && !el.getAttribute('data-wb-tag')) {
            el.setAttribute('data-wb-tag', def.xmlTag);
        }

        if (def.nameTemplate) {
            var newName = generateComponentName(doc, def.tagName, def.nameTemplate);
            if (newName) el.setAttribute('name', newName);
        }

        var parentOnly = def.parentOnly;
        if (!parentOnly && def.tagName) {
            parentOnly = PARENT_FALLBACK[String(def.tagName).toLowerCase()];
        }

        if (parentOnly) {
            var parent = this._findParentFor(parentOnly, target);
            if (!parent) {
                this.pending = null;
                bus.emit('palette:placed');
                return null;
            }
            parent.appendChild(el);
        } else if (def.rootLevel) {
            html.appendChild(el);
        } else if (def.headOnly) {
            var head = this.getOrCreateHead();
            head.appendChild(el);
        } else if (target === html || !target || !target.parentNode) {
            var body = this.getOrCreateBody();
            if (body) body.appendChild(el);
        } else if (zone === 'before') {
            target.parentNode.insertBefore(el, target);
        } else if (zone === 'after') {
            target.parentNode.insertBefore(el, target.nextSibling);
        } else {
            target.appendChild(el);
        }

        this.refreshPreviewAndParent(el);

        this.pending = null;
        bus.emit('palette:placed');

        var prev = doc.querySelectorAll('.' + SEL);
        for (var i = 0; i < prev.length; i++) {
            prev[i].classList.remove(SEL);
            this._cleanClass(prev[i]);
        }
        el.classList.add(SEL);
        this._addResizeHandles(el);

        bus.emit('canvas:changed');
        bus.emit('selection:changed', { element: el });
        return el;
    };

    Canvas.prototype._renderPreview = function (el) {
        if (!el || el.nodeType !== 1) return;

        var old = el.querySelector(':scope > [data-wb-preview="1"]');
        if (old) old.parentNode.removeChild(old);

        if (this.getRootContainer && this.getRootContainer() === el) return;

        var def = ComponentRegistry.match(el);
        if (!def || !def.preview) return;

        var doc = this.getDoc();
        var node;
        try { node = def.preview(el, doc); } catch (e) { node = null; }
        if (!node) return;

        if (typeof node === 'string') {
            var tmp = doc.createElement('div');
            tmp.innerHTML = node;
            node = tmp.firstChild;
        }
        if (!node || node.nodeType !== 1) return;

        node.setAttribute('data-wb-preview', '1');
        el.appendChild(node);
    };

    Canvas.prototype.refreshPreview = function (el) {
        if (!el || el.nodeType !== 1) return;
        this._renderPreview(el);
        var kids = el.children;
        for (var i = 0; i < kids.length; i++) {
            var c = kids[i];
            if (c.getAttribute && (c.getAttribute('data-wb-tag') || c.getAttribute('cmptype'))) {
                this.refreshPreview(c);
            }
        }
    };

    Canvas.prototype.refreshPreviewAndParent = function (el) {
        if (!el || el.nodeType !== 1) return;
        this.refreshPreview(el);
        var p = el.parentNode;
        if (p && p.nodeType === 1 && p.getAttribute &&
            (p.getAttribute('data-wb-tag') || p.getAttribute('cmptype'))) {
            this._renderPreview(p);
        }
    };

    Canvas.prototype._place = function (def, target) {
        this.insertComponent(def, target, 'inside');
    };

    Canvas.prototype.setPending  = function (def) { this.pending = def; };
    Canvas.prototype.getSelected = function () { return this.getDoc().querySelector('.' + SEL); };

    Canvas.prototype.select = function (el) {
        if (!el || el.nodeType !== 1) return;
        if (el === this.getHtml()) return;
        if (this.designMode) return;
        var prev = this.getDoc().querySelectorAll('.' + SEL);
        for (var i = 0; i < prev.length; i++) {
            prev[i].classList.remove(SEL);
            this._cleanClass(prev[i]);
        }
        el.classList.add(SEL);
        this._addResizeHandles(el);
        bus.emit('selection:changed', { element: el });
    };

    Canvas.prototype._applyBox = function (el, left, top, width, height, setAttrs) {
        el.style.left   = left   + 'px';
        el.style.top    = top    + 'px';
        el.style.width  = width  + 'px';
        el.style.height = height + 'px';

        if (setAttrs && el.getAttribute &&
            (el.getAttribute('data-wb-tag') || el.getAttribute('cmptype'))) {
            el.setAttribute('width',  Math.round(width)  + 'px');
            el.setAttribute('height', Math.round(height) + 'px');
        }

        var preview = null;
        for (var k = 0; k < el.children.length; k++) {
            var ch = el.children[k];
            if (ch.getAttribute && ch.getAttribute('data-wb-preview') === '1') {
                preview = ch;
                break;
            }
        }
        if (preview) {
            preview.style.width     = width  + 'px';
            preview.style.height    = height + 'px';
            preview.style.boxSizing = 'border-box';
        }
    };

    Canvas.prototype._makeAbsolute = function (el) {
        var doc  = this.getDoc();
        var body = this.getBody();
        if (!body) return false;
        var cs = doc.defaultView.getComputedStyle(el);
        if (cs.position !== 'absolute' && cs.position !== 'fixed') {
            var op = this._getOffsetParent(el);
            if (!op) op = body;
            var r  = el.getBoundingClientRect();
            var or = op.getBoundingClientRect();
            el.style.position = 'absolute';
            el.style.left     = Math.round(r.left - or.left) + 'px';
            el.style.top      = Math.round(r.top  - or.top)  + 'px';
            el.style.width    = Math.round(r.width)  + 'px';
            el.style.height   = Math.round(r.height) + 'px';
            return true;
        }
        return false;
    };

    Canvas.prototype._addResizeHandles = function (el) {
        this._removeResizeHandles();
        if (!el || el.nodeType !== 1) return;
        if (this.designMode) return;

        try {
            var cs = this.getDoc().defaultView.getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden') return;
        } catch (e) {}

        var html = this.getHtml();
        var head = this.getHead();
        var body = this.getBody();
        if (!html || !body) return;

        if (el === html || el === head || el === body) return;
        if (head && head.contains(el)) return;

        var rc = this.getRootContainer();
        if (this._rootType !== 'html' && rc && el === rc) return;

        var doc = this.getDoc();
        var self = this;
        this._handles = [];

        for (var i = 0; i < RESIZE_DIRS.length; i++) {
            (function (dir) {
                var h = doc.createElement('div');
                h.className = 'wb-resize-handle wb-resize-' + dir;
                h.setAttribute('data-wb-ide', '1');
                h.setAttribute('data-dir', dir);
                h.setAttribute('contenteditable', 'false');
                h.addEventListener('mousedown', function (ev) {
                    self._startResize(ev, dir);
                }, false);
                body.appendChild(h);
                self._handles.push(h);
            })(RESIZE_DIRS[i]);
        }

        (function () {
            var m = doc.createElement('div');
            m.className = 'wb-resize-handle wb-move-handle';
            m.setAttribute('data-wb-ide', '1');
            m.setAttribute('data-dir', 'move');
            m.setAttribute('contenteditable', 'false');
            m.addEventListener('mousedown', function (ev) {
                self._startMoveFromHandle(ev);
            }, false);
            body.appendChild(m);
            self._handles.push(m);
        })();

        this._positionResizeHandles(el);
    };

    Canvas.prototype._removeResizeHandles = function () {
        if (!this._handles) return;
        for (var i = 0; i < this._handles.length; i++) {
            var h = this._handles[i];
            if (h && h.parentNode) h.parentNode.removeChild(h);
        }
        this._handles = null;
    };

    Canvas.prototype._positionResizeHandles = function (el) {
        if (!this._handles || !this._handles.length) return;
        if (!el) el = this.getSelected();
        if (!el || el.nodeType !== 1) return;
        var body = this.getBody();
        if (!body) return;

        var r  = el.getBoundingClientRect();
        var br = body.getBoundingClientRect();
        var x = r.left - br.left;
        var y = r.top  - br.top;
        var w = r.width;
        var h = r.height;

        var positions = {
            nw: [x,       y,       'nwse-resize'],
            n:  [x + w/2, y,       'ns-resize'],
            ne: [x + w,   y,       'nesw-resize'],
            e:  [x + w,   y + h/2, 'ew-resize'],
            se: [x + w,   y + h,   'nwse-resize'],
            s:  [x + w/2, y + h,   'ns-resize'],
            sw: [x,       y + h,   'nesw-resize'],
            w:  [x,       y + h/2, 'ew-resize'],
            move: [x + w/2, y + h/2, 'move']
        };

        for (var i = 0; i < this._handles.length; i++) {
            var hd = this._handles[i];
            var dir = hd.getAttribute('data-dir');
            var p = positions[dir];
            if (!p) continue;
            hd.style.left   = p[0] + 'px';
            hd.style.top    = p[1] + 'px';
            hd.style.cursor = p[2];
        }
    };

    Canvas.prototype._trackMouse = function (onMove, onUp) {
        var doc      = this.getDoc();
        var iframe   = this.iframe;
        var outerDoc = global.document;
        var body     = this.getBody();

        var oldIframeCursor = body ? (body.style.cursor || '') : '';
        var oldOuterCursor  = (outerDoc && outerDoc.body)
            ? (outerDoc.body.style.cursor || '') : '';

        function handleIframe(ev) {
            onMove(ev.clientX, ev.clientY);
        }
        function handleOuter(ev) {
            var rect = iframe.getBoundingClientRect();
            onMove(ev.clientX - rect.left, ev.clientY - rect.top);
        }
        function handleUp() {
            doc.removeEventListener('mousemove', handleIframe, true);
            doc.removeEventListener('mouseup',   handleUp,     true);
            if (outerDoc) {
                outerDoc.removeEventListener('mousemove', handleOuter, true);
                outerDoc.removeEventListener('mouseup',   handleUp,    true);
            }
            if (body) body.style.cursor = oldIframeCursor;
            if (outerDoc && outerDoc.body) outerDoc.body.style.cursor = oldOuterCursor;
            if (onUp) onUp();
        }

        if (body) body.style.cursor = 'move';
        if (outerDoc && outerDoc.body) outerDoc.body.style.cursor = 'move';

        doc.addEventListener('mousemove', handleIframe, true);
        doc.addEventListener('mouseup',   handleUp,     true);
        if (outerDoc) {
            outerDoc.addEventListener('mousemove', handleOuter, true);
            outerDoc.addEventListener('mouseup',   handleUp,    true);
        }
    };

    Canvas.prototype._startResize = function (e, dir) {
        var self = this;
        var el = this.getSelected();
        if (!el) return;

        e.preventDefault();
        e.stopPropagation();

        var doc  = this.getDoc();
        var body = this.getBody();
        if (!body) return;

        var r  = el.getBoundingClientRect();

        this._makeAbsolute(el);

        var startLeft   = parseFloat(el.style.left);
        var startTop    = parseFloat(el.style.top);
        var startWidth  = parseFloat(el.style.width);
        var startHeight = parseFloat(el.style.height);

        if (isNaN(startLeft) || isNaN(startTop) ||
            isNaN(startWidth) || isNaN(startHeight)) {
            var op = this._getOffsetParent(el) || body;
            var or = op.getBoundingClientRect();
            if (isNaN(startLeft))   startLeft   = r.left - or.left;
            if (isNaN(startTop))    startTop    = r.top  - or.top;
            if (isNaN(startWidth))  startWidth  = r.width;
            if (isNaN(startHeight)) startHeight = r.height;
        }

        var startX = e.clientX;
        var startY = e.clientY;
        var MIN = 8;

        for (var i = 0; i < (this._handles || []).length; i++) {
            if (this._handles[i].getAttribute('data-dir') === dir) {
                this._handles[i].classList.add('wb-resize-active');
            }
        }

        function applyResize(clientX, clientY) {
            var dx = clientX - startX;
            var dy = clientY - startY;
            var nl = startLeft, nt = startTop, nw = startWidth, nh = startHeight;

            if (dir.indexOf('e') >= 0) nw = Math.max(MIN, startWidth + dx);
            if (dir.indexOf('s') >= 0) nh = Math.max(MIN, startHeight + dy);
            if (dir.indexOf('w') >= 0) {
                var tw = Math.max(MIN, startWidth - dx);
                nl = startLeft + (startWidth - tw);
                nw = tw;
            }
            if (dir.indexOf('n') >= 0) {
                var th = Math.max(MIN, startHeight - dy);
                nt = startTop + (startHeight - th);
                nh = th;
            }

            self._applyBox(el, nl, nt, nw, nh, true);
            self._positionResizeHandles(el);
        }

        this._trackMouse(applyResize, function () {
            for (var k = 0; k < (self._handles || []).length; k++) {
                self._handles[k].classList.remove('wb-resize-active');
            }
            bus.emit('canvas:changed');
            bus.emit('selection:changed', { element: el });
        });
    };

    Canvas.prototype._startMove = function (e, el) {
        if (!el || el.nodeType !== 1) return;
        if (this.designMode) return;

        var html = this.getHtml();
        var head = this.getHead();
        var body = this.getBody();
        if (!html || !body) return;
        if (el === html || el === body || el === head) return;
        if (head && head.contains(el)) return;

        var rc = this.getRootContainer();
        if (this._rootType !== 'html' && rc && el === rc) return;

        if (e.target && e.target.classList &&
            e.target.classList.contains('wb-resize-handle')) return;

        var self = this;
        var startX = e.clientX;
        var startY = e.clientY;
        var moved = false;
        var startLeft = 0, startTop = 0;

        function onMove(clientX, clientY) {
            var dx = clientX - startX;
            var dy = clientY - startY;

            if (!moved) {
                if (Math.abs(dx) < MOVE_THRESHOLD && Math.abs(dy) < MOVE_THRESHOLD) return;
                moved = true;

                self._makeAbsolute(el);

                var sl = parseFloat(el.style.left);
                var st = parseFloat(el.style.top);
                if (isNaN(sl) || isNaN(st)) {
                    var op = self._getOffsetParent(el) || body;
                    var r  = el.getBoundingClientRect();
                    var or = op.getBoundingClientRect();
                    if (isNaN(sl)) { sl = r.left - or.left; el.style.left = sl + 'px'; }
                    if (isNaN(st)) { st = r.top  - or.top;  el.style.top  = st + 'px'; }
                }
                startLeft = sl;
                startTop  = st;

                el.classList.add('wb-moving');
            }

            el.style.left = (startLeft + dx) + 'px';
            el.style.top  = (startTop  + dy) + 'px';
            self._positionResizeHandles(el);
        }

        this._trackMouse(onMove, function () {
            el.classList.remove('wb-moving');
            if (moved) {
                bus.emit('canvas:changed');
                bus.emit('selection:changed', { element: el });
            }
        });
    };

    Canvas.prototype._startMoveFromHandle = function (e) {
        var el = this.getSelected();
        if (!el || el.nodeType !== 1) return;
        if (this.designMode) return;

        e.preventDefault();
        e.stopPropagation();

        var html = this.getHtml();
        var body = this.getBody();
        if (!html || !body) return;
        if (el === html || el === body) return;

        var rc = this.getRootContainer();
        if (this._rootType !== 'html' && rc && el === rc) return;

        var self = this;
        var startX = e.clientX;
        var startY = e.clientY;

        this._makeAbsolute(el);

        var startLeft = parseFloat(el.style.left);
        var startTop  = parseFloat(el.style.top);

        if (isNaN(startLeft) || isNaN(startTop)) {
            var op = this._getOffsetParent(el) || body;
            var r  = el.getBoundingClientRect();
            var or = op.getBoundingClientRect();
            if (isNaN(startLeft)) startLeft = r.left - or.left;
            if (isNaN(startTop))  startTop  = r.top  - or.top;
            el.style.left = startLeft + 'px';
            el.style.top  = startTop  + 'px';
        }

        el.classList.add('wb-moving');

        function onMove(clientX, clientY) {
            var dx = clientX - startX;
            var dy = clientY - startY;
            el.style.left = (startLeft + dx) + 'px';
            el.style.top  = (startTop  + dy) + 'px';
            self._positionResizeHandles(el);
        }

        this._trackMouse(onMove, function () {
            el.classList.remove('wb-moving');
            bus.emit('canvas:changed');
            bus.emit('selection:changed', { element: el });
        });
    };

    Canvas.prototype._formatTagName = function (el) {
        var custom = el.getAttribute && el.getAttribute('data-wb-tag');
        if (custom) return custom;
        return el.tagName.toLowerCase();
    };

    function nodeHasMeaningfulChildren(node) {
        for (var i = 0; i < node.childNodes.length; i++) {
            var c = node.childNodes[i];
            if (c.nodeType === 1) {
                if (c.getAttribute && c.getAttribute('data-wb-preview') === '1') continue;
                if (c.tagName && c.tagName.toLowerCase() === 'wb-cdata') continue;
                return true;
            }
            if (c.nodeType === 3 && c.nodeValue && c.nodeValue.trim() !== '') return true;
        }
        return false;
    }

    Canvas.prototype._formatAttrs = function (el) {
        var out = '';
        var attrs = el.attributes;
        var hasWbTag = !!(el.getAttribute && el.getAttribute('data-wb-tag'));

        for (var i = 0; i < attrs.length; i++) {
            var a = attrs[i];
            var name = a.name;
            if (name === 'data-cmptype') continue;
            if (name === 'data-wb-editable') continue;
            if (name === 'data-wb-ide') continue;
            if (name === 'data-wb-tag') continue;
            if (name === 'data-wb-preview') continue;
            if (name === 'data-wb-root') continue;
            if (name === 'data-wb-comp-asset') continue;

            if (name === 'cmptype') {
                if (hasWbTag) continue;
            }

            var val = a.value == null ? '' : String(a.value);

            if (name === 'class') {
                var parts = val.split(/\s+/).filter(function (c) {
                    return c && c !== 'wb-selected' && c !== 'wb-hover' && c !== 'wb-moving';
                });
                if (parts.length === 0) continue;
                val = parts.join(' ');
            }

            val = val.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
            out += ' ' + name + '="' + val + '"';
        }
        return out;
    };

    Canvas.prototype._stripServiceClasses = function (el) {
        if (!el || el.nodeType !== 1) return;
        var cls = el.getAttribute('class');
        if (!cls) return;
        var parts = cls.split(/\s+/).filter(function (c) {
            return c && c !== 'wb-selected' && c !== 'wb-hover' && c !== 'wb-moving';
        });
        if (parts.length === 0) el.removeAttribute('class');
        else el.setAttribute('class', parts.join(' '));
    };

    Canvas.prototype._purgeServiceNodes = function (el) {
        if (!el || el.nodeType !== 1) return;
        var kids = el.children;
        for (var i = kids.length - 1; i >= 0; i--) {
            var child = kids[i];
            if (child.getAttribute && child.getAttribute('data-wb-ide') === '1') {
                child.parentNode.removeChild(child);
                continue;
            }
            if (child.getAttribute && child.getAttribute('data-wb-preview') === '1') {
                child.parentNode.removeChild(child);
                continue;
            }
            if (child.tagName && child.tagName.toLowerCase() === 'wb-cdata') {
                child.parentNode.removeChild(child);
                continue;
            }
            this._stripServiceClasses(child);
            if (child.hasAttribute && child.hasAttribute('data-cmptype')) {
                child.removeAttribute('data-cmptype');
            }
            if (child.hasAttribute && child.hasAttribute('data-wb-editable')) {
                child.removeAttribute('data-wb-editable');
            }
            this._purgeServiceNodes(child);
        }
    };

    Canvas.prototype._formatCmpNode = function (node, level, xmlTag) {
        var pad = '';
        for (var k = 0; k < level; k++) pad += INDENT;
        var innerPad = pad + INDENT;

        var attrs = this._formatAttrs(node);
        var cdata = null;
        var childCmp = [];

        for (var i = 0; i < node.childNodes.length; i++) {
            var c = node.childNodes[i];
            if (c.nodeType === 1) {
                if (c.getAttribute && c.getAttribute('data-wb-preview') === '1') continue;
                if (c.tagName && c.tagName.toLowerCase() === 'wb-cdata') {
                    var cv = c.textContent || '';
                    var cm = cv.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
                    cdata = cm ? cm[1] : cv;
                    continue;
                }
                childCmp.push(c);
            } else if (c.nodeType === 3) {
                var t = c.nodeValue || '';
                if (t.trim() === '') continue;
                var m = t.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
                if (m) {
                    cdata = m[1];
                } else {
                    childCmp.push(c);
                }
            } else if (c.nodeType === 8) {
                childCmp.push(c);
            }
        }

        if ((cdata === null || cdata === '') && childCmp.length === 0) {
            if (xmlTag === 'cmpForm') {
                return pad + '<' + xmlTag + attrs + '></' + xmlTag + '>\n';
            }
            return pad + '<' + xmlTag + attrs + '/>\n';
        }

        var out = pad + '<' + xmlTag + attrs + '>\n';

        if (cdata !== null && cdata !== '') {
            var lines = cdata.split(/\r?\n/);
            while (lines.length && lines[0].trim() === '') lines.shift();
            while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();

            var minIndent = Infinity;
            for (var mm = 0; mm < lines.length; mm++) {
                if (lines[mm].trim() === '') continue;
                var ind = lines[mm].match(/^\s*/)[0].length;
                if (ind < minIndent) minIndent = ind;
            }
            if (!isFinite(minIndent)) minIndent = 0;

            out += innerPad + '<![CDATA[\n';
            for (var n = 0; n < lines.length; n++) {
                if (lines[n].trim() === '') out += '\n';
                else out += innerPad + lines[n].substr(minIndent) + '\n';
            }
            out += innerPad + ']]>\n';
        }

        for (var p = 0; p < childCmp.length; p++) {
            out += this._formatNode(childCmp[p], level + 1);
        }

        out += pad + '</' + xmlTag + '>\n';
        return out;
    };

    Canvas.prototype._formatNode = function (node, level) {
        var pad = '';
        for (var k = 0; k < level; k++) pad += INDENT;

        if (node.nodeType === 3) {
            var t = node.nodeValue;
            if (t == null) return '';
            if (t.trim() === '') return '';
            if (/<!\[CDATA\[/.test(t)) return '';
            var norm = t.replace(/\s+/g, ' ').trim();
            return pad + norm + '\n';
        }
        if (node.nodeType === 8) {
            return pad + '<!--' + node.nodeValue + '-->\n';
        }
        if (node.nodeType !== 1) return '';

        var tagLower = node.tagName.toLowerCase();
        var tagName  = this._formatTagName(node);
        var attrs    = this._formatAttrs(node);

        if (tagLower === 'cmpcomment') {
            var commentText = String(node.textContent || '').replace(/--/g, '- -');
            return pad + '<!--' + commentText + '-->\n';
        }

        if (tagLower === 'wb-cdata') return '';

        if (tagLower === 'wb-images') {
            var outImg = '';
            var kidsImg = node.children;
            for (var ii = 0; ii < kidsImg.length; ii++) {
                outImg += this._formatNode(kidsImg[ii], level + 1);
            }
            if (!outImg) return '';
            return pad + '<' + tagName + attrs + '>\n' + outImg + pad + '</' + tagName + '>\n';
        }
        if (tagLower === 'wb-image') {
            return pad + '<' + tagName + attrs + '/>\n';
        }

        var cmptypeAttr = node.getAttribute && node.getAttribute('cmptype');
        var isM2 = !!cmptypeAttr && !node.getAttribute('data-wb-tag');

        if (node.getAttribute && node.getAttribute('data-wb-tag')) {
            return this._formatCmpNode(node, level, tagName);
        }

        if (isM2) {
            var m2cmp = 'cmp' + String(cmptypeAttr).toLowerCase();
            if (CDATA_CONTAINERS[m2cmp]) {
                return this._formatCmpNode(node, level, tagName);
            }
            if (!nodeHasMeaningfulChildren(node)) {
                return pad + '<' + tagName + attrs + '/>\n';
            }
        }

        if (CDATA_CONTAINERS[tagLower]) {
            return this._formatCmpNode(node, level, tagName);
        }

        if (XML_SELF_CLOSE[tagLower]) {
            return pad + '<' + tagName + attrs + '/>\n';
        }

        if (VOID_LOWER[tagLower]) {
            return pad + '<' + tagName + attrs + '>\n';
        }

        if (RAW_TAGS[tagLower]) {
            var raw = node.textContent || '';
            return pad + '<' + tagName + attrs + '>' + raw + '</' + tagName + '>\n';
        }

        var children = [];
        var childNodes = node.childNodes;
        for (var i = 0; i < childNodes.length; i++) {
            var c = childNodes[i];
            if (c.nodeType === 1) {
                if (c.getAttribute && c.getAttribute('data-wb-preview') === '1') continue;
                if (c.tagName && c.tagName.toLowerCase() === 'wb-cdata') continue;
                if (c.getAttribute && c.getAttribute('data-wb-comp-asset') === '1') continue;
                children.push(c);
            } else if (c.nodeType === 3) {
                if (c.nodeValue == null || c.nodeValue.trim() === '') continue;
                if (/<!\[CDATA\[/.test(c.nodeValue)) continue;
                children.push(c);
            } else if (c.nodeType === 8) {
                children.push(c);
            }
        }

        if (children.length === 1 && children[0].nodeType === 3) {
            var txt = children[0].nodeValue.replace(/\s+/g, ' ').trim();
            return pad + '<' + tagName + attrs + '>' + txt + '</' + tagName + '>\n';
        }

        if (children.length === 0) {
            return pad + '<' + tagName + attrs + '></' + tagName + '>\n';
        }

        var out = pad + '<' + tagName + attrs + '>\n';
        for (var j = 0; j < children.length; j++) {
            out += this._formatNode(children[j], level + 1);
        }
        out += pad + '</' + tagName + '>\n';
        return out;
    };

    Canvas.prototype._findRootInClone = function (clone) {
        if (this._rootType === 'html') return null;
        var body = clone.querySelector('body');
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

    Canvas.prototype.cleanHtml = function () {
        var htmlEl = this.getHtml();
        if (!htmlEl) return '';
        var clone = htmlEl.cloneNode(true);
        this._purgeServiceNodes(clone);

        var root = this._findRootInClone(clone);
        if (root) {
            return this._formatNode(root, 0).replace(/\n$/, '');
        }

        var bodyStr = this._formatNode(clone, 0);
        return '<!DOCTYPE html>\n' + bodyStr;
    };

    Canvas.CMP_TAGS = CMP_TAGS;
    Canvas.expandSelfClosingCmpTags = expandSelfClosingCmpTags;
    Canvas.generateComponentName = generateComponentName;
    global.Canvas = Canvas;
})(window);