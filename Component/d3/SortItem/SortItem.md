# cmpSortItem

Индикатор сортировки в колонке Grid. В рантайме рендерит `<div
class="sort_item">` с двумя стрелками (вверх / вниз) и номером
уровня сортировки. По клику переключает состояние:

```
none  →  asc  →  desc  →  none
```

Текущее состояние хранится в атрибуте `sortorder`:
- `null` — сортировка не активна;
- `1` — ascending (по возрастанию);
- `-1` — descending (по убыванию);
- `N` — уровень сортировки (когда полей несколько).

При клике `D3Api.SortItemCtrl.setSort` обновляет состояние,
регистрируется в связанном `cmpSort` и вызывает пересортировку
DataSet-а.

---

## Расположение

```
Component/d3/SortItem/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `SortCtrl.inc` | class `SortItem extends BaseCtrl` |
| `Sort.js` | `D3Api.SortItemCtrl` |
| `Sort.css` | Стили `.sort_item`, `.sort_block`, `.sort_level`, `.sort-ordernone/asc/desc` |

---

## Тег и ID

- **XML-тег:** `cmpSortItem`
- **Регистрация в IDE:** `id: 'd3.sortitem'`
- **Категория:** D3
- **Вид в палитре:** `SortItem`
- **Видимость:** видимый (рендерит иконку в canvas)
- **parentOnly:** не ограничен. Обычно внутри `cmpColumn`, но
  сервер проверяет родителя сам при рендере

---

## Разметка в рантайме

Серверный `SortItem::Show()` собирает:

```html
<div class="sort_item sort-ordernone"
     name="DS_HH_code_SortItem"
     field="code"
     refreshdataset="DS_HH"
     title="Сортировать колонку: Код"
     onclick="D3Api.SortItemCtrl.setSort(this);">
  <div class="sort_block">
    <cmpLabel name="DS_HH_code_SortItem_level"
              caption=""
              style="position: absolute;"
              class="sort_level"/>
  </div>
</div>
```

Особенности:

- Корень — `<div class="sort_item">` с CSS-классом состояния
  (`sort-ordernone` / `sort-orderasc` / `sort-orderdesc`).
- Внутри — `<div class="sort_block">` с вложенным `<cmpLabel
  class="sort_level">`, который показывает номер уровня сортировки
  (когда полей несколько).
- `title` добавляется, если `use_in_view="true"` — тултип
  «Сортировать колонку: <caption>».
- `onclick` навешивается через `extendEvent` — пользовательский
  обработчик выполняется **до** системного
  `D3Api.SortItemCtrl.setSort`.

Если `constant="true"`, сервер добавляет `style="display:none;"` —
элемент скрыт, но сортировка по полю активна и не снимается через UI.

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`, `title`

### D3 Base
- `name`, `enabled`, `visible`, `hint`

### SortItem
- **`field`** — имя поля сортировки (обязательное)
- **`refreshdataset`** — DataSet, который пересортировывается
  по клику
- **`sortorder`** — текущее состояние: `null | 1 | -1 | N`
- **`constant`** — `true` — скрыть элемент (используется для
  постоянной сортировки)
- **`use_in_view`** — `true` — добавить title-подсказку

### Events
- `onclick`, `ondblclick`

Системный `onclick` (`D3Api.SortItemCtrl.setSort(this)`) навешивается
сервером через `extendEvent`. Пользовательский выполняется **до**
системного.

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`.

---

## Формат атрибутов

| Атрибут | Тип | Описание |
|---|---|---|
| `name` | string | Имя контрола. Если не задано — сервер формирует `<refreshdataset>_<field>_SortItem` |
| `field` | string | Поле сортировки. Обязательное |
| `refreshdataset` | string | Имя DataSet. Если не задано — берётся через `getDataSet($this)` (по родителю) |
| `sortorder` | number | `null` / `1` / `-1` / `N` — текущее состояние |
| `constant` | boolean | `true` — скрыть элемент; сортировка остаётся активной |
| `use_in_view` | boolean | `true` — добавить tooltip «Сортировать колонку: <caption>» |

---

## Логика работы

### Инициализация (`init`)

`D3Api.SortItemCtrl.init(dom)`:

1. Читает `refreshdataset`. Если пусто — выходит.
2. Находит DataSet через `D3Form.getDataSet(dsn)`.
3. Регистрирует поле через `ds.addSortItem(name, field)`.
4. Если `sortorder` уже задан (`1`, `-1` или `N`) — вызывает
   `register(dom)` и `setClass(dom)`, чтобы сразу показать
   правильное состояние.

### Клик (`setSort`)

`D3Api.SortItemCtrl.setSort(dom)`:

1. Читает текущее `sortorder`:
    - **`-1`** (desc) → сбрасывает в `null` (нет сортировки),
      обновляет hint на «Отсортировать по возрастанию», вызывает
      `colibrate(dom, 1)`;
    - **`1`** (asc) → ставит `-1` (desc), hint на «Убрать
      сортировку»;
    - **другое** (null / 0 / не число) → ставит `1` (asc), hint на
      «Отсортировать по убыванию», вызывает `colibrate(dom, 2)`.
2. Вызывает `register(dom)` — добавляет себя в список `Sort`.
3. Вызывает `setClass(dom)` — обновляет CSS-класс.
4. Вызывает `dom.D3Form.refreshDataSet(ds)` — пересортировка.

### Регистрация (`register`)

Добавляет имя `SortItem` в `sortitems` связанного `cmpSort`:

```js
var _con_name = _ds + '_Sort';                // DS_HH_Sort
var _reg_items = dom.D3Form.getControlProperty(_con_name, 'items');
if (_reg_items.indexOf(_name) == -1)
    dom.D3Form.setControlProperty(_con_name, 'items', _reg_items + _name + ';');
