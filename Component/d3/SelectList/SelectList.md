# cmpSelectList

«Мастер-чекбокс» с тремя состояниями для массового выбора записей
в DataSet. В рантайме рендерит `<div class="selectlist">` размером
17×17 с фоновой иконкой галочки.

Состояния (CSS-классы):

- **`state0`** — ничего не выбрано (пустая иконка);
- **`state1`** — выбрана часть (серая галочка);
- **`state2`** — выбрано всё (зелёная галочка).

Клик по иконке переключает между «выбрать всё» и «снять всё».
Отдельные элементы выбора — компоненты `cmpSelectListItem`,
которые встраиваются в ячейки Grid-колонок и связываются с
`SelectList` через атрибут `selectlist` (не через DOM-иерархию).

---

## Расположение

```
Component/d3/SelectList/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)

Component/d3/SelectListItem/
index.js
README.md
images/icon.png
css/preview.css
js/
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `SelectListCtrl.inc` | class `SelectList extends BaseCtrl` и class `SelectListItem extends BaseCtrl` |
| `SelectListCtrlTraits.inc` | Трейты `SelectListTrait` и `SelectListItemTrait` |
| `SelectList.js` | `D3Api.SelectListCtrl` и `D3Api.SelectListItemCtrl` |
| `SelectList.css` | Стили `.selectlist`, `.state0/1/2`, `input.SelectListItem` |

---

## Тег и ID

- **XML-тег:** `cmpSelectList`
- **Регистрация в IDE:** `id: 'd3.selectlist'`
- **Категория:** D3
- **Вид в палитре:** `SelectList`
- **Видимость:** видимый (рендерит иконку в canvas)
- **Связанные компоненты:** `cmpSelectListItem`

---

## Разметка в рантайме

Серверный `SelectList::Show()` собирает:

```html
<div class="selectlist" dataset="DS_HH" fields="id,caption"
     onclick="D3Api.SelectListCtrl.onMouseClick(this);"></div>
```

Если `SelectList` находится внутри `Column`, сервер добавляет
`selectlist="true"` в родительскую колонку — это маркер для Grid.

Клиентский `D3Api.SelectListCtrl.init`:

1. Инициализирует `D3SelectList` (`data`, `pdata`, `values_count`,
   `state`, `allc`, `name`, `fields`, `dataset`, `type`, `usedom`,
   `selectChilds`).
2. Добавляет класс `state0`.
3. Находит DataSet через `D3Form.getDataSet(dataset)`.
4. Подписывается на `onafter_refresh` DataSet → `setCheckedValues`.

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`

### D3 Base
- `name`, `enabled`, `visible`, `hint`

### SelectList
- **`dataset`** — DataSet, с которым работает выбор
- **`fields`** — `value,caption` (по умолчанию `id,caption`).
  Первое значение — поле для `value`, второе — для `caption`
- **`type`** — `''` | `'tree'`. В режиме `tree` работает
  иерархический выбор (см. `select_childs`)
- **`select_childs`** — `true` — при клике на родительский узел
  выбирать всех потомков (только при `type="tree"`)
- **`usedom`** — `true` — собирать значения из DOM (всех клонов
  `SelectListItem`), а не из DataSet
- **`state`** — `0` | `1` | `2` — текущее состояние галочки.
  Обычно управляется клиентом, редко задаётся вручную

