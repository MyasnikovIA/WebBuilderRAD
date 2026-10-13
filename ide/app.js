/* Точка сборки + команды приложения. */
(function (global, $) {
    'use strict';

    $(function () {

        mini.parse();

        /* ------------------------------------------------------------------
           ВАЖНО: заглушка App создаётся ДО ProjectManager.

           ProjectManager._applyProjectMode() при загрузке компонентного
           проекта устанавливает `global.App._componentMode = true`, но
           если в этот момент `global.App` ещё не определён, присвоение
           молча теряется. Из-за этого при F5 вкладка Component пропадала,
           а Canvas не инжектил libs компонента в iframe.

           Заглушка гарантирует, что флаг будет куда записать; ниже,
           при определении полноценного App, мы переносим значение
           флага из заглушки. */
        if (!global.App) global.App = { _componentMode: false };
        if (typeof global.App._componentMode === 'undefined') {
            global.App._componentMode = false;
        }

        var domTree   = new DomTree(document.getElementById('wb-domtree'));
        var palette   = new Palette(document.getElementById('wb-palette'));
        global.palette = palette;
        var inspector = new Inspector(document.getElementById('wb-right') || document.body);

        var codePaneEl = document.querySelector('#wb-center-panes .wb-center-pane[data-pane="code"]');
        var codeView = codePaneEl ? new CodeView(codePaneEl) : null;

        var canvas    = new Canvas(document.getElementById('wb-canvas'));
        History.attach(canvas);

        if (global.RunPreview) {
            global.RunPreview.attach({
                canvas:   canvas,
                codeView: codeView
            });
        }

        /* ---------- Component tab (Root: component) ---------- */
        var componentPaneEl = document.querySelector('#wb-center-panes .wb-center-pane[data-pane="component"]');
        var componentTab = componentPaneEl && global.ComponentTab
            ? new global.ComponentTab(componentPaneEl)
            : null;
        global.componentTab = componentTab;
        $('#wb-center-tabs .wb-center-tab[data-pane="component"]').hide();

        /* ---------- Хелпер: показать/скрыть вкладку Component ----------
           Делает это безопасно, вне зависимости от того, каким способом
           jQuery 1.6.2 применяет inline-стили. Если вкладка должна быть
           показана — снимает inline display:none (и, на всякий случай,
           выставляет display:inline-block через cssText). */
        function setComponentTabVisible(visible, switchIfActive) {
            var tabs = document.getElementById('wb-center-tabs');
            if (!tabs) return;
            var el = tabs.querySelector('.wb-center-tab[data-pane="component"]');
            if (!el) return;

            if (visible) {
                el.style.display = 'inline-block';
                el.removeAttribute('hidden');
            } else {
                el.style.display = 'none';

                if (switchIfActive) {
                    var active = tabs.querySelector('.wb-center-tab.wb-active');
                    if (active && active.getAttribute('data-pane') === 'component') {
                        var sceneTab = tabs.querySelector('.wb-center-tab[data-pane="scene"]');
                        if (sceneTab) sceneTab.click();
                    }
                }
            }
        }

        /* ---------- Реакция на смену режима проекта ---------- */
        EventBus.on('project:mode-changed', function (e) {
            if (!e) return;
            var isComponent = (e.mode === 'component');
            setComponentTabVisible(isComponent, /* switchIfActive */ true);
        });

        /* Контекстное меню пользовательской палитры. */
        EventBus.on('palette:contextmenu', function (ctx) {
            if (!palette) return;
            var menuId;
            if (ctx.type === 'item') {
                menuId = (ctx.kind === 'user') ? 'wb-usercompmenu' : 'wb-paletteitemmenu';
            } else if (ctx.type === 'folder') {
                menuId = 'wb-userfoldermenu';
            } else {
                menuId = 'wb-userpalettemenu';
            }
            var m = mini.get(menuId);
            if (m) m.showAtPos(ctx.x, ctx.y);
        });

        /* Двойной клик по user-компоненту — открыть вкладку Component. */
        EventBus.on('component:edit-request', function (e) {
            if (!componentTab) return;
            setComponentTabVisible(true, false);
            $('#wb-center-tabs .wb-center-tab[data-pane="component"]').click();
            componentTab.setComponent(e.component);
        });

        /* ---------- Project management ---------- */
        if (global.ProjectManager) {
            var projectManager = new global.ProjectManager({
                comboSel:  '#wb-project-combo',
                treeSel:   '#wb-project-tree',
                btnNewSel: '#wb-project-new',
                btnDelSel: '#wb-project-del'
            });
            if (global.IDE) global.IDE.projectManager = projectManager;
            global.ProjectManagerInstance = projectManager;

            /* Страховка: после того как ProjectManager восстановил
               последний проект, ещё раз синхронизируем видимость
               вкладки Component с текущим режимом. Сработает даже если
               событие 'project:mode-changed' было пропущено. */
            setTimeout(function () {
                var isComp = !!(global.App && global.App._componentMode);
                setComponentTabVisible(isComp, !isComp);
            }, 0);
        }

        /* ---------- Panel splitter (project panel / palette) ---------- */
        if (global.PanelSplitter) {
            new global.PanelSplitter({
                topSel:       '#wb-project-panel',
                splitSel:     '#wb-panel-splitter',
                containerSel: '#wb-right-panel',
                minTop:       80,
                minBottom:    120
            });
        }

        var clipboard = null;

        /* ---------- Переключение вкладок Scene / Code / Component ---------- */
        $('#wb-center-tabs').delegate('.wb-center-tab', 'click', function () {
            var paneName = $(this).attr('data-pane');

            if (codeView &&
                paneName !== 'code' &&
                codeView.isActive() &&
                codeView.hasUnsavedChanges()) {
                if (!codeView.apply()) return;
            }

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

            if (componentTab) componentTab.setActive(paneName === 'component');

            /* При переключении на Scene в режиме Root: component —
               гарантированно переинжектить libs и заново выполнить
               пользовательский JS (даже если canvas не перезагружался). */
            if (paneName === 'scene' && canvas &&
                global.App && global.App._componentMode) {
                setTimeout(function () {
                    if (canvas._injectComponentAssets) {
                        canvas._injectComponentAssets();
                    }
                }, 0);
            }
        });

        /* Клик по компоненту в палитре → готовим его к вставке на сцену.
           Если это пользовательский компонент с внешними библиотеками —
           подгружаем их в основной документ IDE. */
        EventBus.on('palette:selected', function (e) {
            canvas.setPending(e.component);

            if (e && e.component && (e.component.jsLibs || e.component.cssLibs)) {
                if (global.ComponentTab && global.ComponentTab.loadLibsIntoMainDoc) {
                    global.ComponentTab.loadLibsIntoMainDoc(
                        e.component.jsLibs || [],
                        e.component.cssLibs || []
                    );
                }
            }
        });

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
            var m4 = mini.get('wb-pfilemenu');  if (m4) m4.hide();
            var m5 = mini.get('wb-pfoldermenu');if (m5) m5.hide();
            var m6 = mini.get('wb-prootmenu');  if (m6) m6.hide();
            var m7 = mini.get('wb-usercompmenu'); if (m7) m7.hide();
            var m8 = mini.get('wb-userfoldermenu'); if (m8) m8.hide();
            var m9 = mini.get('wb-userpalettemenu'); if (m9) m9.hide();
        });

        EventBus.on('canvas:selection:reset', function () {
            var t = document.getElementById('wb-inspector-target');
            if (t) t.textContent = '—';
        });

        /* ---------- Глобальные хоткеи ---------- */
        function isTextInputFocused() {
            var el = document.activeElement;
            if (!el || el === document.body || el === document.documentElement) return false;
            var tag = el.tagName ? el.tagName.toUpperCase() : '';
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
            if (el.isContentEditable) return true;
            return false;
        }

        $(document).keydown(function (e) {
            if (canvas.designMode && document.activeElement === canvas.iframe) return;
            if (isTextInputFocused()) return;

            if (e.ctrlKey && e.keyCode === 90) { History.undo(); e.preventDefault(); }
            else if (e.ctrlKey && e.keyCode === 89) { History.redo(); e.preventDefault(); }
            else if (e.ctrlKey && e.keyCode === 83) { App.cmd('saveProject'); e.preventDefault(); }
            else if (e.ctrlKey && e.keyCode === 67) { App.cmd('copy');  e.preventDefault(); }
            else if (e.ctrlKey && e.keyCode === 88) { App.cmd('cut');   e.preventDefault(); }
            else if (e.ctrlKey && e.keyCode === 86) { App.cmd('paste'); e.preventDefault(); }
            else if (e.keyCode === 46) { App.cmd('delete'); }
            else if (e.keyCode === 120) { App.cmd('run'); e.preventDefault(); }
            else if (e.keyCode === 121) { App.cmd('runProject'); e.preventDefault(); }
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

        var COMPONENT_SELF_CLOSE_RE = /<component((?:\s+[^<>]*?)?)\s*\/>/g;
        function expandSelfClosingComponentTags(str) {
            return String(str).replace(COMPONENT_SELF_CLOSE_RE, function (m, attrs) {
                return '<component' + (attrs || '') + '></component>';
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

        function showToast(text) {
            var el = document.getElementById('wb-toast');
            if (!el) {
                el = document.createElement('div');
                el.id = 'wb-toast';
                el.style.cssText =
                    'position:fixed;bottom:20px;right:20px;' +
                    'background:#323232;color:#fff;padding:8px 14px;' +
                    'border-radius:4px;font-family:Segoe UI,Tahoma,sans-serif;' +
                    'font-size:12px;z-index:99999;' +
                    'box-shadow:0 2px 8px rgba(0,0,0,0.3);' +
                    'transition:opacity 0.3s;opacity:0;pointer-events:none;';
                document.body.appendChild(el);
            }
            el.textContent = text;
            el.style.opacity = '1';
            clearTimeout(el._timer);
            el._timer = setTimeout(function () { el.style.opacity = '0'; }, 2000);
        }

        var App = {
            /* Флаг переносим из заглушки, созданной в начале ready-блока. */
            _componentMode: (global.App && global.App._componentMode) || false,

            cmd: function (action) { if (App[action]) App[action](); },

            run: function () {
                if (global.RunPreview) {
                    global.RunPreview.run();
                } else {
                    alert('Модуль RunPreview не подключён.');
                }
            },
            runProject: function () {
                if (global.ProjectRunner) {
                    global.ProjectRunner.run();
                } else {
                    alert('Модуль ProjectRunner не подключён.');
                }
            },
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

            new: function () {
                var pm = global.ProjectManagerInstance;
                if (pm && pm.editing) {
                    if (!pm._confirmSwitchFrom(canvas)) return;
                }
                if (!confirm('Очистить холст?')) return;
                clipboard = null;
                if (pm) pm.stopEditing();
                canvas.reset();
            },

            load: function () {
                var pm = global.ProjectManagerInstance;
                if (pm && pm.editing) {
                    if (!pm._confirmSwitchFrom(canvas)) return;
                }

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
                            if (pm) pm.stopEditing();
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

            saveProject: function () {
                var pm = global.ProjectManagerInstance;
                if (!pm || !pm.current) {
                    alert('Проект не выбран. Создайте или выберите проект в панели Project.');
                    return;
                }
                try {
                    if (pm.editing && canvas && pm._hasUnsavedChanges(canvas)) {
                        pm._saveCurrentEdit(canvas);
                    } else {
                        pm.save();
                    }
                    showToast('Проект сохранён: ' + pm.current.name);
                } catch (ex) {
                    console.error('[App.saveProject]', ex);
                    alert('Ошибка сохранения проекта: ' + (ex.message || ex));
                }
            },

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

            setRootHtml:    function () {
                App._componentMode = false;
                setComponentTabVisible(false, true);
                canvas.setRootType('html');
            },
            setRootCmpForm: function () {
                App._componentMode = false;
                setComponentTabVisible(false, true);
                canvas.setRootType('cmpForm');
            },
            setRootM2Form:  function () {
                App._componentMode = false;
                setComponentTabVisible(false, true);
                canvas.setRootType('m2Form');
            },
            setRootDiv:     function () {
                App._componentMode = false;
                setComponentTabVisible(false, true);
                canvas.setRootType('div');
            },
            setRootComponent: function () {
                App._componentMode = true;
                setComponentTabVisible(true, false);
                canvas.setRootType('div');
                $('#wb-center-tabs .wb-center-tab[data-pane="component"]').click();
            },

            exportProjectAsComponent: function () {
                var pm = global.ProjectManagerInstance;
                if (!pm || !pm.current) {
                    alert('Проект не выбран.');
                    return;
                }
                pm.save();

                var p = pm.current;
                if (global.componentTab && global.componentTab.getFormData) {
                    try {
                        var cd = global.componentTab.getFormData();
                        if (cd) { delete cd.js; delete cd.css; }
                        p.componentData = cd;
                    } catch (e) {}
                }
                global.ZipUtils.exportProject(p, { asComponent: true });
            },

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
                prepared = expandSelfClosingComponentTags(prepared);

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

        /* После замены объекта App — пересинхронизируем видимость вкладки
           Component, используя финальный флаг _componentMode. */
        try {
            var isCompNow = !!App._componentMode;
            setComponentTabVisible(isCompNow, !isCompNow);
        } catch (e) { /* ignore */ }

        try {
            var savedTheme = localStorage.getItem('wb.theme') || 'light';
            App.setTheme(savedTheme);
        } catch (e) {
            App.setTheme('light');
        }
    });
})(window, jQuery);