```

Формат `items` — `';'`-разделённый список с завершающей `';'`.

### Обновление CSS-класса (`setClass`)

1. Снимает все классы состояний (`sort-orderasc`,
   `sort-orderdesc`, `sort-nextsort`, `sort-ordernone`).
2. По значению `sortorder`:
    - `> 0` → `sort-orderasc`, уровень = значение;
    - `< 0` → `sort-orderdesc`, уровень = `|значение|`;
    - `0` → `sort-nextsort` (не используется на практике);
    - `null` / пусто → `sort-ordernone`, уровень пустой.
3. Ставит новый класс.
4. Обновляет caption `<cmpLabel name="<name>_level">` — туда
   пишется номер уровня.

### Пересчёт уровней (`colibrate`)

Вызывается при добавлении новой сортировки к DataSet-у:

1. Собирает все активные `SortItem`-ы (кроме текущего и
   `constant`-ов).
2. Сортирует их по `Math.abs(value)` (текущий уровень).
3. Перенумеровывает уровни: `_new_ind`, `_new_ind + 1`, …,
   сохраняя знаки (`+` / `-`).
4. Обновляет CSS-классы и уровни для каждого.

Это позволяет корректно отображать нумерацию сортировки «1, 2, 3»,
когда выбрано несколько полей.

---

## Примеры использования

### 1. Простая колонка с сортировкой

```xml
<cmpGrid name="GRID_HH" dataset="DS_HH">
    <cmpColumn name="" field="code" caption="Код" sort="code">
        <cmpSortItem name="DS_HH_code_SortItem"
                     field="code"
                     refreshdataset="DS_HH"
                     use_in_view="true"/>
    </cmpColumn>
    <cmpColumn name="" field="name" caption="Наименование" sort="name">
        <cmpSortItem name="DS_HH_name_SortItem"
                     field="name"
                     refreshdataset="DS_HH"
                     use_in_view="true"/>
    </cmpColumn>
    <cmpGridFooter separate="false">
        <cmpRange dataset="DS_HH" default_amount="10"/>
    </cmpGridFooter>
</cmpGrid>

<cmpSort name="DS_HH_Sort"/>
```

Клик по иконке сортировки в колонке переключает состояние и
вызывает `refreshDataSet('DS_HH')`.

### 2. Автоматическая генерация

Обычно `SortItem` создаётся сервером автоматически при наличии
`sort` у колонки Grid. В этом случае в IDE можно увидеть его в
дереве под колонкой.

### 3. Постоянная сортировка

```xml
<cmpColumn name="" field="id" caption="ID">
    <cmpSortItem name="DS_HH_id_SortItem"
                 field="id"
                 refreshdataset="DS_HH"
                 sortorder="1"
                 constant="true"/>
</cmpColumn>
```

Элемент скрыт (`style="display:none"`), но сортировка по `id`
активна. Пользователь не может её снять через UI. Уровень в
нумерации такие `SortItem`-ы не занимают (см. `colibrate`).

### 4. Несколько полей сортировки

```xml
<cmpColumn name="" field="code" caption="Код">
    <cmpSortItem name="DS_HH_code_SortItem"
                 field="code"
                 refreshdataset="DS_HH"
                 sortorder="1"/>
</cmpColumn>
<cmpColumn name="" field="name" caption="Наименование">
    <cmpSortItem name="DS_HH_name_SortItem"
                 field="name"
                 refreshdataset="DS_HH"
                 sortorder="-2"/>
</cmpColumn>
```

Означает: `code` — по возрастанию (уровень 1),
`name` — по убыванию (уровень 2). Номера показываются в правом
верхнем углу иконки.

### 5. Программное управление

```js
var item = getControl('DS_HH_code_SortItem');

