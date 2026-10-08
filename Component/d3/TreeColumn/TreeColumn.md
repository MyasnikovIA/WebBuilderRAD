# cmpTreeColumn

Колонка иерархического Grid (`cmpTree`). В рантайме не рендерит
собственной разметки — `Show()` пушит данные в родительский `Tree`:

- `<col>` в `col_group` (описание ширины);
- `<td class="column_data">` в `columns[]` (ячейка данных);
- `<td class="column_filter">` в `filters[]` (ячейка фильтра);
- заголовок в `columns_caption[]`;
- `<cmpSortItem>` (при заданном `sort`).

Особенность первой колонки: сервер добавляет в неё `<div
class="btnOC">` — кнопку раскрытия/сворачивания узла. Только первая
колонка получает класс `firstnode` и кнопку `btnOC`.

`TreeColumn` поддерживает **colspan** (`colspanfield`) — если в
строке данных значение поля `> 1`, ячейка растягивается на
несколько колонок.

Без родителя `Tree` не работает: при попытке рендера вне `Tree`
`Show()` выходит молча.

---

## Расположение

```
Component/d3/TreeColumn/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `TreeCtrl.inc` | class `TreeColumn extends BaseCtrl` |
| `Tree.js` | клиентская логика в `D3Api.TreeCtrl` |
| `Tree.css` | стили `.column_caption`, `.column_data`, `.column_filter`, `.firstnode`, `.btnOC` |

---

## Тег и ID

- **XML-тег:** `cmpTreeColumn`
- **Регистрация в IDE:** `id: 'd3.treecolumn'`
- **Категория:** D3
- **Вид в палитре:** `TreeColumn`
- **Видимость:** видимый (рендерится родителем `Tree`)
- **parentOnly:** `cmptree` — можно вставить только внутрь `Tree`

---

## Разметка в рантайме

Собственной разметки `TreeColumn` не генерирует. Все части
вставляются в родительский `Tree`:

### `<col>` в colgroup

```html
<col width="200" fcol="c1" index="1"
     cont="name" column_name="name"/>
```

### Заголовок колонки

```html
<td class="column_caption"
    cont="name" index="1" column_name="name">
  <div style="position: relative">
    <table class="table_caption">
      <tr>
        <td class="icn"><cmpSortItem field="name" …/></td>
        <td class="caption_sort" title="">
          Наименование
        </td>
        <td class="icn">
          <div class="filter_icon" fhead_uid="f1"
               onclick="D3Api.TreeCtrl.toggleFilter(this);"></div>
        </td>
      </tr>
    </table>
    <div onmousedown="D3Api.TreeCtrl.columnSize(event)"
         class="grid__column-size"></div>
  </div>
</td>
```

### Ячейка данных

**Первая колонка (`index === 0`)** — с кнопкой раскрытия:

```html
<td class="column_data firstnode" style="…"
    cont="name" index="0" column_name="name">
  <div cmptype="Base" title="Развернуть" class="btnOC"
       name="<tree_name>_btnOC"
       onmousedown="D3Api.setEvent(event);
                    D3Api.TreeCtrl.toggleNode(this);">
  </div>
  <cmpLabel data="caption:name"/>
</td>
```

**Остальные колонки:**

```html
<td class="column_data" style="…"
    cont="code" index="1" column_name="code">
  <cmpLabel data="caption:code"/>
</td>
```

### Ячейка фильтра (если `filter` задан)

```html
<td class="column_filter" cont="name" index="1" column_name="name">
  <cmpFilterItem field="name" filterkind="text"
                 onkeypress="D3Api.TreeCtrl.filterKeyPress(this)"
                 fdata_uid="f1"/>
</td>
```

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`, `hint`

### D3 Base
- `name` — имя контрола (по умолчанию берётся `field`).

### Column
- **`field`** — имя поля DataSet (обязательное).
- **`caption`** — заголовок колонки.
- **`width`** — ширина колонки.
- **`align`** — `left | center | right`.
- **`profile_hidden`** — `true` — скрыть по умолчанию в профиле.

### Sort
- **`sort`** — поле сортировки (включает сортировку).
- **`sortorder`** — `asc` / `desc` — начальный порядок.

