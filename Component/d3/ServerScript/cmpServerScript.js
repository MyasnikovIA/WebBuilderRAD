/* cmpServerScript — серверный скрипт.

   Серверный контрол: ServerScriptCtrl.inc (class ServerScript extends BaseCtrl).
   Клиентский контрол: нет.

   Серверный Show():
     - ob_start();
     - eval($this->script);
     - $this->_showtext = ob_get_clean();
     - FormParser::parse('<dummy>' . $this->_showtext . '</dummy>', …);

   То есть содержимое выполняется как PHP и его вывод парсится как
   D3-разметка, вставляемая в родителя. По сути — серверный генератор
   HTML/D3-компонентов.

   Атрибуты:
     name     — идентификатор контрола.
     language — язык содержимого. Используется для подсветки синтаксиса
                в IDE. Сервер в текущей версии всегда выполняет PHP,
                но атрибут сохраняется для будущей поддержки других
                языков и для документирования.

   Содержимое: скрипт (хранится в CDATA).

   В IDE: невидим, доступен только в дереве и инспекторе.
   Редактируется в модальном окне с подсветкой синтаксиса
   (Highlight.js), язык подсветки берётся из атрибута language. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    /* Читаем CDATA-блок (или просто текст, если CDATA нет). */
    function getCdata(el) {
        var raw = el.textContent || '';
        var m = raw.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
        return m ? m[1] : raw;
    }

    /* Записываем содержимое в первый текстовый узел в CDATA-обёртке. */
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
        id: 'd3.serverscript', tagName: 'cmpServerScript', caption: 'ServerScript',
        subCategory: 'Data',
        icon: 'images/icon.png',
        nameTemplate: 'serverScript',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            language: 'php'
        },

        create: function (doc) {
            var el = doc.createElement('cmpserverscript');
            el.setAttribute('data-wb-tag', 'cmpServerScript');
            el.setAttribute('name', '');
            el.setAttribute('language', 'php');
            el.style.display = 'none';

            /* Стартовое содержимое — комментарий-заготовка. */
            var initial = '\n// PHP\n';
            el.appendChild(doc.createTextNode('<![CDATA[' + initial + ']]>'));
            return el;
        },

        /* Превью не нужно — результат зависит от серверного eval. */
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

            /* --- ServerScript --- */
            { type: 'separator', caption: 'ServerScript' },
            {
                name: 'language',
                caption: 'Language (подсветка в IDE)',
                type: 'enum',
                attr: true,
                values: [
                    'php',
                    'javascript',
                    'sql',
                    'xml',
                    'css',
                    'json',
                    'text'
                ]
            },
            {
                name: 'script',
                caption: 'Script',
                type: 'code-editor',
                /* Язык для CodeEditor берём с текущего элемента. */
                language: function (el) {
                    return el.getAttribute('language') || 'php';
                },
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