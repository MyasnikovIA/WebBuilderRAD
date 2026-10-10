/* Inspector: вкладка Events.

   Дополняет Inspector.prototype, определённый в inspector.js.
   Загружается ПОСЛЕ inspector.js.

   Содержит:
     • collectFormFunctions — сбор всех функций формы из cmpScript /
       component[cmptype="Script"] / <script>;
     • _buildEventEditor — строка события (input + dropdown);
     • _createEventFunction — генерация тела функции по шаблону;
     • вспомогательные isM2Element / findOrCreateScriptContainer. */
(function (global, $) {
    'use strict';
    var bus = global.EventBus;
    var Inspector = global.Inspector;
    if (!Inspector) { console.error('[inspector-events] Inspector не загружен'); return; }

    /* ============================================================
       Утилиты для разбора функций формы
       ============================================================ */

    function parseArgsList(raw) {
        if (!raw) return [];
        return String(raw).split(',')
            .map(function (s) { return s.trim(); })
            .filter(function (s) { return s.length > 0; });
    }

    function buildCallSignature(name, args) {
        var out = args.slice();
        if (out.length > 0) {
            var first = out[0];
            if (first === 'dom' || /^_this/i.test(first)) out[0] = 'this';
        }
        return name + '(' + out.join(', ') + ');';
    }

    function eventNamePriority(name) {
        var last = String(name).split('.').pop();
        return /^on/i.test(last) ? 0 : 1;
    }

    function collectFormFunctions(canvas) {
        var out = [];
        if (!canvas || !canvas.getDoc) return out;
        var doc = canvas.getDoc();
        if (!doc) return out;

        var sources = [];
        var scripts = doc.querySelectorAll('cmpscript, component[cmptype="Script"], script');
        for (var i = 0; i < scripts.length; i++) {
            var s = scripts[i];
            var tag = s.tagName.toLowerCase();
            if (tag === 'script' && s.getAttribute('src')) continue;
            var raw = s.textContent || '';
            var m = raw.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
            sources.push(m ? m[1] : raw);
        }
        if (!sources.length) return out;

        var combined = sources.join('\n');
        var seen = {};

        function add(name, argsRaw) {
            if (!name || seen[name]) return;
            seen[name] = 1;
            var args = parseArgsList(argsRaw);
            out.push({ name: name, args: args, call: buildCallSignature(name, args) });
        }

        var reAssign = /([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*=\s*function\s*\(([^)]*)\)/g;
        var m;
        while ((m = reAssign.exec(combined)) !== null) add(m[1], m[2]);

        var reFunc = /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/g;
        while ((m = reFunc.exec(combined)) !== null) add(m[1], m[2]);

        out.sort(function (a, b) {
            var pa = eventNamePriority(a.name);
            var pb = eventNamePriority(b.name);
            if (pa !== pb) return pa - pb;
            return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
        });

        return out;
    }

    var EVENT_CAMEL_MAP = {
        onclick: 'Click', ondblclick: 'DblClick',
        onmousedown: 'MouseDown', onmouseup: 'MouseUp',
        onmouseover: 'MouseOver', onmouseout: 'MouseOut', onmousemove: 'MouseMove',
        onkeydown: 'KeyDown', onkeyup: 'KeyUp', onkeypress: 'KeyPress',
        onchange: 'Change', oninput: 'Input',
        onfocus: 'Focus', onblur: 'Blur',
        onsubmit: 'Submit', onreset: 'Reset',
        onload: 'Load', onerror: 'Error'
    };

    function eventNameToCamel(name) {
        var lc = String(name || '').toLowerCase();
        if (EVENT_CAMEL_MAP[lc]) return EVENT_CAMEL_MAP[lc];
        var rest = lc.replace(/^on/, '');
        return rest.charAt(0).toUpperCase() + rest.slice(1);
    }

    function isFunctionDeclared(code, name) {
        if (!code || !name) return false;
        var esc = String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var re1 = new RegExp('\\b' + esc + '\\s*=\\s*function');
        if (re1.test(code)) return true;
        var lastSeg = String(name).split('.').pop();
        if (lastSeg && lastSeg !== name) {
            var escLast = lastSeg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            var re2 = new RegExp('\\bfunction\\s+' + escLast + '\\s*\\(');
            if (re2.test(code)) return true;
        }
        return false;
    }

    function isM2Element(el) {
        if (!el || el.nodeType !== 1) return false;
        if (!el.getAttribute) return false;
        if (el.getAttribute('data-wb-tag')) return false;
        return !!el.getAttribute('cmptype');
    }

    function findOrCreateScriptContainer(doc, canvas, isM2) {
        if (isM2) {
            var m2Script = doc.querySelector('component[cmptype="Script"]');
            if (m2Script) return { node: m2Script, isFormFunc: true, created: false };
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'Script');
            el.appendChild(doc.createTextNode('<![CDATA[\n]]>'));
            var root = canvas.getRootContainer() || canvas.getBody();
            if (root) {
                if (root.firstChild) root.insertBefore(el, root.firstChild);
                else root.appendChild(el);
            }
            return { node: el, isFormFunc: true, created: true };
        }
        var cmpScript = doc.querySelector('cmpscript');
        if (cmpScript) return { node: cmpScript, isFormFunc: true, created: false };
        var el2 = doc.createElement('cmpscript');
        el2.setAttribute('data-wb-tag', 'cmpScript');
        el2.appendChild(doc.createTextNode('<![CDATA[\n]]>'));
        var root2 = canvas.getRootContainer() || canvas.getBody();
        if (root2) {
            if (root2.firstChild) root2.insertBefore(el2, root2.firstChild);
            else root2.appendChild(el2);
        }
        return { node: el2, isFormFunc: true, created: true };
    }

    /* ============================================================
       Редактор события: input + dropdown со списком функций формы.
       ============================================================ */
    Inspector.prototype._buildEventEditor = function (f, val, commit) {
        var self = this;
        var evRow = $('<div class="wb-event-row"></div>');

        var evInp = $('<input type="text" class="wb-event-input">').val(val == null ? '' : val);
        var evSel = $('<select class="wb-event-select" title="Выбрать функцию формы"></select>');
        evSel.append($('<option></option>').val('').text('⋯'));

        var canvas = global.IDE && global.IDE._canvas;
        var fns = collectFormFunctions(canvas);
        fns.forEach(function (fn) {
            evSel.append($('<option></option>').val(fn.call).text(fn.call));
        });

        if (val) {
            if (evSel.find('option[value="' + val.replace(/"/g, '\\"') + '"]').length === 0) {
                evSel.append($('<option></option>').val(val).text(val));
            }
            evSel.val(val);
        }

        evInp.change(function () { commit(evInp.val()); });
        evInp.dblclick(function () {
            var current = evInp.val();
            var editor = new global.CodeEditor({ value: current, language: 'javascript' });
            global.Modal.open({
                title: f.caption || f.name,
                content: editor.el,
                onOk: function () {
                    var v = editor.getValue();
                    evInp.val(v);
                    commit(v);
                }
            });
            setTimeout(function () { editor.focus(); }, 50);
        });

        evSel.change(function () {
            var v = evSel.val();
            if (!v) return;
            evInp.val(v);
            commit(v);
        });

        evSel.dblclick(function () {
            var v = evSel.val();
            if (v) {
                bus.emit('codeview:show');
                bus.emit('codeview:navigate-function', { signature: v });
                return;
            }
            if (!evInp.val()) {
                var result = self._createEventFunction(f);
                if (result && result.signature) {
                    var call = result.signature;
                    var callName = result.name || call;

                    evInp.val(call);
                    if (evSel.find('option[value="' + call.replace(/"/g, '\\"') + '"]').length === 0) {
                        evSel.append($('<option></option>').val(call).text(call));
                    }
                    evSel.val(call);
                    commit(call);

                    bus.emit('codeview:show');
                    bus.emit('codeview:navigate-function', { signature: call, name: callName });
                }
            }
        });

        evRow.append(evInp).append(evSel);
        return evRow;
    };

    /* ============================================================
       Создание функции события
       ============================================================ */
    Inspector.prototype._createEventFunction = function (f) {
        var el = this.element;
        if (!el) return null;
        var canvas = global.IDE && global.IDE._canvas;
        if (!canvas || !canvas.getDoc) return null;
        var doc = canvas.getDoc();
        if (!doc) return null;

        var isM2 = isM2Element(el);
        var camelEvent = eventNameToCamel(f.name);
        var ctrlName = '';
        if (el.getAttribute) ctrlName = el.getAttribute('name') || el.getAttribute('id') || '';
        var funcName = 'on' + camelEvent + ctrlName;

        var container = findOrCreateScriptContainer(doc, canvas, isM2);
        if (!container || !container.node) return null;

        var scriptNode   = container.node;
        var createdScript = container.created;
        var isFormFunc = container.isFormFunc;
        var funcPath = (isFormFunc ? 'Form.' : '') + funcName;

        function applyPlaceholders(str) {
            return String(str)
                .replace(/\{name\}/g, funcName)
                .replace(/\{func\}/g, funcPath)
                .replace(/\{event\}/g, camelEvent)
                .replace(/\{ctrl\}/g, ctrlName);
        }

        var funcBody;
        if (f.template && typeof f.template === 'string') {
            funcBody = applyPlaceholders(f.template);
        } else {
            funcBody = funcPath + ' = function(dom) {\n\n};';
        }

        var callSig;
        if (f.callTemplate && typeof f.callTemplate === 'string') {
            callSig = applyPlaceholders(f.callTemplate);
        } else {
            callSig = funcPath + '(this);';
        }

        var callName = funcPath;
        if (callSig.indexOf(funcPath) < 0) {
            var nm = callSig.match(/^\s*([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*\(/);
            if (nm) callName = nm[1];
        }

        var existingCode = scriptNode.textContent || '';
        if (isFunctionDeclared(existingCode, callName)) {
            return { signature: callSig, name: callName };
        }

        var textNode = null;
        for (var i = 0; i < scriptNode.childNodes.length; i++) {
            var cn = scriptNode.childNodes[i];
            if (cn.nodeType === 3) { textNode = cn; break; }
        }
        if (!textNode) {
            textNode = doc.createTextNode('<![CDATA[\n]]>');
            scriptNode.appendChild(textNode);
        }
        var raw = textNode.nodeValue || '';
        var cdataMatch = raw.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
        var innerBody = cdataMatch ? cdataMatch[1] : raw;
        innerBody = innerBody.replace(/\s+$/, '') + '\n\n' + funcBody + '\n';
        textNode.nodeValue = '<![CDATA[' + innerBody + ']]>';

        if (createdScript && canvas._reobserve) canvas._reobserve();

        return { signature: callSig, name: callName };
    };

})(window, jQuery);