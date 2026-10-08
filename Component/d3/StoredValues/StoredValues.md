# cmpStoredValues

Составной контрол для сохранения и восстановления значений
параметров формы. Позволяет пользователю сохранять текущие
значения контролов под именем (caption), выбирать сохранённый
набор из выпадающего списка, помечать один из наборов как
«по умолчанию» и удалять ненужные записи.

В рантайме компонент разворачивается в целый блок: Expander с
ComboBox, CheckBox, кнопками «Сохранить»/«Удалить» и
`cmpDependences`. Плюс сервер автоматически генерирует DataSet
(`ds_svc_<name>`) и два Action-а (save / del) для работы с таблицей
`core.v_paramval_data`.

Клиентский `D3Api.StoredValuesCtrl` умеет:

- **`setParamVals(dom, item, name)`** — при выборе значения из
  ComboBox раскладывает сохранённые параметры по контролам формы;
- **`saveParamVals(dom, name, params)`** — собирает значения
  контролов и сохраняет через сгенерированный Action.

---

## Расположение

```
Component/d3/StoredValues/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `StoredValuesCtrl.inc` | class `StoredValues extends BaseCtrl` |
| `StoredValues.js` | `D3Api.StoredValuesCtrl` |
| `StoredValues.css` | (опционально — стили, если нужны) |

**Связанные таблицы в БД:**

- `core.v_paramval_data` — хранилище сохранённых значений. Поля:
  `id`, `caption`, `paramvals` (JSON), `is_default`, `entity_name`,
  `sysuser`, `lpuid`.

**Связанные функции БД:**

- `core.f_paramval_data8set(...)` — сохранение / обновление записи.
- `core.f_paramval_data8del(...)` — удаление записи.

---

## Тег и ID

- **XML-тег:** `cmpStoredValues`
- **Регистрация в IDE:** `id: 'd3.storedvalues'`
- **Категория:** D3
- **Вид в палитре:** `StoredValues`
- **Видимость:** видимый (рендерит разметку в canvas)
- **parentOnly:** не ограничен

---

## Разметка в рантайме

Серверный `StoredValues::Show()` собирает:

```html
<div cmptype="StoredValues">
  <cmpDataSet name="ds_svc_<name>">
    select d.id, d.caption, d.paramvals, d.is_default
      from core.v_paramval_data d
     where d.entity_name = :entity_name
       and d.sysuser      = :sysuser
       and d.lpuid        = :lpuid
     order by d.is_default desc, caption asc
    <cmpDataSetVar name="entity_name" srctype="const_server"
                   default="<entity_name>" get="g1"/>
    <cmpDataSetVar name="sysuser" srctype="session" src="sysuser" get="g2"/>
    <cmpDataSetVar name="lpuid"   srctype="session" src="lpu"     get="g3"/>
  </cmpDataSet>

  <cmpAction name="action_svc_<name>_save"
             action="core.f_paramval_data8set">
    <cmpActionVar name="pn_sysuser"    src="sysuser" srctype="session" get="g1"/>
    <cmpActionVar name="pn_lpuid"      src="lpu"     srctype="session" get="g2"/>
    <cmpActionVar name="ps_entity_name" srctype="const_server" default="<entity_name>"/>
    <cmpActionVar name="ps_caption"    src="svc_combobox_<name>:caption" srctype="ctrl" get="g4"/>
    <cmpActionVar name="ps_paramvals"  src="svc_var_paramval_<name>"     srctype="var"  get="g5"/>
    <cmpActionVar name="pn_is_default" src="svc_chk_<name>"              srctype="ctrl" get="g6"/>
  </cmpAction>

  <cmpAction name="action_svc_<name>_del"
             action="core.f_paramval_data8del">
    <cmpActionVar name="pn_id" src="svc_combobox_<name>" srctype="ctrl" get="g1"/>
  </cmpAction>

  <cmpExpander name="svc_exp_<name>" caption="Сохраненные значения">
    <cmpComboBox name="svc_combobox_<name>"
                 initIndex="0" anyvalue="true"
                 onchange="D3Api.StoredValuesCtrl.setParamVals(this,
                           getControlProperty(this,'item'),
                           '<name>')">
      <cmpComboItem dataset="ds_svc_<name>" repeat="0"
                    data="value:id;caption:caption"/>
    </cmpComboBox>

    <cmpCheckBox name="svc_chk_<name>" value="0"
                 valuechecked="1" valueunchecked="0"
                 hint="По-умолчанию"/>

    <cmpButton name="svc_button_<name>" caption="Сохранить"
               onclick="D3Api.StoredValuesCtrl.saveParamVals(this,
                        '<name>', '<params>')"/>

    <cmpButton name="svc_buttonx_<name>" icon="~Icon/x"
               onclick="executeAction('action_svc_<name>_del');"/>

    <cmpDependences required="svc_combobox_<name>:caption"
                    depend="svc_button_<name>"/>
  </cmpExpander>
