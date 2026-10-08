# cmpUnitProps

Таблица дополнительных свойств раздела. В рантайме сервер генерирует
таблицу со значениями свойств для текущей записи раздела — по одной
строке на свойство. Каждая строка: подпись свойства и контрол
редактирования (Edit / DateEdit / UnitEdit / CheckBox — в зависимости
от `prp_generation_type`).

Компонент невидим в рантайме как самостоятельный DOM-элемент: сервер
заменяет тег на `<table class="ctrl_unitprops">` со всеми контролами
внутри. Значения хранятся в сгенерированном `cmpDataSet`
(`DS_UnitProps_<unit><name>`), сохранение выполняется через
`cmpAction` (`ACT_<name>`), если не задан `bind_action`.

Обязательные свойства оборачиваются в `cmpDependences`, числовые с
ограничением длины — в `cmpMask`.

---

## Расположение

```
Component/d3/UnitProps/
    index.js               ← регистрация D3.register
    README.md              ← этот файл
    images/icon.png        ← иконка палитры (14×14)
    css/preview.css        ← стили превью (скелет таблицы)
    js/                    ← (пусто)
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `UnitPropsCtrl.inc` | class `UnitProps extends BaseCtrl` — рендер таблицы |
| `UnitProps.js` | `D3Api.UnitPropCtrl` — клиентский контрол |
| `UnitProps.css` | Стили `.ctrl_unitprops` |

---

## Тег и ID

- **XML-тег:** `cmpUnitProps`
- **Регистрация в IDE:** `id: 'd3.unitprops'`
- **Категория:** D3
- **Вид в палитре:** `UnitProps`
- **Видимость:** видимый (в canvas отображается «скелет» таблицы)
- **Самозакрывающийся:** нет (в рантайме разворачивается в `<table>`)
- **Содержит CDATA:** нет
- **Дочерние компоненты:** нет (все контролы генерируются сервером)

---

## Разметка в рантайме

Серверный `UnitProps::Show()` читает из БД:

- `core.v_unitprop_links` — привязки свойств к разделу;
- `core.v_unitprops` — описания свойств;
- `core.v_unitprop_values` — значения свойств для записи;
- `core.v_composition` — композиции для `UnitEdit`-ов.

И генерирует:

```html
<cmpDataSet name="DS_UnitProps_<unit><name>"> … </cmpDataSet>

<cmpAction name="ACT_<name>"> … </cmpAction>

<table class="ctrl_unitprops" unitprops_count="N">
  <colgroup>
    <col width="200"/>
    <col/>
  </colgroup>
  <tbody>
    <tr>
      <td>Наименование свойства:</td>
      <td><cmpEdit …/></td>
    </tr>
    …
  </tbody>
</table>
```

Тип контрола в строке определяется `prp_generation_type`:

| `prp_generation_type` | Контрол |
|---|---|
| `0` | `cmpEdit` (или `cmpDateEdit` по `prp_data_type`) |
| `1` | `cmpUnitEdit` (unit + composition) |
| `2` | `cmpUnitEdit` (extradict) |
| `3` | `cmpCheckBox` |

Дополнительно:

- **`cmpDependences`** — если у свойства `requere=1`. Блокирует
  указанный `depend_control_name` до заполнения обязательных полей.
- **`cmpMask`** — для числовых свойств с ограничением длины.

Если атрибут `bind_action` **не задан**, сервер дополнительно
генерирует `<cmpAction name="ACT_<name>">` — Action сохранения значений.

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`

### D3 Base
- `name` — имя контрола (используется в `ACT_<name>`)
- `enabled`, `visible`, `hint`, `width`

### UnitProps
- **`unit`** — код раздела (обязателен). Определяет, из какого
  раздела брать свойства
- **`subunit`** — код подраздела (опционально)
- **`unitid_varname`** — имя переменной с id записи
  (по умолчанию `'id'`)
- **`activateoncreate`** — `'true'` — активировать `DataSet` при
  создании
- **`bind_action`** — `';'`-список имён Action-ов, к которым
  привязываются контролы (вместо генерации `ACT_<name>`)
- **`label_width`** — ширина колонки подписи (по умолчанию `'200'`)
- **`value_width`** — ширина колонки значения
- **`repeatername`** — имя репитера (для `UnitProps` внутри `Grid`)
- **`parent_var`** — переменная-родитель для `UnitEdit`-ов
- **`depend_control_name`** — контрол, который блокируется
  `Dependences`
- **`unitprops_count`** — счётчик свойств (auto). В IDE отображается
  как число строк в «скелете»

### Events
- `onafter_refresh` — вызывается клиентским контролом после
  обновления `DataSet` со значениями свойств

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`.

---

## Примеры использования

### 1. Простая таблица свойств раздела

```xml
<cmpUnitProps name="UP_HH" unit="HH" unitid_varname="id"/>
```

Сервер найдёт все свойства раздела `HH`, привязанные через
`v_unitprop_links`, и нарисует таблицу.

### 2. Свойства подраздела

```xml
<cmpUnitProps name="UP_HH_DETAIL"
              unit="HH"
              subunit="HH_DETAIL"
              unitid_varname="detail_id"/>
