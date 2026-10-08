# cmpStatGridColumn

Колонка аналитического Grid (`cmpStatGrid`). В рантайме не рендерит
собственной разметки — `Show()` пушит данные в родительский
`StatGrid`:

- `<col>` в `col_group` (описание ширины и группы);
- `<td class="column_data">` в `columns[]` (ячейка данных);
- `<td class="column_filter">` в `filters[]` (ячейка фильтра);
- заголовок в `columns_caption[]`;
- `<cmpSortItem>` в `sort_item` (при заданном `sort`);
- суммы в `columns_summ` (накопление через `StatSumm`).

Дополнительно `StatGridColumn` поддерживает **группировку**
(`group="true"`) и **расширенные фильтры**
(`extended_filter="true"`).

Без родителя `StatGrid` не работает: при попытке рендера вне
`StatGrid` `Show()` выходит молча.

---

## Расположение

```
Component/d3/StatGridColumn/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)
```

**Серверные файлы:**

| Файл | Role |
|---|---|
| `StatGridCtrl.inc` | class `StatGridColumn extends BaseCtrl` |
| `StatGrid.js` | `D3Api.StatGridCtrl` (колонка не имеет отдельного контрола) |
| `StatGrid.css` | стили `.column_caption`, `.column_data`, `.column_filter`, `.groupcell`, `.groupdatacell` |

---

## Тег и ID

- **XML-тег:** `cmpStatGridColumn`
- **Регистрация в IDE:** `id: 'd3.statgridcolumn'`
- **Категория:** D3
- **Вид в палитре:** `StatGridColumn`
- **Видимость:** видимый (рендерится родителем `StatGrid`)
- **parentOnly:** `cmpstatgrid` — можно вставить только внутрь
  `StatGrid`
- **Дочерние компоненты:** `cmpStatSumm`, `cmpStatGridColumnHeader`

---

## Разметка в рантайме

Собственной разметки `StatGridColumn` не генерирует. Все части
вставляются в родительский `StatGrid`:

### `<col>` в colgroup

```html
<col fcol="c2"
     width="100"
     cont="amount"
     index="2"
     column_name="amount"
     profile_hidden="false"
     group="1"
     grouporder="2"/>
```

### Заголовок колонки

```html
<td class="column_caption"
    cont="amount"
    index="2"
    column_name="amount">
  <div style="overflow: hidden;">
    <table class="table_caption">
      <tr>
        <td class="icn"><cmpSortItem …/></td>
        <td class="caption_sort"
            title=""
            onclick="D3Api.StatGridCtrl.addGroupField(this,'amount','2',true)">
          Сумма
        </td>
        <td class="icn"><div class="filter_icon" …></div></td>
      </tr>
    </table>
  </div>
</td>
```

### Ячейка данных

```html
<td class="column_data" style="text-align: right;" cont="amount" index="2" column_name="amount">
  <cmpLabel data="caption:amount"/>
</td>
```

### Ячейка фильтра (если `filter` задан)

```html
<td class="column_filter" cont="amount" index="2">
  <cmpFilterItem field="amount" filterkind="numb" …/>
</td>
```