</div>
```

Особенности:

- **Все id генерируются из `name`**: `svc_combobox_<name>`,
  `svc_chk_<name>`, `svc_exp_<name>`, `svc_button_<name>`,
  `svc_buttonx_<name>`, `ds_svc_<name>`,
  `action_svc_<name>_save`, `action_svc_<name>_del`,
  `svc_var_paramval_<name>`.
- **В IDE это не воспроизводится.** IDE отображает только «скелет» —
  Expander с ComboBox, CheckBox и кнопками. Всё остальное (DataSet,
  Actions, ComboItem) генерируется на сервере в момент парсинга
  формы.
- **`cmpDependences`** делает кнопку «Сохранить» недоступной, пока
  не выбран ComboBox (required=`svc_combobox_<name>:caption`).

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`

### D3 Base
- `name`, `enabled`, `visible`, `hint`, `width`

### StoredValues
- **`name`** — имя компонента. Из него генерируются все внутренние
  id. Обязательно (иначе будут коллизии при нескольких
  `StoredValues` без name).
- **`entity_name`** — имя сущности в `core.v_paramval_data`.
  Используется как фильтр в DataSet и как параметр в Action.
  Обязательно.
- **`params`** — `;`-разделённый список имён контролов, значения
  которых нужно сохранять. Если пусто — `saveParamVals` соберёт
  значения всех Edit / TextArea / ComboBox / DateEdit / CheckBox /
  RadioGroup формы.

### Events
Пусто.

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`. Впрочем,
стили почти не применяются — компонент после парсинга превращается
в Expander с контролами, и стили к ним не пробрасываются.

---

## Формат атрибутов

| Атрибут | Тип | Описание |
|---|---|---|
| `name` | string | Имя компонента. Часть всех сгенерированных id. Обязательно |
| `entity_name` | string | Имя сущности в `core.v_paramval_data`. Обязательно |
| `params` | string | `;`-список имён контролов для сохранения. Если пусто — все контролы формы |

---

## Логика работы

### Сервер

`StoredValues::__construct`:

1. Устанавливает `CmpType = 'StoredValues'`.
2. Читает `entity_name`, `name`, `params` из атрибутов.

`StoredValues::SetInnerText($text)`:

1. Накапливает текст: `$this->text .= trim($text)`.
   (В текущей версии не используется — сервер сам генерирует
   содержимое через `FormParser`.)

`StoredValues::Show()`:

1. Проверяет `getDAMParam()` — если это DAM-запрос, выходит.
2. Формирует `<cmpDataSet>` — SQL-запрос к `core.v_paramval_data`.
3. Формирует `<cmpAction action_svc_<name>_save>` — вызов
   `core.f_paramval_data8set(...)`.
4. Формирует `<cmpAction action_svc_<name>_del>` — вызов
   `core.f_paramval_data8del(...)`.
5. Формирует `<cmpExpander svc_exp_<name>>` с ComboBox, CheckBox,
   кнопками и Dependences.
6. Парсит всё это через `FormParser`.
7. Передаёт готовую разметку родителю через `SetInnerText`.

На каждом шаге при DAM-запросе (для оптимизации) выходит
досрочно, если `ds_search` соответствует имени сгенерированного
компонента.

### Клиент

`D3Api.StoredValuesCtrl.setParamVals(dom, item, name)`:

1. **Если это не user event** (программное изменение, а не клик
   пользователя):
    - если `item.clone.data.is_default === '1'` — ставит галочку
      `svc_exp_<name>`;
    - иначе — сбрасывает ComboBox (`svc_combobox_<name>`) и выходит.
2. Ставит значение чекбокса `svc_chk_<name>` в
   `item.clone.data.is_default`.
3. Читает `item.clone.data.paramvals` (JSON вида
   `{pv: [{p: 'field1', v: 'value1'}, {p: 'field2', v: 'value2'}]}`),
   парсит и для каждого `p` вызывает `D3Form.setValue(p, v)`, если
   контрол существует.

**`D3Api.StoredValuesCtrl.saveParamVals(dom, name, params)`**:

1. Если `params` задан — разбирает через `;`, строит селектор
   `[name="ctrl1"],[name="ctrl2"]…`.
2. Иначе — строит селектор по всем контролам форм-редактирования:
   `[name][cmptype="Edit"], [name][cmptype="TextArea"],
   [name][cmptype="ComboBox"], [name][cmptype="DateEdit"],
   [name][cmptype="CheckBox"], [name][cmptype="RadioGroup"]`.
3. Обходит найденные контролы, для каждого читает `name` и `value`.
4. Пропускает `svc_combobox_<name>` и `svc_chk_<name>` — их
   значения не должны попасть в сохраняемый набор.
5. Формирует массив `pva = [{p: name, v: value}, …]`.
6. Кладёт его в переменную формы `svc_var_paramval_<name>` как JSON.
7. Вызывает `executeAction('action_svc_<name>_save')` — сохранение
   на сервере.
8. После успешного выполнения обновляет DataSet
   `ds_svc_<name>` — список сохранённых значений.

---

## Примеры использования

### 1. Сохранение всех параметров формы

```xml
<cmpStoredValues name="allFilters" entity_name="my_form_filters"/>
```

Сохранение и восстановление значений всех Edit, TextArea, ComboBox,
DateEdit, CheckBox, RadioGroup формы.

### 2. Сохранение только указанных контролов

```xml
<cmpStoredValues name="rangeFilters"
                 entity_name="range_filters"
                 params="beginDate;endDate;amount"/>
