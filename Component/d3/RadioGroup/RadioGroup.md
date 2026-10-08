# cmpRadioGroup

Группа радиокнопок. В рантайме рендерит `<div class="ctrl_radiogroup">`
с `<form onsubmit="return false;">` и дочерними `cmpRadioItem`, каждая
из которых — `<input type="radio">` с подписью.

Поддерживает два режима:

- `vertical` (по умолчанию) — кнопки столбиком;
- `gorizontal` — кнопки в строку. Именно `gorizontal` (с опечаткой в
  оригинале), так в серверном коде и CSS.

Клиентский `D3Api.RadioGroupCtrl` управляет значением группы
(`value`), подписью (`caption`), блокировкой (`enabled`). Событие
`onchange` вызывается при смене активной радиокнопки.

---

## Расположение

```
Component/d3/RadioGroup/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)

Component/d3/RadioItem/
index.js
README.md
images/icon.png
css/preview.css
js/
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `RadioGroupCtrl.inc` | class `RadioGroup extends BaseCtrl` и class `RadioItem extends BaseCtrl` |
| `RadioGroup.js` | `D3Api.RadioGroupCtrl` и `D3Api.RadioItemCtrl` |
| `RadioGroup.css` | Стили `.ctrl_radiogroup`, `.ctrl_radioitem` |

---

## Тег и ID

- **XML-тег:** `cmpRadioGroup`
- **Регистрация в IDE:** `id: 'd3.radiogroup'`
- **Категория:** D3
- **Вид в палитре:** `RadioGroup`
- **Видимость:** видимый (рендерит разметку в canvas)
- **Дочерние компоненты:** `cmpRadioItem`

---

## Разметка в рантайме

Серверный `RadioGroup::Show()` собирает:

```html
<div class="ctrl_radiogroup vertical" keyvalue="2" …attrs…>
  <form onsubmit="return false;">
    <div class="ctrl_radioitem">
      <input value="1" type="radio" name="rg"
             onmousedown="return false;"
             onchange="D3Api.stopEvent(event);"/>
      <span cont="caption">Вариант 1</span>
    </div>
    <div class="ctrl_radioitem">
      <input value="2" type="radio" name="rg" checked
             onmousedown="return false;"
             onchange="D3Api.stopEvent(event);"/>
      <span cont="caption">Вариант 2</span>
    </div>
    <div class="ctrl_radioitem">
      <input value="3" type="radio" name="rg"
             onmousedown="return false;"
             onchange="D3Api.stopEvent(event);"/>
      <span cont="caption">Вариант 3</span>
    </div>
  </form>
</div>
```

Особенности:

- `<form onsubmit="return false;">` — чтобы не происходило
  отправки формы при нажатии Enter.
- `name="<parent_name>"` у каждого `<input>` — все радиокнопки
  группы объединены одним именем.
- `onmousedown="return false;"` — блокирует drag;
- `onchange="D3Api.stopEvent(event);"` — гасит нативный обработчик,
  клик обрабатывается через `mouseup` на родительском `<div>`.

Режим `gorizontal` меняет только CSS: пункты становятся
`inline-block`.

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`

### D3 Base
- `name`, `enabled`, `visible`, `hint`, `width`, `height`

### RadioGroup
- **`value`** — значение выбранной радиокнопки. Хранится в
  серверном `keyvalue`
- **`caption`** — текст выбранной кнопки. Синхронизируется клиентом
  при смене значения
- **`mode`** — `vertical` (по умолчанию) | `gorizontal`
- **`readonly`** — `true` — блокирует все кнопки группы

### Events
- `onchange` — смена активной радиокнопки;
- `onfocus`, `onblur` — фокус на группу;
- `onclick`, `ondblclick` — клики по группе.

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`.

---

## Дочерние компоненты

Внутрь `RadioGroup` можно вкладывать `RadioItem` — каждая кнопка
описывается одним `RadioItem`.

**parentOnly:** `cmpradiogroup` — `RadioItem` не может быть вставлен
вне `RadioGroup`. В IDE ограничение реализовано через `PARENT_ONLY`
в `panels.js`.

**Пример полной структуры:**

```xml
<cmpRadioGroup name="rg" mode="vertical" value="2">
    <cmpRadioItem name="" value="1" caption="Вариант 1"/>
    <cmpRadioItem name="" value="2" caption="Вариант 2" checked="true"/>
    <cmpRadioItem name="" value="3" caption="Вариант 3"/>
