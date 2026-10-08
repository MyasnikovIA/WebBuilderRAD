# cmpRadioItem

Отдельная радиокнопка внутри `cmpRadioGroup`. В рантайме рендерит
`<div class="ctrl_radioitem">` с `<input type="radio">` и подписью
`<span cont="caption">`.

Состояние (`checked`, `disabled`, `readonly`) формируется сервером
в `__construct` на основе атрибутов самого `RadioItem` и его
родительской группы. Клик по кнопке обрабатывается через `mouseup`
на `<div>` — нативный `change` у `<input>` гасится, а `value` и
`caption` передаются в родительскую `RadioGroup`.

Без родителя не работает: вне `RadioGroup` `RadioItem` не
рендерится (ограничение `parentOnly`).

---

## Расположение

```
Component/d3/RadioItem/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `RadioGroupCtrl.inc` | class `RadioItem extends BaseCtrl` (в одном файле с `RadioGroup`) |
| `RadioGroup.js` | `D3Api.RadioItemCtrl` |
| `RadioGroup.css` | Стили `.ctrl_radioitem` |

---

## Тег и ID

- **XML-тег:** `cmpRadioItem`
- **Регистрация в IDE:** `id: 'd3.radioitem'`
- **Категория:** D3
- **Вид в палитре:** `RadioItem`
- **Видимость:** видимый (рендерится родителем)
- **parentOnly:** `cmpradiogroup` — можно вставить только внутрь
  `RadioGroup`

---

## Разметка в рантайме

Серверный `RadioItem::Show()` формирует:

```html
<div class="ctrl_radioitem" …attrs…>
  <input value="2" type="radio" name="rg" checked
         onmousedown="return false;"
         onchange="D3Api.stopEvent(event);"/>
  <span cont="caption">Вариант 2</span>
</div>
```

Ключевые детали:

- `value` — значение радиокнопки (приходит из XML);
- `name="<parent_name>"` — все `RadioItem` одной группы имеют
  одно имя, что объединяет их в нативную радиогруппу (стрелки
  вверх/вниз работают автоматически);
- `checked` — если этот пункт выбран в родительской группе;
- `disabled` — если `enabled="false"` у пункта или у группы;
- `readonly` — если `readonly="true"` у пункта или у группы;
- `onmousedown="return false;"` — блокирует drag (текст не
  выделяется при клике);
- `onchange="D3Api.stopEvent(event);"` — гасит нативный `change`,
  чтобы не было двойного срабатывания (клик обрабатывается
  через `mouseup` на родительском `<div>`).

Если у `RadioItem` есть дочерний текст (`SetInnerText`), он
используется вместо `<span cont="caption">`.

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`

### D3 Base
- `name`, `enabled`, `visible`, `hint`

### RadioItem
- **`value`** — значение радиокнопки. Используется при выборе:
  клиент сравнивает `value` с `value` группы
- **`caption`** — текст подписи
- **`checked`** — `true` — выбран при открытии (только у одной
  кнопки в группе)
- **`readonly`** — `true` — кнопка только для чтения

