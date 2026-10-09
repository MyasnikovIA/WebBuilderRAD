/* M2 StatGridColumnHeader — заголовок колонки StatGrid. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    function getCdata(el) {
        var raw = el.textContent || '';
        var m = raw.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
        return m ? m[1] : raw;
    }
    function setCdata(el, text) {
        el.textContent = '<![CDATA[' + (text == null ? '' : text) + ']]>';
    }

    M2.register({
        id: 'm2.statgridcolumnheader', tagName: 'component', cmptype: 'StatGridColumnHeader',
        caption: 'StatGridColumnHeader (M2)', subCategory: 'Grids', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'StatGridColumnHeader');
            return el;
        },
        preview: null,

        properties: [
            { type: 'separator', caption: 'Content' },
            { name: 'cdata', caption: 'Header HTML', type: 'code',
                get: getCdata, set: setCdata }
        ],
        events: [], styles: []
    });

})(window);