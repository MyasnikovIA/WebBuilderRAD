/* D3 Framework — общий namespace D3.
   Экспортирует:
     D3.register(opts)         — регистрирует cmp-компонент в ComponentRegistry
     D3.cdataProp(caption)     — свойство CDATA для инспектора
     D3.attrSchema(attrs,cdata)
     D3.buildSchema(props, cdata, events, styles)
     D3.findFirstTextNode(el)
     D3.setCdataOnElement(el, v)
     D3.getCdataFromElement(el)
     D3.folderOf(tagName)      — 'cmpButton' → 'Button'
     D3.baseFor(tagName)       — абсолютный URL папки компонента
     D3.imageFor(tagName, rel) — абсолютный URL картинки внутри папки компонента

   Каждый компонент живёт в папке Component/d3/<Имя>/index.js
   и может иметь подпапки images/, css/, js/.

   В opts.icon / opts.previewCss / opts.previewJs указываются ОТНОСИТЕЛЬНЫЕ
   пути (например 'images/icon.png'); D3.register сделает их абсолютными.

   Поля схемы:
     properties — массив полей; можно вставлять { type:'separator', caption:'…' }
     events     — массив событий (type:'code' — редактор кода)
     styles     — массив CSS-свойств (попадают во вкладку Styles)
     cdataSchema — опционально, добавляет поле CDATA */
(function (global) {
    'use strict';

    function findFirstTextNode(el) {
        var nodes = el.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType === 3) return nodes[i];
        }
        return null;
    }

    function setCdataOnElement(el, text) {
        var doc = el.ownerDocument;
        var cdataText = '<![CDATA[' + (text == null ? '' : text) + ']]>';
        var tn = findFirstTextNode(el);
        if (tn) {
            tn.nodeValue = cdataText;
        } else {
            el.insertBefore(doc.createTextNode(cdataText), el.firstChild);
        }
    }

    function getCdataFromElement(el) {
        var raw = el.textContent || '';
        var m = raw.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
        return m ? m[1] : '';
    }

    function cdataProp(caption) {
        return {
            name: 'cdata',
            caption: caption || 'CDATA',
            type: 'code',
            get: function (el) { return getCdataFromElement(el); },
            set: function (el, v) { setCdataOnElement(el, v); }
        };
    }

    function attrSchema(attrs, cdata) {
        var props = (attrs || []).slice();
        if (cdata) props.push(cdataProp(cdata.caption));
        return { properties: props, styles: [], events: [] };
    }

    /* Собирает schema компонента.
       properties  — массив полей; можно вставлять { type:'separator', caption:'…' }.
       cdata       — опционально, добавляет поле CDATA.
       events      — массив событий (type:'code' → редактор кода).
       styles      — массив CSS-свойств для вкладки Styles. */
    function buildSchema(properties, cdata, events, styles) {
        var props = (properties || []).slice();
        if (cdata) props.push(cdataProp(cdata.caption));
        return {
            properties: props,
            events: events || [],
            styles: styles || []
        };
    }

    /* 'cmpButton' → 'Button', 'cmpSubActionVar' → 'SubActionVar' */
    function folderOf(tagName) {
        var s = String(tagName || '').replace(/^cmp/, '');
        if (!s) return s;
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    function pageBase() {
        return window.location.href.replace(/[?#].*$/, '').replace(/[^\/]*$/, '');
    }

    function baseFor(tagName) {
        return pageBase() + 'Component/d3/' + folderOf(tagName) + '/';
    }

    function imageFor(tagName, rel) {
        return baseFor(tagName) + String(rel || '').replace(/^\/+/, '');
    }

    function absolutizeList(tagName, list) {
        if (!list) return [];
        var out = [];
        for (var i = 0; i < list.length; i++) {
            out.push(baseFor(tagName) + String(list[i] || '').replace(/^\/+/, ''));
        }
        return out;
    }

    function register(opts) {
        var R = global.ComponentRegistry;
        var tagName = opts.tagName || opts.id.split('.')[1];
        var tagLower = tagName.toLowerCase();

        var comp = {
            id: opts.id,
            category: 'D3',
            caption: opts.caption,
            tagName: tagLower,
            xmlTag: tagName,
            hidden: !!opts.hidden,
            folder: folderOf(tagName),
            iconUrl:        opts.icon        ? imageFor(tagName, opts.icon)                 : '',
            previewCssUrls: absolutizeList(tagName, opts.previewCss),
            previewJsUrls:  absolutizeList(tagName, opts.previewJs),
            create: opts.create || function (doc) {
                var el = doc.createElement(tagLower);
                el.setAttribute('data-wb-tag', tagName);
                if (opts.attrs) {
                    for (var k in opts.attrs) el.setAttribute(k, opts.attrs[k]);
                }
                if (opts.cdata != null) {
                    el.appendChild(doc.createTextNode('<![CDATA[' + opts.cdata + ']]>'));
                }
                return el;
            },
            preview: opts.preview,
            parentOnly: opts.parentOnly,
            unique: opts.unique,
            schema: buildSchema(opts.properties, opts.cdataSchema, opts.events, opts.styles)
        };
        R.register(comp);
        return comp;
    }

    global.D3 = {
        register: register,
        cdataProp: cdataProp,
        attrSchema: attrSchema,
        buildSchema: buildSchema,
        findFirstTextNode: findFirstTextNode,
        setCdataOnElement: setCdataOnElement,
        getCdataFromElement: getCdataFromElement,
        folderOf: folderOf,
        baseFor: baseFor,
        imageFor: imageFor
    };

})(window);