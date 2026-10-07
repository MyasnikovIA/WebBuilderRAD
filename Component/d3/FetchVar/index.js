/* cmpFetchVar — переменная Fetch-запроса или ответа.

   Серверный контрол: Fetch.inc (class FetchVar).
   Разворачивается в XML-тег <var …> внутри родительского <fetch>.

   Атрибуты:
     name         — имя переменной. Может отсутствовать: сервер
                    выставляет get = name, если name не задан, а
                    get не указан явно.
     src          — источник (имя переменной, контрола, сессии).
     srctype      — тип источника:
                      var           — переменная формы
                      ctrl          — контрол (значение)
                      ctrlcaption   — контрол (отображаемый текст)
                      session       — сессионная переменная
                      data          — данные DataSet
                      const         — клиентская константа
                      const_server  — серверная константа
     get          — имя поля для чтения из src (для запроса).
                    По умолчанию совпадает с name.
     put          — имя поля для записи в src (для ответа).
     type         — тип значения: string | integer | number | boolean | date | path.
                    'path' — подставить в {path}-плейсхолдер URI.
     query_type   — способ передачи:
                      path   — {var} в URL
                      filter — фильтр запроса
                      body   — тело запроса
     default      — значение по умолчанию.
     ignorenull   — не передавать переменную, если она null.
     len          — подсказка длины (для совместимости с ActionVar).

   parentOnly: cmpFetch — можно добавлять только внутрь Fetch. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.fetchvar', tagName: 'cmpFetchVar', caption: 'FetchVar',
        parentOnly: 'cmpfetch',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            src: '',
            srctype: 'var'
        },

        create: function (doc) {
            var el = doc.createElement('cmpfetchvar');
            el.setAttribute('data-wb-tag', 'cmpFetchVar');
            el.setAttribute('name', '');
            el.setAttribute('src', '');
            el.setAttribute('srctype', 'var');
            return el;
        },

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
            { name: 'name',    caption: 'Name',    type: 'string', attr: true },
            { name: 'src',     caption: 'Src',     type: 'string', attr: true },
            { name: 'srctype', caption: 'SrcType', type: 'enum',   attr: true,
                values: ['', 'var', 'ctrl', 'ctrlcaption', 'session',
                    'data', 'const', 'const_server'] },

            /* --- Binding --- */
            { type: 'separator', caption: 'Binding' },
            { name: 'get',        caption: 'Get',        type: 'string',  attr: true },
            { name: 'put',        caption: 'Put',        type: 'string',  attr: true },
            { name: 'type',       caption: 'Type',       type: 'enum',    attr: true,
                values: ['', 'string', 'integer', 'number', 'boolean', 'date', 'path'] },
            { name: 'query_type', caption: 'Query Type', type: 'enum',    attr: true,
                values: ['', 'path', 'filter', 'body'] },
            { name: 'default',    caption: 'Default',    type: 'string',  attr: true },
            { name: 'ignorenull', caption: 'Ignore Null', type: 'boolean', attr: true },
            { name: 'len',        caption: 'Length',     type: 'number',  attr: true }
        ],

        events: [],

        styles: []
    });

})(window);