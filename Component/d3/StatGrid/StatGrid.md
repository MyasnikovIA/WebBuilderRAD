# cmpStatGrid

Аналитический Grid с группировкой строк, суммированием, расширенными
фильтрами и профилями. Структурно повторяет `cmpGrid`, но добавляет:

- **группировку** — по колонкам с `group="true"` (`grouporder` задаёт порядок);
- **суммирование** — через `cmpStatSumm` в колонках (`sum`, `count`, `avg`, `max`, `min`);
- **расширенные фильтры** — `extended_filter="true"` (`filter_lines` задаёт число строк);
- **заголовки колонок** через `cmpStatGridColumnHeader` (CDATA с HTML);
- **вложенные строки-группы** (`grouprow`) с раскрытием/сворачиванием;
- **итоговую строку** в подвале `statgrid_footer`.

В рантайме рендерит крупную структуру (`header`, `groups`, `columns`,
`data_cont`, `filters`, `footer`), управляется `D3Api.StatGridCtrl`.

---

## Расположение

```
Component/d3/StatGrid/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)

Component/d3/StatGridColumn/
Component/d3/StatGridColumnHeader/
Component/d3/StatGridFooter/
Component/d3/StatSumm/
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `StatGridCtrl.inc` | классы `StatGrid`, `StatGridColumn`, `StatGridColumnHeader`, `StatGridFooter`, `StatSumm` |
| `StatGrid.js` | `D3Api.StatGridCtrl`, `D3Api.StatGridRowCtrl` |
| `StatGrid.css` | стили `.statgrid`, `.statgrid_header`, `.statgrid_columns`, `.statgrid_groups`, `.statgrid_data`, `.statgrid_footer`, `.grouprow`, `.groupcell`, `.groupsumm` |

---

## Тег и ID

- **XML-тег:** `cmpStatGrid`
- **Регистрация в IDE:** `id: 'd3.statgrid'`
- **Категория:** D3
- **Вид в палитре:** `StatGrid`
- **Видимость:** видимый (рендерит разметку в canvas)
- **Дочерние компоненты:** `cmpStatGridColumn`, `cmpStatGridFooter`

---

## Разметка в рантайме

Серверный `StatGrid::Show()` собирает (упрощённо):

```html
<div class="statgrid box-sizing-force" tabindex="0" …>
  <div class="statgrid_header" cont="statgridcaption">
    <div class="statgrid_settings"></div>
    <span cont="statgridcaptioncontent">Caption</span>
    <cmpButton class="btn_actions" onclick="…PopupMenuCtrl.showPopupMenu(…)"/>
  </div>

  <div class="statgrid_groups" cont="statgridgroups"></div>

  <div class="statgrid_columns" cont="statgridcolumnscont">
    <table class="statgrid_columns" cont="statgridcolumns">
      <colgroup cont="statgridcols">…</colgroup>
      <tbody>
        <tr cont="statgridcolumnscaption" oncreate="D3Api.StatGridCtrl.headerSizerInit(this)">
          <td class="column_caption">…</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="statgrid_data_cont">
    <div class="statgrid_data" cont="statgriddatacont">
      <div class="statgrid_data_info" cont="statgriddatainfo"></div>
      <table class="statgrid_data show_activerow" cont="statgriddata">
        <colgroup>…</colgroup>
        <tbody>
          <tr cmptype="StatGridRow" class="node closed"
              cont="statgridrow" repeatername="<name>_repeater"
              name="<name>_Row" data="value:id"
              onmousedown="D3Api.StatGridCtrl.setActiveRow(this);">
            <td class="column_data">…</td>
          </tr>
        </tbody>
      </table>

      <div class="statgrid_filters" cont="statgridfilter">
        <table class="statgrid_filters">…</table>
        <div class="filterPanel" cont="statgridfilterpanel">…кнопки фильтра…</div>
      </div>
    </div>
  </div>

  <div class="statgrid_footer" cont="statgridfooter">
    <span cont="statgridfootersumm"></span>
    <span cont="statgridfooterttext" class="statgrid_footer_text"></span>
  </div>
