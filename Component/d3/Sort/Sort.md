# cmpSort

Служебный невидимый контрол-хелпер сортировки. Связывает
`cmpSortItem`-ы (индикаторы сортировки в колонках Grid) с
DataSet-ом и хранит общий список сортируемых полей.

В рантайме рендерит `<div cmptype="Sort" style="display:none;">`.
Обычно создаётся автоматически сервером в `Grid::Show()` при
наличии атрибута `sort` у колонок или флага `usesort`.

Клиентский `D3Api.SortCtrl` — минимален: `getValue` / `setValue`
для `sortvalue`, `getItems` / `setItems` для `sortitems`. Вся
логика переключения сортировки — в `D3Api.SortItemCtrl`.

---

## Расположение

```
Component/d3/Sort/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)

Component/d3/SortItem/
index.js
README.md
images/icon.png
css/preview.css
js/
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `SortCtrl.inc` | class `SortItem extends BaseCtrl` |
| `Sort.js` | `D3Api.SortCtrl` и `D3Api.SortItemCtrl` |
| `Sort.css` | Стили `.sort_item`, `.sort-ordernone/asc/desc`, `.sort_block` |

---

## Тег и ID

- **XML-тег:** `cmpSort`
- **Регистрация в IDE:** `id: 'd3.sort'`
- **Категория:** D3
- **Вид в палитре:** `Sort`
- **Видимость:** невидимый (скрыт в canvas через `_injectIdeStyle`)

---

## Разметка в рантайме

Серверный код (в `Grid::Show()`) генерирует:

```html
<div cmptype="Sort" style="display:none;" name="DS_HH_Sort"></div>
```

Это «пустышка», в которую `D3Api.SortItemCtrl.register` пишет
имена зарегистрированных `SortItem`-ов. Формат:

- `sortitems` — `';'`-разделённый список имён, например
  `"DS_HH_code_SortItem;DS_HH_name_SortItem;"`;
- `sortvalue` — строка вида `"|code:1|name:-2"` — какие поля и с
  каким знаком сейчас сортируются.

Сам `<div>` скрыт, никаких DOM-манипуляций с ним не происходит.
Он нужен только как «хранилище» состояния сортировки для
текущего DataSet.

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`

### D3 Base
- **`name`** — имя контрола. Обычно `<dataset>_Sort` (например
  `DS_HH_Sort`). Именно по этому имени `SortItem.register` ищет
  хелпер, чтобы записать себя в список.

### Sort
- **`sortvalue`** — текущее значение сортировки. Формат:
  `"|field1:1|field2:-2"`. Положительное число — ascending,
  отрицательное — descending. Порядок значений — уровень
  сортировки.
- **`sortitems`** — `';'`-разделённый список имён `SortItem`-ов,
  зарегистрированных в этом хелпере.

### Events
Пусто.

### Styles
Пусто.

---

## Формат `sortvalue` и `sortitems`

### `sortitems`

Пример:

```
"DS_HH_code_SortItem;DS_HH_name_SortItem;DS_HH_date_SortItem;"
```

Пишется автоматически в `SortItemCtrl.register()` при первом
клике по `SortItem`. Завершающая `';'` — обязательна (используется
для `indexOf`-проверок).

### `sortvalue`

Пример:

```
"|code:1|name:-2"
```

Означает: `code` — по возрастанию (уровень 1), `name` — по
убыванию (уровень 2).

При снятии сортировки с поля — запись удаляется. Если сортировки
нет вообще — `sortvalue` пустой.

**Замечание.** В текущей реализации `SortItemCtrl` использует
только `items` (список зарегистрированных SortItem-ов) и значения
`sortorder` на самих `SortItem`. Поле `sortvalue` оставлено для
совместимости и внешнего API — визуальное состояние и сама
сортировка поддерживаются через отдельные контролы.

---

## Логика работы

`Sort` не имеет собственной логики на сервере и клиенте.
Единственное, что делает `D3Api.SortCtrl` — предоставляет
геттеры/сеттеры для двух атрибутов:

```js
D3Api.SortCtrl.getValue(dom)   // → sortvalue
D3Api.SortCtrl.setValue(dom, v)
D3Api.SortCtrl.getItems(dom)   // → sortitems
D3Api.SortCtrl.setItems(dom, v)
```

Все взаимодействия идут через `D3Api.SortItemCtrl`:

1. **`init(dom)`** — при инициализации `SortItem` регистрируется в
   DataSet через `ds.addSortItem(name, field)`.