Клиентский код сам собирает эти фрагменты в таблицы `statgrid_columns`
(шапка) и `statgrid_data` (данные), а также в `statgrid_filters`.

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`, `title`

### D3 Base
- `name` — имя контрола (по умолчанию берётся `field`).

### Column
- **`field`** — имя поля DataSet (обязательное).
- **`caption`** — заголовок колонки.
- **`width`** — ширина колонки.
- **`align`** — `left | center | right`.
- **`visible`** — `false` — колонка не рендерится.
- **`profile_hidden`** — `true` — скрыть по умолчанию в профиле.

### Grouping
- **`group`** — `true` — колонка участвует в группировке.
- **`grouporder`** — порядок группировки (число).

### Sort
- **`sort`** — поле сортировки (включает сортировку).
- **`sortorder`** — `asc` / `desc` — начальный порядок сортировки.

### Filter
- **`filter`** — поле фильтра (включает фильтр).
- **`filterkind`** — тип фильтра.
- **`upper`** — `true` — учитывать регистр при LIKE.
- **`condition`** — `eq | neq | gt | lt | gteq | lteq | like | none`.
- **`like`** — `left | right | both`.
- **`extended_filter`** — `true` — расширенный фильтр.
- **`not_append_ds`** — не добавлять фильтр к DataSet.

### Filter (units / combo)
- **`funit`**, **`fmethod`**, **`fcomposition`** — параметры справочника.
- **`fcontent`**, **`fdataset`**, **`fdata`**, **`fdefault`** — параметры combo.

### Other
- **`data`** — data-атрибут Label (`value:…;caption:…`).
- **`excelfield`** — имя поля при выгрузке.
- **`keep`** — не удалять колонку при применении профиля.
- **`addlistener`** — слушатель для расширенного фильтра.

### Events
- `onclick` — клик по ячейке.

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`.

---

## Формат атрибутов

| Атрибут | Тип | Описание |
|---|---|---|
| `field` | string | Имя поля DataSet. Обязательное |
| `name` | string | Имя контрола. Если пусто — берётся из `field` |
| `caption` | string | Заголовок |
| `width` | string | Ширина (число или CSS-значение) |
| `align` | enum | `left` / `center` / `right` |
| `visible` | boolean | `false` — не рендерить колонку |
| `profile_hidden` | boolean | `true` — скрыть по умолчанию в профиле |
| `group` | boolean | `true` — участвует в группировке |
| `grouporder` | number | Порядок группы (1, 2, 3, …) |
| `sort` | string | Поле сортировки. Если задано — колонка сортируемая |
| `sortorder` | string | `asc` / `desc` — начальное состояние |
| `filter` | string | Поле фильтра. Если задано — колонка фильтруемая |
| `filterkind` | enum | Тип фильтра (`text`, `numb`, `date`, `combo`, `unitedit`, …) |
| `upper` | boolean | `true` — учитывать регистр в LIKE |
| `condition` | enum | `eq`, `neq`, `gt`, `lt`, `gteq`, `lteq`, `like`, `none` |
| `like` | enum | `left`, `right`, `both` |
| `extended_filter` | boolean | `true` — расширенный фильтр |
| `not_append_ds` | boolean | Не добавлять фильтр к DataSet |
| `funit` | string | Имя справочника для `unitedit` / `unitmulti` / `cmb_unit` |
| `fmethod` | string | Метод справочника (LIST, DEFAULT) |
| `fcomposition` | string | Композиция справочника |
| `fcontent` | string | Список элементов combo (`1|Да;0|Нет`) |
| `fdataset` | string | DataSet для combo |
| `fdata` | string | Поля DataSet для combo (`value:id;caption:name`) |
| `fdefault` | string | Значение по умолчанию |
| `data` | string | data-атрибут Label (`value:id;caption:name`) |
| `excelfield` | string | Имя поля при выгрузке в Excel |
| `keep` | boolean | Не удалять колонку при применении профиля |
| `addlistener` | boolean | Слушатель для расширенного фильтра |

---

## Логика работы

### Сервер (`StatGridColumn::__construct`)

1. Проверяет родителя (`StatGrid`).
2. Парсит `group`, `grouporder`, `visible`, `field`, `data`, `addlistener`,
   `not_append_ds`.
3. Если `field` пусто, но `data` задано — берёт `field` из `caption:…`
   в `data`.
4. Парсит `onclick`, `caption`, `usesort` (`sort`), `sortorder`,
   `colname` (`name` или `field`).
5. Парсит параметры фильтра (`filter`, `upper`, `condition`, `like`,
   `filterkind`, `funit`, `fmethod`, `fcomposition`, `fcontent`,
   `fdataset`, `fdata`, `fdefault`).
6. Парсит `ctrlstyle`, `align`, `width`, `excel_field`.
7. Вычисляет `index = count($parent->columns)`.
8. **Если `visible !== false`** — добавляет `<col>` в `$parent->col_group`.
9. Применяет `align` к `ctrlstyle` (`text-align: right/center/left`).

