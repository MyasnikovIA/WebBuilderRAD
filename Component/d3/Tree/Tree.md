# cmpTree

Иерархический Grid с раскрытием/сворачиванием узлов. Структурно
повторяет `cmpGrid`, но добавляет:

- **иерархию** — `keyfield` + `parentfield` + `childsfield` + `root`;
- **раскрытие узлов** — кнопка `btnOC` с состояниями `opened` /
  `closed` / `nochilds`;
- **режимы** — `simple`, `fulldata`, `opened`, `list`;
- **выгрузку в ODS** (`excel="true"`);
- **профили** через `popupmenu` (скрытие/порядок колонок, ширины);
- **фильтры и сортировку** через `FilterItem` / `SortItem`.

`Tree` — видимый контрол. Управляется клиентским контролом
`D3Api.TreeCtrl`. `TreeRow` (строка-репитер) генерируется сервером,
в IDE не регистрируется.

---

## Расположение

```
Component/d3/Tree/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)

Component/d3/TreeColumn/
Component/d3/TreeFooter/
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `TreeCtrl.inc` | классы `Tree`, `TreeColumn`, `TreeFooter` |
| `Tree.js` | `D3Api.TreeCtrl`, `D3Api.TreeRowCtrl` |
| `Tree.css` | стили `.tree`, `.tree_header`, `.tree_columns`, `.tree_data`, `btnOC`, `.tree_filters`, `.tree_footer` |

---

## Тег и ID

- **XML-тег:** `cmpTree`
- **Регистрация в IDE:** `id: 'd3.tree'`
- **Категория:** D3
- **Вид в палитре:** `Tree`
- **Видимость:** видимый (рендерит разметку в canvas)
- **Дочерние компоненты:** `cmpTreeColumn`, `cmpTreeFooter`

---

## Разметка в рантайме

Серверный `Tree::Show()` собирает (упрощённо):

```html
<div class="tree box-sizing-force" tabindex="0" …>
  <div class="tree_header" cont="treecaption">
    <div class="tree_settings"></div>
    <span cont="treecaptioncontent">Caption</span>
    <cmpButton class="btn_actions" onclick="…PopupMenuCtrl.showPopupMenu(…)"/>
  </div>

  <div class="tree_columns" cont="treecolumnscont">
    <table class="tree_columns" cont="treecolumns">
      <colgroup>…</colgroup>
      <tbody>
        <tr cont="treecolumnscaption" oncreate="D3Api.TreeCtrl.headerSizerInit(this)">
          <td class="column_caption">…</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="tree_data_cont">
    <div class="tree_data" cont="treedatacont">
      <div class="tree_data_info" cont="treedatainfo"></div>
      <table class="tree_data" cont="treedata" cmpparse="Tree" ondblclick="…">
        <colgroup>…</colgroup>
        <tbody>
          <tr cmptype="TreeRow" class="node closed"
              cont="treerow" onlycreate="true" repeat="0"
              name="<name>_Row" repeatername="<name>_repeater"
              keyfield="…" data="value:id"
              onmousedown="D3Api.TreeCtrl.setActiveRow(this);">
            <td class="column_data firstnode">
              <div class="btnOC" onclick="…toggleNode(this);"></div>
              <cmpLabel data="caption:name"/>
            </td>
            …
          </tr>
        </tbody>
      </table>

      <div class="tree_filters" cont="treefilter">
        <table class="tree_filters">…</table>
        <div class="filterPanel" cont="treefilterpanel">…кнопки фильтра…</div>
      </div>
    </div>
  </div>

  <div class="tree_footer">…</div>

  <div class="tree_params_cont" cont="tree_params_cont"
       onmousedown="D3Api.TreeCtrl.stopPopup(event);"></div>
</div>
```

Плюс сервер автоматически создаёт `cmpPopupMenu` для действий и
профилей.

Первая колонка данных получает класс `firstnode` и дополнительный
`<div class="btnOC">` — кнопку раскрытия.

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`

