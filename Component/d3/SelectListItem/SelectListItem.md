# cmpSelectListItem

Чекбокс-элемент для массового выбора записей. В рантайме рендерит
`<input type="checkbox" class="SelectListItem">`, который
встраивается в ячейку Grid-колонки или Tree-колонки.

Связь с родительским `cmpSelectList` устанавливается через атрибут
`selectlist` — это **не** DOM-иерархия. Поэтому `SelectListItem`
может жить в любом контейнере: в `<td>` Grid, в колонке Tree, в
произвольном `<div>`. Главное — чтобы атрибут `selectlist`
указывал на существующий `SelectList`.

Клик по чекбоксу отправляет `addValue`/`delValue` в связанный
`SelectList`, который пересчитывает своё состояние (`state0` /
`state1` / `state2`).

---

## Расположение

```
Component/d3/SelectListItem/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `SelectListCtrl.inc` | class `SelectListItem extends BaseCtrl` |
| `SelectListCtrlTraits.inc` | трейт `SelectListItemTrait` |
| `SelectList.js` | `D3Api.SelectListItemCtrl` |
| `SelectList.css` | стиль `input.SelectListItem` |

---

## Тег и ID

- **XML-тег:** `cmpSelectListItem`
- **Регистрация в IDE:** `id: 'd3.selectlistitem'`
- **Категория:** D3
- **Вид в палитре:** `SelectListItem`
- **Видимость:** видимый (рендерит чекбокс в canvas)
- **parentOnly:** не ограничен — компонент может быть вставлен в
  любую колонку Grid / Tree или другой контейнер

---

## Разметка в рантайме

Серверный `SelectListItem::Show()` (через трейт) генерирует:

```html
<input type="checkbox"
       class="SelectListItem"
       data="value:id;caption:caption"
       selectlist="SL1"
       item_value=""
       item_caption=""
       onchange="D3Api.stopEvent(event);"
       onclick="D3Api.SelectListItemCtrl.onMouseClick(this);"
       onmousedown="D3Api.SelectListItemCtrl.onMouseDown(this);"/>
```

Особенности:

- `type="checkbox"` — сервер ставит тип в `__construct`.
- `data` — генерируется из `fields` (по умолчанию `id,caption`):
  `value:<fields[0]>;caption:<fields[1]>`.
- `onchange` гасит нативное событие — клик обрабатывается через
  `onclick`.
- `onmousedown` вызывает `D3Api.stopEvent()`, чтобы клик не
  выделял текст и не срабатывал на родительских элементах.
- `item_value` и `item_caption` заполняются при клонировании
  репитера (Grid row / Tree row) на основе `data`.

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`, `title`

### D3 Base
- `name`, `enabled`, `visible`, `hint`

### SelectListItem
- **`selectlist`** — имя связанного `cmpSelectList` (по его
  атрибуту `name`)
- **`fields`** — `value,caption` (по умолчанию `id,caption`).
  Первое значение идёт в `value`, второе — в `caption`
- **`item_value`** — значение элемента. Обычно заполняется
  автоматически при клонировании (из DataSet)
- **`item_caption`** — подпись. Также заполняется автоматически
- **`state`** — `true` / `false` — установлена ли галочка
- **`readonly`** — `true` — блокирует изменение. Используется
  для «постоянных» значений, которые нельзя снять

### Events
- `onclick`, `ondblclick`, `onmouseover`, `onmouseout`