### Сервер (`StatGridColumn::Show`)

1. Проверяет `$parent->CmpType == 'StatGrid'`. Если нет — выходит.
2. Проверяет `visible`. Если `false` — очищает `$this->text` и
   выходит.
3. Если `add_script` задан — оборачивает в `<input type="Button">`.
4. Если `$this->text` пусто — создаёт `<cmpLabel>` с `data` (то
   есть ячейка данных — это Label).
5. Пушит ячейку данных в `$parent->columns[]` со стилем `ctrlstyle`,
   `cont=field`, `index`, `column_name`.
6. Если `usefilter` задан — формирует `<cmpFilterItem>` с параметрами
   и пушит в `$parent->filters[]`.
7. Если `usesort` задан — формирует `<cmpSortItem>` и ставит
   `$parent->usesort = true`.
8. Формирует заголовок колонки (`<td class="column_caption">`) с
   вложенной таблицей `table_caption`: `icn` (иконка сортировки),
   `caption_sort` (текст с onclick для группировки), `icn` (иконка
   фильтра).
9. Накапливает HTML сумм в `$parent->columns_summ` (из дочерних
   `StatSumm`).

### Клиент (`D3Api.StatGridCtrl.init`)

Колонка не имеет собственного контрола. Вся логика — в `StatGridCtrl`:

1. Сканирует `td[column_name]` в `statgrid_columns`.
2. Для каждой колонки читает `cont` (= field), `column_name`, `index`.
3. Читает `<col>` по `index` — берёт `width`, `profile_hidden`,
   `group`, `grouporder`.
4. Проверяет наличие `<cmpSortItem>` внутри ячейки — берёт
   `sortorder`.
5. Собирает объект `colInfo`:
   ```js
   {
     name, field, caption, align,
     doms: [],       // все DOM-элементы колонки (col, td)
     defaultShow,    // из profile_hidden
     sortEnabled,    // был ли SortItem
     SortOrder,
     _show: true,
     Summary: [],    // заполняется из StatSumm
     Grouped: isGroup,
     grouporder,
     _order: index
   }
   ```
6. Кладёт в `dom.D3Store.cols` и `dom.D3Store.defaultCols`.

### Управление колонками

- **`showColDoms(col, params)`** — показать колонку (вернуть в DOM).
- **`hideColDoms(col)`** — скрыть колонку (удалить из DOM, сохранить
  в `doms`).
- **`showAllColDoms(cols)`** / **`hideAllColDoms(cols)`** — массовые
  операции.
- **`setColWidth(dom, fcol, width)`** — установить ширину колонки
  по `fcol`.

При применении профиля (`setProfile`) колонки показываются/скрываются
и меняют порядок в соответствии с `profile.cols`.

### Группировка

- **`addGroupField(dom, field, index, refresh)`** — добавить колонку
  в группировку. Создаёт `<col class="groupcell">` и
  `<td class="groupcell">` в начале, скрывает оригинальную ячейку.
- **`delGroupField(dom, field, refresh, isUserEvent)`** — убрать
  колонку из группировки. Восстанавливает оригинальную ячейку.

Группировка работает через `dom.D3StatGrid.groups` — массив
`{field, caption, index}`.

---

## Примеры использования

### 1. Простая колонка

```xml
<cmpStatGridColumn name="" field="code" caption="Код"/>
```

Ячейка данных — `<cmpLabel data="caption:code"/>`.

### 2. Колонка с сортировкой

```xml
<cmpStatGridColumn name="" field="code" caption="Код"
                   sort="code" sortorder="asc"/>
```

В заголовке появится `<cmpSortItem>` — стрелка вверх (asc).
Клик по ней переключает: asc → desc → none.

### 3. Колонка с фильтром

```xml
<cmpStatGridColumn name="" field="name" caption="Наименование"
                   filter="name" condition="like" like="both"/>
```

