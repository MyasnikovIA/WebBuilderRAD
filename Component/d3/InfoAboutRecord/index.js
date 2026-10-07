/* cmpInfoAboutRecord — иконка «Информация о записи».

   Серверный контрол: InfoAboutRecordCtrl.inc (class InfoAboutRecord).
   Клиентский контрол: InfoAboutRecord.js (D3Api.InfoAboutRecordCtrl).

   Серверный Show() собирает:
     <div style="display:inline-block" [class="ctrl_hidden"]
          onclick="D3Api.InfoAboutRecordCtrl.openInfoAboutRecordForm(this);"
          onchange="D3Api.InfoAboutRecordCtrl.setVisible(this);">
       <i class="fas fa-info-circle info_about_record_ctrl"
          title="Информация о записи"></i>
     </div>

   Видимость:
     - value  (id записи) хранится в атрибуте keyvalue;
     - пока value пусто, контейнер имеет класс ctrl_hidden;
     - onchange -> setVisible — переключает видимость по value.

   Поведение по клику:
     openInfoAboutRecordForm() открывает 'System/Logs/logs_by_unit'
     с vars.data = {unit_id: value, unitcode: unit}.

   Атрибуты:
     name  — имя контрола.
     unit  — код раздела системы.
     value — id записи (в рантайме хранится в keyvalue).

   В IDE: рисуется иконка ⓘ, плейсхолдер, если value не задан. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    function getValue(el) {
        return el.getAttribute('keyvalue') || el.getAttribute('value') || '';
    }
    function setValue(el, v) {
        if (v == null || v === '') {
            el.removeAttribute('keyvalue');
            el.removeAttribute('value');
        } else {
            el.setAttribute('keyvalue', String(v));
        }
    }

    D3.register({
        id: 'd3.infoaboutrecord', tagName: 'cmpInfoAboutRecord',
        caption: 'InfoAboutRecord',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            unit: ''
        },

        create: function (doc) {
            var el = doc.createElement('cmpinfoaboutrecord');
            el.setAttribute('data-wb-tag', 'cmpInfoAboutRecord');
            el.setAttribute('name', '');
            el.setAttribute('unit', '');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-infoaboutrecord';

            var v = getValue(el);
            if (!v) {
                /* Как в рантайме: без value контрол скрыт. Но в IDE
                   показываем полупрозрачный маркер, чтобы пользователь
                   видел компонент на холсте. */
                wrap.classList.add('d3-preview-infoaboutrecord-hidden');
            }

            if (el.getAttribute('visible') === 'false') wrap.style.display = 'none';
            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');

            var title = el.getAttribute('title') || 'Информация о записи';
            wrap.title = title;

            /* Иконка ⓘ — CSS-круг с 'i' внутри. */
            var icon = doc.createElement('span');
            icon.className = 'd3-preview-infoaboutrecord-icon';
            icon.textContent = 'i';
            wrap.appendChild(icon);

            return wrap;
        },

        /* ---------------- Properties ---------------- */
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
            {
                name: 'value', caption: 'Value (id записи)', type: 'string', attr: true,
                get: function (el) { return getValue(el); },
                set: function (el, v) { setValue(el, v); }
            },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            /* --- InfoAboutRecord --- */
            { type: 'separator', caption: 'InfoAboutRecord' },
            { name: 'unit', caption: 'Unit (раздел)', type: 'string', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onclick',  caption: 'OnClick',  type: 'code' },
            { name: 'onchange', caption: 'OnChange', type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);