</div>
```

Также сервер автоматически создаёт два `cmpPopupMenu`:

- `<name>_popupmenu` — для системного меню действий;
- `<name>_menu_profile` — для меню профилей.

Если у `StatGrid` задан `selectlist` — сервер добавляет колонку
с `SelectList` / `SelectListItem` в начало таблицы.

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`

### D3 Base
- `name`, `caption`, `enabled`, `visible`, `hint`, `width`, `height`

### Data
- **`dataset`** — DataSet.
- **`field`** — основное поле (для Locate).
- **`keyfield`** — ключевое поле (для `keyvalue` строк).
- **`returnfield`** — поле для `returnvalue` активной строки.
- **`hintfield`** — поле tooltip-а.

### StatGrid
- **`selectlist`** — имя `SelectList`-колонки множественного выбора.
- **`settings_method`** — JS-метод, вызываемый при клике на «шестерёнку».
- **`use_sort`** — `true` — включить сортировку колонок.
- **`excel`** — `true` — добавить пункт «Выгрузить в Excel» в popup-меню.
- **`activerow`** — `true` — подсветка активной строки.
- **`showfilter`** — `true` — показать панель фильтров сразу.
- **`extended_filter`** — `true` — расширенные фильтры в колонках.
- **`filter_lines`** — количество строк фильтра.
- **`white_space_nowrap`** — `true` — не переносить строки.
- **`limit_row`** — `true` — ограничение количества строк.
- **`show_selectcount`** — `true` — «Отмечено: N» в подвале.
- **`popupmenu`** — имя PopupMenu (создаётся автоматически, если не задано).
- **`popupmenu_actions`** — имя PopupMenu действий (устанавливается автоматически).

### Events
- `oncreate`, `onshow`, `onafter_refresh`, `onrefresh`
- `onchange` — смена активной строки
- `onfilter` — фильтр
- `onprofile_change` — смена профиля
- `onclick`, `ondblclick`

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`.

---

## Дочерние компоненты

### `cmpStatGridColumn`

Колонка StatGrid. Атрибуты группировки (`group`, `grouporder`),
сортировки (`sort`, `sortorder`), фильтрации (`filter`, `filterkind`,
`upper`, `condition`, `like`), а также те же поля для справочников
и combo (`funit`, `fmethod`, `fcomposition`, `fcontent`, `fdataset`,
`fdata`, `fdefault`), что и в `Grid`. `parentOnly: cmpstatgrid`.

### `cmpStatGridColumnHeader`

Заголовок колонки. Содержит CDATA с HTML, который заменяет `caption`
колонки. `parentOnly: cmpstatgridcolumn`.

### `cmpStatGridFooter`

Подвал StatGrid. `parentOnly: cmpstatgrid`.

### `cmpStatSumm`

Определение итоговой суммы в колонке. `summ_type` — `sum | count |
avg | max | min`. `parentOnly: cmpstatgridcolumn`.

---

## Примеры использования

### 1. Простой StatGrid

```xml
<cmpStatGrid name="SG1" dataset="DS_STAT" caption="Статистика">
    <cmpStatGridColumn name="" field="code" caption="Код" sort="code" filter="code"/>
    <cmpStatGridColumn name="" field="name" caption="Наименование" filter="name"/>
    <cmpStatGridColumn name="" field="sum"  caption="Сумма" align="right">
        <cmpStatSumm field="sum" index="2" summ_type="sum"/>
    </cmpStatGridColumn>
    <cmpStatGridFooter separate="false"/>
</cmpStatGrid>
```

### 2. С группировкой

```xml
<cmpStatGrid name="SG1" dataset="DS_STAT" caption="Статистика">
    <cmpStatGridColumn name="" field="category" caption="Категория"
                       group="true" grouporder="1"/>
    <cmpStatGridColumn name="" field="subcategory" caption="Подкатегория"
                       group="true" grouporder="2"/>
    <cmpStatGridColumn name="" field="amount" caption="Сумма" align="right">
        <cmpStatSumm field="amount" index="2" summ_type="sum"/>
    </cmpStatGridColumn>
