/* M2 Comment — <component cmptype="Comment">. HTML-комментарий.

   Аналог D3-компонента cmpComment.
   В дереве IDE отображается как <!-- text -->; при сохранении
   сериализуется в реальный HTML-комментарий.

   Регистрация через M2.register — попадает в категорию M2,
   подкатегорию Display. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    function getText(el) { return el.textContent || ''; }

    function setText(el, v) {
        var doc = el.ownerDocument;
        for (var i = el.childNodes.length - 1; i >= 0; i--) {
            var c = el.childNodes[i];
            if (c.nodeType === 3) el.removeChild(c);
        }
        el.insertBefore(doc.createTextNode(v == null ? '' : String(v)), el.firstChild);
    }

    M2.register({
        id: 'm2.comment',
        tagName: 'component',
        cmptype: 'Comment',
        caption: 'Comment (M2)',
        subCategory: 'Display',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'Comment');
            el.appendChild(doc.createTextNode('Комментарий'));
            return el;
        },

        /* Невидим в canvas — стиль display: none для component[cmptype="Comment"]
           уже прописан в _injectIdeStyle() (canvas.js). */
        preview: null,

        properties: [
            { type: 'separator', caption: 'Comment' },
            {
                name: 'text',
                caption: 'Text',
                type: 'text',
                get: getText,
                set: setText
            }
        ],

        events: [],
        styles: []
    });

})(window);