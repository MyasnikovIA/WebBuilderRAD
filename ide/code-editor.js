/* Редактор кода с подсветкой синтаксиса Highlight.js.
   Двухслойная схема: <pre><code> (подсвеченный текст) + прозрачная
   <textarea> сверху (каретка и ввод). Скроллы синхронизированы.

   ВАЖНО: на <code> НЕ ставится класс .hljs — иначе тема Highlight.js
   применит `pre code.hljs { padding: 1em; }` и слои разъедутся.
*/
(function (global, $) {
    'use strict';

    function CodeEditor(opts) {
        opts = opts || {};
        this.language = opts.language || 'xml';
        this._build();
        this.setValue(opts.value || '');
    }

    CodeEditor.prototype._build = function () {
        var wrap = document.createElement('div');
        wrap.className = 'wb-code-wrap';

        var pre = document.createElement('pre');
        pre.className = 'wb-code-hl';
        var code = document.createElement('code');
        code.className = 'wb-code-hl-inner';   /* НЕ .hljs */
        pre.appendChild(code);

        var ta = document.createElement('textarea');
        ta.className = 'wb-code-ta';
        ta.spellcheck = false;
        ta.setAttribute('autocomplete', 'off');
        ta.setAttribute('autocorrect', 'off');
        ta.setAttribute('autocapitalize', 'off');
        ta.setAttribute('wrap', 'off');

        wrap.appendChild(pre);
        wrap.appendChild(ta);

        this.el   = wrap;
        this.pre  = pre;
        this.code = code;
        this.ta   = ta;

        var self = this;
        ta.addEventListener('input',  function () { self._refresh(); });
        ta.addEventListener('scroll', function () { self._syncScroll(); });
        ta.addEventListener('keydown', function (e) {
            if (e.keyCode === 9) {
                e.preventDefault();
                self._insertAtCursor('    ');
            }
        });
    };

    CodeEditor.prototype._insertAtCursor = function (text) {
        var ta = this.ta;
        var s = ta.selectionStart;
        var e = ta.selectionEnd;
        var v = ta.value;
        ta.value = v.slice(0, s) + text + v.slice(e);
        ta.selectionStart = ta.selectionEnd = s + text.length;
        this._refresh();
    };

    CodeEditor.prototype._refresh = function () {
        var raw = this.ta.value;
        var html = this._highlight(raw, this.language);
        /* \n в конце — чтобы последняя пустая строка не «съедалась» */
        this.code.innerHTML = html + '\n';
        this._syncScroll();
    };

    CodeEditor.prototype._syncScroll = function () {
        this.pre.scrollTop  = this.ta.scrollTop;
        this.pre.scrollLeft = this.ta.scrollLeft;
    };

    CodeEditor.prototype._highlight = function (raw, lang) {
        if (!global.hljs) return this._escape(raw);
        if (lang === 'mixed-sql') return this._highlightMixedSql(raw);
        return this._fragment(raw, lang);
    };

    CodeEditor.prototype._fragment = function (raw, lang) {
        var hljs = global.hljs;
        try {
            if (lang && !hljs.getLanguage(lang)) return this._escape(raw);
            return hljs.highlight(raw, { language: lang, ignoreIllegals: true }).value;
        } catch (e) {
            return this._escape(raw);
        }
    };

    CodeEditor.prototype._highlightMixedSql = function (raw) {
        var re = /<!\[CDATA\[([\s\S]*?)\]\]>/g;
        var out = '';
        var last = 0;
        var m;
        while ((m = re.exec(raw)) !== null) {
            var before = raw.slice(last, m.index);
            if (before) out += this._fragment(before, 'xml');
            out += '<span class="hljs-comment">&lt;![CDATA[</span>';
            out += this._fragment(m[1], 'sql');
            out += '<span class="hljs-comment">]]&gt;</span>';
            last = m.index + m[0].length;
        }
        var tail = raw.slice(last);
        if (tail) out += this._fragment(tail, 'xml');
        return out;
    };

    CodeEditor.prototype._escape = function (s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    };

    CodeEditor.prototype.getValue = function () { return this.ta.value; };
    CodeEditor.prototype.setValue = function (v) { this.ta.value = v || ''; this._refresh(); };
    CodeEditor.prototype.focus    = function () { this.ta.focus(); };

    global.CodeEditor = CodeEditor;
})(window, jQuery);