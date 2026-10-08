/* cmpScript — служебный контрол для JavaScript-кода формы.

   Серверный контрол: ScriptCtrl.inc (class Script extends BaseCtrl).
   Клиентский контрол: нет.

   Серверный код:
     - printTag = 'textarea';
     - style="display:none;";
     - Show() печатает закрывающий </textarea> (открывающий —
       BaseCtrl::Show()).

   Итоговая разметка в рантайме:
     <textarea style="display:none;">
       <![CDATA[
         Form.save = function() { … }
       ]]>
     </textarea>

   Содержимое — JavaScript в CDATA. При парсинге формы сервер
   извлекает текст и включает его в общий скрипт-блок формы.

   Атрибуты:
     name — идентификатор контрола (опционально; обычно не задаётся).

   В IDE: невидим, доступен только в дереве и инспекторе. */
(function (global) {
    'use strict';
    var D3 = global.D3;
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

    D3.register({
        id: 'd3.script', tagName: 'cmpScript', caption: 'Script',
        icon: 'images/icon.png',
        nameTemplate: 'script',
        previewCss: ['css/preview.css'],
        attrs: { name: '' },

        create: function (doc) {
            var el = doc.createElement('cmpscript');
            el.setAttribute('data-wb-tag', 'cmpScript');
            el.setAttribute('name', '');
            el.style.display = 'none';

            /* Стартовое содержимое — комментарий-заготовка. */
            var initial = '\n// JS\n';
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