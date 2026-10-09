/* M2 RepeaterStyler — динамическая стилизация репитера. Невидим. */
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
        id: 'm2.repeaterstyler', tagName: 'component', cmptype: 'RepeaterStyler',
        caption: 'RepeaterStyler (M2)', subCategory: 'Data', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'RepeaterStyler');
            el.setAttribute('name', '');
            el.setAttribute('repeatername', '');
            el.appendChild(doc.createTextNode(
                '<![CDATA[' + JSON.stringify({ classes: {}, specs: [] }) + ']]>'
            ));
            return el;
        },
        preview: null,

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name', caption: 'Name', type: 'string', attr: true },
            { type: 'separator', caption: 'RepeaterStyler' },
            { name: 'repeatername', caption: 'Repeater Name', type: 'string', attr: true },
            { name: 'json', caption: 'JSON (classes + specs)', type: 'code',
                get: getCdata, set: setCdata }
        ],
        events: [], styles: []
    });

})(window);