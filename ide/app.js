/* Точка сборки + команды приложения. */
(function (global, $) {
    'use strict';

    $(function () {

        mini.parse();

        var domTree   = new DomTree(document.getElementById('wb-domtree'));
        var palette   = new Palette(document.getElementById('wb-palette'));
        var inspector = new Inspector(document.getElementById('wb-right') || document.body);

        var canvas    = new Canvas(document.getElementById('wb-canvas'));
        History.attach(canvas);

        var clipboard = null;

        EventBus.on('palette:selected', function (e) { canvas.setPending(e.component); });

        EventBus.on('command:delete', function () { App.cmd('delete'); });
        EventBus.on('command:move',   function (e) { moveSel(e.dx, e.dy, e.resize); });
        EventBus.on('command:undo',   function ()  { History.undo(); });
        EventBus.on('command:redo',   function ()  { History.redo(); });

        EventBus.on('contextmenu:element', function (e) {
            var menu = mini.get('wb-contextmenu');
            menu.showAtPos(e.x, e.y);
        });

        EventBus.on('contextmenu:tree', function (e) {
            var menu = mini.get('wb-treemenu');
            menu.showAtPos(e.x, e.y);
        });

        EventBus.on('contextmenu:root', function (e) {
            var menu = mini.get('wb-rootmenu');
            menu.showAtPos(e.x, e.y);
        });

        EventBus.on('contextmenu:hide', function () {
            var m1 = mini.get('wb-contextmenu'); if (m1) m1.hide();
            var m2 = mini.get('wb-treemenu');   if (m2) m2.hide();
            var m3 = mini.get('wb-rootmenu');   if (m3) m3.hide();
        });

        EventBus.on('canvas:selection:reset', function () {
            var t = document.getElementById('wb-inspector-target');
            if (t) t.textContent = '—';
        });

        $(document).keydown(function (e) {
            if (canvas.designMode && document.activeElement === canvas.iframe) return;

            if (e.ctrlKey && e.keyCode === 90) { History.undo(); e.preventDefault(); }
            else if (e.ctrlKey && e.keyCode === 89) { History.redo(); e.preventDefault(); }
            else if (e.ctrlKey && e.keyCode === 67) { App.cmd('copy');  e.preventDefault(); }
            else if (e.ctrlKey && e.keyCode === 88) { App.cmd('cut');   e.preventDefault(); }
            else if (e.ctrlKey && e.keyCode === 86) { App.cmd('paste'); e.preventDefault(); }
            else if (e.keyCode === 46) { App.cmd('delete'); }
        });

        function moveSel(dx, dy, resize) {
            var el = canvas.getSelected();
            var body = canvas.getBody();
            if (!el || !body || el === body) return;
            var st = el.style;
            if (!st.position || st.position === 'static') {
                var r = el.getBoundingClientRect();
                var br = body.getBoundingClientRect();
                st.position = 'absolute';
                st.left   = Math.round(r.left - br.left) + 'px';
                st.top    = Math.round(r.top  - br.top)  + 'px';
                st.width  = Math.round(r.width)  + 'px';
                st.height = Math.round(r.height) + 'px';
            }
            if (resize) {
                st.width  = ((parseFloat(st.width)  || 0) + dx) + 'px';
                st.height = ((parseFloat(st.height) || 0) + dy) + 'px';
            } else {
                st.left = ((parseFloat(st.left) || 0) + dx) + 'px';
                st.top  = ((parseFloat(st.top)  || 0) + dy) + 'px';
            }
            /* Сразу перепозиционируем маркеры ресайза, чтобы они
               не «отставали» от клавиатурного сдвига. */
            if (canvas._positionResizeHandles) canvas._positionResizeHandles(el);
            EventBus.emit('canvas:changed');
            EventBus.emit('selection:changed', { element: el });
        }

        function cleanClone(node) {
            if (!node || node.nodeType !== 1) return;
            node.classList.remove('wb-selected', 'wb-hover');
            if (node.classList.length === 0) node.removeAttribute('class');
            node.removeAttribute('data-wb-editable');
            var kids = node.querySelectorAll('.wb-selected, .wb-hover, [data-wb-editable]');
            for (var i = 0; i < kids.length; i++) {
                kids[i].classList.remove('wb-selected', 'wb-hover');
                if (kids[i].classList.length === 0) kids[i].removeAttribute('class');
                kids[i].removeAttribute('data-wb-editable');
            }
        }

        function parseHtmlWithCdata(html) {
            var SENT_O = '\u0001WB_CDATA_OPEN\u0001';
            var SENT_C = '\u0001WB_CDATA_CLOSE\u0001';

            var prepared = String(html)
                .replace(/<!\[CDATA\[/g, SENT_O)
                .replace(/\]\]>/g, SENT_C);

            var tmp = document.createElement('div');
            tmp.innerHTML = prepared;

            (function walk(n) {
                if (n.nodeType === 3) {
                    if (n.nodeValue && n.nodeValue.indexOf('\u0001WB_CDATA_') >= 0) {
                        n.nodeValue = n.nodeValue
                            .split(SENT_O).join('<![CDATA[')
                            .split(SENT_C).join(']]>');
                    }
                } else if (n.nodeType === 1) {
                    for (var i = 0; i < n.childNodes.length; i++) walk(n.childNodes[i]);
                }
            })(tmp);

            return tmp.firstChild || null;
        }

        var CMP_TAGS = {
            'cmpaction':      'cmpAction',
            'cmpactionvar':   'cmpActionVar',
            'cmpdataset':     'cmpDataSet',
            'cmpfilter':     'cmpFilter',
            'cmpinfobox': 'cmpInfoBox',
            'cmpinfoaboutrecord': 'cmpInfoAboutRecord',
            'cmpfilteritem': 'cmpFilterItem',
            'cmpimage':       'cmpImage',
            'cmpdatasetvar':  'cmpDataSetVar',
            'cmpscript':      'cmpScript',
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
            'cmpsubactionvar':'cmpSubActionVar',
            'cmpbroker':      'cmpBroker',
            'cmpbuttonedit':  'cmpButtonEdit',
            'cmpuniteditgenerate': 'cmpUnitEditGenerate',
            'cmpunitview': 'cmpUnitView',
            'cmpunitprops': 'cmpUnitProps',
            'cmpserverscript': 'cmpServerScript',
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
            'cmpgrid':       'cmpGrid',
            'cmpcolumn':     'cmpColumn',
            'cmpgridfooter': 'cmpGridFooter',
            'cmptagitem':     'cmpTagItem',
            'cmpcelllabel':   'cmpCellLabel',
            'cmpcharts':      'cmpCharts',
            'cmpcompleter': 'cmpCompleter',
            'cmpcustomfilter': 'cmpCustomFilter',
            'cmpdialog ': 'cmpDialog ',
            'cmpfieldset':    'cmpFieldSet',
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
            'cmpexpander ': 'cmpExpander ',
            'cmpcheckbox':    'cmpCheckBox'
        };

        function restoreCmpTags(root) {
            if (!root || root.nodeType !== 1) return;
            var lower = root.tagName.toLowerCase();
            if (CMP_TAGS[lower]) {
                root.setAttribute('data-wb-tag', CMP_TAGS[lower]);
            }
            var kids = root.children;
            for (var i = 0; i < kids.length; i++) restoreCmpTags(kids[i]);
        }

        /* Проверка parentOnly с поддержкой массива. */
        function parentMatches(def, node) {
            if (!def || !def.parentOnly || !node) return false;
            var allowed = Array.isArray(def.parentOnly) ? def.parentOnly : [def.parentOnly];
            var tag = node.tagName ? node.tagName.toLowerCase() : '';
            return allowed.indexOf(tag) >= 0;
        }

        var App = {
            cmd: function (action) { if (App[action]) App[action](); },

            new: function () {
                if (!confirm('Очистить холст?')) return;
                clipboard = null;
                canvas.reset();
            },

            save: function () {
                var html = canvas.cleanHtml();
                var ta = document.createElement('textarea');
                ta.className = 'wb-code-editor';
                ta.value = html;
                Modal.open({
                    title: 'Result HTML — Ctrl+A / Ctrl+C',
                    content: ta,
                    onOk: function () { try { ta.focus(); ta.select(); document.execCommand('copy'); } catch (e) {} }
                });
            },

            undo: function () { History.undo(); },
            redo: function () { History.redo(); },

            copy: function () {
                var el = canvas.getSelected();
                if (!el) return;
                if (el === canvas.getHtml() || el === canvas.getHead() || el === canvas.getBody()) return;
                var rc = canvas.getRootContainer();
                if (canvas.getRootType() !== 'html' && el === rc) return;
                clipboard = el.cloneNode(true);
            },
            cut: function () {
                var el = canvas.getSelected();
                if (!el) return;
                if (el === canvas.getHtml() || el === canvas.getHead() || el === canvas.getBody()) return;
                var rc = canvas.getRootContainer();
                if (canvas.getRootType() !== 'html' && el === rc) return;
                clipboard = el.cloneNode(true);
                if (canvas._removeResizeHandles) canvas._removeResizeHandles();
                el.parentNode.removeChild(el);
                EventBus.emit('canvas:changed');
            },
            paste: function () {
                var el = canvas.getSelected();
                if (!el || !clipboard) return;
                if (el === canvas.getHtml()) return;

                var clipDef = ComponentRegistry.match(clipboard);
                if (clipDef && clipDef.parentOnly) {
                    if (!parentMatches(clipDef, el)) {
                        var allowed = Array.isArray(clipDef.parentOnly) ? clipDef.parentOnly : [clipDef.parentOnly];
                        alert('Component ' + clipDef.caption +
                            ' can only be placed inside <' + allowed.join('|') + '>');
                        return;
                    }
                }

                var c = clipboard.cloneNode(true);
                cleanClone(c);

                var tagLower = el.tagName.toLowerCase();
                if (tagLower === 'head') {
                    var headTags = { meta:1, link:1, script:1, style:1, title:1, base:1, noscript:1, template:1 };
                    if (!headTags[c.tagName.toLowerCase()]) return;
                    el.appendChild(c);
                } else {
                    el.appendChild(c);
                }

                EventBus.emit('canvas:changed');
                canvas.select(c);
            },
            pasteAfter: function () {
                var el = canvas.getSelected();
                if (!el || !clipboard) return;
                if (el === canvas.getHtml() || !el.parentNode) return;

                var clipDef = ComponentRegistry.match(clipboard);
                if (clipDef && clipDef.parentOnly) {
                    if (!parentMatches(clipDef, el.parentNode)) {
                        var allowed = Array.isArray(clipDef.parentOnly) ? clipDef.parentOnly : [clipDef.parentOnly];
                        alert('Component ' + clipDef.caption +
                            ' can only be placed inside <' + allowed.join('|') + '>');
                        return;
                    }
                }

                var c = clipboard.cloneNode(true);
                cleanClone(c);
                el.parentNode.insertBefore(c, el.nextSibling);
                EventBus.emit('canvas:changed');
                canvas.select(c);
            },
            duplicate: function () {
                var el = canvas.getSelected();
                if (!el) return;
                if (el === canvas.getHtml() || el === canvas.getHead() || el === canvas.getBody()) return;
                var rc = canvas.getRootContainer();
                if (canvas.getRootType() !== 'html' && el === rc) return;
                if (!el.parentNode) return;
                var c = el.cloneNode(true);
                cleanClone(c);
                el.parentNode.insertBefore(c, el.nextSibling);
                EventBus.emit('canvas:changed');
                canvas.select(c);
            },
            delete: function () {
                var el = canvas.getSelected();
                if (!el) return;
                if (el === canvas.getHtml()) return;
                var rc = canvas.getRootContainer();
                if (canvas.getRootType() !== 'html' && el === rc) return;

                if (canvas._removeResizeHandles) canvas._removeResizeHandles();

                var parent = el.parentNode;
                parent.removeChild(el);

                /* Обновить превью родителя — ComboBox после удаления ComboItem
                   должен убрать <option>. */
                if (parent && parent.nodeType === 1 &&
                    parent.getAttribute && parent.getAttribute('data-wb-tag')) {
                    canvas._renderPreview(parent);
                }

                EventBus.emit('canvas:changed');
            },
            editText: function () {
                var el = canvas.getSelected();
                if (!el) return;
                var t = prompt('Текст элемента:', el.textContent || '');
                if (t === null) return;
                el.textContent = t;
                EventBus.emit('canvas:changed');
                EventBus.emit('selection:changed', { element: el });
            },

            editHtml: function () {
                var el = canvas.getSelected();
                if (!el) return;

                var clone = el.cloneNode(true);
                canvas._purgeServiceNodes(clone);

                var code = canvas._formatNode(clone, 0).replace(/\n$/, '');

                var editor = new CodeEditor({ value: code, language: 'xml' });

                Modal.open({
                    title: 'Edit HTML — ' + canvas._formatTagName(el),
                    content: editor.el,
                    onOk: function () {
                        try {
                            var nw = parseHtmlWithCdata(editor.getValue());
                            if (!nw) return;
                            cleanClone(nw);
                            restoreCmpTags(nw);
                            el.parentNode.replaceChild(nw, el);
                            EventBus.emit('canvas:changed');
                            canvas.select(nw);
                        } catch (ex) { alert('Некорректный HTML: ' + ex.message); }
                    }
                });

                setTimeout(function () { editor.focus(); }, 50);
            },

            editInnerHtml: function () {
                var el = canvas.getSelected();
                if (!el) return;

                var tagLower = el.tagName.toLowerCase();
                var language = 'xml';
                var initial  = '';
                var isCdata  = false;

                if (tagLower === 'cmpaction' || tagLower === 'cmpdataset' || tagLower === 'cmpsubaction') {
                    isCdata  = true;
                    language = 'sql';
                    var raw = el.textContent || '';
                    var m = raw.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
                    initial = m ? m[1] : '';
                } else if (tagLower === 'script') {
                    language = 'javascript';
                    initial = el.textContent || '';
                } else if (tagLower === 'style') {
                    language = 'css';
                    initial = el.textContent || '';
                } else {
                    initial = el.innerHTML;
                }

                var editor = new CodeEditor({ value: initial, language: language });

                Modal.open({
                    title: 'Edit InnerHTML — ' + canvas._formatTagName(el),
                    content: editor.el,
                    onOk: function () {
                        var v = editor.getValue();

                        if (isCdata) {
                            var doc = el.ownerDocument;
                            var cdataText = '<![CDATA[' + v + ']]>';
                            var firstText = null;
                            for (var i = 0; i < el.childNodes.length; i++) {
                                if (el.childNodes[i].nodeType === 3) {
                                    firstText = el.childNodes[i];
                                    break;
                                }
                            }
                            if (firstText) {
                                firstText.nodeValue = cdataText;
                            } else {
                                el.insertBefore(doc.createTextNode(cdataText), el.firstChild);
                            }
                        } else if (tagLower === 'script' || tagLower === 'style') {
                            el.textContent = v;
                        } else {
                            el.innerHTML = v;
                        }

                        EventBus.emit('canvas:changed');
                        EventBus.emit('selection:changed', { element: el });
                    }
                });

                setTimeout(function () { editor.focus(); }, 50);
            },

            setRootHtml:    function () { canvas.setRootType('html'); },
            setRootCmpForm: function () { canvas.setRootType('cmpForm'); },
            setRootDiv:     function () { canvas.setRootType('div'); },

            designMode: function () { canvas.toggleDesignMode(); },

            front: function () {
                var el = canvas.getSelected();
                if (el && el.parentNode) el.parentNode.appendChild(el);
            },
            back: function () {
                var el = canvas.getSelected();
                if (el && el.parentNode && el.parentNode.firstChild)
                    el.parentNode.insertBefore(el, el.parentNode.firstChild);
            }
        };

        global.App = App;
    });
})(window, jQuery);