2. **`setSort(dom)`** — при клике по `SortItem` переключает
   состояние (`none → asc → desc → none`), вызывает
   `register(dom)` для добавления в список `Sort`, обновляет
   CSS-класс и вызывает `refreshDataSet`.
3. **`colibrate(dom, newInd)`** — пересчитывает уровни всех
   активных сортировок, если к текущему полю добавлена ещё одна.

---

## Примеры использования

### 1. Автоматически через Grid

Сервер сам создаёт `Sort` в `Grid::Show()` при наличии у колонок
атрибута `sort`:

```xml
<cmpGrid name="GRID_HH" dataset="DS_HH">
    <cmpColumn name="" field="code" caption="Код"
               sort="code" filter="code"/>
    <cmpColumn name="" field="name" caption="Наименование"
               sort="name"/>
    <cmpGridFooter separate="false">
        <cmpRange dataset="DS_HH" default_amount="10"/>
    </cmpGridFooter>
</cmpGrid>
```

Сервер сгенерирует `<cmpSort name="DS_HH_Sort"/>` автоматически и
создаст `<cmpSortItem>` в колонках.

### 2. Вручную

Если пользователь пишет XML вручную (или через **Edit InnerHTML…**),
нужно явно добавить `Sort`:

```xml
<cmpSort name="DS_HH_Sort"/>

<cmpGrid name="GRID_HH" dataset="DS_HH">
    <cmpColumn name="" field="code" caption="Код">
        <cmpSortItem name="DS_HH_code_SortItem"
                     field="code"
                     refreshdataset="DS_HH"
                     use_in_view="true"/>
    </cmpColumn>
    <cmpColumn name="" field="name" caption="Наименование">
        <cmpSortItem name="DS_HH_name_SortItem"
                     field="name"
                     refreshdataset="DS_HH"
                     use_in_view="true"/>
    </cmpColumn>
</cmpGrid>
```

### 3. Программный доступ

```js
var sort = getControl('DS_HH_Sort');

// Текущее состояние сортировки
var value = D3Api.SortCtrl.getValue(sort);
// → "|code:1|name:-2"

// Список зарегистрированных SortItem
var items = D3Api.SortCtrl.getItems(sort);
// → "DS_HH_code_SortItem;DS_HH_name_SortItem;"
```

### 4. Отключение сортировки

```js
var sort = getControl('DS_HH_Sort');
D3Api.SortCtrl.setValue(sort, '');
D3Api.SortCtrl.setItems(sort, '');
```

Не пересчитывает DataSet — только сбрасывает состояние хелпера.
Реальная отмена сортировки — через `SortItem.setSort` или
`refreshDataSet`.

### 5. Постоянная сортировка (`constant="true"`)

```xml
<cmpSortItem name="DS_HH_id_SortItem"
             field="id"
             refreshdataset="DS_HH"
             sortorder="1"
             constant="true"/>
```

Сервер поставит `style="display:none"` — визуально элемент не
появится, но сортировка по полю `id` будет активна и её нельзя
будет снять через UI.

---

## Поведение в IDE

Компонент **невидимый**. После вставки ничего не появится.

### В дереве

```
cmpSort name="DS_HH_Sort"
```

Одна строка — детей нет.

### В инспекторе

- HTML attributes: `id`, `class`, `style`
- D3 Base: `name`
- Sort: `sortvalue`, `sortitems`
- Events: пусто
- Styles: пусто

### Ограничения

- **Не отображается в canvas** — только в дереве.
- **Не работает в одиночку** — нужны `SortItem`-ы, которые будут
  в него регистрироваться.
- **Обычно создаётся автоматически** — добавлять вручную стоит
  только при работе с XML напрямую.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 controls**:

```html
<script src="Component/d3/Sort/index.js"></script>
<script src="Component/d3/SortItem/index.js"></script>
```

Порядок: `Sort` до `SortItem`.

### Правки в `ide/canvas.js`

**`_injectIdeStyle`** — скрыть `cmpSort` в canvas:

```js
'cmpaction, cmpdataset, cmpscript, cmpmask, cmpbroker, ' +
'cmpcomment, cmpcompleter, cmpdependences, cmpfetch, ' +
'cmpfetchvar, cmplocate, cmpmodule, cmpmodulevar, ' +
'cmprepeaterstyler, cmpserverscript, cmpsort {' +
'  display: none !important; visibility: hidden !important;' +
'  pointer-events: none !important; user-select: none !important;' +
'}'
```