</cmpStatGrid>
```

Клик по заголовку колонки добавляет/удаляет поле из группировки.
В превью StatGrid отображается полоса «Группировка: Категория → Подкатегория».

### 3. Множественное суммирование в колонке

```xml
<cmpStatGridColumn name="" field="amount" caption="Сумма" align="right">
    <cmpStatSumm field="amount" index="2" summ_type="sum"    summ_caption="Итого"/>
    <cmpStatSumm field="amount" index="2" summ_type="avg"    summ_caption="Среднее"/>
    <cmpStatSumm field="amount" index="2" summ_type="count"  summ_caption="Кол-во"/>
</cmpStatGridColumn>
```

В подвале каждой группы и в общей итоговой строке появится три значения.

### 4. Заголовок с HTML

```xml
<cmpStatGridColumn name="" field="sum" caption="Сумма">
    <cmpStatGridColumnHeader>
    <![CDATA[
    <b>Сумма, руб.</b><br/><span style="font-size:9px">с НДС</span>
    ]]>
    </cmpStatGridColumnHeader>
</cmpStatGridColumn>
```

В шапке колонки отобразится HTML-заголовок вместо простого текста.

### 5. Множественный выбор

```xml
<cmpStatGrid name="SG1" dataset="DS_STAT"
             selectlist="id" show_selectcount="true">
    <cmpStatGridColumn name="" field="code" caption="Код"/>
    <cmpStatGridColumn name="" field="name" caption="Наименование"/>
</cmpStatGrid>
```

Сервер автоматически добавит колонку с `SelectList` в начало.
В подвале появится «Отмечено: N».

### 6. Расширенный фильтр

```xml
<cmpStatGrid name="SG1" dataset="DS_STAT"
             extended_filter="true" filter_lines="2">
    <cmpStatGridColumn name="" field="code" caption="Код"
                       filter="code" extended_filter="true"/>
    <cmpStatGridColumn name="" field="date" caption="Дата"
                       filter="date" filterkind="perioddate"/>
</cmpStatGrid>
```

Каждая колонка с `extended_filter="true"` получит свой фильтр
в дополнительной строке под шапкой.

### 7. Выгрузка в Excel

```xml
<cmpStatGrid name="SG1" dataset="DS_STAT" excel="true">
    …
</cmpStatGrid>
```

В системном popup-меню появится пункт «Выгрузить в Excel».
Клик вызывает `D3Api.StatGridCtrl.exportXLS`.

### 8. Программное управление

```js
var sg = getControl('SG1');

// Переключить группировку по полю
D3Api.StatGridCtrl.addGroupField(sg, 'category', 0, true);
D3Api.StatGridCtrl.delGroupField(sg, 'category', true);

// Обновить данные
D3Api.StatGridCtrl.refreshData(sg);

// Установить активную строку
D3Api.StatGridCtrl.setValue(sg, 42);

// Прочитать данные активной строки
var data = D3Api.StatGridCtrl.getData(sg);

// Переключить фильтр
D3Api.StatGridCtrl.toggleFilter(sg);
```

### 9. Профили (программно)

```js
var sg = getControl('SG1');

// Установить профиль
D3Api.StatGridCtrl.setProfile(sg, 'По умолчанию', true);