### Filter
- **`filter`** — поле фильтра.
- **`filterkind`** — тип фильтра.
- **`upper`** — `true` — учитывать регистр при LIKE.
- **`condition`** — `eq | neq | gt | lt | gteq | lteq | like | none`.
- **`like`** — `left | right | both`.
- **`not_append_ds`** — не добавлять фильтр к DataSet.

### Filter (units / combo)
- `funit`, `fmethod`, `fcomposition`, `fbeforeopen` — параметры
  справочника.
- `fcontent`, `fdataset`, `fdata`, `fdefault` — параметры combo.

### Other
- **`data`** — data-атрибут Label (`value:…;caption:…`).
- **`format`** — форматирование значения (через Label `onformat`).
- **`excelfield`** — имя поля при выгрузке.
- **`colspanfield`** — если задано, ячейка может объединять
  несколько колонок.
- **`keep`** — не удалять колонку при применении профиля.
- **`fixed`** — `true` — не показывать resize-handle.

### Events
- `onclick` — клик по ячейке (навешивается на Label).

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`.

---

## Формат атрибутов

| Атрибут | Тип | Описание |
|---|---|---|
| `field` | string | Имя поля DataSet. Обязательное |
| `name` | string | Имя контрола. Если пусто — берётся из `field` |
| `caption` | string | Заголовок |
| `width` | string | Ширина |
| `align` | enum | `left` / `center` / `right` |
| `profile_hidden` | boolean | `true` — скрыть по умолчанию в профиле |
| `sort` | string | Поле сортировки |
| `sortorder` | enum | `asc` / `desc` |
| `filter` | string | Поле фильтра |
| `filterkind` | enum | `text`, `numb`, `date`, `combo`, `unitedit`, `unitmulti`, `cmb_unit`, `perioddate`, `periodnumb`, `periodtime`, `speriodnum` |
| `upper` | boolean | `true` — учитывать регистр в LIKE |
| `condition` | enum | `eq`, `neq`, `gt`, `lt`, `gteq`, `lteq`, `like`, `none` |
| `like` | enum | `left`, `right`, `both` |
| `not_append_ds` | boolean | Не добавлять фильтр к DataSet |
| `funit` | string | Имя справочника |
| `fmethod` | string | Метод справочника |
| `fcomposition` | string | Композиция справочника |
| `fbeforeopen` | string | JS-handler перед раскрытием |
| `fcontent` | string | Список элементов combo (`1\|Да;0\|Нет`) |
| `fdataset` | string | DataSet для combo |
| `fdata` | string | Поля DataSet для combo |
| `fdefault` | string | Значение по умолчанию |
| `data` | string | data-атрибут Label |
| `format` | string | Формат значения (JSON-настройки Label) |
| `excelfield` | string | Имя поля при выгрузке |
| `colspanfield` | string | Поле, значение которого определяет colspan |
| `keep` | boolean | Не удалять при применении профиля |
| `fixed` | boolean | Скрыть resize-handle |
| `hint` | string | Tooltip колонки |

---

## Логика работы

### Сервер (`TreeColumn::__construct`)

1. Проверяет родителя (`Tree`).
2. Парсит `field`, `data`, `keep`, `onclick`, `caption`.
3. Читает `sort`, `sortorder`.
4. Читает параметры фильтра (`filter`, `upper`, `condition`,
   `like`, `filterkind`, `funit`, `fmethod`, `fcomposition`,
   `fcontent`, `fdataset`, `fdata`, `fdefault`, `fbeforeopen`).
5. Читает `format`, `colspanfield`, `align`, `width`,
   `excelfield`, `colhint` (`hint`), `fixed`, `not_append_ds`.
6. Вычисляет `index = count($parent->columns_caption)`.
7. Добавляет `<col>` в `$parent->col_group`.
8. Применяет `align` к `ctrlstyle`.

### Сервер (`TreeColumn::Show`)

1. Проверяет `$parent->CmpType == 'Tree'`. Если нет — выходит.
2. Если `$this->text` пусто — создаёт `<cmpLabel>` с `data`.
   Для первой колонки (`index == 0`) при `selectlist` — добавляет
   `<cmpSelectListItem>`.
3. Пушит ячейку в `$parent->columns[]`:
    - **Первая колонка** получает `<div class="btnOC">` + опционально
      `line-clamp` для `max_lines`.
    - **Остальные** — просто `<cmpLabel>`.
4. Если `usefilter` — формирует `<cmpFilterItem>` и пушит
   в `$parent->filters[]`.
5. Если `usesort` — формирует `<cmpSortItem>` и ставит
   `$parent->usesort = true`.
6. Формирует заголовок с `<table class="table_caption">`.
7. Если `colspanfield` — увеличивает `$parent->colspanfieldsCount`.

### Клиент (`D3Api.TreeCtrl.init`)

`TreeColumn` не имеет собственного контрола. Вся логика — в
`TreeCtrl.init`:

1. Находит `td[column_name]` в `treecolumns`.
2. Собирает `colInfo`: `name`, `field`, `colspanField`, `caption`,
   `align`, `doms`, `defaultShow`, `sortEnabled`, `SortOrder`.
3. Если `colspanField` — добавляет в `dom.D3Store.colSpans`.

### Кнопка раскрытия (`btnOC`)

`D3Api.TreeCtrl.toggleNode(btnOC)`:
1. Находит строку через `getControlByDom(domNode, 'TreeRow')`.
2. Переключает `opened` / `closed`.
3. Если узел не загружен — запускает догрузку детей
   (`refreshDataSet` с `parentVar`).
4. Иначе — `showNode` переключает видимость потомков.

### Colspan (`onAfterCloneColSpan`)

При `onafter_clone` для строки, если у `Tree` есть колонки с
`colspanfield`, вызывается `onAfterCloneColSpan(clone)`:
1. Читает `colSpans` из `Tree.D3Store`.
2. Для каждого `<td>` проверяет значение
   `clone.clone.data[colSpans[column_name]]`.
3. Если `> 1` — ставит `colspan` и удаляет следующие N-1 ячеек.

---

## Примеры использования

### 1. Простая колонка

```xml
<cmpTreeColumn name="" field="name" caption="Наименование"/>
```

### 2. Первая колонка с иерархией

```xml
<cmpTree name="TR1" dataset="DS_TREE" keyfield="id" parentfield="pid">
  <cmpTreeColumn name="" field="name" caption="Наименование"/>
  <cmpTreeColumn name="" field="code" caption="Код"/>
