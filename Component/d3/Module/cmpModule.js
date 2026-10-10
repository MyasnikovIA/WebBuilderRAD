/* cmpModule — вызов серверного модуля (.mdl или класс из Modules/…).

   Серверный контрол: ModuleCtrl.inc (class Module extends ModuleBase).
   Клиентский контрол: нет. Module работает на уровне сервера:
   Show() пишет XML-фрагмент <cmpModule …>…</cmpModule> в SetSysInfo(),
   ShowXML() подключает файл модуля и вызывает его функцию/класс.

   Поле module имеет тип FILE: путь к модулю можно выбрать
   из текущего проекта либо ввести вручную. */
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

        preview: null,

        properties: [
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },

            { type: 'separator', caption: 'D3 Base' },
            { name: 'name', caption: 'Name', type: 'string', attr: true },

            { type: 'separator', caption: 'Module' },
            { name: 'module', caption: 'Module (файл проекта или путь)', type: 'FILE', attr: true },
            { name: 'method', caption: 'Method', type: 'string',  attr: true },
            { name: 'async',  caption: 'Async',  type: 'boolean', attr: true }
        ],

        events: [],
        styles: []
    });

})(window);