// Открыть редактор профилей
D3Api.StatGridCtrl.openProfile(sg);
```

---

## Поведение в IDE

Компонент **видимый**. В canvas отображается статичный «скелет»:

```
┌──────────────────────────────────────────┐
│ StatGrid                                 │
├──────────────────────────────────────────┤
│ Группировка: Категория → Подкатегория    │
├──────────┬────────────┬──────────────────┤
│ Код ⇅    │ Наименование│ Сумма            │
├──────────┼────────────┼──────────────────┤
│          │            │                  │
│          │            │                  │
│          │            │                  │
├──────────┴────────────┴──────────────────┤
│ Всего: 0                                 │
└──────────────────────────────────────────┘
```

Полоса «Группировка: …» появляется, если есть колонки с `group="true"`.
Колонки с `sort` получают индикатор ⇅, с `filter` — ▼.

`StatGridColumn` и `StatGridFooter` внутри `StatGrid` не видны
(скрыты через CSS). `StatSumm` и `StatGridColumnHeader` — только
в дереве.

### В дереве

```
cmpStatGrid name="SG1" dataset="DS_STAT" caption="Статистика"
  cmpStatGridColumn name="" field="code" caption="Код" sort="code"
  cmpStatGridColumn name="" field="name" caption="Наименование"
  cmpStatGridColumn name="" field="sum" caption="Сумма" align="right"
    cmpStatSumm field="sum" index="2" summ_type="sum"
  cmpStatGridFooter separate="false"