### Events
- **`onchange`** — изменилось состояние галочки (state 0↔1↔2)
- **`onupdate`** — любое обновление `SelectList`
- **`onselect`** — выбран отдельный элемент. Аргумент: `value`
- **`onunselect`** — снят выбор с элемента. Аргумент: `value`
- `onclick`, `ondblclick` — стандартные

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`.

---

## Формат атрибутов

| Атрибут | Тип | Описание |
|---|---|---|
| `name` | string | Имя контрола. Используется для связи с `SelectListItem` через атрибут `selectlist` |
| `dataset` | string | Имя DataSet. Если не задан — берётся через `getDataSet($this)` от родительского Grid |
| `fields` | string | `value,caption`. Пример: `"id,sf_name"` — первое поле идёт в `value`, второе в `caption` |
| `type` | string | `'tree'` — иерархический режим (для работы с `Tree`) |
| `select_childs` | string | `'true'` — выбирать детей при выборе родителя (только `type="tree"`) |
| `usedom` | string | `'true'` — брать значения из DOM, а не через DataSet |
| `state` | number | `0` / `1` / `2` — начальное состояние |

---

## Связь с `SelectListItem`

`SelectList` и `SelectListItem` — не иерархические компоненты:
`SelectListItem` не обязан быть ребёнком `SelectList` в DOM.

**Связь устанавливается через атрибут `selectlist`** у `SelectListItem`.
Значение — имя `name` соответствующего `SelectList`.

Типовое применение — `SelectList` рядом с Grid, `SelectListItem`
внутри Grid-колонки:

```xml
<cmpGrid name="GRID_HH" dataset="DS_HH">
    <cmpColumn name="" field="code" caption="Код"/>
    <cmpColumn name="" field="name" caption="Наименование"/>
    <cmpColumn name="" caption="Выбор" width="40">
        <cmpSelectListItem name="sl_item" selectlist="SL1"
                           item_value="" item_caption=""/>
    </cmpColumn>
    <cmpGridFooter separate="false">
        <cmpSelectList name="SL1" dataset="DS_HH" fields="id,sf_name"/>
        <cmpRange dataset="DS_HH" default_amount="10"/>
    </cmpGridFooter>
</cmpGrid>
```

При клике по строке Grid клиент заполняет `item_value` и
`item_caption` клона `SelectListItem`, а также его `checked`
state. Дальнейшие клики по чекбоксу отправляют `addValue` /
`delValue` в `SelectList`.

---

## Логика работы

### Состояния (`state`)

`SelectList` пересчитывает состояние автоматически при каждом
изменении `values_count` (см. `updateState`):

- `state0` — `values_count === 0`;
- `state1` — `0 < values_count < allc`;
- `state2` — `values_count >= allc`.

При смене состояния:

- снимается класс `state<old>`, добавляется класс `state<new>`;
- через `setControlPropertyByDom(dom, 'state', state)` обновляется
  атрибут;
- вызывается `onchange`;
- всегда вызывается `onupdate`.

### Выбор всех (`checkAll`)

1. Если `usedom` — собирает значения из всех клонов
   `SelectListItem` в DOM (по `[name="<name>_Item"][isclone]`).
2. Иначе — вызывает `dataset.refreshByMode('fields', {fields: …})`
   для получения всех значений.
3. Для каждого значения вызывает `addValue(dom, value, caption)`.
4. По окончании — `updateState`.

### Снятие всего (`unCheckAll`)

1. Для каждого сохранённого значения находит `SelectListItem` и
   вызывает `setControlPropertyByDom(item, 'state', false)`.
2. Очищает `data` и `values_count`.
3. Вызывает `updateState`.

### Ручное управление (`SelectListItem`)

`D3Api.SelectListItemCtrl.onMouseClick(dom)`:

1. Вызывает `setState(dom, dom.checked)` — обновляет состояние
   чекбокса.
2. Через `addValue` / `delValue` пишет/удаляет значение в
   родительском `SelectList`.
3. Вызывает у `SelectList` событие `onselect` / `onunselect`.
4. Если `type="tree"` и `select_childs` — рекурсивно обходит
   всех потомков и переключает их так же.

### Значения

- **`value`** — `;`-разделённый список **непостоянных** выбранных
  значений (`data` без `pdata`);
- **`permanent_value`** — `;`-разделённый список **постоянных**
  значений (`pdata`) — те, что выбраны на сервере и не могут быть
  сняты пользователем;
- **`caption`** — `;`-разделённый список подписей (`data[v]`);
- **`data`** — объект `{value → caption}`;
- **`state`** — текущее состояние галочки (`0/1/2`).

---

## Примеры использования

### 1. Простой выбор строк Grid

```xml
<cmpGrid name="GRID_HH" dataset="DS_HH" selectlist="id">
    <cmpColumn name="" field="id"   caption="ID"/>
    <cmpColumn name="" field="name" caption="Наименование"/>
    <cmpGridFooter separate="false">
        <cmpSelectList name="SL1" dataset="DS_HH" fields="id,name"/>
        <cmpRange dataset="DS_HH" default_amount="10"/>
    </cmpGridFooter>