### D3 Base
- `name`, `caption`, `enabled`, `visible`, `hint`, `width`, `height`

### Data
- **`dataset`** — DataSet.
- **`keyfield`** — ключевое поле узла.
- **`parentfield`** — поле-родитель (по нему строится иерархия).
- **`childsfield`** — поле «есть ли дети» (0/1). Используется для
  классов `nochilds`.
- **`parentvar`** — имя переменной формы для `parentvalue`.
- **`root`** — значение корня. Пусто — корни имеют `parentvalue=null`.
- **`returnfield`** — поле для `returnvalue` активной строки.
- **`hintfield`** — поле tooltip-а.

### Tree
- **`simple`** — `true` — простой режим клонирования строк.
- **`fulldata`** — `true` — все данные загружены сразу (без
  догрузки детей при раскрытии).
- **`opened`** — `true` — раскрывать узлы по умолчанию (для `fulldata`).
- **`list`** — `true` — переключатель «список/дерево» (пункт меню).
- **`maxlevels`** — максимальный уровень вложенности (0 — без
  ограничения; для `fulldata` — 100).
- **`selectlist`** — поля SelectList (`;`-разделённые) для
  множественного выбора.
- **`select_childs`** — `true` — при выборе родителя отмечать всех
  детей.
- **`excel`** — `true` — пункт «Выгрузить таблицу» (ODS).
- **`profile`** — `true` — включить профили.
- **`popupmenu`** — имя `PopupMenu` (создаётся автоматически, если
  не задано).
- **`popupmenu_actions`** — служебный PopupMenu действий.
- **`settings_method`** — JS-метод, вызываемый при клике на
  «шестерёнку».
- **`showfilter`** — `true` — показать панель фильтров сразу.
- **`white_space_nowrap`** — `true` — не переносить строки.
- **`max_lines`** — обрезка длинного текста в колонке (line-clamp).
- **`columns_to_sum`** — колонки для суммирования при экспорте.
- **`limit_row`** — `true` — ограничение на количество строк.
- **`popup_log_unit`** — код юнита для пункта «Журнал изменений
  записи».

### Events
- `oncreate`, `onshow`, `onafter_refresh`, `onrefresh`
- `onchange` — смена активной строки
- `onopen_node`, `onopen_node_after` — раскрытие узла
- `onclose_node`, `onclose_node_after` — сворачивание узла
- `onprofile_change` — смена профиля
- `onclick`, `ondblclick` — клики (dblclick переопределён сервером
  на `toggleNode`)

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`.

---

## Дочерние компоненты

### `cmpTreeColumn`

Колонка Tree. Атрибуты: `field`, `caption`, `width`, `align`,
`sort`, `sortorder`, `filter`, `filterkind`, `upper`, `condition`,
`like`, `funit` / `fmethod` / `fcomposition` / `fcontent` /
`fdataset` / `fdata` / `fdefault`, `format`, `excelfield`,
`colspanfield`, `hint`, `profile_hidden`, `keep`, `fixed`,
`not_append_ds`. `parentOnly: cmptree`.

### `cmpTreeFooter`

Подвал Tree. `separate`, `height`. `parentOnly: cmptree`.

### `TreeRow` (не регистрируется в IDE)

Репитер строк. Создаётся сервером в `Tree::Show()`. Содержит `td`
для каждой колонки + `div.btnOC` в первой.

---

## Примеры использования

### 1. Простое дерево

```xml
<cmpTree name="TR1" dataset="DS_TREE" caption="Каталоги"
         keyfield="id" parentfield="pid" root="">
  <cmpTreeColumn name="" field="name" caption="Наименование"/>
  <cmpTreeColumn name="" field="code" caption="Код"/>
</cmpTree>
```

`DS_TREE` содержит `id`, `pid`, `name`, `code`. Корни — записи с
`pid = null` (или `pid = root`).

### 2. Дерево с полной загрузкой

```xml
<cmpTree name="TR1" dataset="DS_TREE" caption="Каталоги"
         keyfield="id" parentfield="pid"
         fulldata="true" opened="true">
  <cmpTreeColumn name="" field="name" caption="Наименование"/>