</cmpTree>
```

Первая колонка автоматически получает `btnOC`. Это
обязательно — иерархия строится по первой колонке.

### 3. Колонка с сортировкой

```xml
<cmpTreeColumn name="" field="code" caption="Код" sort="code"/>
```

### 4. Колонка с фильтром

```xml
<cmpTreeColumn name="" field="name" caption="Наименование"
               filter="name" condition="like" like="both"/>
```

### 5. Числовой фильтр

```xml
<cmpTreeColumn name="" field="amount" caption="Сумма"
               filter="amount" filterkind="numb" align="right"/>
```

### 6. Период дат

```xml
<cmpTreeColumn name="" field="date" caption="Дата"
               filter="date" filterkind="perioddate"/>
```

### 7. Справочник

```xml
<cmpTreeColumn name="" field="lpu" caption="ЛПУ"
               filter="lpu" filterkind="unitedit"
               funit="LPUDICT" fcomposition="DEFAULT"/>
```

### 8. Форматирование значения

```xml
<cmpTreeColumn name="" field="amount" caption="Сумма" align="right"
               format="{toType: 'number', options: {minimumFractionDigits: 2}}"/>
```

Значение будет отформатировано через `D3Api.LabelCtrl.format`.

### 9. Colspan

```xml
<cmpTree name="TR1" dataset="DS_TREE" keyfield="id" parentfield="pid">
  <cmpTreeColumn name="" field="name" caption="Наименование"/>
  <cmpTreeColumn name="" field="note" caption="Примечание"
                 colspanfield="note_span"/>
  <cmpTreeColumn name="" field="code" caption="Код"/>
</cmpTree>
```

Если в данных `note_span=2` — ячейка `note` растянется на две
колонки (займёт `note` и `code`).

### 10. Не удалять при применении профиля

```xml
<cmpTreeColumn name="" field="actions" caption=""
               keep="true">
    <cmpButton caption="..."/>
</cmpTreeColumn>
```

Колонка с `keep="true"` не удаляется из DOM при применении
профиля, даже если в профиле `show=false`. Используется для
колонок с контролами.

### 11. Скрытая по умолчанию колонка

```xml
<cmpTreeColumn name="" field="internal_code" caption="Внутренний код"
               profile_hidden="true"/>