Под шапкой появится `<cmpFilterItem field="name" filterkind="text"
condition="like" like="both"/>` — текстовое поле фильтра.

### 4. Колонка с числовым фильтром

```xml
<cmpStatGridColumn name="" field="amount" caption="Сумма"
                   filter="amount" filterkind="numb" align="right"/>
```

Фильтр — числовое поле. Ячейка данных выравнивается вправо.

### 5. Колонка с периодом

```xml
<cmpStatGridColumn name="" field="date" caption="Дата"
                   filter="date" filterkind="perioddate"/>
```

Фильтр — два поля «с» и «по» (DateEdit).

### 6. Колонка с combo

```xml
<cmpStatGridColumn name="" field="status" caption="Статус"
                   filter="status" filterkind="combo"
                   fcontent="1|Активный;0|Неактивный"/>
```

Фильтр — выпадающий список со значениями.

### 7. Группируемая колонка

```xml
<cmpStatGridColumn name="" field="category" caption="Категория"
                   group="true" grouporder="1"/>
```

Клик по заголовку колонки добавит её в группировку. Появится полоса
«Группировка: Категория» вверху StatGrid.

### 8. Колонка со справочником

```xml
<cmpStatGridColumn name="" field="lpu" caption="ЛПУ"
                   filter="lpu" filterkind="unitedit"
                   funit="LPUDICT" fcomposition="DEFAULT"/>
```

Фильтр — поле `UnitEdit` со справочником.

### 9. Колонка с суммой

```xml
<cmpStatGridColumn name="" field="amount" caption="Сумма" align="right">
    <cmpStatSumm field="amount" index="2" summ_type="sum"/>
</cmpStatGridColumn>
```

В подвале StatGrid появится «Итого: …». При группировке — итог по
каждой группе.

### 10. Колонка с HTML-заголовком

```xml
<cmpStatGridColumn name="" field="amount" caption="Сумма">
    <cmpStatGridColumnHeader>
    <![CDATA[
    <b>Сумма</b><br/><span style="font-size:9px">руб.</span>
    ]]>
    </cmpStatGridColumnHeader>
</cmpStatGridColumn>
```

В шапке — HTML-разметка вместо простого `caption`.

### 11. Скрытая по умолчанию колонка

```xml
<cmpStatGridColumn name="" field="internal_code" caption="Внутренний код"
                   profile_hidden="true"/>
```

Колонка не показывается, пока пользователь не включит её через
профиль.

### 12. Невидимая колонка

```xml
<cmpStatGridColumn name="" field="tmp" caption="TMP" visible="false"/>
```

Колонка полностью не рендерится (ни в шапке, ни в данных). Может
использоваться для расчётов на сервере.

### 13. Расширенный фильтр

```xml
<cmpStatGridColumn name="" field="date" caption="Дата"
                   filter="date" filterkind="date"
                   extended_filter="true"/>
```

Фильтр выводится в дополнительной строке под шапкой (если у
`StatGrid` задан `extended_filter="true"`).

---

## Поведение в IDE

`StatGridColumn` — видимая только через родителя (`StatGrid`).
Отдельного `preview()` у неё нет: `StatGrid.preview()` сканирует
детей и строит общий «скелет».

### В canvas

Колонка видна как столбец в таблице StatGrid:

```
┌──────────┬────────────┬──────────────────┐
│ Код ⇅    │ Наименование│ Сумма            │
├──────────┼────────────┼──────────────────┤
│          │            │                  │
│          │            │                  │
└──────────┴────────────┴──────────────────┘
```

- Столбцы с `sort` получают индикатор ⇅ в шапке.
- Столбцы с `filter` получают индикатор ▼.
- Полоса «Группировка: …» появляется в StatGrid, если есть колонки
  с `group="true"`.

### В дереве

```
cmpStatGrid name="SG1" dataset="DS_STAT"
  cmpStatGridColumn name="" field="code" caption="Код" sort="code"
  cmpStatGridColumn name="" field="name" caption="Наименование"
  cmpStatGridColumn name="" field="sum" caption="Сумма" align="right"
    cmpStatSumm field="sum" index="2" summ_type="sum"
  cmpStatGridFooter separate="false"
```