// Установить состояние
D3Api.SortItemCtrl.setValue(item, 1);   // asc
D3Api.SortItemCtrl.setValue(item, -1);  // desc
D3Api.SortItemCtrl.setValue(item, null); // сброс

// Применить сортировку
D3Api.SortItemCtrl.setSort(item);

// Обновить CSS-класс вручную
D3Api.SortItemCtrl.setClass(item);
```

### 6. Реакция на клик

```xml
<cmpSortItem name="DS_HH_code_SortItem"
             field="code"
             refreshdataset="DS_HH"
             onclick="Form.onSortClick(this);"/>
```

```js
Form.onSortClick = function(item) {
    // Срабатывает до системного setSort
    console.log('Клик по сортировке поля:',
                D3Api.getProperty(item, 'field'));
};
```

Системный `setSort` выполнится после пользовательского.

### 7. Только для чтения

```xml
<cmpSortItem name="DS_HH_code_SortItem"
             field="code"
             refreshdataset="DS_HH"
             sortorder="1"
             enabled="false"/>
```

Иконка отображается с активной сортировкой, но клик не работает.

### 8. Скрытие без потери сортировки

```xml
<cmpSortItem name="DS_HH_code_SortItem"
             field="code"
             refreshdataset="DS_HH"
             sortorder="1"
             visible="false"/>
```

В отличие от `constant="true"`, здесь `visible="false"` — элемент
скрыт на уровне D3 Base, но `setClass` и `colibrate` его учитывают
как обычный.

---

## Поведение в IDE

Компонент **видимый**. В canvas отображается иконка сортировки
в зависимости от `sortorder`:

```
ordonne     asc       desc
   ▲         ▲         ▲
   ▬         ▬         ▬
   ▬         ▼         ▼
            (тёмн.)   (тёмн.)
```

Точнее: иконка состоит из двух стрелок (вверх / вниз).
- `sort-ordernone` — обе стрелки серые;
- `sort-orderasc` — верхняя стрелка тёмная;
- `sort-orderdesc` — нижняя стрелка тёмная.

Если `sortorder` задан числом (`1`, `-1`, `2`, `-3`), в правом
верхнем углу показывается абсолютное значение — номер уровня.

Если `constant="true"` — элемент невидим (`visibility: hidden;
width: 0; height: 0`).

### В дереве

```
cmpGrid name="GRID_HH" dataset="DS_HH"
  cmpColumn name="" field="code" caption="Код"
    cmpSortItem name="DS_HH_code_SortItem" field="code" refreshdataset="DS_HH"
  cmpColumn name="" field="name" caption="Наименование"
    cmpSortItem name="DS_HH_name_SortItem" field="name" refreshdataset="DS_HH"
```

`cmpSortItem` — узел внутри колонки Grid.

### В инспекторе

- HTML attributes: `id`, `class`, `style`, `title`
- D3 Base: `name`, `enabled`, `visible`, `hint`
- SortItem: `field`, `refreshdataset`, `sortorder`, `constant`, `use_in_view`
- Events: `OnClick`, `OnDblClick`
- Styles: полный набор CSS-свойств

Изменение `sortorder` в инспекторе немедленно отражается в иконке.

### Ограничения

- **Клик в canvas не работает** — превью неинтерактивно.
  Реальное переключение — только в рантайме.
- **`refreshdataset` лучше задавать явно** — без него сервер
  пытается вычислить DataSet по родителю, что может привести к
  ошибке при нестандартной иерархии.
- **`colibrate` не воспроизводится** — в превью не показывается
  нумерация уровней при нескольких активных сортировках. Это
  видно только в рантайме.

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

**`CMP_TAGS`:**

```js
'cmpsort':     'cmpSort',
'cmpsortitem': 'cmpSortItem',
```

`_injectIdeStyle` не трогаем — `SortItem` видим.

`XML_SELF_CLOSE` не трогаем — `SortItem` контейнерный
(в рантайме содержит `<div class="sort_block">` и `<cmpLabel>`).

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmpsort':     'cmpSort',
'cmpsortitem': 'cmpSortItem',
```

### `PARENT_ONLY`

**Не трогаем.** В типовых формах `SortItem` кладётся внутрь
`<cmpColumn>` Grid, но сервер сам проверяет родителя при рендере.
В IDE пользователь может вставить его в любое место — ошибок не
будет, просто в рантайме он не сработает.

---

## Известные ограничения

1. **`field` обязателен.** Без него `SortItemCtrl.init` не
   зарегистрирует поле и клик не сработает.

2. **`refreshdataset` желательно задавать явно.** Если его нет,
   сервер попытается вычислить DataSet через `getDataSet($this)`.
   В большинстве случаев это работает, но при сложной иерархии
   (несколько вложенных Grid) может дать неверный результат.

