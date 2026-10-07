/* cmpFetch — вызов сервиса (HTTP-запрос).

   Серверный контрол: Fetch.inc (class Fetch).
   Клиентский контрол: нет. Fetch — служебный компонент, работает
   на уровне сервера: пишет XML-фрагмент <fetch …>…</fetch> в SetSysInfo().

   Атрибуты:
     name           — идентификатор fetch-а (обязателен).
     service        — имя сервиса. Сервер резолвит его через Configuration
                      (template с подстановкой <service> или прямой URL).
     uri            — путь запроса, может содержать {var}-плейсхолдеры.
     method         — GET | POST | PUT | DELETE | PATCH.
     action         — имя Action, который получит ответ.
     dataset        — имя DataSet, в который загрузятся данные.
     module         — имя Module (взаимоисключим с action/dataset).
     preprocessor   — JS-функция для обработки запроса до отправки.
     postprocessor  — JS-функция для обработки ответа после получения.

   Дети: cmpFetchVar (переменные запроса/ответа).

   В IDE: невидимый служебный компонент. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.fetch', tagName: 'cmpFetch', caption: 'Fetch',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            service: '',
            uri: '',
            method: 'GET'
        },

        create: function (doc) {
            var el = doc.createElement('cmpfetch');
            el.setAttribute('data-wb-tag', 'cmpFetch');
            el.setAttribute('name', '');
            el.setAttribute('service', '');
            el.setAttribute('uri', '');
            el.setAttribute('method', 'GET');
            return el;
        },

        /* Невидим в canvas — как и в рантайме. */
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

            /* --- Fetch --- */
            { type: 'separator', caption: 'Fetch' },
            { name: 'service', caption: 'Service', type: 'string', attr: true },
            { name: 'uri',     caption: 'URI',     type: 'string', attr: true },
            { name: 'method',  caption: 'Method',  type: 'enum',   attr: true,
                values: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },

            /* --- Target --- */
            { type: 'separator', caption: 'Target (Action / DataSet / Module)' },
            { name: 'action',  caption: 'Action',  type: 'string', attr: true },
            { name: 'dataset', caption: 'DataSet', type: 'string', attr: true },
            { name: 'module',  caption: 'Module',  type: 'string', attr: true },

            /* --- Handlers --- */
            { type: 'separator', caption: 'Handlers' },
            { name: 'preprocessor',  caption: 'Preprocessor',  type: 'string', attr: true },
            { name: 'postprocessor', caption: 'Postprocessor', type: 'string', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);