```

Будут сохранены только значения `beginDate`, `endDate` и `amount`.

### 3. Несколько StoredValues на одной форме

```xml
<cmpStoredValues name="filters1"
                 entity_name="form_a_filters"
                 params="code;name"/>
<cmpStoredValues name="filters2"
                 entity_name="form_b_filters"
                 params="beginDate;endDate"/>
```

Разные `name` и `entity_name` — два независимых хранилища. Если
бы `name` не были заданы явно, оба развернулись бы в
`svc_combobox_`, `ds_svc_`, `action_svc__save` — и возникли бы
коллизии.

### 4. Раскладка сохранённых значений

При выборе в ComboBox значения (например «Мой фильтр»):

```js
D3Api.StoredValuesCtrl.setParamVals(combo, combo.D3Store.item, 'filters1');
```

Из `item.clone.data.paramvals` (JSON `{pv: [{p: 'code', v: 'A'}, {p: 'name', v: 'Alpha'}]}`)
все пары разложатся по контролам формы. Значения `code` и `name`
установятся автоматически.

### 5. Сохранение текущих значений

Пользователь нажимает «Сохранить». Клиент вызывает:

```js
D3Api.StoredValuesCtrl.saveParamVals(button, 'filters1', 'code;name');
```

Собирает значения `code` и `name`, формирует JSON
`{pv: [{p: 'code', v: 'A'}, {p: 'name', v: 'Alpha'}]}`, кладёт его
в `svc_var_paramval_filters1` и вызывает
`action_svc_filters1_save`. Сервер записывает в
`core.v_paramval_data` новую строку с `entity_name`, `caption`
(из ComboBox), `paramvals` и `is_default` (из CheckBox).

### 6. Сохранение «по умолчанию»

Если при сохранении CheckBox `svc_chk_<name>` установлен в `1`,
запись помечается как default. SQL-запрос DataSet-а сортирует
`order by d.is_default desc, caption asc`, поэтому default-запись
оказывается вверху списка.

### 7. Автоматическая подстановка default при открытии формы

```js
D3Api.StoredValuesCtrl.setParamVals(combo, undefined, 'filters1');
```

Серверная логика `setParamVals`:
- если `item.clone.data.is_default === '1'` — выставляется галочка
  `svc_exp_<name>`;
- иначе — ComboBox сбрасывается.

Это используется в сценариях автозагрузки: при открытии формы
вызывается `setParamVals` без item — если есть default-запись,
она применится.

### 8. Удаление сохранённого значения

Клик по кнопке «✕» → `executeAction('action_svc_<name>_del')` →
серверный вызов `core.f_paramval_data8del(id)`.

### 9. Программная работа

```js
var sv = getControl('allFilters');