```

`StatGridColumn` перетаскивается только в `StatGrid`,
`StatSumm` / `StatGridColumnHeader` — только в `StatGridColumn`,
`StatGridFooter` — только в `StatGrid`. Ограничения через `PARENT_ONLY`.

### В инспекторе

**StatGrid → Properties** — большой раздел с атрибутами:

- HTML attributes: `id`, `class`, `style`
- D3 Base: `name`, `caption`, `enabled`, `visible`, `hint`, `width`, `height`
- Data: `dataset`, `field`, `keyfield`, `returnfield`, `hintfield`
- StatGrid: `selectlist`, `settings_method`, `use_sort`, `excel`,
  `activerow`, `showfilter`, `extended_filter`, `filter_lines`,
  `white_space_nowrap`, `limit_row`, `show_selectcount`, `popupmenu`,
  `popupmenu_actions`

**StatGrid → Events**: 9 событий (см. раздел Events).

**StatGridColumn → Properties**: HTML, Column, Grouping, Sort,
Filter, Filter (units/combo), Other.

**StatSumm → Properties**: `field`, `index`, `summ_type`, `summ_caption`,
`summ_before`, `summ_after`, `summ_fixed`, `summ_postfix`.

**StatGridColumnHeader → Properties**: `cdata` (тип `code`,
модальный редактор HTML).

**StatGridFooter → Properties**: `separate`, `height`.

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

Порядок: `StatGrid` первым.

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

`_injectIdeStyle` не трогаем — все компоненты видимы.

`XML_SELF_CLOSE` не трогаем.

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

1. **`StatGridRow` не регистрируется в IDE.** Генерируется сервером
   как репитер внутри `StatGrid::Show()`. Пользователь его не
   добавляет вручную.

2. **`StatGridColumnHeader` — CDATA-контейнер.** Обязательно в
   `CDATA_CONTAINERS`, иначе пробелы в HTML заголовка схлопнутся.

3. **`StatSumm` работает только внутри `StatGridColumn`.**
   `parentOnly: cmpstatgridcolumn`. Суммы собираются клиентом
   в `dom.D3StatGrid.summ`.

4. **`group="true"` включает колонку в группировку.** Порядок
   группировки задаётся `grouporder`. Группировка управляется
   кликом по заголовку колонки (или через
   `D3Api.StatGridCtrl.addGroupField`).

5. **`selectlist` создаёт отдельную колонку.** Сервер добавляет
   её автоматически в начало таблицы. В IDE эта колонка не
   воспроизводится — только на сервере.

6. **`settings_method`** — имя JS-метода, вызываемого при клике
   на «шестерёнку». Если не задан — «шестерёнка» не появляется.

7. **`excel="true"`** — добавляет пункт «Выгрузить в Excel» в
   системное popup-меню. Клик вызывает
   `D3Api.StatGridCtrl.exportXLS`, который делает POST-запрос
   через `D3Form.sendRequest('statgrid', …)`.

8. **`extended_filter="true"`** — расширенный фильтр. Каждая
   колонка может задать `extended_filter="true"` для собственного
   фильтра в дополнительной строке.

9. **Профили Grid** — работают так же, как в `Grid`. Атрибуты
   `profile_hidden`, `group`, `grouporder` участвуют в профиле.
   Хранятся в `D3Form.getParamsByName('StatGrid', name)`.

10. **`use_sort` устанавливается автоматически.** Если у колонки
    задан `sort`, сервер выставит `use_sort = true` на корне
    `StatGrid` и создаст `<cmpSort name="<ds>_Sort"/>`.

11. **Итоговая строка (`groupsumm`).** Генерируется клиентом в
    рантайме, содержит суммы по группам. В превью IDE не
    воспроизводится.

12. **`limit_row`** — ограничение количества строк. Работает через
    `D3Store.limit_row` и `enablingDataRowLimit`.

13. **`show_selectcount`** — работает совместно с `selectlist`.
    Если `selectlist` не задан — атрибут игнорируется.

14. **`popupmenu` и `popupmenu_actions`** — генерируются сервером
    автоматически, если не заданы. В инспекторе поля доступны
    для явного указания.

15. **`white_space_nowrap="true"`** — устанавливает `white-space:
    nowrap` на строку репитера. В превью не воспроизводится.

---

## Чек-лист добавления нового экземпляра

1. В палитре выбрать **D3 → StatGrid**.
2. В инспекторе задать:
    - `name`, `caption`, `dataset` (обязательные);
    - `keyfield`, `returnfield`, `hintfield` (по необходимости);
    - `selectlist` (если нужно множественное выделение);
    - `excel="true"` (если нужна выгрузка);
    - `activerow="true"` (для подсветки активной строки);
    - `showfilter="true"` (показать панель фильтров сразу);
    - `extended_filter="true"` + `filter_lines` (для расширенных
      фильтров);
    - `show_selectcount="true"` (для счётчика отмеченных).
3. Добавить внутрь `StatGrid` нужные `StatGridColumn` через
   палитру.
4. У каждой `StatGridColumn` задать:
    - `field`, `caption` (обязательные);
    - `width`, `align` (по необходимости);
    - `group="true"` + `grouporder` (если колонка участвует в
      группировке);
    - `sort`, `sortorder` (если колонка сортируемая);
    - `filter`, `filterkind`, `condition`, `like` (если колонка
      фильтруемая);
    - `extended_filter="true"` (если нужен расширенный фильтр);
    - `profile_hidden="true"` (если колонка скрыта по умолчанию).
5. В колонки, где нужны суммы, добавить `StatSumm` с указанием
   `field`, `index` и `summ_type`.
6. При необходимости — добавить `StatGridColumnHeader` для
   HTML-заголовка колонки.
7. Добавить `StatGridFooter` в подвал StatGrid (опционально).
8. При необходимости — привязать события `onchange`, `onfilter`,
   `onprofile_change` на `StatGrid`.
9. Проверить в дереве: `cmpStatGrid` → `cmpStatGridColumn` →
   `cmpStatSumm` / `cmpStatGridColumnHeader`; `cmpStatGridFooter`
   отдельно внутри `cmpStatGrid`.
10. Проверить в canvas: StatGrid должен отобразить заголовок,
    полосу группировки (если есть), шапку колонок, пример строк,
    подвал.

---

## См. также

- `Component/d3/Grid/README.md` — обычный (неаналитический) Grid
- `Component/d3/Column/README.md` — колонка обычного Grid
- `Component/d3/Sort/README.md` — хелпер сортировки, используемый
  при `use_sort="true"`
- `Component/d3/SortItem/README.md` — элемент сортировки в колонке
- `Component/d3/SelectList/README.md` — для `selectlist`
- `Component/d3/Filter/README.md` — фильтры колонок
- `StatGridCtrl.inc` — серверный код (`StatGrid`, `StatGridColumn`,
  `StatGridColumnHeader`, `StatGridFooter`, `StatSumm`)
- `StatGrid.js` — клиентский `D3Api.StatGridCtrl`
- `StatGrid.css` — стили аналитического Grid
