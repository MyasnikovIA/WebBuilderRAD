/* cmpModuleVar — переменная Module.

   Серверный контрол: ModuleBaseCtrl.inc (class ModuleVar extends BaseCtrl).
   Пишет <var …> в parent->xml. Читает и передаёт модулю входные
   переменные, принимает выходные.

   Атрибуты:
     name         — имя переменной внутри модуля.
     src          — источник (имя переменной формы, контрола, поля DataSet).
     srctype      — тип источника:
                      var          — переменная формы
                      ctrl         — контрол (значение)
                      ctrlcaption  — контрол (отображаемый текст)
                      session      — сессионная переменная
                      const        — клиентская константа
                      const_server — серверная константа
                      parent       — переменная родительского модуля
                      data         — данные DataSet
                      exit_var     — прерывание модуля (специальное)
                      break_var    — прерывание цикла (специальное)
     get          — имя поля для чтения (для входа). Если задано пустым
                    ('get=""'), сервер генерирует автоматически: g0, g1, …
     put          — имя поля для записи (для выхода). Если 'put=""',
                    сервер генерирует p0, p1, …
     type         — тип значения: string | integer | number | boolean | date
     query_type   — способ передачи: path | filter | body
     default      — значение по умолчанию.
     property     — свойство контрола (при srctype=ctrl).
     ignorenull   — не передавать null-значение.

   parentOnly: cmpmodule — можно добавлять только внутрь Module.

   В IDE: невидим, доступен только в дереве и инспекторе. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.modulevar', tagName: 'cmpModuleVar', caption: 'ModuleVar',
        parentOnly: 'cmpmodule',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            src: '',
            srctype: 'var'
        },

        create: function (doc) {
            var el = doc.createElement('cmpmodulevar');
            el.setAttribute('data-wb-tag', 'cmpModuleVar');
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
                    'const', 'const_server', 'parent', 'data',
                    'exit_var', 'break_var'] },

            /* --- Binding --- */
            { type: 'separator', caption: 'Binding' },
            { name: 'get',        caption: 'Get',        type: 'string',  attr: true },
            { name: 'put',        caption: 'Put',        type: 'string',  attr: true },
            { name: 'type',       caption: 'Type',       type: 'enum',    attr: true,
                values: ['', 'string', 'integer', 'number', 'boolean', 'date'] },
            { name: 'query_type', caption: 'Query Type', type: 'enum',    attr: true,
                values: ['', 'path', 'filter', 'body'] },
            { name: 'default',    caption: 'Default',    type: 'string',  attr: true },
            { name: 'property',   caption: 'Property',   type: 'string',  attr: true },
            { name: 'ignorenull', caption: 'Ignore Null', type: 'boolean', attr: true }
        ],

        events: [],

        styles: []
    });

})(window);