</cmpRadioGroup>
```

Подробное описание `RadioItem` — см.
`Component/d3/RadioItem/README.md`.

---

## Логика работы

### Инициализация

`D3Api.RadioGroupCtrl.init(dom)`:

1. Инициализирует событие `onchange`.
2. Подписывается на `onchange_property`: при изменении `value`
   вызывает `onchange`.
3. Инициализирует фокус через `init_focus`.

`D3Api.RadioItemCtrl.init(dom)`:

1. Находит `input[type=radio]` внутри своего `<div>`.
2. Навешивает на `<div>` обработчик `mouseup`. При клике:
    - проверяет `cancelBubble`, `disabled`, `readOnly`;
    - ставит `input.checked = true`;
    - пишет `value` и `caption` в родительскую группу через
      `setControlPropertyByDom(radioGroup, …)`.

### Управление значением

`setValue(group, value)`:

1. Ищет в группе `input[value=<value>]`.
2. Ставит ему `checked = true`.
3. Пишет `keyvalue = value` в атрибут группы.

`getValue(group)` — читает `keyvalue` из атрибутов.

### Управление подписью

`setCaption(group, value)`:

1. Пишет `caption = value` в атрибут группы.
2. Ищет `RadioItem` с подписью `value`.
3. Ставит его `input.checked = true`.

### Блокировка

`setEnabled(group, value)`:

1. Итерирует всех `RadioItem` группы.
2. Каждому ставит/снимает `input.disabled`.
3. Вызывает `BaseCtrl.setEnabled` на каждом `RadioItem` и на
   самой группе.

### Клавиатура

`RadioItem.CtrlKeyDown`:

- `Space` / `Enter` — установить `checked = true` у текущего
  `RadioItem` (клавиатурный аналог клика).

Навигация стрелками между пунктами одной группы — нативная
(работает благодаря одинаковому `name` у `<input>`).

---

## Примеры использования

### 1. Простая вертикальная группа

```xml
<cmpRadioGroup name="priority" mode="vertical" value="normal">
    <cmpRadioItem name="" value="low"    caption="Низкий"/>
    <cmpRadioItem name="" value="normal" caption="Обычный" checked="true"/>
    <cmpRadioItem name="" value="high"   caption="Высокий"/>
</cmpRadioGroup>
```

### 2. Горизонтальная группа

```xml
<cmpRadioGroup name="sex" mode="gorizontal" value="m">
    <cmpRadioItem name="" value="m" caption="Мужской" checked="true"/>
    <cmpRadioItem name="" value="f" caption="Женский"/>
</cmpRadioGroup>
```

Обратите внимание: `mode="gorizontal"` — именно так.

### 3. Программное управление

```js
// Установить выбранное значение
setControlProperty('priority', 'value', 'high');

// Прочитать выбранное значение
var v = getValue('priority');
console.log(v); // 'high'
```

### 4. Реакция на смену

```xml
<cmpRadioGroup name="priority"
               onchange="Form.onPriorityChange(getValue('priority'));">
    <cmpRadioItem name="" value="low"    caption="Низкий"/>
    <cmpRadioItem name="" value="normal" caption="Обычный" checked="true"/>
    <cmpRadioItem name="" value="high"   caption="Высокий"/>
</cmpRadioGroup>
```

```js
Form.onPriorityChange = function(newValue) {
    console.log('Выбран вариант:', newValue);
};
```

### 5. Блокировка группы

```js
setControlProperty('priority', 'enabled', false);
```

Все кнопки станут недоступными (`disabled`), клик не сработает.

### 6. Блокировка отдельной кнопки

```xml
<cmpRadioGroup name="priority" mode="vertical" value="normal">
    <cmpRadioItem name="" value="low"    caption="Низкий"/>
    <cmpRadioItem name="" value="normal" caption="Обычный" checked="true"/>
    <cmpRadioItem name="" value="high"   caption="Высокий" enabled="false"/>
