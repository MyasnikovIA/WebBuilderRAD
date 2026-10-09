/* M2 ServerScript — серверный скрипт. Невидим. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    function getCdata(el) {
        var raw = el.textContent || '';
        var m = raw.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
        return m ? m[1] : raw;
    }
    function setCdata(el, text) {
        var doc = el.ownerDocument;
        var cdata = '<![CDATA[' + (text == null ? '' : text) + ']]>';
        var firstText = null;
        for (var i = 0; i < el.childNodes.length; i++) {
            if (el.childNodes[i].nodeType === 3) { firstText = el.childNodes[i]; break; }
        }
        if (firstText) firstText.nodeValue = cdata;
        else el.insertBefore(doc.createTextNode(cdata), el.firstChild);
    }

    M2.register({
        id: 'm2.serverscript', tagName: 'component', cmptype: 'ServerScript',
        caption: 'ServerScript (M2)', subCategory: 'Data', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'ServerScript');
            el.setAttribute('name', '');
            el.setAttribute('language', 'php');
            el.appendChild(doc.createTextNode('<![CDATA[\n// PHP\n]]>'));
            return el;
        },
        preview: null,

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name', caption: 'Name', type: 'string', attr: true },
            { type: 'separator', caption: 'ServerScript' },
            { name: 'language', caption: 'Language', type: 'enum', attr: true,
                values: ['php', 'javascript', 'sql', 'xml', 'css', 'json', 'text'] },
            {
                name: 'cdata', caption: 'Script (CDATA)', type: 'code',
                get: getCdata, set: setCdata
            }
        ],
        events: [], styles: []
    });

})(window);