</cmpGrid>
```

Сервер сам создаст колонку SelectList внутри Grid (через `selectlist="id"`), а `SelectList` в подвале будет управлять массовым выбором.

### 2. Ручное размещение SelectListItem в колонке

```xml
<cmpGrid name="GRID_HH" dataset="DS_HH">
    <cmpColumn name="" field="code" caption="Код"/>
    <cmpColumn name="" field="name" caption="Наименование"/>
    <cmpColumn name="" caption="Выбор" width="40">
        <cmpSelectListItem name="sl_item" selectlist="SL1" fields="id,caption"/>
    </cmpColumn>
    <cmpGridFooter separate="false">
        <cmpSelectList name="SL1" dataset="DS_HH"/>
        <cmpRange dataset="DS_HH" default_amount="10"/>
    </cmpGridFooter>
</cmpGrid>
```

### 3. Иерархический выбор (Tree)

```xml
<cmpTree name="TR1" dataset="DS_TREE">
    <cmpTreeColumn name="" field="name" caption="Наименование"/>
    <cmpTreeColumn name="" caption="Выбор" width="40">
        <cmpSelectListItem name="sl_item" selectlist="SL1"/>
    </cmpTreeColumn>
</cmpTree>

<cmpSelectList name="SL1" dataset="DS_TREE"
               type="tree" select_childs="true"/>
```

При клике на родительский узел выберутся все потомки.

### 4. Программное управление

```js
var sl = getControl('SL1');

// Выбрать конкретное значение
D3Api.SelectListCtrl.addValue(sl, 42, 'Позиция 42');

// Снять выбор
D3Api.SelectListCtrl.delValue(sl, 42);

// Выбрать всё
D3Api.SelectListCtrl.checkAll(sl);

// Снять всё
D3Api.SelectListCtrl.unCheckAll(sl);

// Получить выбранные значения (непостоянные)
var values = D3Api.SelectListCtrl.getValue(sl);

// Получить все выбранные значения (включая постоянные)
var all = D3Api.SelectListCtrl.getValue(sl, true);

// Получить подписи
var captions = D3Api.SelectListCtrl.getCaption(sl);

// Установить состояние галочки
D3Api.SelectListCtrl.setState(sl, 2);
```

### 5. Реакция на смену состояния

```xml
<cmpSelectList name="SL1" dataset="DS_HH"
               onchange="Form.onSelectionChange(arguments[0]);"/>
```

```js
Form.onSelectionChange = function(state) {
    console.log('Новое состояние:', state); // 0, 1 или 2
};
```

### 6. Реакция на выбор отдельного элемента

```xml
<cmpSelectList name="SL1" dataset="DS_HH"
               onselect="Form.onItemSelected(arguments[0]);"
               onunselect="Form.onItemUnselected(arguments[0]);"/>
```

```js
Form.onItemSelected = function(value) {
    console.log('Выбрано:', value);
};
Form.onItemUnselected = function(value) {
    console.log('Снят выбор:', value);
};
```

### 7. Постоянные значения

```js
// Задать значения, которые нельзя снять
D3Api.SelectListCtrl.setPermanentValue(sl, '1;2;3');

