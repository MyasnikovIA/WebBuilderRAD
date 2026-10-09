/* cmpSubAction — вложенное действие.
   Разрешено внутри cmpAction ИЛИ другого cmpSubAction.
   Невидим на сцене, содержимое хранится в CDATA.

   Ссылка: Action.inc (класс SubAction). */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.subaction', tagName: 'cmpSubAction', caption: 'SubAction',
        subCategory: 'Data',
        icon: 'images/icon.png',
        nameTemplate: 'subAction',
        parentOnly: ['cmpaction', 'cmpsubaction'],
        attrs: { name: '', repeatername: '', execon: 'each' },
        cdata: 'begin\n  null;\nend;\n',
        cdataSchema: { caption: 'PL/SQL' },

        properties: [
            /* --- HTML --- */
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },
            { name: 'title', caption: 'Title', type: 'string', attr: true },

            /* --- D3 Base --- */
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string', attr: true },

            /* --- SubAction --- */
            { type: 'separator', caption: 'SubAction' },
            { name: 'repeatername', caption: 'RepeaterName', type: 'string',  attr: true },
            { name: 'execon',       caption: 'ExecOn',       type: 'enum',    attr: true,
                values: ['', 'each', 'del', 'before', 'after'] },
            { name: 'execlast',     caption: 'ExecLast',     type: 'boolean', attr: true },
            { name: 'showerror',    caption: 'ShowError',    type: 'boolean', attr: true, default: true },
            { name: 'compile',      caption: 'Compile',      type: 'boolean', attr: true },
            { name: 'query_type',   caption: 'QueryType',    type: 'enum',    attr: true,
                values: ['', 'sql', 'php', 'server_php', 'php_function', 'php_class', 'repository'] }
        ]
    });

})(window);