</cmpTree>
```

Все данные загружаются одним запросом, узлы раскрываются
автоматически.

### 3. Дерево с фильтрами и сортировкой

```xml
<cmpTree name="TR1" dataset="DS_TREE" caption="Каталоги"
         keyfield="id" parentfield="pid">
  <cmpTreeColumn name="" field="code" caption="Код"
                 sort="code" filter="code"/>
  <cmpTreeColumn name="" field="name" caption="Наименование"
                 sort="name" filter="name" condition="like" like="both"/>
</cmpTree>
```

### 4. С множественным выбором

```xml
<cmpTree name="TR1" dataset="DS_TREE" caption="Каталоги"
         keyfield="id" parentfield="pid"
         selectlist="id" select_childs="true"
         childsfield="has_children">
  <cmpTreeColumn name="" field="name" caption="Наименование"/>
</cmpTree>
```

При выборе родителя отмечаются все потомки. Колонка SelectList
создаётся автоматически в первой колонке.

### 5. С экспортом в ODS

```xml
<cmpTree name="TR1" dataset="DS_TREE" caption="Каталоги"
         keyfield="id" parentfield="pid" excel="true">
  <cmpTreeColumn name="" field="name" caption="Наименование"/>
  <cmpTreeColumn name="" field="amount" caption="Сумма"/>
</cmpTree>
```

В системном popup-меню появится пункт «Выгрузить таблицу».
Клик вызывает `D3Api.TreeCtrl.exportTBS`.

### 6. С подвалом

```xml
<cmpTree name="TR1" dataset="DS_TREE" caption="Каталоги"
         keyfield="id" parentfield="pid">
  <cmpTreeColumn name="" field="name" caption="Наименование"/>
  <cmpTreeFooter separate="false">
    Данные за текущий период
  </cmpTreeFooter>
</cmpTree>
```

### 7. Программное управление

```js
var tr = getControl('TR1');

// Активная строка
var row = D3Api.TreeCtrl.getActiveRow(tr);
var value = D3Api.TreeCtrl.getValue(tr);

// Навигация
D3Api.TreeCtrl.getNextRow(tr);
D3Api.TreeCtrl.getPreviousRow(tr);
D3Api.TreeCtrl.getNearRow(tr);

// Раскрытие узла
var row = D3Api.TreeCtrl.getActiveRow(tr);
D3Api.TreeCtrl.toggleNode(row);

// Установка/чтение значений
D3Api.TreeCtrl.setValue(tr, 42);
var v = D3Api.TreeCtrl.getValue(tr);

// Позиционирование
D3Api.TreeCtrl.setLocate(tr, 42);
```

### 8. Раскрытие/сворачивание через API

```js
var tr = getControl('TR1');
var row = D3Api.TreeCtrl.getRowByKey(tr, 42);
D3Api.TreeCtrl.showNode(tr, row, true);   // раскрыть
D3Api.TreeCtrl.showNode(tr, row, false);  // свернуть
```

### 9. Переключение режима «список»

```js
D3Api.TreeCtrl.toggleList(getControl('TR1'));
```

### 10. Обновление узла

```js
D3Api.TreeCtrl.refreshNode(getControl('TR1'), 42, 100);
```

Сбрасывает флаг `loaded`, сворачивает узел и переоткрывает его
заново — например, после изменения данных.

### 11. Профили

```js
var tr = getControl('TR1');

// Установить профиль
D3Api.TreeCtrl.setProfile(tr, 'По умолчанию', true);