// Сохранить текущие значения
D3Api.StoredValuesCtrl.saveParamVals(sv, 'allFilters', '');

// Применить сохранённое значение
var combo = getControl('svc_combobox_allFilters');
D3Api.StoredValuesCtrl.setParamVals(combo, combo.D3Store.item, 'allFilters');

// Удалить текущую запись
executeAction('action_svc_allFilters_del');
```

---

## Поведение в IDE

Компонент **видимый**. В canvas отображается статичный «скелет»:

```
┌──────────────────────────────────────────────┐
│ Сохраненные значения                     ▸  │
├──────────────────────────────────────────────┤
│ ┌───────────────┬──┐  ☐ По-умолчанию  [Сохранить] [✕] │
│ │ (выбрать)     │▾ │                          │
│ └───────────────┴──┘                          │
└──────────────────────────────────────────────┘
                                          stored values
```

Реальные данные (DataSet, Actions, ComboItem) в canvas не
воспроизводятся — только визуальная структура Expander-а с
элементами управления.

### В дереве

```
cmpStoredValues name="allFilters" entity_name="my_form_filters" params=""
```

Одна строка — детей нет (в IDE).

### В инспекторе

- HTML attributes: `id`, `class`, `style`
- D3 Base: `name`, `enabled`, `visible`, `hint`, `width`
- StoredValues: `name`, `entity_name`, `params`
- Events: пусто
- Styles: полный набор CSS-свойств

### Ограничения

- **Собственный preview — только «скелет».** Реальная разметка
  формируется сервером в момент парсинга формы.
- **`DataSet`, `Action`, `ComboItem` не видны в дереве** — они
  генерируются на сервере и появляются уже после парсинга `.frm`.
- **Стили не применяются к финальному DOM** — они попадают в XML,
  но сервер их игнорирует.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 controls**:

```html
<script src="Component/d3/StoredValues/index.js"></script>
```

### Правки в `ide/canvas.js`

**`CMP_TAGS`:**

```js
'cmpstoredvalues': 'cmpStoredValues',
```

`_injectIdeStyle` не трогаем — компонент видим.

`XML_SELF_CLOSE` не трогаем — контейнерный.

`CDATA_CONTAINERS` не трогаем — не содержит CDATA.

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmpstoredvalues': 'cmpStoredValues',
```

### `PARENT_ONLY`

Не трогаем — `StoredValues` можно вставлять в любое место формы.

---

## Известные ограничения

1. **`name` обязателен при нескольких экземплярах.** Все
   сгенерированные id (`svc_combobox_<name>`, `ds_svc_<name>`,
   `action_svc_<name>_save`, …) зависят от `name`. Если задать два
   `StoredValues` без `name` — получите коллизии.

2. **`entity_name` обязателен.** Используется как фильтр в SQL и
   как параметр Action. Без него DataSet вернёт пустой список.

3. **`params` — `;`-разделённая строка, не массив.** Пример:
   `params="code;name;amount"`. Если список длинный, удобнее
   `type: 'code'` в инспекторе (но тогда в XML тоже строкой).

4. **Дети игнорируются.** В серверном `Show()` есть
   `$this->text = ''` перед парсингом сгенерированного
   содержимого. Если вставить что-то внутрь
   `<cmpStoredValues>`, оно не попадёт в рантайм.

5. **Значения `svc_combobox_<name>` и `svc_chk_<name>` не
   сохраняются.** В `saveParamVals` есть явная проверка
   `ctrl_name !== 'svc_combobox_'+name && ctrl_name !== 'svc_chk_'+name`.
   Это защита от рекурсивного сохранения собственного
   ComboBox-а.

6. **`params` влияет только на сохранение, не на восстановление.**
   При `setParamVals` раскладываются все пары из `paramvals`,
   которые были сохранены. То есть если при сохранении был задан
   `params="code;name"`, в JSON попадут только `code` и `name`.
   Остальные контролы не будут затронуты.

