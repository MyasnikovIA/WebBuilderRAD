/* M2 SubAction — вложенное действие. Невидим, CDATA. */
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
        id: 'm2.subaction', tagName: 'component', cmptype: 'SubAction',
        caption: 'SubAction (M2)', subCategory: 'Data', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'SubAction');
            el.setAttribute('name', '');
            el.setAttribute('repeatername', '');
            el.setAttribute('execon', 'each');
            el.appendChild(doc.createTextNode('<![CDATA[begin\n  null;\nend;]]>'));
            return el;
        },
        preview: null,

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name', caption: 'Name', type: 'string', attr: true },
            { type: 'separator', caption: 'SubAction' },
            { name: 'repeatername', caption: 'RepeaterName', type: 'string',  attr: true },
            { name: 'execon',       caption: 'ExecOn',       type: 'enum',    attr: true,
                values: ['', 'each', 'del', 'before', 'after'] },
            { name: 'execlast',     caption: 'ExecLast',     type: 'boolean', attr: true },
            { name: 'showerror',    caption: 'ShowError',    type: 'boolean', attr: true },
            { name: 'compile',      caption: 'Compile',      type: 'boolean', attr: true },
            { name: 'cdata', caption: 'PL/SQL (CDATA)', type: 'code',
                get: getCdata, set: setCdata }
        ],
        events: [], styles: []
    });

})(window);