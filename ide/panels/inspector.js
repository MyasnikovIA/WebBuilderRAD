/* Inspector — Object Inspector (Properties / Styles / Events).

   Содержит конструктор, вкладки, чтение/запись значений, построение
   строк и базовый редактор полей (boolean, enum, color, length, number,
   string, text, FILE, image, images, code, custom-editor-url).
   Вкладка Events реализована в inspector-events.js.

   Загружается после panels-utils.js и project-file-picker.js.
   Экспортирует global.Inspector. */
(function (global, $) {
    'use strict';
    var bus = global.EventBus;
    var U   = global.PanelsUtils;

    var stripServiceClasses = U.stripServiceClasses;
    var getServiceClasses   = U.getServiceClasses;
    var isFileField         = U.isFileField;
    var isImageField        = U.isImageField;
    var resolvePreviewSrc   = U.resolvePreviewSrc;

    /* ============================================================
       Конструктор
       ============================================================ */
    function Inspector(rootEl) {
        this.root = $(rootEl);
        this.element = null;
        this.def = null;
        this.tab = 'properties';
        this._internalChange = false;
        this._bindTabs();
        var self = this;
        bus.on('selection:changed', function (e) { self.show(e.element); });
        bus.on('canvas:changed', function () {
            if (self._internalChange) return;
            if (self.element) self.refresh();
        });
    }

    Inspector.prototype._bindTabs = function () {
        var self = this;
        this.root.find('.wb-itab').click(function () {
            self.root.find('.wb-itab').removeClass('wb-active');
            $(this).addClass('wb-active');
            self.tab = $(this).attr('data-tab');
            self.root.find('.wb-itab-pane').hide();
            self.root.find('.wb-itab-pane[data-tab="' + self.tab + '"]').show();
        });
    };

    Inspector.prototype.show = function (el) {
        this.element = el || null;
        if (!el) {
            this.def = null;
            this.root.find('#wb-inspector-target').text('—');
            this.root.find('.wb-itab-pane').empty();
            return;
        }
        this.def = global.ComponentRegistry.match(el);
        var custom = el.getAttribute && el.getAttribute('data-wb-tag');
        var displayTag = custom || el.tagName.toLowerCase();
        this.root.find('#wb-inspector-target')
            .text('<' + displayTag + '>' + (this.def ? ' — ' + this.def.caption : ''));
        this.refresh();
    };

    Inspector.prototype.refresh = function () {
        var self = this;
        ['properties', 'styles', 'events'].forEach(function (tab) {
            var pane = self.root.find('.wb-itab-pane[data-tab="' + tab + '"]');
            pane.empty();
            var schema = (self.def && self.def.schema && self.def.schema[tab]) || [];
            if (!schema.length) { pane.html('<div class="wb-empty">No ' + tab + '</div>'); return; }
            schema.forEach(function (f) { pane.append(self._row(tab, f)); });
        });
    };

    /* ============================================================
       Чтение / запись значений
       ============================================================ */

    Inspector.prototype._get = function (tab, f) {
        var el = this.element; if (!el) return '';
        if (tab === 'properties') {

            /* Оригинал пути — приоритетнее blob:/data:-URL от ProjectResolver. */
            var readOrig = function () {
                if (!el.getAttribute) return null;
                var v = el.getAttribute('data-wb-orig-' + f.name);
                return (v == null) ? null : v;
            };

            if (f.get) {
                var v0 = f.get(el);
                if (typeof v0 === 'string' && /^(blob:|data:)/i.test(v0)) {
                    var o0 = readOrig();
                    if (o0 != null) return o0;
                }
                return v0;
            }

            if (f.name === 'class' || f.name === 'className') {
                var raw = f.attr ? (el.getAttribute('class') || '') : (el.className || '');
                return stripServiceClasses(raw);
            }

            var orig = readOrig();
            if (orig != null) return orig;

            if (f.attr) return el.getAttribute(f.name) || '';

            if (isFileField(f)) {
                var av = el.getAttribute && el.getAttribute(f.name);
                if (av != null) return av;
            }

            var v = el[f.name];
            return (v == null) ? '' : v;
        }
        if (tab === 'styles') return el.style[f.name] || '';
        if (tab === 'events') return el.getAttribute(f.name) || '';
        return '';
    };

    Inspector.prototype._set = function (tab, f, v) {
        var el = this.element; if (!el) return;

        var cleanClass = function (node) {
            if (node && node.nodeType === 1 && typeof node.className === 'string' && node.className.trim() === '') {
                node.removeAttribute('class');
            }
        };

        if (tab === 'properties') {
            if (f.set) {
                f.set(el, v);
                if (global.ProjectResolver && global.ProjectResolver.applyElement) {
                    try { global.ProjectResolver.applyElement(el); } catch (e) {}
                }
            } else if (f.type === 'boolean') {
                var bv = !!v;
                el[f.name] = bv;
                if (f.attr) {
                    if (bv) el.setAttribute(f.name, 'true');
                    else    el.removeAttribute(f.name);
                }
            } else if (f.name === 'class' || f.name === 'className') {
                var preserved = getServiceClasses(el.getAttribute('class') || '');
                var userCls   = stripServiceClasses(v);
                var merged    = (userCls + ' ' + preserved).replace(/\s+/g, ' ').trim();
                if (merged) el.setAttribute('class', merged);
                else el.removeAttribute('class');
            } else if (f.attr || isFileField(f)) {
                if (global.ProjectResolver && global.ProjectResolver.applyToAttribute) {
                    global.ProjectResolver.applyToAttribute(el, f.name, v);
                } else {
                    el.setAttribute(f.name, v);
                }
            } else {
                el[f.name] = v;
            }
            if (f.name === 'className') cleanClass(el);
        } else if (tab === 'styles') {
            if (v === '' || v == null) {
                try { el.style.removeProperty(f.name); } catch (e) { el.style[f.name] = ''; }
            } else {
                el.style[f.name] = v;
            }
        } else if (tab === 'events') {
            if (v) el.setAttribute(f.name, v); else el.removeAttribute(f.name);
        }

        var canvas = global.IDE && global.IDE._canvas;
        if (canvas && canvas.refreshPreviewAndParent) {
            var isCmp  = el.getAttribute && (el.getAttribute('data-wb-tag') || el.getAttribute('cmptype'));
            var isRoot = canvas.getRootContainer && canvas.getRootContainer() === el;
            if (isCmp || isRoot) {
                canvas.refreshPreviewAndParent(el);
            } else if (canvas.refreshPreview) {
                canvas.refreshPreview(el);
            }
        }

        this._internalChange = true;
        bus.emit('canvas:changed');
        this._internalChange = false;
    };

    Inspector.prototype._unset = function (tab, f) {
        var el = this.element;
        if (!el) return;

        if (tab === 'properties') {
            if (typeof f.unset === 'function') {
                f.unset(el);
            } else if (typeof f.set === 'function') {
                f.set(el, '');
            } else if (f.type === 'boolean') {
                el[f.name] = false;
                if (f.attr) el.removeAttribute(f.name);
            } else if (f.attr) {
                el.removeAttribute(f.name);
            } else {
                try { el[f.name] = ''; } catch (e) {}
            }

            if (f.name === 'class' || f.name === 'className') {
                var preserved = getServiceClasses(el.getAttribute('class') || '');
                if (preserved) el.setAttribute('class', preserved);
                else el.removeAttribute('class');
            }
        } else if (tab === 'styles') {
            try { el.style.removeProperty(f.name); }
            catch (e) { el.style[f.name] = ''; }
        } else if (tab === 'events') {
            el.removeAttribute(f.name);
        }

        var canvas = global.IDE && global.IDE._canvas;
        if (canvas && canvas.refreshPreviewAndParent) {
            var isCmp  = el.getAttribute && (el.getAttribute('data-wb-tag') || el.getAttribute('cmptype'));
            var isRoot = canvas.getRootContainer && canvas.getRootContainer() === el;
            if (isCmp || isRoot) {
                canvas.refreshPreviewAndParent(el);
            } else if (canvas.refreshPreview) {
                canvas.refreshPreview(el);
            }
        }

        this._internalChange = true;
        bus.emit('canvas:changed');
        this._internalChange = false;
    };

    /* ============================================================
       Строка инспектора
       ============================================================ */

    Inspector.prototype._row = function (tab, f) {
        if (f.type === 'separator') {
            return $('<div class="wb-row-separator"></div>').text(f.caption || '');
        }
        var self = this;
        var row = $('<div class="wb-row"></div>');
        row.append($('<div class="wb-row-name"></div>').text(f.caption || f.name));
        var box = $('<div class="wb-row-value"></div>').append(this._editor(tab, f));
        row.append(box);

        var del = $('<button type="button" class="wb-row-del"></button>')
            .attr('title', 'Удалить')
            .text('\u00D7');
        del.click(function (e) {
            e.preventDefault();
            e.stopPropagation();
            setTimeout(function () { self._unset(tab, f); }, 0);
        });
        row.append(del);

        return row;
    };

    Inspector.prototype._attachSuggest = function (inputNode, suggestList) {
        if (!suggestList || !suggestList.length) return inputNode;
        var listId = 'wb-sug-' + Math.floor(Math.random() * 1e9);
        var dl = document.createElement('datalist');
        dl.id = listId;
        for (var i = 0; i < suggestList.length; i++) {
            var opt = document.createElement('option');
            opt.value = String(suggestList[i]);
            dl.appendChild(opt);
        }
        inputNode.setAttribute('list', listId);

        var wrap = document.createElement('div');
        wrap.className = 'wb-suggest';
        wrap.appendChild(inputNode);
        wrap.appendChild(dl);
        return wrap;
    };

    Inspector.prototype._buildFileRow = function (f, val, commit) {
        var withThumb = isImageField(f);

        var wrap = document.createElement('div');
        wrap.className = 'wb-file';

        var input = document.createElement('input');
        input.type = 'text';
        input.value = (val == null ? '' : val);
        wrap.appendChild(input);

        var thumb = null;
        if (withThumb) {
            thumb = document.createElement('img');
            thumb.className = 'wb-file-thumb';
            thumb.alt = '';
            wrap.appendChild(thumb);
        }

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'wb-file-btn';
        btn.title = 'Выбрать файл из проекта';
        btn.textContent = '…';
        wrap.appendChild(btn);

        function refreshThumb() {
            if (!thumb) return;
            var src = resolvePreviewSrc(input.value);
            if (src) {
                thumb.src = src;
                thumb.style.display = '';
            } else {
                thumb.removeAttribute('src');
                thumb.style.display = 'none';
            }
        }
        refreshThumb();

        input.addEventListener('change', function () {
            commit(input.value);
            refreshThumb();
        }, false);

        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (global.ProjectFilePicker) {
                global.ProjectFilePicker.open({
                    value: input.value || '',
                    onPick: function (path) {
                        input.value = path;
                        commit(path);
                        refreshThumb();
                    }
                });
            }
        }, false);

        return wrap;
    };

    /* ============================================================
       Базовый редактор полей
       ============================================================ */

    Inspector.prototype._editor = function (tab, f) {
        var self = this, t = f.type || 'string', val = self._get(tab, f);
        var commit = function (v) { self._set(tab, f, v); };

        /* ---- boolean ---- */
        if (t === 'boolean') {
            var cb = $('<input type="checkbox">').prop('checked', !!val);
            cb.change(function () { commit(cb.prop('checked')); });
            return cb;
        }

        /* ---- enum ---- */
        if (t === 'enum') {
            var sel = $('<select></select>');
            (f.values || []).forEach(function (v) {
                sel.append($('<option></option>').val(v).text(v === '' ? '(not set)' : v));
            });
            sel.val(val == null ? '' : val);
            sel.change(function () { commit(sel.val()); });
            return sel;
        }

        /* ---- color ---- */
        if (t === 'color') {
            var wrapC = $('<div class="wb-color"></div>');
            var ci = $('<input type="color">').val(val || '#000000');
            var ti = $('<input type="text" class="wb-color-text">').val(val || '');
            ci.change(function () { ti.val(ci.val()); commit(ci.val()); });
            ti.change(function () { ci.val(ti.val() || '#000000'); commit(ti.val()); });
            wrapC.append(ci).append(ti);
            return wrapC;
        }

        /* ---- length ---- */
        if (t === 'length') {
            var lw = $('<div class="wb-length"></div>');
            var num = val ? parseFloat(val) : '';
            var um = String(val).match(/[a-z%]+$/i);
            var unit = um ? um[0] : 'px';
            if (val === 'auto') { num = ''; unit = 'auto'; }
            var ni = $('<input type="number" class="wb-length-num">').val(isNaN(num) ? '' : num);
            var us = $('<select class="wb-length-unit">' +
                '<option>px</option><option>%</option><option>em</option>' +
                '<option>rem</option><option>pt</option><option>vh</option>' +
                '<option>vw</option><option>auto</option>' +
                '</select>').val(unit);
            var upd = function () {
                if (us.val() === 'auto') commit('auto');
                else if (ni.val() === '') commit('');
                else commit(ni.val() + us.val());
            };
            ni.change(upd); us.change(upd);
            lw.append(ni).append(us);
            return lw;
        }

        /* ---- number ---- */
        if (t === 'number') {
            var nn = $('<input type="number">').val(val === '' ? '' : val);
            nn.change(function () { commit(nn.val()); });
            if (f.suggest && f.suggest.length) {
                return $(self._attachSuggest(nn[0], f.suggest));
            }
            return nn;
        }

        /* ---- FILE / image / URL-имена ---- */
        if (isFileField(f)) {
            return $(self._buildFileRow(f, val, commit));
        }

        /* ---- text (textarea) ---- */
        if (t === 'text') {
            var ta = $('<textarea rows="3" style="width:100%;box-sizing:border-box;' +
                'font-family:inherit;font-size:11px;border:1px solid #c0c0c0;"></textarea>')
                .val(val || '');
            ta.change(function () { commit(ta.val()); });
            ta.dblclick(function () {
                var editor = new global.CodeEditor({ value: ta.val() || '', language: 'plaintext' });
                global.Modal.open({
                    title: (f.caption || f.name) + ' — Edit',
                    content: editor.el,
                    onOk: function () {
                        var v = editor.getValue();
                        ta.val(v);
                        commit(v);
                    }
                });
                setTimeout(function () { editor.focus(); }, 50);
            });
            return ta;
        }

        /* ---- images (map) ---- */
        if (t === 'images') {
            var mBtn = $('<button type="button" class="wb-code-btn">Edit…</button>');
            mBtn.click(function () {
                var current = self._get(tab, f) || {};
                if (global.D3 && global.D3.openImagesEditor) {
                    global.D3.openImagesEditor(current, function (newMap) { commit(newMap); });
                }
            });
            return mBtn;
        }

        /* ---- code (events) ---- */
        if (t === 'code' && tab === 'events') {
            /* Реализовано в inspector-events.js */
            return self._buildEventEditor
                ? self._buildEventEditor(f, val, commit)
                : $('<input type="text">').val(val || '');
        }

        /* ---- code ---- */
        if (t === 'code') {
            var btn = $('<button type="button" class="wb-code-btn">Edit…</button>');
            btn.click(function () {
                var current = self._get(tab, f);
                var editor = new global.CodeEditor({
                    value: current || '',
                    language: f.language || 'javascript'
                });
                global.Modal.open({
                    title: f.caption || f.name,
                    content: editor.el,
                    onOk: function () { commit(editor.getValue()); }
                });
                setTimeout(function () { editor.focus(); }, 50);
            });
            return btn;
        }

        /* ---- code-editor ---- */
        if (t === 'code-editor') {
            var btn2 = $('<button type="button" class="wb-code-btn">Edit…</button>');
            btn2.click(function () {
                var current = self._get(tab, f);
                var lang = 'xml';
                if (typeof f.language === 'function') lang = f.language(self.element) || 'xml';
                else if (typeof f.language === 'string') lang = f.language;
                var editor = new global.CodeEditor({ value: current, language: lang });
                global.Modal.open({
                    title: f.caption || f.name,
                    content: editor.el,
                    onOk: function () { commit(editor.getValue()); }
                });
                setTimeout(function () { editor.focus(); }, 50);
            });
            return btn2;
        }

        /* ---- custom-editor-url ----
           Открывает внешний редактор (iframe по f.editorUrl) в модальном
           окне. Значение читается/пишется через input над iframe.
           Внешний редактор может слать postMessage:
             { wbComponentFieldValue: '…' } */
        if (t === 'custom-editor-url') {
            var btnEU = $('<button type="button" class="wb-code-btn">Edit…</button>');
            btnEU.click(function () {
                var current = self._get(tab, f) || '';
                var url = f.editorUrl || '';
                if (!url) { alert('URL редактора не задан.'); return; }

                var host = document.createElement('div');
                host.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;gap:4px;';

                var inpRow = document.createElement('input');
                inpRow.type = 'text';
                inpRow.value = current;
                inpRow.style.cssText = 'width:100%;box-sizing:border-box;padding:4px 6px;font-size:12px;';
                host.appendChild(inpRow);

                var iframe = document.createElement('iframe');
                iframe.src = url;
                iframe.style.cssText = 'flex:1;min-height:400px;border:1px solid #c0c0c0;background:#fff;';
                host.appendChild(iframe);

                global.Modal.open({
                    title: (f.caption || f.name) + ' — внешний редактор',
                    content: host,
                    onOk: function () { commit(inpRow.value); }
                });

                var onMsg = function (ev) {
                    try {
                        var d = ev.data;
                        if (d && typeof d === 'object' && 'wbComponentFieldValue' in d) {
                            inpRow.value = String(d.wbComponentFieldValue);
                        }
                    } catch (e) {}
                };
                window.addEventListener('message', onMsg);
                setTimeout(function () {
                    var okBtn = document.querySelector(
                        '#wb-window [property="footer"] .mini-button:first-child'
                    );
                    if (okBtn) {
                        okBtn.addEventListener('click', function () {
                            window.removeEventListener('message', onMsg);
                        }, { once: true });
                    }
                }, 50);
            });
            return btnEU;
        }

        /* ---- string по умолчанию ---- */
        var inp = $('<input type="text">').val(val == null ? '' : val);
        inp.change(function () { commit(inp.val()); });

        if (f.suggest && f.suggest.length) {
            return $(self._attachSuggest(inp[0], f.suggest));
        }

        return inp;
    };

    global.Inspector = Inspector;

})(window, jQuery);