```

Колонка не показывается, пока пользователь не включит её через
профиль.

### 12. Колонка без resize-handle

```xml
<cmpTreeColumn name="" field="actions" caption=""
               fixed="true"/>
```

Скрывает handle изменения ширины колонки.

---

## Поведение в IDE

`TreeColumn` — видимая только через родителя (`Tree`). Отдельного
`preview()` у неё нет: `Tree.preview()` сканирует детей и строит
общий «скелет».

### В canvas

Колонка видна как столбец в таблице Tree:

```
┌──────────────┬──────────────┬────────────────┐
│ Код ⇅        │ Наименование │ Дата           │
├──────────────┼──────────────┼────────────────┤
│ ⊖ Корень     │              │                │
```

- Столбцы с `sort` получают индикатор ⇅ в шапке.
- Столбцы с `filter` получают индикатор ▼.
- Первая колонка содержит кнопку `⊖`/`⊕` в примерах строк.

### В дереве

```
cmpTree name="TR1" dataset="DS_TREE"
  cmpTreeColumn name="" field="name" caption="Наименование"
  cmpTreeColumn name="" field="code" caption="Код" sort="code"
  cmpTreeFooter separate="false"
```

`TreeColumn` перетаскивается только в `Tree` — ограничение
`PARENT_ONLY.cmptreecolumn = 'cmptree'`.

### В инспекторе

Большой набор атрибутов, разбитый на разделы:
- HTML attributes
- D3 Base
- Column (`field`, `caption`, `width`, `align`, `profile_hidden`)
- Sort (`sort`, `sortorder`)
- Filter (`filter`, `filterkind`, `upper`, `condition`, `like`,
  `not_append_ds`)
- Filter (units / combo) (`funit`, `fmethod`, `fcomposition`,
  `fbeforeopen`, `fcontent`, `fdataset`, `fdata`, `fdefault`)
- Other (`data`, `format`, `excelfield`, `colspanfield`, `keep`,
  `fixed`, `hint`)

Изменения `caption`, `width`, `align` немедленно отражаются в
превью родителя (через `refreshPreviewAndParent`).

### Ограничения

- **Без `Tree` не работает.**
- **Собственный preview отсутствует** — вся визуализация в
  родителе.
- **Кнопка `btnOC` показывается только у первой колонки** — в
  превью это эмулируется для всех колонок с `index === 0`.
- **Colspan в превью не отражается** — только в рантайме.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 controls**:

```html
<script src="Component/d3/Tree/index.js"></script>
<script src="Component/d3/TreeColumn/index.js"></script>
<script src="Component/d3/TreeFooter/index.js"></script>
```

Порядок: `TreeColumn` после `Tree`.

### Правки в `ide/panels.js`

**`PARENT_ONLY`:**

```js
cmptreecolumn: 'cmptree',
cmptreefooter: 'cmptree',
```

### Правки в `ide/canvas.js`

**`CMP_TAGS`:**

```js
'cmptree':       'cmpTree',
'cmptreecolumn': 'cmpTreeColumn',
'cmptreefooter': 'cmpTreeFooter',
```

`_injectIdeStyle` не трогаем — `TreeColumn` видима через родителя.

`XML_SELF_CLOSE` не трогаем — контейнерный.

`CDATA_CONTAINERS` не трогаем — нет CDATA.

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmptreecolumn': 'cmpTreeColumn',
```

---

## Известные ограничения

1. **`field` обязателен.** Без него колонка не отобразится.

2. **`parentOnly: cmptree`.** Вне `Tree` колонка не рендерится.

3. **`name` может быть пустым** — тогда берётся из `field`.
   Это удобно: имя контрола соответствует полю. Но если нужен
   доступ через `getControl`, задайте `name` явно.

4. **Первая колонка содержит `btnOC`.** В рантайме кнопка
   раскрытия добавляется только к первой колонке
   (`index === 0`). Если у первой колонки задано `field`, но
   `width` слишком мала — кнопка может сжать содержимое.

5. **`colspanfield` требует числовых значений.** Если значение
   поля `> 1` — ячейка растянется. `1` или пустое — обычная
   ячейка.

6. **`max_lines`** — обрезка текста через `line-clamp`. Работает
   только если у родительского `Tree` задан `max_lines` (он
   пробрасывается в колонки автоматически).

