/* Object Inspector в стиле Delphi 7: три вкладки — Properties / Styles / Events. */
(function (global, $) {
    'use strict';

    function Inspector(rootEl) {
        this.root = $(rootEl);
        this.element = null;
        this.def = null;
        this.currentTab = 'properties';

        this._bindTabs();
        var self = this;
        EventBus.on('selection:changed', function (e) { self.show(e.element); });
        EventBus.on('canvas:changed',    function ()  { if (self.element) self.refresh(); });
    }

    Inspector.prototype._bindTabs = function () {
        var self = this;
        this.root.find('.wb-itab').click(function () {
            self.root.find('.wb-itab').removeClass('wb-active');
            $(this).addClass('wb-active');
            self.currentTab = $(this).attr('data-tab');
            self.root.find('.wb-itab-pane').hide();
            self.root.find('.wb-itab-pane[data-tab="' + self.currentTab + '"]').show();
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
        this.def = ComponentRegistry.match(el);
        var caption = '<' + el.tagName.toLowerCase() + '>' + (this.def ? ' — ' + this.def.caption : '');
        this.root.find('#wb-inspector-target').text(caption);
        this.refresh();
    };

    Inspector.prototype.refresh = function () {
        var self = this;
        ['properties', 'styles', 'events'].forEach(function (tab) {
            var pane = self.root.find('.wb-itab-pane[data-tab="' + tab + '"]');
            pane.empty();
            var schema = (self.def && self.def.schema && self.def.schema[tab]) || [];
            if (!schema.length) {
                pane.html('<div class="wb-empty">No ' + tab + '</div>');
                return;
            }
            schema.forEach(function (field) { pane.append(self._buildRow(tab, field)); });
        });
    };

    /* -------- get/set значения -------- */

    Inspector.prototype._getValue = function (tab, field) {
        var el = this.element;
        if (!el) return '';

        if (tab === 'properties') {
            if (field.get) return field.get(el);
            if (field.attr) return el.getAttribute(field.name) || '';
            var v = el[field.name];
            return (v === undefined || v === null) ? '' : v;
        }
        if (tab === 'styles') {
            return el.style[field.name] || '';
        }
        if (tab === 'events') {
            return el.getAttribute(field.name) || '';
        }
        return '';
    };

    Inspector.prototype._setValue = function (tab, field, value) {
        var el = this.element;
        if (!el) return;

        if (tab === 'properties') {
            if (field.set) field.set(el, value);
            else if (field.type === 'boolean') el[field.name] = !!value;
            else if (field.attr) el.setAttribute(field.name, value);
            else el[field.name] = value;
        }
        else if (tab === 'styles') {
            if (value === '' || value == null) {
                try { el.style.removeProperty(field.name); } catch (e) { el.style[field.name] = ''; }
            } else {
                el.style[field.name] = value;
            }
        }
        else if (tab === 'events') {
            if (value) el.setAttribute(field.name, value);
            else el.removeAttribute(field.name);
        }

        EventBus.emit('canvas:changed');
    };

    /* -------- построение строки -------- */

    Inspector.prototype._buildRow = function (tab, field) {
        var self = this;
        var row  = $('<div class="wb-row"></div>');
        var name = $('<div class="wb-row-name"></div>').text(field.caption || field.name);
        var box  = $('<div class="wb-row-value"></div>');
        box.append(self._buildEditor(tab, field));
        row.append(name).append(box);
        return row;
    };

    Inspector.prototype._buildEditor = function (tab, field) {
        var self = this;
        var type = field.type || 'string';
        var value = self._getValue(tab, field);
        var commit = function (v) { self._setValue(tab, field, v); };

        if (type === 'boolean') {
            var cb = $('<input type="checkbox">').prop('checked', !!value);
            cb.change(function () { commit(cb.prop('checked')); });
            return cb;
        }

        if (type === 'enum') {
            var sel = $('<select></select>');
            (field.values || []).forEach(function (v) {
                sel.append($('<option></option>').val(v).text(v === '' ? '(not set)' : v));
            });
            sel.val(value == null ? '' : value);
            sel.change(function () { commit(sel.val()); });
            return sel;
        }

        if (type === 'color') {
            var wrap = $('<div class="wb-color"></div>');
            var colorInp = $('<input type="color">').val(value || '#000000');
            var textInp  = $('<input type="text" class="wb-color-text">').val(value || '');
            colorInp.change(function () { textInp.val(colorInp.val()); commit(colorInp.val()); });
            textInp.change(function () { colorInp.val(textInp.val() || '#000000'); commit(textInp.val()); });
            wrap.append(colorInp).append(textInp);
            return wrap;
        }

        if (type === 'length') {
            var lw   = $('<div class="wb-length"></div>');
            var num  = value ? parseFloat(value) : '';
            var unitMatch = String(value).match(/[a-z%]+$/i);
            var unit = unitMatch ? unitMatch[0] : 'px';
            if (value === 'auto') { num = ''; unit = 'auto'; }
            var numInp = $('<input type="number" class="wb-length-num">').val(isNaN(num) ? '' : num);
            var unitSel = $('<select class="wb-length-unit"><option>px</option><option>%</option><option>em</option><option>rem</option><option>pt</option><option>auto</option></select>').val(unit);
            var update = function () {
                if (unitSel.val() === 'auto') commit('auto');
                else if (numInp.val() === '') commit('');
                else commit(numInp.val() + unitSel.val());
            };
            numInp.change(update);
            unitSel.change(update);
            lw.append(numInp).append(unitSel);
            return lw;
        }

        if (type === 'number') {
            var nInp = $('<input type="number">').val(value === '' ? '' : value);
            nInp.change(function () { commit(nInp.val()); });
            return nInp;
        }

        if (type === 'text') {
            var ta = $('<textarea rows="3"></textarea>').val(value || '');
            ta.change(function () { commit(ta.val()); });
            return ta;
        }

        if (type === 'code') {
            var btn = $('<button type="button" class="wb-code-btn">Edit…</button>');
            btn.click(function () {
                var current = self._getValue(tab, field);
                var editor = $('<textarea class="wb-code-editor"></textarea>').val(current);
                Modal.open({
                    title: (field.caption || field.name),
                    content: editor,
                    onOk: function () { commit(editor.val()); }
                });
            });
            return btn;
        }

        /* string */
        var inp = $('<input type="text">').val(value == null ? '' : value);
        inp.change(function () { commit(inp.val()); });
        return inp;
    };

    global.Inspector = Inspector;
})(window, jQuery);