// Прочитать их
var pv = D3Api.SelectListCtrl.getPermanentValue(sl);
```

В UI такие значения будут отмечены, а чекбокс у соответствующих `SelectListItem` — `readonly`.

### 8. Работа с DataSet через API

```js
var sl = getControl('SL1');

// Обновить список значений из DataSet
D3Api.SelectListCtrl.checkAll(sl);

// Записать выбранные значения в DataSet
D3Api.SelectListCtrl.setValue(sl, '1;2;5');
```

### 9. Проверить состояние

```js
var state = D3Api.SelectListCtrl.getState(sl);
// state: 0 — ничего, 1 — частично, 2 — всё
```

### 10. Полный объект data

```js
var data = D3Api.SelectListCtrl.getData(sl);
// { '1': 'Позиция 1', '2': 'Позиция 2', '5': 'Позиция 5' }
```

---

## Поведение в IDE

Компонент **видимый**. В canvas отображается иконка галочки
согласно атрибуту `state`:

**state0** (по умолчанию):

```
┌───┐
│   │
│   │
└───┘
```

**state1**:

```
┌───┐
│ ✓ │
│   │
└───┘
```

**state2**:

```
┌───┐
│✓✓ │
│   │
└───┘
```

### В дереве

```
cmpSelectList name="SL1" dataset="DS_HH" fields="id,caption" state="0"
```

Одна строка — `SelectList` обычно не имеет детей.

### В инспекторе

- HTML attributes: `id`, `class`, `style`
- D3 Base: `name`, `enabled`, `visible`, `hint`
- SelectList: `dataset`, `fields`, `type`, `select_childs`, `usedom`, `state`
- Events: `OnChange`, `OnUpdate`, `OnSelect`, `OnUnselect`, `OnClick`, `OnDblClick`
- Styles: полный набор CSS-свойств

Изменение `state` в инспекторе немедленно отражается в иконке.

### Ограничения

- **`SelectListItem` не отображается внутри `SelectList`** — они
  связаны через атрибут `selectlist`, а не через DOM.
- **Клик по иконке в canvas не работает** — превью неинтерактивно.
  Клик обрабатывается только в рантайме.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 controls**:

```html
<script src="Component/d3/SelectList/index.js"></script>
<script src="Component/d3/SelectListItem/index.js"></script>
```

### Правки в `ide/canvas.js`

**`CMP_TAGS`:**

```js
'cmpselectlist':     'cmpSelectList',
'cmpselectlistitem': 'cmpSelectListItem',
```

`_injectIdeStyle` не трогаем — компоненты видимы.

`XML_SELF_CLOSE` не трогаем — `SelectList` контейнерный,
`SelectListItem` самозакрывающийся (но IDE всё равно отрендерит
его как контейнерный — это нормально).

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmpselectlist':     'cmpSelectList',
'cmpselectlistitem': 'cmpSelectListItem',
```

### `PARENT_ONLY`

Не трогаем — `SelectListItem` может быть вставлен в любую колонку
Grid, Tree или в другое место. Связь с `SelectList` — через
атрибут `selectlist`.

---

## Известные ограничения

1. **`fields` — строка через запятую.** Если первое поле пусто —
   `addValue` проигнорирует значение (`D3Api.empty(value)`).
   Минимум: `fields="id,caption"`.

2. **`state` на сервере не формируется** — сервер только пишет
   атрибут `state="0"` при создании (в `create()`). Дальше
   состояние управляется клиентом (`updateState`). При загрузке
   формы из XML `state` можно задать вручную, но клиент
   пересчитает его после первого `refresh` DataSet.

3. **Порядок значений в `value`** — не гарантирован. `Object.keys`
   не сортирует значения. Если важен порядок — сортируйте
   самостоятельно в `getValue`.

4. **`usedom="true"` требует, чтобы все `SelectListItem` были
   уже отрисованы** в DOM (клоны репитера). Если список ещё
   пуст — `checkAll` выберет 0 значений.

