/* cmpComment — HTML-комментарий.

   Серверный контрол: CommentCtrl.inc (class Comment).
   В рантайме Show() оборачивает _showtext в <!-- ... -->,
   поэтому в готовом HTML комментарий выглядит как обычный <!-- text -->.

   В IDE: элемент невидим в canvas (как и в браузере), но доступен в дереве
   и в инспекторе. Текст хранится как простой текстовый узел. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    /* Текст комментария — единственный прямой текстовый ребёнок.
       Служебные узлы (data-wb-preview) пропускаем. */
    function getText(el) {
        var out = '';
        var kids = el.childNodes;
        for (var i = 0; i < kids.length; i++) {
            var n = kids[i];
            if (n.nodeType === 3) out += n.nodeValue;
        }
        return out;
    }

    function setText(el, text) {
        var kids = el.childNodes;
        for (var i = kids.length - 1; i >= 0; i--) {
            if (kids[i].nodeType === 3) el.removeChild(kids[i]);
        }
        var v = (text == null) ? '' : String(text);
        /* Недопустимо иметь "--" внутри HTML-комментария. */
        v = v.replace(/--/g, '- -');
        el.insertBefore(el.ownerDocument.createTextNode(v), el.firstChild);
    }

    D3.register({
        id: 'd3.comment', tagName: 'cmpComment', caption: 'Comment',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: { name: '' },

        /* Невидим в canvas — как и в браузере. Пользователь работает
           с ним через дерево и инспектор. */
        create: function (doc) {
            var el = doc.createElement('cmpcomment');
            el.setAttribute('data-wb-tag', 'cmpComment');
            el.setAttribute('name', '');
            el.appendChild(doc.createTextNode('Комментарий'));
            return el;
        },

        /* Превью не нужно: элемент скрыт стилем IDE. */
        preview: null,

        /* ---------------- Properties ---------------- */
        properties: [
            /* --- HTML --- */
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },

            /* --- Comment --- */
            { type: 'separator', caption: 'Comment' },
            { name: 'name', caption: 'Name', type: 'string', attr: true },
            {
                name: 'text',
                caption: 'Text',
                type: 'code',
                get: function (el) { return getText(el); },
                set: function (el, v) { setText(el, v); }
            }
        ],

        /* ---------------- Events ---------------- */
        events: [],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);