```

### 3. Без генерации Action (привязка к внешнему Action-у)

```xml
<cmpUnitProps name="UP_HH" unit="HH"
              bind_action="ACT_SAVE_FORM;ACT_SAVE_HH"/>
```

Сервер **не** сгенерирует `ACT_UP_HH`, а привяжет контролы к
указанным Action-ам.

### 4. С блокировкой кнопки сохранения до заполнения обязательных

```xml
<cmpUnitProps name="UP_HH" unit="HH"
              depend_control_name="btnSave"/>
```

Если хотя бы одно свойство с `requere=1` не заполнено — `btnSave`
блокируется через `cmpDependences`.

### 5. UnitProps внутри Grid (репитера)

```xml
<cmpGrid name="GRID_HH" repeatername="repHH">
  <cmpColumn …/>
  <cmpColumn …>
    <cmpUnitProps name="UP_HH" unit="HH"
                  repeatername="repHH"
                  parent_var="id"/>
  </cmpColumn>
</cmpGrid>
```

`repeatername` указывает, что `UnitProps` рендерится внутри строки
репитера.

### 6. Кастомные ширины колонок

```xml
<cmpUnitProps name="UP_HH" unit="HH"
              label_width="240"
              value_width="360"/>
```

### 7. Активация DataSet при создании

```xml
<cmpUnitProps name="UP_HH" unit="HH"
              activateoncreate="true"/>
```

### 8. Обработка после обновления

```xml
<cmpUnitProps name="UP_HH" unit="HH"
              onafter_refresh="Form.onPropsRefresh(DS_UnitProps_HHUP_HH);"/>
```

```js
Form.onPropsRefresh = function(ds) {
    var prop = ds.getProp('PRP_CODE');
    if (prop && prop.value === 'X') {
        // скрыть какой-то контрол
    }
};
```

---

## Логика работы (серверная)

### Рендер (`UnitProps::Show()`)

1. По `unit` + `subunit` находит привязки свойств в
   `core.v_unitprop_links`.
2. Для каждой привязки читает описание из `core.v_unitprops`.
3. Читает значения для текущей записи (`unitid_varname`) из
   `core.v_unitprop_values`.
4. Строит `<cmpDataSet name="DS_UnitProps_<unit><name>">` со
   значениями.
5. Для каждого свойства — по `prp_generation_type` создаёт контрол
   и подставляет в строку таблицы.
6. Если у свойства `requere=1` — оборачивает в `cmpDependences`
   с `depend_control_name`.
7. Если числовое с ограничением длины — оборачивает в `cmpMask`.
8. Если `bind_action` не задан — генерирует
   `<cmpAction name="ACT_<name>">` с логикой сохранения.
9. Отдаёт `<table class="ctrl_unitprops" unitprops_count="N">`.

### Сохранение

`cmpAction name="ACT_<name>"` (если сгенерирован) собирает значения
со всех контролов и пишет их в `core.unitprop_values`. Если задан
`bind_action` — сохранение делегируется указанным Action-ам.

---

## Поведение в IDE

Компонент **видимый**. В canvas отображается «скелет» таблицы
свойств:

```
┌──────────────────────────────────────┐
│ ⚙ UnitProps (HH : id)                │
├──────────────────────────────────────┤
│ Свойство 1:      [ …             ]   │
│ Свойство 2:      [ ] Да              │
│ Свойство 3:      ( выбрать )    ▾    │
│                                      │
│                        unitprops: 3  │
└──────────────────────────────────────┘
```

- Число строк = `unitprops_count` (по умолчанию `3`, если не задан).
- Типы контролов чередуются (`i % 4`):
    - `0` — текстовое поле (Edit);
    - `1` — чекбокс (CheckBox);
    - `2` — комбобокс (UnitEdit);
    - `3` — текстовое поле (Edit).
- Реальные наименования свойств неизвестны IDE — показываются
  placeholder-подписи `«Свойство N:»`.
- При `unitprops_count="0"` выводится `(нет свойств — ctrl_hidden)`.

### В дереве

```
cmpUnitProps name="UP_HH" unit="HH"
  cmpUnitProps subunit="HH_DETAIL" unit="HH"