// Открыть редактор профилей
D3Api.TreeCtrl.openProfile(tr);
```

### 12. Экспорт

```js
D3Api.TreeCtrl.exportTBS(getControl('TR1'));
```

---

## Поведение в IDE

Компонент **видимый**. В canvas отображается статичный «скелет»:

```
┌──────────────────────────────────────────────┐
│ Tree                                         │
├──────────────┬──────────────┬────────────────┤
│ Код ⇅        │ Наименование │ Дата           │
├──────────────┼──────────────┼────────────────┤
│ ⊖ Корень     │              │                │
│   · Ребёнок1 │              │                │
│   ⊕ Ребёнок2 │              │                │
│ ⊕ Узел2      │              │                │
├──────────────┴──────────────┴────────────────┤
│ (footer)                                     │
└──────────────────────────────────────────────┘
```

Кнопки `⊖` (`opened`) и `⊕` (`closed`) показываются у корней и
узлов с детьми. `TreeColumn` и `TreeFooter` внутри `Tree` не видны
(скрыты через CSS).

### В дереве

```
cmpTree name="TR1" dataset="DS_TREE" caption="Каталоги"
  cmpTreeColumn name="" field="name" caption="Наименование"
  cmpTreeColumn name="" field="code" caption="Код"
  cmpTreeFooter separate="false"
```

`TreeColumn` / `TreeFooter` перетаскиваются только в `Tree` —
ограничение `PARENT_ONLY`.

### В инспекторе

`Tree` — большой набор атрибутов (Data / Tree / Events). У `Tree`
9+ событий, включая `onopen_node`, `onclose_node`,
`onopen_node_after`, `onclose_node_after`.

`TreeColumn` — разделы HTML / D3 Base / Column / Sort / Filter /
Filter (units/combo) / Other.

`TreeFooter` — `separate`, `height`.

### Ограничения

- **`TreeRow` не виден в IDE** — генерируется сервером.
- **Реальные данные не отображаются** — только скелет.
- **Собственный preview у `TreeColumn`/`TreeFooter` отсутствует** —
  всё в родителе.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 controls**:

```html
<script src="Component/d3/Tree/index.js"></script>
<script src="Component/d3/TreeColumn/index.js"></script>
<script src="Component/d3/TreeFooter/index.js"></script>
```

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

`_injectIdeStyle` и `XML_SELF_CLOSE` не трогаем — все компоненты
видимы и контейнерные. `CDATA_CONTAINERS` тоже не трогаем.

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmptree':       'cmpTree',
'cmptreecolumn': 'cmpTreeColumn',
'cmptreefooter': 'cmpTreeFooter',
```

---

## Известные ограничения

1. **`keyfield` обязателен.** Без него иерархия не строится.

2. **`parentfield` обязателен.** Определяет связь «родитель →
   ребёнок».

3. **`root` — значение корня.** Пусто — корни имеют `parentvalue=null`.
   Если в DataSet корни помечены конкретным значением (например
   `0`), задайте `root="0"`.

4. **`childsfield`** — если задан, узлы с `childsfield=0` получают
   класс `nochilds` — кнопка раскрытия не показывается, попытка
   раскрыть игнорируется.

5. **`fulldata="true"`** — все данные загружаются одним запросом,
   без догрузки при раскрытии. Требует, чтобы DataSet вернул всю
   иерархию.

6. **`simple="true"`** — использует `simpleClone` вместо `addClone`.
   Служебный режим, используется в редких случаях.

7. **`opened="true"`** — раскрывать все узлы по умолчанию. Работает
   только с `fulldata="true"` или в режиме фильтрации.

8. **`maxlevels`** — ограничение уровня вложенности. Для
   `fulldata` — 100 по умолчанию, чтобы избежать бесконечного
   цикла на циклических данных.

9. **`selectlist` + `select_childs`** — при выборе родителя
   отмечаются все потомки (см. `checkChilds` в
   `SelectListItemCtrl`).

10. **`excel="true"`** — пункт «Выгрузить таблицу» появляется в
    системном popup-меню. Клик вызывает
    `D3Api.TreeCtrl.exportTBS`, который делает POST-запрос и
    скачивает `.ods`-файл.

11. **Профили Tree** — сохраняются через
    `D3Api.TreeCtrl.saveDefaultProfile` (POST на `request.php`).
    Хранятся в `core.v_form_grid_defprofiles` (общая таблица для
    Grid и Tree).