### Events
- `onclick`, `ondblclick` — клики по кнопке;
- `onmouseover`, `onmouseout` — наведение курсора.

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`.

---

## Формат атрибутов

| Атрибут | Описание |
|---|---|
| `name` | Имя элемента (для `getControl`). У самой радиокнопки `name` не используется в нативном `<input>`, там имя берётся от группы |
| `value` | Значение радиокнопки. Может быть строкой, числом, любым уникальным идентификатором |
| `caption` | Текст подписи |
| `checked` | `true` — пункт выбран при открытии. Если у группы задан `value`, приоритет у него |
| `enabled` | `false` — пункт отключён (серый, клик не работает) |
| `readonly` | `true` — пункт нельзя выбрать (клик не работает, но отображается как обычно) |
| `visible` | `false` — пункт скрыт |

---

## Логика работы

### Инициализация (сервер)

`RadioItem::__construct`:

1. Проверяет родителя — `RadioGroup`.
2. Обрабатывает `readonly` и `enabled`:
    - если `readonly` у пункта или у группы — ставит
      `state .= ' readonly="readonly" disabled="disabled"'`;
    - если `enabled="false"` у пункта или у группы — то же.
3. Если `value != null` и `value == parent.value` — добавляет
   `checked="checked"` в `state`.

### Рендер (сервер)

`RadioItem::Show`:

1. Проверяет родителя — `RadioGroup`. Если иное — молча выходит.
2. Формирует `<div class="ctrl_radioitem" …attrs…>` с `<input>` и
   подписью.
3. Пишет HTML в родителя через `parent->SetInnerText(...)`.

### Клиент

**`D3Api.RadioItemCtrl.init(dom)`** — навешивает `mouseup` на `<div>`:

1. Находит родительскую группу через `getControlByDom(dom, 'RadioGroup')`.
2. Проверяет `cancelBubble`, `input.disabled`, `input.readOnly` —
   если что-то истинно, клик игнорируется.
3. Ставит `input.checked = true`.
4. Пишет в группу `value` через `setControlPropertyByDom(group, 'value', ...)`.
5. Пишет в группу `caption` через `setControlPropertyByDom(group, 'caption', ...)`.

**`D3Api.RadioItemCtrl.getValue(dom)`** — читает `input.value`.

**`D3Api.RadioItemCtrl.setValue(dom, value)`** — пишет `input.value`.
*Замечание:* в серверном коде здесь опечатка — вызывается
`D3Api.CheckBoxCtrl.getInput(_dom)` вместо
`D3Api.RadioItemCtrl.getInput(_dom)`. Если в рантайме попытаться
программно установить `value` отдельного пункта, будет ошибка.
Используйте установку `value` на группе.

**`D3Api.RadioItemCtrl.getChecked(dom)`** — возвращает `input.checked`.

**`D3Api.RadioItemCtrl.setChecked(dom, value)`** — пишет
`input.checked`.
*Замечание:* тоже содержит опечатку — `CheckBoxCtrl.getInput`.
Используйте установку `value` на группе.

**`D3Api.RadioItemCtrl.getCaption(dom)` / `setCaption(dom, value)`** —
читает/пишет текст в `<span cont="caption">`.

**`D3Api.RadioItemCtrl.setEnabled(dom, value)`** — ставит/снимает
`input.disabled`.

**`D3Api.RadioItemCtrl.CtrlKeyDown(dom, e)`** — обработчик клавиатуры:

- `Space` / `Enter` — `setChecked(dom, true)`.

Навигация стрелками между пунктами — нативная (за счёт одинакового
`name` у `<input>`).

---

## Примеры использования

### 1. Простая кнопка в группе

```xml
<cmpRadioGroup name="priority" mode="vertical">
    <cmpRadioItem name="" value="low"    caption="Низкий"/>
    <cmpRadioItem name="" value="normal" caption="Обычный" checked="true"/>
    <cmpRadioItem name="" value="high"   caption="Высокий"/>
</cmpRadioGroup>
```

Кнопка `normal` выбрана при открытии.

### 2. Заблокированная кнопка

```xml
<cmpRadioItem name="" value="high" caption="Высокий" enabled="false"/>
```

Серая, клик не работает.

### 3. Кнопка только для чтения

```xml
<cmpRadioItem name="" value="low" caption="Низкий" readonly="true"/>
```

Внешне такая же, но выбрать её нельзя (клик игнорируется).

### 4. Скрытая кнопка

```xml
<cmpRadioItem name="" value="debug" caption="Debug" visible="false"/>
```

Не отображается в группе. Показать в рантайме:

```js
setControlProperty('<radioitem_name>', 'visible', true);
```

### 5. Уникальное имя кнопки

```xml
<cmpRadioItem name="item_low" value="low" caption="Низкий"/>
```

Имя задаётся через `name` для доступа через `getControl('item_low')`.
В нативном `<input>` это имя не используется — там `name` берётся
от группы.

### 6. Клик по кнопке с обработчиком

```xml
<cmpRadioItem name="" value="cancel" caption="Отмена"
              onclick="Form.confirmCancel();"/>
