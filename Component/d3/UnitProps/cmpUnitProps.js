/* cmpUnitProps — таблица дополнительных свойств раздела.

   Серверный контрол: UnitPropsCtrl.inc (class UnitProps extends BaseCtrl).
   Клиентский контрол: UnitProps.js (D3Api.UnitPropCtrl).

   Серверный Show() читает конфигурацию свойств из БД:
     - core.v_unitprop_links — привязки свойств к разделу;
     - core.v_unitprops     — описания свойств;
     - core.v_unitprop_values — значения свойств для записи;
     - core.v_composition   — композиции для UnitEdit-ов.

   Генерирует:
     - <cmpDataSet name="DS_UnitProps_<unit><name>"> — значения свойств;
     - по одному контролу на свойство:
         prp_generation_type = 0 → Edit / DateEdit (по prp_data_type);
         prp_generation_type = 1 → UnitEdit (unit+composition);
         prp_generation_type = 2 → UnitEdit (extradict);
         prp_generation_type = 3 → CheckBox;
     - <cmpDependences> для обязательных свойств (requere=1);
     - <cmpMask> для числовых свойств с ограничением длины;
     - <cmpAction name="ACT_<name>"> — сохранение значений
       (если не задан bind_action);
     - <table class="ctrl_unitprops" unitprops_count="N">
         <colgroup><col width="200"/><col/></colgroup>
         <tr><td>Наименование свойства:</td><td><cmpEdit …/></td></tr>
         …
       </table>

   Атрибуты:
     name              — имя контрола (используется в ACT_<name>).
     unit              — код раздела.
     subunit           — код подраздела (опционально).
     unitid_varname    — имя переменной с id записи (по умолчанию 'id').
     activateoncreate  — 'true' — активировать DataSet при создании.
     bind_action       — ';'-список имён Action-ов, к которым
                         привязываются контролы (вместо генерации ACT_<name>).
     label_width       — ширина колонки подписи (по умолчанию '200').
     value_width       — ширина колонки значения.
     repeatername      — имя репитера (для UnitProps внутри Grid).
     parent_var        — переменная-родитель для UnitEdit-ов.
     depend_control_name — контрол, который блокируется Dependences.

   В IDE: в canvas видно таблицу-скелет с примером свойств. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.unitprops', tagName: 'cmpUnitProps', caption: 'UnitProps',
        subCategory: 'Controls',
        icon: 'images/icon.png',
        nameTemplate: 'unitProps',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            unit: '',
            unitid_varname: 'id',
            label_width: '200'
        },

        create: function (doc) {
            var el = doc.createElement('cmpunitprops');
            el.setAttribute('data-wb-tag', 'cmpUnitProps');
            el.setAttribute('name', '');
            el.setAttribute('unit', '');
            el.setAttribute('unitid_varname', 'id');
            el.setAttribute('label_width', '200');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-unitprops';
            if (el.getAttribute('visible') === 'false') wrap.style.display = 'none';
            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');

            var w = el.getAttribute('width');
            if (w) wrap.style.width = w;

            var unit = el.getAttribute('unit') || '';
            var unitid = el.getAttribute('unitid_varname') || 'id';
            var count = parseInt(el.getAttribute('unitprops_count'), 10);
            if (isNaN(count) || count < 0) count = 3; /* скелет: 3 свойства */

            /* Шапка с параметрами */
            var header = doc.createElement('div');
            header.className = 'd3-preview-unitprops-header';

            var icon = doc.createElement('span');
            icon.className = 'd3-preview-unitprops-icon';
            icon.textContent = '\u2699'; /* ⚙ */
            header.appendChild(icon);

            var title = doc.createElement('span');
            title.textContent = 'UnitProps';
            header.appendChild(title);

            if (unit) {
                var hint = doc.createElement('span');
                hint.className = 'd3-preview-unitprops-hint';
                hint.textContent = ' (' + unit + ' : ' + unitid + ')';
                header.appendChild(hint);
            }

            wrap.appendChild(header);

            /* Таблица свойств */
            var table = doc.createElement('table');
            table.className = 'd3-preview-unitprops-table';

            var cg = doc.createElement('colgroup');
            var c1 = doc.createElement('col');
            c1.style.width = (el.getAttribute('label_width') || '200') + 'px';
            var c2 = doc.createElement('col');
            cg.appendChild(c1);
            cg.appendChild(c2);
            table.appendChild(cg);

            var tbody = doc.createElement('tbody');

            if (count === 0) {
                var trEmpty = doc.createElement('tr');
                var tdEmpty = doc.createElement('td');
                tdEmpty.colSpan = 2;
                tdEmpty.className = 'd3-preview-unitprops-empty';
                tdEmpty.textContent = '(нет свойств — ctrl_hidden)';
                trEmpty.appendChild(tdEmpty);
                tbody.appendChild(trEmpty);
            } else {
                for (var i = 0; i < count; i++) {
                    var tr = doc.createElement('tr');

                    var tdCap = doc.createElement('td');
                    tdCap.className = 'd3-preview-unitprops-caption';
                    tdCap.textContent = 'Свойство ' + (i + 1) + ':';
                    tr.appendChild(tdCap);

                    var tdVal = doc.createElement('td');
                    tdVal.className = 'd3-preview-unitprops-value';

                    /* Разные типы контролов для наглядности */
                    if (i % 4 === 1) {
                        var chk = doc.createElement('label');
                        chk.className = 'd3-preview-unitprops-check';
                        var inp = doc.createElement('input');
                        inp.type = 'checkbox';
                        inp.disabled = true;
                        chk.appendChild(inp);
                        var sp = doc.createElement('span');
                        sp.textContent = 'Да';
                        chk.appendChild(sp);
                        tdVal.appendChild(chk);
                    } else if (i % 4 === 2) {
                        var combo = doc.createElement('div');
                        combo.className = 'd3-preview-unitprops-combo';
                        combo.textContent = '(выбрать)';
                        var arrow = doc.createElement('span');
                        arrow.className = 'd3-preview-unitprops-combo-arrow';
                        arrow.textContent = '\u25BE';
                        combo.appendChild(arrow);
                        tdVal.appendChild(combo);
                    } else {
                        var inp2 = doc.createElement('input');
                        inp2.type = 'text';
                        inp2.readOnly = true;
                        inp2.disabled = true;
                        inp2.placeholder = '\u2026';
                        tdVal.appendChild(inp2);
                    }

                    tr.appendChild(tdVal);
                    tbody.appendChild(tr);
                }
            }

            table.appendChild(tbody);
            wrap.appendChild(table);

            /* Бейдж со счётчиком */
            var badge = doc.createElement('div');
            badge.className = 'd3-preview-unitprops-badge';
            badge.textContent = 'unitprops: ' + count;
            wrap.appendChild(badge);

            return wrap;
        },

        /* ---------------- Properties ---------------- */
        properties: [
            /* --- HTML --- */
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },

            /* --- D3 Base --- */
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },

            /* --- UnitProps --- */
            { type: 'separator', caption: 'UnitProps' },
            { name: 'unit',           caption: 'Unit',            type: 'string',  attr: true },
            { name: 'subunit',        caption: 'SubUnit',         type: 'string',  attr: true },
            { name: 'unitid_varname', caption: 'UnitID Varname',  type: 'string',  attr: true },
            { name: 'activateoncreate', caption: 'Activate On Create', type: 'boolean', attr: true },
            { name: 'bind_action',    caption: 'Bind Action (names via ;)', type: 'string', attr: true },
            { name: 'label_width',    caption: 'Label Width',     type: 'string',  attr: true },
            { name: 'value_width',    caption: 'Value Width',     type: 'string',  attr: true },
            { name: 'repeatername',   caption: 'Repeater Name',   type: 'string',  attr: true },
            { name: 'parent_var',     caption: 'Parent Var',      type: 'string',  attr: true },
            { name: 'depend_control_name', caption: 'Depend Control', type: 'string', attr: true },
            { name: 'unitprops_count', caption: 'UnitProps Count (auto)', type: 'number', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onafter_refresh', caption: 'OnAfterRefresh', type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);