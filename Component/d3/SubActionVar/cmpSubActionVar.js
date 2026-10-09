/* cmpSubActionVar — переменная вложенного действия.
   Разрешена ТОЛЬКО внутри cmpSubAction.

   Ссылка: Action.inc (класс SubActionVar extends ActionVar). */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.subactionvar', tagName: 'cmpSubActionVar', caption: 'SubActionVar',
        subCategory: 'Data',
        icon: 'images/icon.png',
        nameTemplate: 'subActionVar',
        parentOnly: ['cmpsubaction'],
        attrs: { name: '', src: '', srctype: 'var' },

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

            /* --- SubActionVar --- */
            { type: 'separator', caption: 'SubActionVar' },
            { name: 'srctype',    caption: 'SrcType',    type: 'enum',    attr: true,
                values: ['', 'var', 'session', 'parent', 'const', 'const_server', 'exit_var', 'break_var'] },
            { name: 'src',        caption: 'Src',        type: 'string',  attr: true },
            { name: 'default',    caption: 'Default',    type: 'string',  attr: true },
            { name: 'get',        caption: 'Get',        type: 'string',  attr: true },
            { name: 'put',        caption: 'Put',        type: 'string',  attr: true },
            { name: 'property',   caption: 'Property',   type: 'string',  attr: true },
            { name: 'type',       caption: 'Type',       type: 'string',  attr: true },
            { name: 'len',        caption: 'Len',        type: 'number',  attr: true },
            { name: 'tdo',        caption: 'TDO',        type: 'string',  attr: true },
            { name: 'ignorenull', caption: 'IgnoreNull', type: 'boolean', attr: true },
            { name: 'file_store', caption: 'FileStore',  type: 'string',  attr: true },
            { name: 'query_type', caption: 'QueryType',  type: 'string',  attr: true }
        ]
    });

})(window);