`StatGridColumn` перетаскивается только в `StatGrid` — ограничение
`PARENT_ONLY.cmpstatgridcolumn = 'cmpstatgrid'`.

### В инспекторе

Большой набор атрибутов — разделы:
- HTML attributes
- D3 Base
- Column (`field`, `caption`, `width`, `align`, `profile_hidden`, `visible`)
- Grouping (`group`, `grouporder`)
- Sort (`sort`, `sortorder`)
- Filter (`filter`, `filterkind`, `upper`, `condition`, `like`,
  `extended_filter`, `not_append_ds`)
- Filter (units / combo) (`funit`, `fmethod`, `fcomposition`,
  `fcontent`, `fdataset`, `fdata`, `fdefault`)
- Other (`data`, `excelfield`, `keep`, `addlistener`)

### Ограничения

- **Без `StatGrid` не работает** — `Show()` молча выходит, если
  родитель не `StatGrid`.
- **Собственный preview отсутствует** — вся визуализация в
  родителе.
- **`StatSumm` и `StatGridColumnHeader`** — дочерние компоненты,
  в превью колонки не отражаются.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 controls**:

```html
<script src="Component/d3/StatGrid/index.js"></script>
<script src="Component/d3/StatGridColumn/index.js"></script>
<script src="Component/d3/StatGridColumnHeader/index.js"></script>
<script src="Component/d3/StatGridFooter/index.js"></script>
<script src="Component/d3/StatSumm/index.js"></script>
```

### Правки в `ide/panels.js`

**`PARENT_ONLY`:**

```js
cmpstatgridcolumn:       'cmpstatgrid',
cmpstatgridfooter:       'cmpstatgrid',
cmpstatgridsumm:         'cmpstatgridcolumn',
cmpstatgridcolumnheader: 'cmpstatgridcolumn',
```

### Правки в `ide/canvas.js`

**`CMP_TAGS`:**

```js
'cmpstatgrid':             'cmpStatGrid',
'cmpstatgridcolumn':       'cmpStatGridColumn',
'cmpstatgridcolumnheader': 'cmpStatGridColumnHeader',
'cmpstatgridfooter':       'cmpStatGridFooter',
'cmpstatsumm':             'cmpStatSumm',
```

**`CDATA_CONTAINERS`:**

```js
cmpstatgridcolumnheader: 1
```