7. **`format`** — JSON-строка, которая превращается в
   `onformat="D3Api.LabelCtrl.format(this, {…}, arguments[0])"`.
   Пример: `{toType: 'number', options: {minimumFractionDigits: 2}}`.

8. **`align="right"` / `"center"`** — устанавливает
   `text-align` через `ctrlstyle` на `<td>` ячейки.

9. **`profile_hidden="true"`** — скрывает колонку по умолчанию
   в профиле. Пользователь может показать её через редактор
   профилей.

10. **`keep="true"`** — колонка не удаляется из DOM при
    применении профиля, даже если в профиле `show=false`.
    Используется для колонок с контролами (CheckBox, Button).

11. **`fixed="true"`** — скрывает `resize-handle` в заголовке.
    Пользователь не может изменять ширину колонки мышью.

12. **`onclick`** — навешивается на `<cmpLabel>` внутри ячейки.
    Клик по `<td>` не срабатывает, если кликнуть по padding.

13. **`hint`** — устанавливает `title` у `<cmpLabel>`. В `Tree`
    дополнительно `show_hint` влияет на подсказки в заголовках
    колонок.

14. **`not_append_ds`** — если `true`, фильтр не добавляется к
    DataSet. Используется, когда фильтрация должна
    обрабатываться вручную.

15. **`data` может задать `field`** — если `field` пусто, а в
    `data` есть `caption:<field>`, сервер возьмёт `field` оттуда.

16. **`selectlist`** — если у `Tree` задан `selectlist`,
    в первую колонку автоматически добавляется
    `<cmpSelectListItem>`. Не нужно добавлять его вручную.

17. **`sortEnabled`** — определяется клиентом по наличию
    `<cmpSortItem>` внутри заголовка. Используется для
    меню профиля.

18. **`SortOrder`** — начальное состояние сортировки колонки.
    Сохраняется в профиле и восстанавливается при
    `setProfile`.

19. **Экспорт в ODS.** `excelfield` задаёт имя поля при
    выгрузке. Если не задано, берётся `field`. Реальная
    выгрузка — `D3Api.TreeCtrl.exportTBS`.

20. **Клиентского контрола нет.** Все взаимодействия — через
    `D3Api.TreeCtrl`.

---

## Чек-лист добавления нового экземпляра

1. Убедиться, что колонка добавляется **внутрь `cmpTree`** —
   иначе IDE не даст вставить (через `PARENT_ONLY`).
2. В инспекторе задать:
    - `field` — имя поля DataSet (обязательное);
    - `caption` — заголовок;
    - `width`, `align` — размер и выравнивание;
    - `profile_hidden="true"` — если скрыта по умолчанию.
3. Для сортировки:
    - `sort` — поле сортировки;
    - `sortorder` — `asc` / `desc`.
4. Для фильтра:
    - `filter` — поле фильтра;
    - `filterkind` — тип;
    - `condition`, `like` — условия.
5. Для справочников:
    - `funit`, `fmethod`, `fcomposition` — для `unitedit`;
    - `fcontent`, `fdataset`, `fdata`, `fdefault` — для `combo`.
6. Для форматирования: `format` — JSON-настройки.
7. Для colspan: `colspanfield` — имя поля, значение которого
   определяет число колонок.
8. Для колонок с контролами: `keep="true"` — чтобы не
   удалялись при применении профиля.
9. Проверить в дереве: `cmpTreeColumn` — ребёнок `cmpTree`.
10. Проверить в canvas: колонка должна отображаться в шапке
    Tree с правильным `caption`, индикаторами сортировки и
    фильтра.

---

## См. также

- `Component/d3/Tree/README.md` — родительский иерархический Grid
- `Component/d3/TreeFooter/README.md` — подвал Tree
- `Component/d3/Grid/README.md` — обычный Grid
- `Component/d3/Column/README.md` — колонка Grid
  (аналогичная по структуре)
- `Component/d3/SelectList/README.md` — множественный выбор
  через `selectlist` в Tree
- `Component/d3/Sort/README.md` — сортировка
- `TreeCtrl.inc` — серверный код `TreeColumn`
- `Tree.js` — клиентский `D3Api.TreeCtrl`
- `Tree.css` — стили `.column_caption`, `.column_data`, `.firstnode`,
  `.btnOC`
