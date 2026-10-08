/* cmpCompleter — автодополнение для привязанных контролов.

   Серверный контрол: CompleterCtrl.inc (class Completer).
   Клиентский контрол: Completer.js (D3Api.CompleterCtrl).

   Серверный код выводит невидимый <div class="ctrl_completer"
   style="display:none"> с шаблоном <div class="ctrl_completer_item"
   repeat=... dataset=...>. Клиентский CompleterCtrl вешает обработчики
   на input-ы, перечисленные в attr controls, и показывает всплывающий
   список при вводе.

   В IDE элемент невидим в canvas (как и в рантайме), но доступен в дереве
   и инспекторе. Аналог Action / Mask / Broker по поведению. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.completer', tagName: 'cmpCompleter', caption: 'Completer',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            dataset: '',
            showfield: '',
            maxitems: '0'
        },

        /* Свой create: разметка, как у серверного Show() —
           корневой div + шаблон item + "ничего не найдено" + hint. */
        create: function (doc) {
            var el = doc.createElement('cmpcompleter');
            el.setAttribute('data-wb-tag', 'cmpCompleter');
            el.setAttribute('name', '');
            el.setAttribute('dataset', '');
            el.setAttribute('showfield', '');
            el.setAttribute('maxitems', '0');
            el.setAttribute('minlength', '3');
            el.setAttribute('timeout', '500');
            el.setAttribute('mask', '%*%');

            /* Служебные узлы, которые ждёт CompleterCtrl.show():
               см. CompleterCtrl.inc → Show(). Они невидимы, но IDE
               сохранит их в HTML наравне с остальным. */
            var item = doc.createElement('div');
            item.className = 'ctrl_completer_item';
            el.appendChild(item);

            var noData = doc.createElement('div');
            noData.className = 'ctrl_completer_no_data';
            noData.textContent = 'Ничего не найдено';
            el.appendChild(noData);

            var hint = doc.createElement('div');
            hint.setAttribute('cont', 'hint');
            hint.textContent = 'Еще...';
            el.appendChild(hint);

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
            { name: 'name',  caption: 'Name',  type: 'string', attr: true },
            { name: 'value', caption: 'Value', type: 'string', attr: true },

            /* --- Completer --- */
            { type: 'separator', caption: 'Completer' },
            { name: 'controls',  caption: 'Controls',  type: 'string', attr: true },
            { name: 'setdata',   caption: 'SetData',   type: 'string', attr: true },
            { name: 'showfield', caption: 'ShowField', type: 'string', attr: true },
            { name: 'dataset',   caption: 'DataSet',   type: 'string', attr: true },
            { name: 'maxitems',  caption: 'MaxItems',  type: 'number', attr: true },
            { name: 'minlength', caption: 'MinLength', type: 'number', attr: true },
            { name: 'timeout',   caption: 'Timeout (ms)', type: 'number', attr: true },
            { name: 'mask',      caption: 'Mask',      type: 'string', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onselect', caption: 'OnSelect', type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);