7. **`is_default` — только одна запись на entity.** Сервер
   сортирует `order by d.is_default desc` — все default-записи
   оказываются вверху. Реальная проверка уникальности — на
   уровне триггера / серверного кода `f_paramval_data8set`.

8. **`params` — часть selector-а** в `saveParamVals`. Если
   контрол не найден по имени — он просто пропускается. Ошибки
   не будет.

9. **`cmpDependences required="svc_combobox_<name>:caption"`** —
   кнопка «Сохранить» блокируется, пока ComboBox пуст. Это
   предотвращает сохранение без caption-а.

10. **`cmpButton svc_buttonx_<name>`** — иконка `~Icon/x`
    (серверный путь). В IDE это не воспроизводится (в превью
    используется CSS-крестик ✕).

11. **DAM-запросы.** Сервер обрабатывает `getDAMParam()` — при
    DAM-запросе каждый сгенерированный компонент (`ds_svc_<name>`,
    `action_svc_<name>_save`, `action_svc_<name>_del`, сам
    Expander) может быть запрошен по отдельности. Это нужно для
    асинхронной загрузки частей формы.

12. **Клиентский контрол зарегистрирован как
    `D3Api.controlsApi['StoredValues']`** — но не имеет
    специфичного API. Все методы — прямые вызовы из контролов
    (`svc_button_<name>`, `svc_combobox_<name>`) или программно
    через `D3Api.StoredValuesCtrl`.

13. **Превью в IDE не отражает ComboItem.** ComboItem генерируется
    на сервере, в IDE его нет. В canvas ComboBox отображается
    как пустой с placeholder-ом `(выбрать)`.

14. **Кнопка «✕» — не Button, а Button с иконкой.** В серверном
    коде — `<cmpButton name="svc_buttonx_<name>" icon="~Icon/x" …
    onclick="executeAction('action_svc_<name>_del');"/>`. В
    превью IDE рисуется как CSS-крестик.

15. **Экспорт значений.** Клиентский `saveParamVals` использует
    `D3Api.JSONstringify({pv: pva})`. Если в форме есть контролы
    с несериализуемыми значениями (объекты, файлы) — они могут
    попасть в JSON некорректно. `params` позволяет ограничить
    набор сохраняемых контролов простыми полями (Edit, DateEdit
    и т. п.).

---

## Чек-лист добавления нового экземпляра

1. В палитре выбрать **D3 → StoredValues**.
2. В инспекторе задать:
    - `name` — уникальное имя (например `formFilters`);
    - `entity_name` — имя сущности в `core.v_paramval_data`
      (например `my_form_filters`);
    - `params` — `;`-список имён контролов для сохранения
      (опционально; если пусто — сохраняются все Edit/TextArea/
      ComboBox/DateEdit/CheckBox/RadioGroup).
3. При необходимости задать `width`, `visible`, `enabled`.
4. Проверить в canvas: должен отобразиться Expander с ComboBox,
   CheckBox и кнопками.
5. Проверить в дереве: `cmpStoredValues` — одна строка без детей.
6. При сохранении убедиться, что атрибуты `name`, `entity_name`,
   `params` попали в XML.
7. В рантайме:
    - ComboBox заполнится сохранёнными значениями из
      `core.v_paramval_data` (по `entity_name`);
    - «Сохранить» заблокирована, пока не выбран ComboBox;
    - клик по «Сохранить» записывает текущие значения;
    - клик по «✕» удаляет запись;
    - выбор ComboBox раскладывает сохранённые значения по
      контролам формы.

---

## См. также

- `Component/d3/DataSet/README.md` — DataSet, используемый внутри
- `Component/d3/Action/README.md` — Action, используемый внутри
- `Component/d3/Expander/README.md` — Expander-контейнер
- `Component/d3/ComboBox/README.md` — ComboBox выбора значений
- `Component/d3/CheckBox/README.md` — CheckBox «по-умолчанию»
- `Component/d3/Dependences/README.md` — Dependences для блокировки кнопки
- `StoredValuesCtrl.inc` — серверный код
- `StoredValues.js` — клиентский `D3Api.StoredValuesCtrl`
