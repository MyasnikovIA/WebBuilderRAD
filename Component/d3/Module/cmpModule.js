/* cmpModule — вызов серверного модуля (.mdl или класс из Modules/…).

   Серверный контрол: ModuleCtrl.inc (class Module extends ModuleBase).
   Клиентский контрол: нет. Module работает на уровне сервера:
   Show() пишет XML-фрагмент <cmpModule …>…</cmpModule> в SetSysInfo(),
   ShowXML() подключает файл модуля и вызывает его функцию/класс.

   Атрибуты:
     name    — идентификатор модуля (обязателен).
     module  — путь к модулю без расширения (например 'Test/Some/ModuleName').
               Резолвится в Modules/<module>.mdl или Modules/<module>/index.php.
     method  — имя метода класса (по умолчанию 'exec').
     async   — 'true' | 'false' (по умолчанию 'false').

   Дети: cmpModuleVar (переменные модуля).

   В IDE: невидимый служебный компонент. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.module', tagName: 'cmpModule', caption: 'Module',
        subCategory: 'Data',
        icon: 'images/icon.png',
        nameTemplate: 'module',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            module: '',
            method: 'exec',
            async: 'false'
        },

        create: function (doc) {
            var el = doc.createElement('cmpmodule');
            el.setAttribute('data-wb-tag', 'cmpModule');
            el.setAttribute('name', '');
            el.setAttribute('module', '');
            el.setAttribute('method', 'exec');
            el.setAttribute('async', 'false');
            el.style.display = 'none';
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

            /* --- Module --- */
            { type: 'separator', caption: 'Module' },
            { name: 'module', caption: 'Module (path)', type: 'string', attr: true },
            { name: 'method', caption: 'Method',        type: 'string', attr: true },
            { name: 'async',  caption: 'Async',         type: 'boolean', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [],

        /* ---------------- Styles ---------------- */
        styles: []
    });

})(window);