3. **`sortorder` — число, а не boolean.** Значение `1` —
   ascending, `-1` — descending, `N > 1` — уровень при
   множественной сортировке, `null` — сортировка не активна.

4. **`name` должен быть уникальным.** По нему `register` пишет
   в `sortitems` связанного `Sort`, и `sortitems.indexOf(name)`
   проверяет дубликаты. Если два `SortItem` имеют одно имя —
   второй не зарегистрируется.

5. **`constant="true"` исключает из `colibrate`.** Такие
   `SortItem`-ы не занимают уровни и не учитываются при
   перенумерации. Это позволяет иметь «фиксированные» сортировки
   (например, по `id`), которые всегда активны, но не сбивают
   нумерацию пользовательских.

6. **`setSort` не перерисовывает весь `SortItem` заново.** Он
   только переключает CSS-класс и обновляет caption уровня. Если
   понадобится сбросить состояние полностью — используйте
   `D3Api.SortItemCtrl.setValue(item, null)` +
   `setClass(item)` + `refreshDataSet`.

7. **`colibrate(dom, newInd)` вызывается при каждом клике** — он
   пересчитывает уровни всех активных `SortItem`-ов. Если у вас
   много сортируемых полей, каждый клик даёт N операций. При
   типовом использовании (2-5 полей) это незаметно.

8. **`onclick` совмещается с системным.** Сервер навешивает
   `D3Api.SortItemCtrl.setSort(this)` через `extendEvent`.
   Пользовательский `onclick` срабатывает **до** системного.
   Если нужно предотвратить переключение — вернуть `false`
   (текущая реализация `setSort` не проверяет возврат).

9. **`sort-nextsort` — не используется.** Это промежуточное
   состояние, оставшееся от более ранней версии логики. В
   превью оно отображается как нейтральная иконка.

10. **Иконка серверная.** `Sort.css` использует спрайт
    `~CmpSort/sort` (три позиции по вертикали: 0, -28, -56).
    В IDE превью рисует стрелки через CSS — без картинки. Это
    позволяет избежать загрузки серверных путей в iframe.

11. **`use_in_view="true"`** добавляет `title` с подсказкой
    «Сортировать колонку: <caption>». Требует, чтобы у
    родительской колонки был `caption` — иначе подсказка будет
    пустая.

12. **`enabled="false"` и `visible="false"`** — стандартные
    атрибуты D3 Base. В серверном коде `SortItem` их отдельно
    не обрабатывает — они применяются через `BaseCtrl`. В
    превью отражаются через CSS.

13. **`cmpSortItem` и `cmpSort`** — обычно создаются сервером
    автоматически при наличии `sort` у колонок Grid. В IDE
    пользователь может увидеть их в дереве, но добавлять вручную
    стоит только при работе с XML напрямую.

---

## Чек-лист добавления нового экземпляра

1. Убедиться, что в форме есть связанный `cmpSort` с именем
   `<refreshdataset>_Sort` (или он будет создан сервером
   автоматически при использовании `sort` у Grid).
2. В палитре выбрать **D3 → SortItem**.
3. Поместить в колонку Grid (или другое место, но обычно
   в колонку).
4. В инспекторе задать:
    - `name` — имя контрола (или оставить пустым — сервер
      сформирует `<refreshdataset>_<field>_SortItem`);
    - `field` — поле сортировки (обязательное);
    - `refreshdataset` — DataSet, к которому привязана сортировка;
    - `sortorder` — начальное состояние (`null` / `1` / `-1` / `N`);
    - `constant="true"` — если сортировка не должна сниматься
      пользователем;
    - `use_in_view="true"` — если нужна подсказка.
5. При необходимости привязать `onclick` (сработает до
   системного `setSort`).
6. Проверить в canvas: должна отобразиться иконка сортировки в
   правильном состоянии.
7. Проверить в дереве: `cmpSortItem` — узел внутри колонки.
8. В рантайме: клик по иконке должен переключать состояние и
   вызывать `refreshDataSet`.

---

## См. также

- `Component/d3/Sort/README.md` — хелпер `Sort`, в который
  регистрируется `SortItem`
- `Component/d3/Grid/README.md` — типовое место применения
  (колонки Grid)
- `Component/d3/Column/README.md` — колонка, внутри которой
  кладётся `SortItem`
- `Component/d3/DataSet/README.md` — DataSet, к которому
  привязана сортировка
- `SortCtrl.inc` — серверный код `SortItem`
- `Sort.js` — клиентский `D3Api.SortItemCtrl`
- `Sort.css` — стили `.sort_item`, `.sort_block`, `.sort_level`