```

Пользовательский `onclick` навесится на `<div class="ctrl_radioitem">`,
но **не заменит** внутренний `mouseup`, который обновляет группу.

### 7. Программный выбор через группу

```js
// Правильно — установить value у группы
setControlProperty('priority', 'value', 'high');
```

```js
// Неправильно — попытка установить value отдельного пункта
// через setControlProperty('item_high', 'value', 'high')
// (в рантайме упадёт из-за опечатки в серверном коде)
```

### 8. Программное скрытие пункта

```js
setControlProperty('item_debug', 'visible', false);
```

Скрыть пункт можно как через `visible`, так и удалить его из DOM:

```js
var el = getControl('item_debug');
el.parentNode.removeChild(el);
```

### 9. Динамическое добавление

Через `D3Api.createDom` и `D3Api.addDom`:

```js
var group = getControl('priority');
var html = '<div class="ctrl_radioitem" cmptype="RadioItem">' +
           '<input value="new" type="radio" name="priority" ' +
           'onmousedown="return false;" ' +
           'onchange="D3Api.stopEvent(event);"/>' +
           '<span cont="caption">Новый</span></div>';
var item = D3Api.createDom(html);
D3Api.addDom(group.querySelector('form'), item);
group.D3Form.parse(item);
```

### 10. Клавиатурный выбор

```js
// Аналог клика по кнопке через клавиатуру
D3Api.RadioItemCtrl.setChecked(getControl('item_high'), true);
```

Но помните: `setChecked` в серверном коде содержит опечатку
(`CheckBoxCtrl.getInput`). Если у вас есть возможность править
серверный код — исправьте, иначе используйте `setControlProperty`
на группе.

---

## Поведение в IDE

`RadioItem` — видимый только внутри `RadioGroup`. Отдельного
`preview()` у него нет: `RadioGroup.preview()` сканирует детей и
рисует всю группу.

### В canvas

Внутри `RadioGroup`:

**Вертикальный режим:**

```
○ Вариант 1
● Вариант 2  ← активный
○ Вариант 3
```

**Горизонтальный режим (`mode="gorizontal"`):**

```
○ Вариант 1   ● Вариант 2   ○ Вариант 3
```

Активный пункт определяется по `value` группы или по
`checked="true"`.

Отключённый пункт (`enabled="false"`) — серый и с курсором
`not-allowed`.

### В дереве

```
cmpRadioGroup name="rg" mode="vertical" value="2"
  cmpRadioItem name="" value="1" caption="Вариант 1"
  cmpRadioItem name="" value="2" caption="Вариант 2" checked="true"
  cmpRadioItem name="" value="3" caption="Вариант 3"