5. **`select_childs` работает только с `Tree`.** Привязка к
   иерархии идёт через `D3Api.getControlByDom(DOM, 'TreeRow')` и
   `D3Api.getControlByDom(DOM, 'Tree')`. Вне `Tree` этот режим
   не сработает.

6. **`onupdate` вызывается чаще, чем `onchange`.** `onupdate`
   срабатывает при любом изменении `values_count` (включая
   промежуточные состояния во время `checkAll`). `onchange` —
   только при фактической смене `state` (0↔1↔2).

7. **`getValue(dom)` без второго аргумента** возвращает только
   **непостоянные** значения — те, что не в `pdata`. Для всех
   выбранных используйте `getValue(dom, true)`.

8. **`setValue` не сбрасывает предыдущее состояние** — добавляет
   новые значения к уже имеющимся. Для полной замены сначала
   вызовите `unCheckAll`.

9. **`SelectListItem.readonly`** — блокирует клик. В серверном
   коде `setReadonly` ставит `readonly` + `disabled` на `<input>`.
   Используется для `permanent_value` — выбранных на сервере
   значений, которые нельзя снять пользователю.

10. **Клиентский `onMouseDown` у `SelectListItem`** — всегда
    вызывает `D3Api.stopEvent()`, чтобы клик не выделял текст и
    не срабатывал на родительских элементах. Пользователь может
    добавить свой `onmousedown` — он выполнится после системного.

11. **`onMouseClick` вызывает `setState(dom, dom.checked)`** —
    то есть `state` в `SelectListItemCtrl` совпадает с
    `input.checked`. Если `input` не выбран — `addValue` не
    вызовется. Это работает, потому что клик по `<input type=checkbox>`
    меняет `checked` до `mouseup`, но системный `onmousedown`
    гасит `preventDefault`-ом нативные события браузера, и
    `checked` обновляется вручную в `onMouseClick`.

12. **`state` у `SelectList` и `checked` у `SelectListItem`** —
    разные вещи. `state` — это агрегат (0/1/2), `checked` —
    конкретная галочка.

---

## Чек-лист добавления нового экземпляра

1. В палитре выбрать **D3 → SelectList**.
2. В инспекторе задать:
    - `name` — имя контрола (обязательно, если планируется связь
      с `SelectListItem`);
    - `dataset` — DataSet для работы с данными;
    - `fields` — `value,caption`;
    - при необходимости `type="tree"`, `select_childs`, `usedom`.
3. Добавить в Grid/Tree колонку с `SelectListItem` через палитру.
4. У `SelectListItem` задать:
    - `name` — имя элемента;
    - `selectlist` — имя соответствующего `SelectList`;
    - `fields` — должно совпадать с `SelectList.fields`;
    - `readonly` — если элемент нельзя менять.
5. При необходимости привязать события:
    - `onchange` на `SelectList` — реакция на смену состояния;
    - `onselect` / `onunselect` на `SelectList` — реакции на
      отдельные элементы.
6. Проверить в canvas: `SelectList` отображается как иконка
   с правильным `state`; `SelectListItem` — как чекбокс.
7. Для программного управления использовать:
   ```js
   var sl = getControl('<name>');
   D3Api.SelectListCtrl.checkAll(sl);
   D3Api.SelectListCtrl.unCheckAll(sl);
   D3Api.SelectListCtrl.getValue(sl);
   D3Api.SelectListCtrl.getValue(sl, true);
   ```

---

## См. также

- `Component/d3/SelectListItem/README.md` — элемент выбора
- `Component/d3/Grid/README.md` — типовое место применения
- `Component/d3/Tree/README.md` — для иерархического режима
- `SelectListCtrl.inc` — серверный код
- `SelectListCtrlTraits.inc` — трейты `SelectListTrait` и
  `SelectListItemTrait`
- `SelectList.js` — клиентские контролы
- `SelectList.css` — стили `.selectlist`, `.state0/1/2`
