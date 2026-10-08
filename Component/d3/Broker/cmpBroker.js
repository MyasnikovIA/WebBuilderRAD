/* cmpBroker — вызов брокера (BrokerBase extends BaseCtrl).

   Специфика — в подключаемом файле по типу БД (Broker<DBType>.inc).
   Собственных атрибутов не объявляет; принимает:
     name       — имя брокера
     mode       — режим ('post' и т.п.)
     enabled / visible / hint / width / height — из BaseCtrl
     произвольные серверные атрибуты передаются как есть.

   Невидим на сцене. Может содержать дочерние cmpAction / cmpActionVar,
   которые описывают передачу параметров брокеру. */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.broker', tagName: 'cmpBroker', caption: 'Broker',
        icon: 'images/icon.png',
        nameTemplate: 'broker',
        attrs: { name: '' },

        /* Невидим на сцене: создаётся только через палитру, содержимое скрыто CSS */
        preview: null,

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
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true, default: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true, default: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            /* --- Broker --- */
            { type: 'separator', caption: 'Broker' },
            { name: 'mode',   caption: 'Mode',   type: 'enum',   attr: true,
                values: ['', 'post'] },
            { name: 'params', caption: 'Params', type: 'string', attr: true },
            { name: 'dbname', caption: 'DBName', type: 'string', attr: true }
        ]
    });

})(window);