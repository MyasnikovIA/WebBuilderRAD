/* D3 Framework — общий namespace D3.
   Экспортирует:
     D3.register(opts)       — регистрирует cmp-компонент в ComponentRegistry
     D3.cdataProp(caption)   — свойство CDATA для инспектора
     D3.attrSchema(attrs,cdata) — собирает schema properties
     D3.findFirstTextNode(el)
     D3.setCdataOnElement(el, v)
     D3.getCdataFromElement(el)

   CDATA-содержимое хранится как первый текстовый узел внутри cmp-элемента
   в виде "<![CDATA[ ... ]]>". Дочерние элементы идут следом.

   parentOnly может быть строкой или массивом (в нижнем регистре). */
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

    function register(opts) {
        var R = global.ComponentRegistry;
        var tagName = opts.tagName || opts.id.split('.')[1];
        R.register({
            id: opts.id,
            category: 'D3',
            caption: opts.caption,
            tagName: tagName.toLowerCase(),
            xmlTag: tagName,
            hidden: !!opts.hidden,
            create: function (doc) {
                var el = doc.createElement(tagName.toLowerCase());
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
            schema: attrSchema(opts.properties, opts.cdataSchema)
        });
    }

    global.D3 = {
        register: register,
        cdataProp: cdataProp,
        attrSchema: attrSchema,
        findFirstTextNode: findFirstTextNode,
        setCdataOnElement: setCdataOnElement,
        getCdataFromElement: getCdataFromElement
    };

})(window);