Системные `onclick` и `onmousedown` навешиваются сервером и
совмещаются с пользовательскими (пользовательский выполняется
**до** системного).

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`.

---

## Формат атрибутов

| Атрибут | Тип | Описание |
|---|---|---|
| `name` | string | Имя контрола. Используется как `[name="<name>_Item"]` в `SelectList` при `usedom` |
| `selectlist` | string | Имя связанного `SelectList`. Обязательно |
| `fields` | string | `value,caption`. Пример: `"id,sf_name"` |
| `item_value` | string | Значение. Заполняется автоматически при клонировании |
| `item_caption` | string | Подпись. Заполняется автоматически |
| `state` | boolean | `true` — галочка установлена |
| `readonly` | boolean | `true` — чекбокс заблокирован |
| `enabled` | boolean | `false` — `disabled` на `<input>` |
| `visible` | boolean | `false` — чекбокс скрыт |

---

## Логика работы

### Инициализация

`D3Api.SelectListItemCtrl.init(dom)`:

1. Читает `selectlist` из атрибута.
2. Добавляет класс `SelectListItem`.
3. Сохраняет ссылку на контрол `SelectList` через
   `D3Form.getControl(sl)`.
4. Сохраняет `D3SelectListItem = { selectlist: <контрол> }`.

### Клик (`onMouseClick`)

1. Вызывает `setState(dom, dom.checked)`:
    - записывает `state` в `checked`;
    - вызывает `addValue` / `delValue` в родительском `SelectList`
      (с флагом `internal=true`, чтобы не было рекурсии).
2. Вызывает у `SelectList` событие `onselect` или `onunselect`
   с аргументом `value`.
3. Если `SelectList.type === 'tree'` и `selectChilds === true` —
   вызывает `checkChilds(dom)`:
    - рекурсивно обходит всех потомков `TreeRow`;
    - для каждого находит `SelectListItem` и переключает его
      так же.

### Нажатие мыши (`onMouseDown`)

Всегда вызывает `D3Api.stopEvent()` — блокирует выделение текста
и всплытие события.

### Состояние (`setState`)

```js
this.setState = function(dom, state) {
    dom.checked = state;
    if (!dom.D3SelectListItem.selectlist) return;

    if (state)
        D3Api.SelectListCtrl.addValue(
            dom.D3SelectListItem.selectlist,
            D3Api.SelectListItemCtrl.getValue(dom),
            D3Api.SelectListItemCtrl.getCaption(dom),
            true  // internal
        );
    else
        D3Api.SelectListCtrl.delValue(
            dom.D3SelectListItem.selectlist,
            D3Api.SelectListItemCtrl.getValue(dom),
            true
        );
};
```

### Значение и подпись

- `getValue(dom)` / `setValue(dom, value)` — читают/пишут
  атрибут `item_value`.
- `getCaption(dom)` / `setCaption(dom, value)` — читают/пишут
  атрибут `item_caption`.

### Readonly

`setReadonly(dom, value)`:

- `true` — ставит `readonly` + `disabled` на `<input>`;
- `false` — снимает оба.

Обычно используется для «постоянных» значений из
`SelectList.pdata`.

---

## Примеры использования

### 1. В колонке Grid

```xml
<cmpGrid name="GRID_HH" dataset="DS_HH">
    <cmpColumn name="" field="code" caption="Код"/>
    <cmpColumn name="" field="name" caption="Наименование"/>
    <cmpColumn name="" caption="Выбор" width="40">
        <cmpSelectListItem name="sl_item"
                           selectlist="SL1"
                           fields="id,sf_name"/>
    </cmpColumn>
    <cmpGridFooter separate="false">
        <cmpSelectList name="SL1" dataset="DS_HH" fields="id,sf_name"/>
        <cmpRange dataset="DS_HH" default_amount="10"/>
    </cmpGridFooter>
</cmpGrid>
```

Колонка «Выбор» получает чекбокс в каждой строке. Чекбокс
связан с `SelectList` `SL1` через атрибут `selectlist`.

### 2. В колонке Tree (иерархия)

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

При клике на родительский узел выбираются все потомки
(см. `checkChilds`).

### 3. Автоматическая колонка через `selectlist`

Если у `Grid` задан атрибут `selectlist="<field>"`, сервер сам
создаёт колонку с `SelectListItem`:

```xml
<cmpGrid name="GRID_HH" dataset="DS_HH" selectlist="id" keyfield="id">
    <cmpColumn name="" field="code" caption="Код"/>
    <cmpColumn name="" field="name" caption="Наименование"/>
    <cmpGridFooter separate="false">
        <cmpSelectList name="SL1" dataset="DS_HH" fields="id,sf_name"/>
        <cmpRange dataset="DS_HH" default_amount="10"/>
    </cmpGridFooter>
</cmpGrid>
```

IDE не воспроизводит этот механизм — колонка создаётся на
сервере. В IDE пользователь может добавить `SelectListItem`
вручную, если нужен кастомный вид.

### 4. Программное управление

```js
var item = getControl('sl_item');

// Установить значение
D3Api.SelectListItemCtrl.setValue(item, 42);

// Прочитать значение
var v = D3Api.SelectListItemCtrl.getValue(item);

