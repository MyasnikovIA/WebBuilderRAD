/* Точка сборки + команды приложения. */
(function (global, $) {
    'use strict';

    $(function () {

        mini.parse();

        var domTree   = new DomTree(document.getElementById('wb-domtree'));
        var palette   = new Palette(document.getElementById('wb-palette'));
        var inspector = new Inspector(document.getElementById('wb-right') || document.body);

        var codePaneEl = document.querySelector('#wb-center-panes .wb-center-pane[data-pane="code"]');
        var codeView = codePaneEl ? new CodeView(codePaneEl) : null;

        var canvas    = new Canvas(document.getElementById('wb-canvas'));
        History.attach(canvas);

        var clipboard = null;

        /* ---------- Переключение вкладок Scene / Code ---------- */
        $('#wb-center-tabs').delegate('.wb-center-tab', 'click', function () {
            var paneName = $(this).attr('data-pane');
            $('#wb-center-tabs .wb-center-tab').removeClass('wb-active');
            $(this).addClass('wb-active');
            $('#wb-center-panes .wb-center-pane').hide();
            $('#wb-center-panes .wb-center-pane[data-pane="' + paneName + '"]').show();

            if (codeView) {
                if (paneName === 'code') {
                    codeView.setActive(true);
                } else {
                    codeView.setActive(false);
                    var el = codeView.getCurrentElement();
                    if (el && canvas) {
                        setTimeout(function () { canvas.select(el); }, 0);
                    }
                }
            }
        });

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
                var op = canvas._getOffsetParent
                    ? (canvas._getOffsetParent(el) || body)
                    : body;
                var r  = el.getBoundingClientRect();
                var or = op.getBoundingClientRect();
                st.position = 'absolute';
                st.left   = Math.round(r.left - or.left) + 'px';
                st.top    = Math.round(r.top  - or.top)  + 'px';
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
            if (canvas._positionResizeHandles) canvas._positionResizeHandles(el);
            EventBus.emit('canvas:changed');
            EventBus.emit('selection:changed', { element: el });
        }

        function cleanClone(node) {
            if (!node || node.nodeType !== 1) return;
            node.classList.remove('wb-selected', 'wb-hover', 'wb-moving');
            if (node.classList.length === 0) node.removeAttribute('class');
            node.removeAttribute('data-wb-editable');
            var kids = node.querySelectorAll('.wb-selected, .wb-hover, .wb-moving, [data-wb-editable]');
            for (var i = 0; i < kids.length; i++) {
                kids[i].classList.remove('wb-selected', 'wb-hover', 'wb-moving');
                if (kids[i].classList.length === 0) kids[i].removeAttribute('class');
                kids[i].removeAttribute('data-wb-editable');
            }
        }

        var CMP_TAGS = {
            'cmpaction':      'cmpAction',
            'cmpactionvar':   'cmpActionVar',
            'cmpcomment':     'cmpComment',
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

        function parentMatches(def, node) {
            if (!def || !def.parentOnly || !node) return false;
            var allowed = Array.isArray(def.parentOnly) ? def.parentOnly : [def.parentOnly];
            var tag = node.tagName ? node.tagName.toLowerCase() : '';
            return allowed.indexOf(tag) >= 0;
        }

        var CMP_SELF_CLOSE_RE = /<(cmp[a-zA-Z0-9]+)((?:\s+[^<>]*?)?)\s*\/>/g;
        function expandSelfClosingCmpTags(str) {
            return String(str).replace(CMP_SELF_CLOSE_RE, function (m, tag, attrs) {
                return '<' + tag + (attrs || '') + '></' + tag + '>';
            });
        }

        var CDATA_TAGS = {
            cmpaction:              'sql',
            cmpdataset:             'sql',
            cmpsubaction:           'sql',
            cmpscript:              'javascript',
            cmpserverscript:        'javascript',
            cmprepeaterstyler:      'json'
        };

        var App = {
            cmd: function (action) { if (App[action]) App[action](); },

            /* ---------- Тема оформления ---------- */

            setTheme: function (theme) {
                if (theme !== 'light' && theme !== 'dark') theme = 'light';
                document.documentElement.setAttribute('data-wb-theme', theme);
                try { localStorage.setItem('wb.theme', theme); } catch (e) {}

                var link = document.getElementById('wb-hljs-theme');
                if (link) {
                    var href = (theme === 'dark')
                        ? 'lib/highlight/styles/dark.css'
                        : 'lib/highlight/styles/default.css';
                    if (link.getAttribute('href') !== href) {
                        link.setAttribute('href', href);
                    }
                }

                EventBus.emit('theme:changed', { theme: theme });
            },

            getTheme: function () {
                return document.documentElement.getAttribute('data-wb-theme') || 'light';
            },

            toggleTheme: function () {
                App.setTheme(App.getTheme() === 'dark' ? 'light' : 'dark');
            },

            /* ---------- HTML ---------- */

            new: function () {
                if (!confirm('Очистить холст?')) return;
                clipboard = null;
                canvas.reset();
            },

            load: function () {
                var editor = new CodeEditor({ value: '', language: 'xml' });

                Modal.open({
                    title: 'Load HTML — вставьте текст и нажмите OK',
                    content: editor.el,
                    onOk: function () {
                        var html = editor.getValue();
                        if (!html || !html.replace(/\s+/g, '')) {
                            alert('Пустой HTML.');
                            return;
                        }
                        try {
                            canvas.loadHtml(html);
                        } catch (ex) {
                            alert('Ошибка загрузки HTML: ' + ex.message);
                        }
                    }
                });

                setTimeout(function () { editor.focus(); }, 50);
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

            /* ---------- JSON ---------- */

            saveJson: function () {
                if (global.FormJSON) {
                    global.FormJSON.save(canvas);
                } else {
                    alert('Модуль FormJSON не подключён.');
                }
            },

            loadJson: function () {
                if (global.FormJSON) {
                    global.FormJSON.load(canvas);
                } else {
                    alert('Модуль FormJSON не подключён.');
                }
            },

            /* ---------- Остальные команды ---------- */

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
                            var nw = App._parseHtmlWithCdata(editor.getValue());
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

                var tagLower  = el.tagName.toLowerCase();
                var cdataLang = CDATA_TAGS[tagLower] || null;

                var rawText = el.textContent || '';
                var rawHtml = el.innerHTML || '';

                var language = 'xml';
                var initial  = '';
                var wasCdata = false;

                var cdataMatch = rawText.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);

                if (cdataMatch) {
                    wasCdata = true;
                    language = cdataLang || 'xml';
                    initial  = cdataMatch[1];
                } else if (cdataLang) {
                    language = cdataLang;
                    initial  = rawText;
                } else if (tagLower === 'script') {
                    language = 'javascript';
                    initial  = rawText;
                } else if (tagLower === 'style') {
                    language = 'css';
                    initial  = rawText;
                } else {
                    initial = rawHtml;
                }

                var editor = new CodeEditor({ value: initial, language: language });

                Modal.open({
                    title: 'Edit InnerHTML — ' + canvas._formatTagName(el),
                    content: editor.el,
                    onOk: function () {
                        var v = editor.getValue();

                        if (wasCdata) {
                            var doc = el.ownerDocument;
                            while (el.firstChild) el.removeChild(el.firstChild);
                            el.appendChild(doc.createTextNode('<![CDATA[' + v + ']]>'));
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
            },

            _parseHtmlWithCdata: function (html) {
                var SENT_O = '\u0001WB_CDATA_OPEN\u0001';
                var SENT_C = '\u0001WB_CDATA_CLOSE\u0001';

                var prepared = String(html)
                    .replace(/<!\[CDATA\[/g, SENT_O)
                    .replace(/\]\]>/g, SENT_C);

                prepared = expandSelfClosingCmpTags(prepared);

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
        };

        global.App = App;

        /* Применяем сохранённую тему на случай, если inline-скрипт в <head>
           не выполнился (например, был отключён браузером). */
        try {
            var savedTheme = localStorage.getItem('wb.theme') || 'light';
            App.setTheme(savedTheme);
        } catch (e) {
            App.setTheme('light');
        }
    });
})(window, jQuery);