12. **`popup_log_unit`** — если задан, добавляется пункт «Журнал
    изменений записи» в системное popup-меню. Сервер проверяет
    права на `log` и существование юнита.

13. **`white_space_nowrap="true"`** — устанавливает `white-space:
    nowrap` на строку репитера.

14. **`max_lines`** — обрезка длинного текста в колонке. Работает
    через `line-clamp` с разной реализацией для IE / Firefox /
    остальных.

15. **`colspanfield`** — в колонке позволяет объединять ячейки по
    значению поля (см. `onAfterCloneColSpan`). Если у узла значение
    `>1`, ячейка растягивается на N колонок.

16. **`onclick` / `ondblclick` совмещаются с системными.**
    `ondblclick` переопределён сервером на `toggleNode`. Если
    задать свой `ondblclick`, он добавится после системного.

17. **Клавиатурная навигация.** `↑/↓` — переход между строками,
    `→/←` — раскрыть/свернуть, `Space` — popup-меню, `Enter` —
    двойной клик.

18. **Режим фильтрации** — `isFilterData` открывает все узлы,
    чтобы были видны результаты фильтра. После снятия фильтра —
    восстанавливается прежнее состояние.

19. **`limit_row`** — управляет `limit_row` в `D3Store` для
    ограничения количества строк при больших DataSet-ах.

20. **`checkUserAgent()`** — серверный метод, определяет браузер
    для разных реализаций `line-clamp`. На современных браузерах
    возвращает `false` (используется webkit-версия).

---

## Чек-лист добавления нового экземпляра

1. В палитре выбрать **D3 → Tree**.
2. В инспекторе задать:
    - `name`, `caption`, `dataset` (обязательные);
    - `keyfield`, `parentfield` (обязательные для иерархии);
    - `childsfield` — если есть поле с числом детей;
    - `root` — если корни помечены конкретным значением;
    - `returnfield`, `hintfield` — по необходимости;
    - `fulldata="true"` — для полной загрузки;
    - `opened="true"` — для раскрытия по умолчанию;
    - `selectlist` + `select_childs` — для множественного выбора;
    - `excel="true"` — для выгрузки в ODS;
    - `profile="true"` — для профилей;
    - `showfilter="true"` — для немедленного показа фильтров.
3. Добавить внутрь `Tree` нужные `TreeColumn` через палитру.
4. У каждой `TreeColumn` задать:
    - `field`, `caption` (обязательные);
    - `width`, `align` — по необходимости;
    - `sort`, `sortorder` — если сортируемая;
    - `filter`, `filterkind`, `condition`, `like` — если фильтруемая;
    - `format` — для форматирования значения;
    - `colspanfield` — если ячейка может объединять колонки;
    - `hint` — для tooltip;
    - `profile_hidden="true"` — если скрыта по умолчанию.
5. При необходимости добавить `TreeFooter` в подвал.
6. Привязать события `onchange`, `onopen_node`, `onclose_node` и др.
7. Проверить в дереве: `cmpTree` → `cmpTreeColumn` / `cmpTreeFooter`.
8. Проверить в canvas: должен отобразиться заголовок + шапка +
   пример иерархических строк + подвал.
9. В рантайме: клик по `⊖`/`⊕` раскрывает/сворачивает узел; двойной
   клик по строке тоже переключает узел.

---

## См. также

- `Component/d3/Grid/README.md` — обычный (неиерархический) Grid
- `Component/d3/TreeColumn/README.md` — колонка Tree
- `Component/d3/TreeFooter/README.md` — подвал Tree
- `Component/d3/SelectList/README.md` — множественный выбор
- `Component/d3/SelectListItem/README.md` — чекбокс в колонке
- `Component/d3/Sort/README.md` — сортировка
- `Component/d3/SortItem/README.md` — элемент сортировки
- `Component/d3/Filter/README.md` — фильтры
- `TreeCtrl.inc` — серверный код (`Tree`, `TreeColumn`, `TreeFooter`)
- `Tree.js` — клиентский `D3Api.TreeCtrl`
- `Tree.css` — стили