// Прочитать подпись
var c = D3Api.SelectListItemCtrl.getCaption(item);

// Установить состояние
D3Api.SelectListItemCtrl.setState(item, true);

// Заблокировать
D3Api.SelectListItemCtrl.setReadonly(item, true);
```

### 5. Реакция на выбор

События `onselect` / `onunselect` навешиваются не на
`SelectListItem`, а на родительский `SelectList`. Аргумент —
значение элемента:

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

### 6. Readonly для постоянных значений

```js
// Пометить элемент как readonly (например, если он входит
// в permanent_value у SelectList)
D3Api.SelectListItemCtrl.setReadonly(getControl('sl_item'), true);
```

После этого клик по чекбоксу не будет переключать состояние.

### 7. Стилизация

```xml
<cmpSelectListItem name="sl_item" selectlist="SL1"
                   class="my-checkbox"
                   style="margin-left: 5px;"/>
```

CSS в форме:

```css
input.SelectListItem.my-checkbox {
    transform: scale(1.2);
}
```

### 8. Скрытие/показ

```xml
<cmpSelectListItem name="sl_item" selectlist="SL1" visible="false"/>
```

Показать позже:

```js
setControlProperty('sl_item', 'visible', true);
```

---

## Поведение в IDE

Компонент **видимый**. В canvas отображается обычный чекбокс:

```
☐
```

### В дереве

`SelectListItem` обычно живёт внутри колонки Grid или Tree:

```
cmpGrid name="GRID_HH" dataset="DS_HH"
  cmpColumn name="" field="code" caption="Код"
  cmpColumn name="" field="name" caption="Наименование"
  cmpColumn name="" caption="Выбор" width="40"
    cmpSelectListItem name="sl_item" selectlist="SL1" fields="id,sf_name"
  cmpGridFooter name=""
    cmpSelectList name="SL1" dataset="DS_HH" fields="id,sf_name"
    cmpRange dataset="DS_HH" default_amount="10"
```

В дереве `cmpSelectListItem` виден отдельным узлом под колонкой.
Связь с `SelectList` (через `selectlist`) в дереве не показывается —
это логическая связь, не иерархическая.

### В инспекторе

- HTML attributes: `id`, `class`, `style`, `title`
- D3 Base: `name`, `enabled`, `visible`, `hint`
- SelectListItem: `selectlist`, `fields`, `item_value`,
  `item_caption`, `state`, `readonly`
- Events: `OnClick`, `OnDblClick`, `OnMouseOver`, `OnMouseOut`
- Styles: полный набор CSS-свойств

Изменение `state` в инспекторе немедленно отражается в чекбоксе
в canvas.

### Ограничения

- **Клик в canvas не работает** — превью неинтерактивно
  (`input.disabled = true`).
- **Связь с `SelectList` не отображается визуально** — для
  проверки используйте инспектор: атрибут `selectlist` должен
  совпадать с `name` соответствующего `SelectList`.
- **`item_value` / `item_caption` в IDE пустые** — они
  заполняются только в рантайме при клонировании.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 controls**:

```html
<script src="Component/d3/SelectList/index.js"></script>
<script src="Component/d3/SelectListItem/index.js"></script>
```

Порядок: `SelectList` до `SelectListItem`.

### Правки в `ide/canvas.js`

**`CMP_TAGS`:**

```js
'cmpselectlist':     'cmpSelectList',
'cmpselectlistitem': 'cmpSelectListItem',
```

`_injectIdeStyle` не трогаем — `SelectListItem` видим.

`XML_SELF_CLOSE` не трогаем — `SelectListItem` контейнерный
(в рантайме `<input>`, но IDE сериализует как `<cmpSelectListItem …></cmpSelectListItem>`).

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmpselectlist':     'cmpSelectList',
'cmpselectlistitem': 'cmpSelectListItem',
```

### `PARENT_ONLY`

**Не трогаем.** `SelectListItem` может быть вставлен в любую
колонку Grid / Tree или в произвольный контейнер. Связь с
`SelectList` идёт через атрибут `selectlist`, а не через DOM.

---

## Известные ограничения

1. **`selectlist` — обязательный атрибут.** Без него `init`
   не найдёт родительский `SelectList`, и клик по чекбоксу
   не будет работать. Имя должно точно совпадать с `name`
   соответствующего `cmpSelectList`.