**`CMP_TAGS`**:

```js
'cmpsort':     'cmpSort',
'cmpsortitem': 'cmpSortItem',
```

`XML_SELF_CLOSE` и `CDATA_CONTAINERS` не трогаем — `Sort` и
`SortItem` не содержат CDATA-блока.

### Правки в `ide/app.js`

**`CMP_TAGS`**:

```js
'cmpsort':     'cmpSort',
'cmpsortitem': 'cmpSortItem',
```

### `PARENT_ONLY`

**Не трогаем.** `SortItem` обычно кладётся внутрь `<cmpColumn>`,
но IDE не запрещает вставить его в другое место — сервер сам
проверит родителя при рендере.

---

## Известные ограничения

1. **`Sort` не работает в одиночку.** Без `SortItem`-ов он
   бесполезен — `sortitems` останется пустым.

2. **`sortvalue` редко обновляется автоматически.** В текущей
   реализации `SortItemCtrl` ведёт состояние через `sortorder` на
   отдельных `SortItem` и `items` в `Sort`. `sortvalue` — для
   внешнего API (например, для сохранения в профиле Grid).

3. **`name` должен совпадать с именем, которое ищет `SortItem`.**
   В `SortItemCtrl.register` имя формируется как `<refreshdataset>_Sort`.
   Если у `Sort` другое `name` — регистрация не сработает.

4. **`sortitems` пишется с завершающей `';'`.** Это сделано для
   `indexOf`-проверок в `register`. Не убирайте последний символ
   вручную.

5. **`sortvalue` при отсутствии сортировки** — пустая строка
   `''`. `SortItemCtrl` это учитывает при разборе (см.
   `colibrate`).

6. **Обычно создаётся сервером.** В `Grid::Show()` при
   `usesort=true` автоматически генерируется
   `<cmpSort name="<ds>_Sort"/>`. В IDE пользователь добавляет
   вручную только если пишет XML напрямую.

7. **`SortItem` и постоянная сортировка.** Если у `SortItem`
   `constant="true"` и `sortorder != 0`, сервер ставит
   `style="display:none"` — элемент скрыт, но сортировка активна.
   `colibrate` учитывает `constant` и не сбрасывает такие
   `SortItem` при пересчёте уровней.

8. **Профиль Grid.** Профили Grid (в котором сортировка сохраняется)
   читают `sortvalue` из `Sort`. Если пользователь сбрасывает
   сортировку, `sortvalue` обновляется через
   `SortItemCtrl.setSort` — и профиль запишет новое состояние.

9. **Клиентский `SortCtrl` — минимален.** Все методы — только
   геттеры/сеттеры атрибутов. Если нужна логика сортировки — она
   в `SortItemCtrl` (см. `SortItem/README.md`).

10. **`cmpSortItem` не в `CDATA_CONTAINERS`.** `SortItem` содержит
    только текстовые подписи и иконки, не CDATA-блоки.

11. **`cmpSort` не имеет событий.** Даже `onclick`/`ondblclick`
    не навешиваются — элемент невидим. Если нужно реагировать на
    смену сортировки, слушайте `onchange` соответствующего
    `SortItem` или `DataSort` DataSet-а.

---

## Чек-лист добавления нового экземпляра

1. В палитре выбрать **D3 → Sort**.
2. В инспекторе задать `name` — обычно `<dataset>_Sort`
   (например `DS_HH_Sort`).
3. Проверить, что имя совпадает с тем, которое формирует
   `SortItemCtrl.register` (атрибут `refreshdataset` у каждого
   `SortItem` + суффикс `_Sort`).
4. Добавить в `Sort` не нужно ничего — он сам наполнится, когда
   пользователь кликнет по `SortItem`.
5. Проверить в дереве: `cmpSort` — одна строка.

---

## См. также

- `Component/d3/SortItem/README.md` — элемент сортировки,
  основной потребитель `Sort`
- `Component/d3/Grid/README.md` — типовое место появления `Sort`
  (генерируется автоматически в `Grid::Show()`)
- `Component/d3/Column/README.md` — колонка, внутри которой
  кладётся `SortItem`
- `SortCtrl.inc` — серверный код `SortItem` (класс `Sort` генерируется
  в Grid)
- `Sort.js` — клиентские контролы `D3Api.SortCtrl` и
  `D3Api.SortItemCtrl`
- `Sort.css` — стили `.sort_item`, `.sort_block`, `.sort_level`