```

Дочерних компонентов нет — всё генерирует сервер.

### В инспекторе

Доступны все атрибуты из групп **HTML attributes**, **D3 Base**,
**UnitProps**; вкладка **Events** содержит `onafter_refresh`;
вкладка **Styles** — стандартный набор.

### Ограничения IDE-превью

- **Реальные свойства не читаются** — IDE не обращается к БД.
  Скелет статичен, число строк задаётся `unitprops_count`.
- **Реальные контролы не инстанцируются** — рисуются упрощённые
  placeholder-ы (`input[readonly]`, `checkbox[disabled]`,
  `div.combo`).
- **`cmpDataSet` / `cmpAction` / `cmpDependences` / `cmpMask`** не
  показываются в дереве и в canvas — они генерируются сервером в
  рантайме и в IDE-модели не создаются.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 form-контейнеры** (или рядом с `TextArea`):

```html
<script src="Component/d3/UnitProps/index.js"></script>
```

Порядок не критичен — у компонента нет родителя/детей.

### Правки в `ide/canvas.js`

**`CMP_TAGS`:**

```js
'cmpunitprops': 'cmpUnitProps',
```

**`XML_SELF_CLOSE`:** не трогаем — тег не самозакрывающийся
(в рантайме разворачивается в `<table>`).

**`_injectIdeStyle`:** не трогаем — компонент видимый.

**`CDATA_CONTAINERS`:** не трогаем.

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmpunitprops': 'cmpUnitProps',
```

### Правки в `ide/panels.js`

**`PARENT_ONLY`:** не требуется — у компонента нет ограничения на
родителя.

---

## Известные ограничения

1. **Скелет без данных.** IDE не может прочитать свойства раздела —
   нет доступа к БД. Отображается фиксированное число placeholder-строк.

2. **`unitprops_count` — только для IDE.** В рантайме это значение
   сервер вычисляет сам и записывает в атрибут
   `<table unitprops_count="N">`. В XML-модели это опциональный
   атрибут, влияющий только на превью.

3. **Контролы свойств не редактируются напрямую.** Чтобы изменить
   свойство (тип, обязательность, порядок) — правят привязки в
   `v_unitprop_links` и описания в `v_unitprops` через отдельный
   интерфейс. В IDE-инспекторе доступны только параметры самого
   контейнера `cmpUnitProps`.

4. **`bind_action` — `';'`-список.** Если указан, сервер не создаёт
   `ACT_<name>`. Пользователь сам отвечает за то, чтобы указанные
   Action-ы существовали и умели сохранять значения.

5. **`depend_control_name`** — блокируется через `cmpDependences`.
   Если контрол с таким именем не найден, блокировка не сработает
   (тихо).

6. **`repeatername`** — обязателен для корректной работы внутри
   `Grid`. Без него `UnitProps` внутри репитера может отрисоваться
   некорректно (одна строка на весь грид).

7. **`parent_var`** — используется `UnitEdit`-ами для получения
   родительской записи. Если не задан, `UnitEdit` может не найти
   родителя (зависит от серверной логики).

8. **`onafter_refresh`** — событие клиентского контрола
   `D3Api.UnitPropCtrl`, не серверное. На сервере не обрабатывается.

9. **Отсутствие preview в рантайме.** В IDE рендерится только
   «скелет»; реальная разметка `<table class="ctrl_unitprops">`
   появляется лишь при серверном рендере.

10. **CSS-класс `.ctrl_unitprops`** применяется сервером; в
    `preview.css` используются собственные классы
    (`d3-preview-unitprops*`), чтобы не конфликтовать с рантайм-стилями.

---

## Чек-лист добавления нового экземпляра

1. В палитре выбрать **D3 → UnitProps**.
2. В инспекторе задать:
    - `name` — имя контрола (используется в `ACT_<name>`);
    - `unit` — код раздела (обязателен);
    - `subunit` — если свойства принадлежат подразделу;
    - `unitid_varname` — имя переменной с id записи (по умолчанию
      `id`);
    - `label_width`, `value_width` — ширины колонок;
    - `bind_action` — если сохранение делегируется внешним Action-ам;
    - `depend_control_name` — контрол для блокировки обязательными
      свойствами;
    - `repeatername` + `parent_var` — если внутри `Grid`;
    - `activateoncreate` — если `DataSet` нужно активировать при
      создании;
    - `unitprops_count` — число строк в скелете (только для IDE).
3. При необходимости — задать `onafter_refresh`.
4. Проверить в дереве: узел `cmpUnitProps name="…" unit="…"`.
5. Проверить в canvas: таблица-скелет с правильным числом строк.
6. Убедиться, что в БД есть привязки для указанного `unit` /
   `subunit` (иначе сервер нарисует пустую таблицу).

---

## См. также

- `Component/d3/UnitEdit/README.md` — контрол, используемый для
  свойств типа `1` и `2` (`prp_generation_type`)
- `Component/d3/Dependences/README.md` — обёртка обязательных
  свойств (`requere=1`)
- `Component/d3/Mask/README.md` — маска для числовых свойств
- `Component/d3/DataSet/README.md` — `DS_UnitProps_<unit><name>`
- `Component/d3/Action/README.md` — `ACT_<name>` при сохранении
- `UnitPropsCtrl.inc` — серверный класс `UnitProps`
- `UnitProps.js` — клиентский `D3Api.UnitPropCtrl`
- `UnitProps.css` — стили `.ctrl_unitprops`
- `Инструкция по созданию компонетов.md` — общая архитектура
  D3-компонентов