```

`RadioItem` перетаскивается только в `RadioGroup` — ограничение
`PARENT_ONLY.cmpradioitem = 'cmpradiogroup'`.

### В инспекторе

- HTML attributes: `id`, `class`, `style`
- D3 Base: `name`, `enabled`, `visible`, `hint`
- RadioItem: `value`, `caption`, `checked`, `readonly`
- Events: `OnClick`, `OnDblClick`, `OnMouseOver`, `OnMouseOut`
- Styles: полный набор CSS-свойств

Изменения `value` / `caption` / `checked` немедленно отражаются в
превью родителя (через `refreshPreviewAndParent`).

### Ограничения

- **Без родителя невидим** — `RadioItem` вне `RadioGroup` не
  рендерится. IDE-вставка вне `RadioGroup` заблокирована.
- **Собственный preview отсутствует** — вся визуализация в
  родителе.
- **Клик в canvas не переключает** — превью неинтерактивно
  (`input.disabled = true`). Активность отображается визуально.

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

`_injectIdeStyle` не трогаем — `RadioItem` видим.

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

1. **Опечатка в серверном коде** — `RadioItem.setValue` и
   `setChecked` вызывают `D3Api.CheckBoxCtrl.getInput(_dom)` вместо
   `D3Api.RadioItemCtrl.getInput(_dom)`. Программная установка
   `value` / `checked` отдельного пункта в рантайме упадёт.
   Обходной путь: устанавливать `value` на группе
   (`setControlProperty('<group>', 'value', '<value>')`).

2. **Клик обрабатывается через `mouseup` на `<div>`** — не через
   нативный `change` у `<input>`. Это сделано, чтобы клик по
   подписи (`<span>`) тоже срабатывал. Нативный `change` гасится
   `D3Api.stopEvent(event)`.

3. **`name` не пробрасывается в `<input>`** — у радиокнопки
   `name="<parent_name>"`, а не `name="<radioitem_name>"`. Это
   нужно для объединения всех кнопок группы в нативную радиогруппу
   (для навигации стрелками).

4. **`checked` в `RadioItem` не всегда срабатывает** — если у
   группы задан `value`, приоритет у него. `checked="true"` у
   пункта выберет его только тогда, когда `value` группы пусто.

5. **`readonly` не снимается** — если у группы `readonly="true"`,
   а у пункта `readonly="false"`, всё равно пункт будет
   заблокирован (сервер смотрит `readonly || parent.readonly`).

6. **`enabled="false"` каскадируется от группы** — если группа
   отключена (`enabled="false"`), все пункты тоже становятся
   `disabled`. Обратно — если у пункта `enabled="false"`, а группа
   включена, только этот пункт блокируется.

7. **`visible="false"` не удаляет пункт** — кнопка скрыта, но
   остаётся в DOM. Если нужно полностью убрать — используйте
   `removeChild`.

8. **`caption` через `SetInnerText`** — если у `RadioItem` есть
   дочерний текст (`<cmpRadioItem>Текст</cmpRadioItem>`), он
   используется вместо `<span cont="caption">`. В типовых формах
   текст задаётся через атрибут `caption`.

9. **`onclick` навешивается на `<div>`, а не на `<input>`** —
   в серверном коде `implode(' ', $this->events)` пишется в
   атрибуты корневого `<div class="ctrl_radioitem">`. Клик по
   input-у всплывёт до div, и `onclick` сработает. Но нативный
   клик по input-у гасится `onmousedown="return false;"`.

10. **`input.disabled` не пробрасывается в `readOnly`** — в
    превью IDE мы ставим `input.disabled = true` для
    неинтерактивности. В рантайме `readonly` и `disabled`
    — разные состояния, но оба блокируют клик.

---

## Чек-лист добавления нового экземпляра

1. Убедиться, что `RadioItem` добавляется **внутрь `cmpRadioGroup`** —
   иначе IDE не даст вставить (через `PARENT_ONLY`).
2. В инспекторе задать:
    - `value` — значение радиокнопки (уникальное в группе);
    - `caption` — текст подписи;
    - `name` — если нужен доступ через `getControl` (не обязательно);
    - `checked="true"` — если это кнопка по умолчанию (только одна
      в группе);
    - `enabled="false"` — если кнопка должна быть недоступна;
    - `readonly="true"` — если кнопка только для чтения;
    - `visible="false"` — если кнопка должна быть скрыта.
3. При необходимости привязать `onclick` / `onmouseover`.
4. Проверить в дереве: `cmpRadioItem` должен быть ребёнком
   `cmpRadioGroup`.
5. Проверить в canvas: в превью группы должна отображаться
   кнопка с правильным `caption` и корректным состоянием
   (`checked`, `enabled`, `visible`).
6. Для программного управления использовать:
   ```js
   // Установить выбранную кнопку
   setControlProperty('<group_name>', 'value', '<radioitem_value>');

   // Прочитать выбранное
   var v = getValue('<group_name>');

   // Скрыть/показать пункт
   setControlProperty('<radioitem_name>', 'visible', false);
   ```

---

## См. также

- `Component/d3/RadioGroup/README.md` — родительская группа
- `Component/d3/CheckBox/README.md` — одиночный флажок
- `Component/d3/ComboBox/README.md` — выпадающий список
- `RadioGroupCtrl.inc` — серверный код `RadioItem`
- `RadioGroup.js` — клиентский `D3Api.RadioItemCtrl`
- `RadioGroup.css` — стили `.ctrl_radioitem`
