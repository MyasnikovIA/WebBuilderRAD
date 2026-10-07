/* cmpAction — процедурный блок (PL/SQL, SQL или PHP).
   Невидим на сцене, содержимое хранится в CDATA.

   Ссылка: Action.inc / ActionOracle.inc */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.action', tagName: 'cmpAction', caption: 'Action',
        icon: 'images/icon.png',
        attrs: { name: 'ActionName' },
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
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },

            /* --- Action --- */
            { type: 'separator', caption: 'Action' },
            { name: 'compile',       caption: 'Compile',      type: 'boolean', attr: true },
            { name: 'showerror',     caption: 'ShowError',    type: 'boolean', attr: true, default: true },
            { name: 'max_exec_time', caption: 'MaxExecTime',  type: 'number',  attr: true },
            { name: 'query_type',    caption: 'QueryType',    type: 'enum',    attr: true,
                values: ['', 'sql', 'php', 'server_php', 'php_function', 'php_class', 'repository'] },
            { name: 'params',        caption: 'Params',       type: 'string',  attr: true },
            { name: 'dbname',        caption: 'DBName',       type: 'string',  attr: true },
            { name: 'repository',    caption: 'Repository',   type: 'string',  attr: true },
            { name: 'method',        caption: 'Method',       type: 'string',  attr: true },
            { name: 'unit',          caption: 'Unit (broker)',   type: 'string', attr: true },
            { name: 'action',        caption: 'Action (broker)', type: 'string', attr: true },
            { name: 'mode',          caption: 'Mode',         type: 'enum',    attr: true,
                values: ['', 'post'] }
        ]
    });

})(window);