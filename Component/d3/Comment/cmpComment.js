/* cmpComment — HTML-комментарий.

   В DOM представляется кастомным тегом <cmpcomment> с атрибутом
   data-wb-tag="cmpComment". В дереве IDE отображается как
   <!-- text -->. При сохранении сериализуется в реальный HTML-
   комментарий <!-- text -->. При загрузке HTML с комментариями
   (nodeType === 8) ядро автоматически заменяет их на <cmpcomment>
   (см. Canvas.loadHtml, шаг 5.5).

   Свойства:
     text — содержимое комментария.

   Категория: HTML (в палитре — в блоке HTML).

   Регистрация через D3.register — ради автоматического разрешения
   относительных путей previewCss/icon относительно папки компонента. */
(function (global) {
    'use strict';
    var D3 = global.D3;

    /* Читаем текст комментария. */
    function getText(el) {
        return el.textContent || '';
    }

    /* Записываем текст: удаляем все текстовые узлы и вставляем один. */
    function setText(el, v) {
        var doc = el.ownerDocument;
        for (var i = el.childNodes.length - 1; i >= 0; i--) {
            var c = el.childNodes[i];
            if (c.nodeType === 3) el.removeChild(c);
        }
        el.insertBefore(doc.createTextNode(v == null ? '' : String(v)),
            el.firstChild);
    }

    D3.register({
        id: 'html.comment',
        tagName: 'cmpComment',
        caption: 'Comment',
        category: 'HTML',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('cmpcomment');
            el.setAttribute('data-wb-tag', 'cmpComment');
            el.appendChild(doc.createTextNode('Комментарий'));
            return el;
        },

        /* Превью не нужно: компонент невидим в canvas (display: none из ide-style), виден только в дереве Structure. */
        preview: null,

        /* ---------------- Properties ---------------- */
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

        /* ---------------- Events ---------------- */
        events: [],

        /* ---------------- Styles ---------------- */
        styles: []
    });

})(window);