</cmpRadioGroup>
```

Третья кнопка будет серой и недоступной, но видимой.

### 7. Read-only группа

```xml
<cmpRadioGroup name="priority" value="normal" readonly="true">
    <cmpRadioItem name="" value="low"    caption="Низкий"/>
    <cmpRadioItem name="" value="normal" caption="Обычный"/>
    <cmpRadioItem name="" value="high"   caption="Высокий"/>
</cmpRadioGroup>
```

Все кнопки заблокированы, но отображается выбранная.

### 8. Связь с DataSet

```xml
<cmpDataSet name="DS_ITEM">
    <![CDATA[ select id, name, priority from items where id = :id ]]>
</cmpDataSet>

<cmpRadioGroup name="priority">
    <cmpRadioItem name="" value="low"    caption="Низкий"/>
    <cmpRadioItem name="" value="normal" caption="Обычный"/>
    <cmpRadioItem name="" value="high"   caption="Высокий"/>
</cmpRadioGroup>

<cmpAction name="ACT_GET">
    <![CDATA[ select priority from items where id = :id ]]>
    <cmpActionVar name="priority" src="priority" srctype="ctrl" put="priority"/>
</cmpAction>
```

`Action` через `put` устанавливает `value` группы.

---

## Поведение в IDE

Компонент **видимый**. В canvas отображается группа радиокнопок.

### Вертикальный режим (по умолчанию)

```
○ Вариант 1
● Вариант 2  ← активный (подсвечен)
○ Вариант 3
```

### Горизонтальный режим (`mode="gorizontal"`)

```
○ Вариант 1   ● Вариант 2   ○ Вариант 3
```

Активная кнопка определяется по `value` группы (или по
`checked="true"` у `RadioItem`, если `value` группы пусто).

При изменении `value` в инспекторе — активная кнопка в превью
переключается. При изменении `caption` у `RadioItem` — обновляется
подпись.

### В дереве

```
cmpRadioGroup name="rg" mode="vertical" value="2"
  cmpRadioItem name="" value="1" caption="Вариант 1"
  cmpRadioItem name="" value="2" caption="Вариант 2" checked="true"
  cmpRadioItem name="" value="3" caption="Вариант 3"
```

`RadioItem` можно перетащить только в `RadioGroup` — ограничение
`PARENT_ONLY.cmpradioitem = 'cmpradiogroup'`.

### Ограничения

- **Клик по радиокнопке в canvas не работает** — превью
  неинтерактивно (`input.disabled = true`). Активность отображается
  визуально, но переключить её в IDE нельзя.
- **Собственный preview у RadioItem отсутствует** — вся визуализация
  в родителе.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 controls**:

```html
<script src="Component/d3/RadioGroup/index.js"></script>
<script src="Component/d3/RadioItem/index.js"></script>
```

Порядок: `RadioGroup` до `RadioItem`.

### Правки в `ide/canvas.js`

**`CMP_TAGS`:**

```js
'cmpradiogroup': 'cmpRadioGroup',
'cmpradioitem':  'cmpRadioItem',
```

`_injectIdeStyle` не трогаем — оба компонента видимы.

`XML_SELF_CLOSE` не трогаем — `RadioItem` контейнерный
(в рантайме содержит `<input>` и `<span>`).

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmpradiogroup': 'cmpRadioGroup',
'cmpradioitem':  'cmpRadioItem',
```

### Правки в `ide/panels.js`

**`PARENT_ONLY`:**

```js
cmpradioitem: 'cmpradiogroup',
```

Это включает проверку drag&drop в дереве — `RadioItem` не сможет
улететь вне `RadioGroup`.

---

## Известные ограничения

1. **`mode="gorizontal"`** — именно с опечаткой. Так в серверном
   коде (`RemoveArrKeyRtrn($attrs, 'mode', 'vertical')`) и в CSS
   (`.ctrl_radiogroup.gorizontal`). В инспекторе значение оставлено
   как есть, чтобы соответствовать рантайму. Если исправить на
   `horizontal` — сервер не поймёт и отрендерит вертикальный режим.