`_injectIdeStyle` не трогаем — `StatGridColumn` видима через
родителя.

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmpstatgrid':             'cmpStatGrid',
'cmpstatgridcolumn':       'cmpStatGridColumn',
'cmpstatgridcolumnheader': 'cmpStatGridColumnHeader',
'cmpstatgridfooter':       'cmpStatGridFooter',
'cmpstatsumm':             'cmpStatSumm',
```

---

## Известные ограничения

1. **`field` обязателен.** Если `field` пусто и `data` не задано,
   колонка сгенерирует пустую ячейку.

2. **`parentOnly: cmpstatgrid`.** Вне `StatGrid` колонка не рендерится.

3. **`name` может быть пустым** — тогда берётся из `field`. Это
   удобно: имя контрола автоматически соответствует полю, но
   если нужно использовать в `Action`/`Module`, лучше задать
   явно.

4. **`data` может задать `field`** — если `field` пусто, а в
   `data` есть `caption:<field>`, сервер возьмёт `field` оттуда.

5. **`group="true"` включает колонку в группировку.** Порядок
   задаётся `grouporder`. Группировка управляется кликом по
   заголовку (или через `D3Api.StatGridCtrl.addGroupField`).

6. **`extended_filter="true"` работает только внутри StatGrid
   с `extended_filter="true"`.** Если у родителя не задан флаг,
   колонка не отобразит расширенный фильтр.

7. **`profile_hidden="true"`** — скрывает колонку по умолчанию
   в профиле. Пользователь может показать её через редактор
   профилей.

8. **`visible="false"`** — колонка полностью не рендерится.
   Используется для скрытых расчётных полей.

9. **`align` устанавливает text-align** через `ctrlstyle` на
   ячейку данных. В превью StatGrid это не отражается (только
   в превью инспектора колонки, если открыть её отдельно).

10. **`sortorder` — начальное состояние сортировки.** В
    `StatGridColumn::__construct` передаётся в `<cmpSortItem>`
    как атрибут `sortorder`. Клиент сам пересчитает состояние
    и класс.

11. **`fdataset` и `fdata`** — в серверном `Show()` не читаются
    (в отличие от `Grid`). Добавлены для совместимости с
    `Column`, но в реальном рантайме игнорируются.

12. **`addlistener`** — задел под расширенные фильтры.
    В текущей версии не используется в `Show()`, но доступен
    через `D3Api.StatGridCtrl`.

13. **`keep="true"`** — колонка не удаляется при применении
    профиля, даже если в профиле `show=false`. Используется
    для контролов внутри колонки (CheckBox, ComboBox).

14. **Множественные `StatSumm`** — можно добавить несколько
    сумм в одну колонку (sum, avg, count, min, max). В подвале
    будет отображено через запятую.

15. **`StatGridColumnHeader`** — заменяет `caption` колонки на
    HTML. `parent->caption = $this->text`. Обязательно в
    `CDATA_CONTAINERS` — иначе пробелы схлопнутся.

16. **`StatGridColumn` не имеет клиентского контрола.**
    Все взаимодействия — через `D3Api.StatGridCtrl`.

17. **Экспорт в Excel.** `excelfield` задаёт имя поля при
    выгрузке. Если не задано, берётся `field`. Реальная
    выгрузка — `D3Api.StatGridCtrl.exportXLS`.

---

## Чек-лист добавления нового экземпляра

1. Убедиться, что колонка добавляется **внутрь `cmpStatGrid`** —
   иначе IDE не даст вставить (через `PARENT_ONLY`).
2. В инспекторе задать:
    - `field` — имя поля DataSet (обязательное);
    - `caption` — заголовок;
    - `width`, `align` — размер и выравнивание;
    - `visible="false"` — если колонка не должна рендериться;
    - `profile_hidden="true"` — если скрыта по умолчанию.
3. Для сортировки:
    - `sort` — поле сортировки;
    - `sortorder` — `asc` / `desc` (опционально).
4. Для группировки:
    - `group="true"`;
    - `grouporder` — порядок группировки.
5. Для фильтра:
    - `filter` — поле фильтра;
    - `filterkind` — тип (`text`, `numb`, `date`, `combo`, `unitedit`, …);
    - `condition`, `like` — условия;
    - `extended_filter="true"` — если нужен расширенный фильтр.
6. Для справочников / combo:
    - `funit`, `fmethod`, `fcomposition` — для `unitedit`;
    - `fcontent`, `fdataset`, `fdata`, `fdefault` — для `combo`.
7. При необходимости — добавить внутрь `StatSumm` для сумм.
8. При необходимости — добавить `StatGridColumnHeader` для HTML-заголовка.
9. При необходимости — привязать `onclick`.
10. Проверить в дереве: `cmpStatGridColumn` должен быть ребёнком
    `cmpStatGrid`.
11. Проверить в canvas: колонка отображается в шапке StatGrid с
    правильным `caption`, индикаторами сортировки и фильтра.

---

## См. также

- `Component/d3/StatGrid/README.md` — родительский аналитический Grid
- `Component/d3/StatSumm/README.md` — определение суммы в колонке
- `Component/d3/StatGridColumnHeader/README.md` — заголовок колонки
  через CDATA
- `Component/d3/Grid/README.md` — обычный Grid
- `Component/d3/Column/README.md` — колонка обычного Grid
  (аналогичная по структуре)
- `StatGridCtrl.inc` — серверный код `StatGridColumn`
- `StatGrid.js` — клиентский `D3Api.StatGridCtrl`
- `StatGrid.css` — стили колонок
