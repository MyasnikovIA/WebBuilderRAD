/* Canvas: сериализация DOM в HTML (cleanHtml и его помощники).

   Дополняет Canvas.prototype, определённый в canvas-core.js.
   Загружается ПОСЛЕ canvas-insert.js. */
(function (global) {
    'use strict';
    var Canvas = global.Canvas;
    if (!Canvas) { console.error('[canvas-format] Canvas не загружен'); return; }

    var INDENT = Canvas.INDENT;
    var VOID_LOWER = Canvas.VOID_LOWER;
    var RAW_TAGS = Canvas.RAW_TAGS;
    var CDATA_CONTAINERS = Canvas.CDATA_CONTAINERS;
    var XML_SELF_CLOSE = Canvas.XML_SELF_CLOSE;

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
                if (c.getAttribute && c.getAttribute('data-wb-ide') === '1') continue;
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

            if (name.indexOf('data-wb-orig-') === 0) continue;
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

            var orig = el.getAttribute && el.getAttribute('data-wb-orig-' + name);
            if (orig != null) val = String(orig);

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
                if (c.getAttribute && c.getAttribute('data-wb-ide') === '1') continue;
                if (c.getAttribute && c.getAttribute('data-wb-comp-asset') === '1') continue;
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
                if (c.getAttribute && c.getAttribute('data-wb-ide') === '1') continue;
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

})(window);