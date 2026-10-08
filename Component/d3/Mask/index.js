/* cmpMask — служебный контрол масок ввода.

   Серверный контрол: MaskCtrl.inc (class Mask extends BaseCtrl).
   Клиентский контрол: Mask.js (D3Api.MaskCtrl).

   Серверный Show():
     <div cmptype="Mask" name="m1" controls="edit1;edit2" style="display:none"></div>

   Никакой видимой разметки — контрол полностью служебный.

   Клиентский init(dom):
     1. Читает controls (';'-список имён целевых контролов).
     2. Для каждого контрола находит его input через getInput().
     3. Читает на нём mask_* атрибуты (mask_type, mask_template,
        mask_check_regular, …) и регистрирует маску.
     4. Навешивает обработчики keydown/keypress/paste/focus/blur
        и классы .ctrl_mask / .ctrl_mask_warning.

   Атрибуты Mask:
     name     — идентификатор контрола маски (для отладки и setParam).
     controls — ';'-список имён целевых контролов.

   ВАЖНО: mask_type и mask_* задаются НЕ на Mask, а на целевых
   контролах. Mask только связывает их между собой.

   В IDE: невидим, доступен только в дереве и инспекторе. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    /* Разбирает строку controls 'a;b;c' в массив имён. */
    function parseControls(raw) {
        var out = [];
        if (!raw) return out;
        var parts = String(raw).split(';');
        for (var i = 0; i < parts.length; i++) {
            var s = parts[i];
            if (s != null && s !== '') out.push(s);
        }
        return out;
    }

    D3.register({
        id: 'd3.mask', tagName: 'cmpMask', caption: 'Mask',
        icon: 'images/icon.png',
        nameTemplate: 'mask',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            controls: ''
        },

        create: function (doc) {
            var el = doc.createElement('cmpmask');
            el.setAttribute('data-wb-tag', 'cmpMask');
            el.setAttribute('name', '');
            el.setAttribute('controls', '');
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

            /* --- Mask --- */
            { type: 'separator', caption: 'Mask' },
            {
                name: 'controls',
                caption: 'Controls (names via ;)',
                type: 'string',
                attr: true
            }
        ],

        /* ---------------- Events ---------------- */
        events: [],

        /* ---------------- Styles ---------------- */
        styles: []
    });

})(window);