/* cmpDependences — невидимый контрол зависимостей и обязательности.

   Серверный контрол: DependencesCtrl.inc (class Dependences).
   Клиентский контрол: Dependences.js (D3Api.DependencesCtrl).

   Серверный код выводит:
     <div cmptype="Dependences" name="..." required="..." depend="..."
          repeatername="..." condition="..." style="display:none"></div>

   Атрибуты:
     required    — список имён контролов через ';', которые надо проверять на заполненность.
                   Поддерживает префиксы:
                     ?name            — только проверка без warning
                     !name            — только warning без блокировки
                     name:prop        — проверять свойство prop вместо 'value'
                     name:prop:check  — проверять выражение check(value)
     depend      — список контролов, состояние которых зависит от результата:
                     name:prop        — устанавливать свойство prop (по умолчанию 'enabled')
                     name:prop:expr   — применить expr(result) перед установкой
     repeatername — имя репитера, если Dependences работает внутри него.
     condition    — JS-выражение от R (карта результатов required):
                     например "R.field1 && !R.field2"

   В IDE: компонент невидим в canvas, но доступен в дереве и инспекторе. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.dependences', tagName: 'cmpDependences', caption: 'Dependences',
        icon: 'images/icon.png',
        nameTemplate: 'dependences',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            required: '',
            depend: '',
            repeatername: '',
            condition: ''
        },

        create: function (doc) {
            var el = doc.createElement('cmpdependences');
            el.setAttribute('data-wb-tag', 'cmpDependences');
            el.setAttribute('name', '');
            el.setAttribute('required', '');
            el.setAttribute('depend', '');
            el.setAttribute('repeatername', '');
            el.setAttribute('condition', '');
            el.style.display = 'none';
            return el;
        },

        /* Превью не показываем: элемент скрыт стилем IDE. */
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

            /* --- Dependences --- */
            { type: 'separator', caption: 'Dependences' },
            { name: 'required',     caption: 'Required',     type: 'string', attr: true },
            { name: 'depend',       caption: 'Depend',       type: 'string', attr: true },
            { name: 'repeatername', caption: 'Repeater',     type: 'string', attr: true },
            {
                name: 'condition',
                caption: 'Condition',
                type: 'code',
                attr: true
            }
        ],

        /* ---------------- Events ---------------- */
        events: [],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);