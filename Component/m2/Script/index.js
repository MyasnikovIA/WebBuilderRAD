/* M2 Script — служебный компонент <component cmptype="Script">.

   Полный аналог D3-компонента cmpScript, но в M2-нотации.

   Содержимое — JavaScript в CDATA. Сервер при парсинге формы извлекает
   содержимое и включает его в общий скрипт-блок формы.

   В рантайме сервер рендерит скрытый <textarea> или иной контейнер.
   В IDE компонент невидим (правило в _injectIdeStyle canvas.js), но
   доступен в дереве и инспекторе.

   Свойства:
     name  — идентификатор контрола (опционально).
     cdata — JavaScript-код в CDATA. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    /* Читаем содержимое между <![CDATA[…]]> (или просто текст). */
    function getCdata(el) {
        var raw = el.textContent || '';
        var m = raw.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
        return m ? m[1] : raw;
    }

    /* Записываем в первый текстовый узел, оборачивая в CDATA. */
    function setCdata(el, text) {
        var doc = el.ownerDocument;
        var cdata = '<![CDATA[' + (text == null ? '' : text) + ']]>';

        var firstText = null;
        for (var i = 0; i < el.childNodes.length; i++) {
            if (el.childNodes[i].nodeType === 3) {
                firstText = el.childNodes[i];
                break;
            }
        }
        if (firstText) {
            firstText.nodeValue = cdata;
        } else {
            el.insertBefore(doc.createTextNode(cdata), el.firstChild);
        }
    }

    M2.register({
        id: 'm2.script',
        tagName: 'component',
        cmptype: 'Script',
        caption: 'Script (M2)',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'Script');
            el.setAttribute('name', '');

            /* Стартовое содержимое — комментарий-заготовка. */
            var initial = '\n// JS\n';
            el.appendChild(doc.createTextNode('<![CDATA[' + initial + ']]>'));
            return el;
        },

        /* Невидим в canvas — стиль уже задан в _injectIdeStyle. */
        preview: null,

        /* ---------------- Properties ---------------- */
        properties: [
            /* --- HTML --- */
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },

            /* --- D3 Base --- */
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name', caption: 'Name', type: 'string', attr: true },

            /* --- Script --- */
            { type: 'separator', caption: 'Script' },
            {
                name: 'cdata',
                caption: 'JavaScript (CDATA)',
                type: 'code',
                get: function (el) { return getCdata(el); },
                set: function (el, v) { setCdata(el, v); }
            }
        ],

        /* ---------------- Events ---------------- */
        events: [],

        /* ---------------- Styles ---------------- */
        styles: []
    });

})(window);