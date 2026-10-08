/* cmpLocate — служебный контрол позиционирования по структуре DataSet-ов.

   Серверный контрол: LocateCtrl.inc (class Locate extends BaseCtrl).
   Клиентский контрол: Locate.js (D3Api.LocateCtrl).

   Серверный Show():
     <div cmptype="Locate" name="…" structure="…" primary="…"
          locate="…" locate_value="…" locate_field="…"
          style="display:none"></div>

   Никакой визуальной разметки — контрол полностью служебный.
   Поведение по вызову locate():
     1. D3Api.LocateCtrl.locate(dom) шлёт запрос на сервер
        (type: 'Locate', params: dom.D3Locate).
     2. Серверный ShowXML() разбирает структуру зависимостей
        (Master:Detail:var=field… через ';' и ':') и раскладывает
        её в глобальный LOCATE_STRUCTURE.
     3. Клиент обновляет primary DataSet (refreshDataSet(primary)).

   Атрибуты:
     name          — имя контрола.
     structure     — структура зависимостей DataSet-ов:
                     DS1;DS2:DS1:pid=id;DS3:DS2:pid=id:pid2=uid
                     синтаксис: Master:Detail:varname[=detail_field]=master_field:…
     primary       — основной DataSet (который обновляется).
     locate        — DataSet, который надо позиционировать.
     locate_value  — значение для позиционирования.
     locate_field  — поле для позиционирования.

   В IDE: невидим, доступен только в дереве и инспекторе. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.locate', tagName: 'cmpLocate', caption: 'Locate',
        icon: 'images/icon.png',
        nameTemplate: 'locate',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            structure: '',
            primary: '',
            locate: '',
            locate_value: '',
            locate_field: ''
        },

        create: function (doc) {
            var el = doc.createElement('cmplocate');
            el.setAttribute('data-wb-tag', 'cmpLocate');
            el.setAttribute('name', '');
            el.setAttribute('structure', '');
            el.setAttribute('primary', '');
            el.setAttribute('locate', '');
            el.setAttribute('locate_value', '');
            el.setAttribute('locate_field', '');
            el.style.display = 'none';
            return el;
        },

        /* Превью не нужно — элемент скрыт стилем IDE. */
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

            /* --- Locate --- */
            { type: 'separator', caption: 'Locate' },
            {
                name: 'structure',
                caption: 'Structure (Master:Detail:var=field…)',
                type: 'code',
                attr: true
            },
            { name: 'primary',      caption: 'Primary DataSet',  type: 'string', attr: true },
            { name: 'locate',       caption: 'Locate DataSet',   type: 'string', attr: true },
            { name: 'locate_value', caption: 'Locate Value',     type: 'string', attr: true },
            { name: 'locate_field', caption: 'Locate Field',     type: 'string', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [],

        /* ---------------- Styles ---------------- */
        styles: []
    });

})(window);