2. **`RadioItem.setValue` содержит баг в серверном коде** —
   вызывается `D3Api.CheckBoxCtrl.getInput(_dom)` вместо
   `D3Api.RadioItemCtrl.getInput(_dom)`. В IDE-регистрации это не
   воспроизводится (наш `properties` правильный), но в рантайме
   попытка программно установить `value` отдельной радиокнопки
   может упасть.

3. **`value` группы хранится в `keyvalue`** — сервер в
   `RadioGroup::Show()` пишет `getDomAttr('keyvalue', $this->value)`.
   Клиентский `getValue` читает `keyvalue`. В инспекторе выведено
   поле `value` (пишем в атрибут `value`); серверный `FormParser`
   сам разложит его в `keyvalue` при парсинге `.frm`.

4. **`caption` группы синхронизируется с активной кнопкой** — при
   клике по `RadioItem` клиент пишет `caption` группы в атрибут.
   В IDE поле `caption` доступно, но в превью не отображается
   напрямую — только через подсветку активного пункта.

5. **`checked` в `RadioItem`** — используется только если у группы
   не задан `value`. Если у группы есть `value="2"`, а у `RadioItem`
   `value="1"` стоит `checked="true"` — всё равно выберется второй
   (`value` группы имеет приоритет). Это соответствует логике
   сервера: `if ($this->value !== null && $this->value == $parent->value)`.

6. **`readonly` каскадируется** — если у группы `readonly="true"`,
   все дочерние `RadioItem` блокируются. Отдельно взять и разблокировать
   один пункт внутри readonly-группы нельзя.

7. **`enabled` каскадируется** — при `setEnabled(group, false)`
   все `RadioItem` получают `disabled`. Обратно — тоже.

8. **`name` у `<input>` берётся от группы** — `name="<parent_name>"`.
   Все радиокнопки группы логически объединены, нативная
   навигация стрелками между ними работает.

9. **Клик обрабатывается через `mouseup` на `<div>`** — нативный
   `change` у `<input>` гасится (`D3Api.stopEvent(event)`). Это
   сделано, чтобы избежать двойного срабатывания (change + mouseup).

10. **Отдельного события `onchange` у `RadioItem` нет** — только
    `onclick`, `ondblclick`, `onmouseover`, `onmouseout`.
    Логика смены значения — на группе.

---

## Чек-лист добавления нового экземпляра

1. В палитре выбрать **D3 → RadioGroup**.
2. В инспекторе задать:
    - `name` — имя группы (для `getControl` / `name` у `<input>`);
    - `mode` — `vertical` или `gorizontal`;
    - `value` — значение по умолчанию (или оставить пусто, чтобы
      выбралось `checked="true"` у `RadioItem`);
    - `readonly`, `enabled` — по необходимости.
3. Добавить в `RadioGroup` нужные `RadioItem` через палитру.
4. У каждого `RadioItem` задать:
    - `value` — значение радиокнопки;
    - `caption` — текст подписи;
    - `checked="true"` — если это кнопка по умолчанию (только одна);
    - `enabled="false"` — если кнопка недоступна.
5. При необходимости привязать `onchange` на группе.
6. Проверить в дереве: `cmpRadioItem` должен быть ребёнком
   `cmpRadioGroup`.
7. Проверить в canvas: в превью должна отображаться группа с
   правильным режимом, подписями и активной кнопкой.
8. Для программного управления использовать:
   ```js
   setControlProperty('<group_name>', 'value', '<value>');
   var v = getValue('<group_name>');
   ```

---

## См. также

- `Component/d3/RadioItem/README.md` — описание отдельной
  радиокнопки
- `Component/d3/CheckBox/README.md` — одиночный флажок
- `Component/d3/ComboBox/README.md` — выпадающий список как
  альтернатива для множественного выбора
- `RadioGroupCtrl.inc` — серверный код `RadioGroup` и `RadioItem`
- `RadioGroup.js` — клиентские контролы `D3Api.RadioGroupCtrl` и
  `D3Api.RadioItemCtrl`
- `RadioGroup.css` — стили `.ctrl_radiogroup`, `.ctrl_radioitem`
