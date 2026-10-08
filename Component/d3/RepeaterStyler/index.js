/* cmpRepeaterStyler — динамическая стилизация клонов репитера.

   Серверный контрол: RepeaterStylerCtrl.inc (class RepeaterStyler extends BaseCtrl).
   Клиентский контрол: RepeaterStyler.js (D3Api.RepeaterStylerCtrl).

   Серверный Show() собирает:
     <div class="…" style="display:none;">
       <textarea>JSON</textarea>
     </div>
     [<style>…сгенерированный CSS…</style>]

   JSON внутри textarea:
     {
       "classes": {
         "warning": {
           "active": { "background-color": "#ff0", "border": "1px solid red" },
           "hover":  { "background-color": "#fee" }
         },
         "success": {
           "active": { "background-color": "#dfd" }
         }
       },
       "specs": [
         { "cond": "status == 'error'",       "class": "warning" },
         { "cond": "status == 'ok'",          "class": "success",
           "selector": ".itemName" }
       ]
     }

   Разбор:
     - "classes" — определения CSS-классов. Ключ верхнего уровня — имя
       класса (в CSS превращается в `<repeatername>_<имя>`). Внутри —
       псевдосостояния: "active", "hover", "activehover".
     - "specs"   — массив условий. На каждом клоне репитера:
         1. Вычисляется `cond(data)` (строка с JS-выражением,
            автоматически оборачивается в `new Function`);
         2. Если true — на клон (или на элементы по `selector`) навешиваются
            CSS-классы `repeaterstyler` и `<repeatername>_<class>`.

   Сервер переименовывает классы из `specs[i].class` в
   `<repeatername>_<class>` и генерирует `<style>`-блок.

   Атрибуты:
     name         — идентификатор контрола.
     repeatername — имя репитера, к которому привязан стилизатор.

   Содержимое: JSON (в XML — внутри CDATA).

   В IDE: невидим, доступен только в дереве и инспекторе. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    /* Читаем текст между <![CDATA[…]]> (или просто текст, если CDATA нет). */
    function getCdata(el) {
        var raw = el.textContent || '';
        var m = raw.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
        return m ? m[1] : raw;
    }

    /* Записываем текст в первый текстовый узел, оборачивая в CDATA. */
    function setCdata(el, text) {
        var doc = el.ownerDocument;
        var cdata = '<![CDATA[' + (text == null ? '' : text) + ']]>';

        /* Найти первый текстовый узел. */
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

    D3.register({
        id: 'd3.repeaterstyler', tagName: 'cmpRepeaterStyler', caption: 'RepeaterStyler',
        icon: 'images/icon.png',
        nameTemplate: 'repeaterStyler',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            repeatername: ''
        },

        create: function (doc) {
            var el = doc.createElement('cmprepeaterstyler');
            el.setAttribute('data-wb-tag', 'cmpRepeaterStyler');
            el.setAttribute('name', '');
            el.setAttribute('repeatername', '');
            el.style.display = 'none';

            /* Стартовый JSON — минимальная заготовка. */
            var initial = JSON.stringify({
                classes: {},
                specs: []
            });
            el.appendChild(doc.createTextNode('<![CDATA[' + initial + ']]>'));
            return el;
        },

        /* Превью не нужно — элемент скрыт стилем IDE. */
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

            /* --- RepeaterStyler --- */
            { type: 'separator', caption: 'RepeaterStyler' },
            { name: 'repeatername', caption: 'Repeater Name', type: 'string', attr: true },
            {
                name: 'json',
                caption: 'JSON (classes + specs)',
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