2. **`fields` должен совпадать с `SelectList.fields`.** Если у
   `SelectListItem` один `fields`, а у `SelectList` — другой,
   значения могут не сойтись. В типовых формах оба задаются
   одинаково: `fields="id,sf_name"`.

3. **`item_value` / `item_caption` заполняются на клиенте.**
   В серверном коде они не формируются автоматически; при
   клонировании репитера (Grid row / Tree row) DataSet
   предоставляет данные, атрибут `data` (`value:id;caption:caption`)
   определяет маппинг. Сервер не пишет эти атрибуты при создании
   `<input>` — они появляются после `onafter_clone`.

4. **`onMouseDown` всегда блокирует событие.** Он вызывает
   `D3Api.stopEvent()` — нативное выделение текста и всплытие
   отключаются. Если нужно своё поведение на `mousedown`, оно
   добавляется через `+`-конкатенацию, но после системного.

5. **`onMouseClick` вызывает `setState(dom, dom.checked)`.** Это
   значит, что состояние читается из `input.checked` в момент
   клика. Браузер успевает переключить `checked` до обработчика
   `onclick`, поэтому система работает корректно.

6. **`setState` с `internal=true`** — используется внутри
   `SelectList` при массовых операциях (`checkAll`,
   `unCheckAll`), чтобы не было рекурсии. Внешние вызовы
   `setState` тоже работают, но через `internal=false` могут
   вызвать каскадные события.

7. **`setReadonly` ставит одновременно `readonly` и `disabled`.**
   Это отличается от обычного `<input readonly>` —
   `disabled` блокирует и клик, и фокус. Используется для
   «постоянных» значений из `SelectList.pdata`.

8. **`checkChilds` работает только с `Tree`.** Он ищет
   родительский `TreeRow` и `Tree` через `getControlByDom`. Вне
   `Tree` этот код не выполняется (или падает, если
   `getControlByDom` вернёт `null`). Обязательно наличие
   `Tree`-контекста, если `type="tree"` и `selectChilds="true"`.

9. **`enabled="false"` даёт `disabled` на `<input>`,**
   `readonly="true"` — `readonly` + `disabled`. Разница
   семантическая: `readonly` означает «значение нельзя
   изменить, но оно есть», `enabled=false` — «элемент выключен».

10. **Связь через `selectlist` не ограничивает вложенность.**
    `SelectListItem` может лежать в любом месте формы, главное —
    совпадение имени. Но в типовых формах он живёт внутри
    колонки Grid или Tree.

11. **Стилизация `input.SelectListItem`.** Готовый CSS
    определяет только `vertical-align: middle`. Остальное —
    на усмотрение пользователя. В IDE превью использует
    `accent-color: #1e88e5` для синей галочки.

---

## Чек-лист добавления нового экземпляра

1. Убедиться, что существует соответствующий `cmpSelectList`
   с заданным `name`.
2. В палитре выбрать **D3 → SelectListItem**.
3. Поместить в колонку Grid или Tree (или другой контейнер).
4. В инспекторе задать:
    - `name` — имя контрола (например `sl_item`);
    - `selectlist` — имя родительского `SelectList` (например `SL1`);
    - `fields` — должно совпадать с `fields` у `SelectList`
      (например `id,sf_name`);
    - при необходимости `readonly="true"`, `enabled="false"`,
      `visible="false"`.
5. При необходимости привязать `onclick` / `ondblclick`.
6. Проверить в canvas: должен отображаться чекбокс.
7. Проверить в дереве: `cmpSelectListItem` — узел внутри
   колонки; связь с `SelectList` — через атрибут `selectlist`.
8. В рантайме: клик по чекбоксу должен отправлять значения в
   `SelectList`, а `SelectList` — пересчитывать `state`.

---

## См. также

- `Component/d3/SelectList/README.md` — родительский компонент
- `Component/d3/Grid/README.md` — типовое место применения
  (колонка Grid)
- `Component/d3/Tree/README.md` — для иерархического режима
- `SelectListCtrl.inc` — серверный код `SelectListItem`
- `SelectListCtrlTraits.inc` — трейт `SelectListItemTrait`
- `SelectList.js` — клиентский `D3Api.SelectListItemCtrl`
- `SelectList.css` — стиль `input.SelectListItem`
