# cmpModuleVar

Переменная модуля. Описывает одну входную, выходную или двустороннюю
переменную для родительского `cmpModule`.

В рантайме разворачивается в XML-тег `<var …>` внутри обёртки
`<cmpModule>`. Не рендерит видимого HTML, клиентских обработчиков
не имеет — всё работает на сервере.

---

## Расположение

```
Component/d3/ModuleVar/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)
```

**Серверный файл:**

| Файл | Роль |
|---|---|
| `ModuleBaseCtrl.inc` | class `ModuleVar extends BaseCtrl` — вся логика в `__construct` |

---

## Тег и ID

- **XML-тег:** `cmpModuleVar`
- **Регистрация в IDE:** `id: 'd3.modulevar'`
- **Категория:** D3
- **Вид в палитре:** `ModuleVar`
- **Видимость:** невидимый (скрыт в canvas через `_injectIdeStyle`)
- **parentOnly:** `cmpmodule` (можно вставить только внутрь `Module`)

---

## Разметка в рантайме

Серверный `ModuleVar::__construct()` пишет в `parent->xml`:

```xml
<component name="…" src="…" srctype="…" get="…" put="…"
           type="…" query_type="…" property="…" ignorenull="…">
```

Сам `ModuleVar` в готовый HTML не попадает — он часть XML-фрагмента,
который сервер передаёт в `SetSysInfo()` родительского `Module`.

В IDE при сохранении сериализуется как самозакрывающийся тег:

```xml
<cmpModuleVar name="id" src="id" srctype="var" get="id" type="integer"/>
```

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style` — стандартные HTML-атрибуты

### D3 Base
- **`name`** — имя переменной внутри модуля
- **`src`** — источник значения
- **`srctype`** — тип источника (см. раздел «Формат srctype»)

### Binding
- **`get`** — имя поля чтения (входная переменная)
- **`put`** — имя поля записи (выходная переменная)
- **`type`** — `string` | `integer` | `number` | `boolean` | `date`
- **`query_type`** — `path` | `filter` | `body`
- **`default`** — значение по умолчанию
- **`property`** — свойство контрола (при `srctype=ctrl`)
- **`ignorenull`** — не передавать null-значение

### Events
Пусто — ModuleVar не инициализирует клиентских событий.

### Styles
Пусто — служебный контрол.

---

## Формат `srctype`

| Значение | Назначение |
|---|---|
| `var` | Переменная формы |
| `ctrl` | Значение контрола |
| `ctrlcaption` | Отображаемый текст контрола |
| `session` | Сессионная переменная (`$_SESSION[strtoupper(src)]`) |
| `const` | Клиентская константа (значение берётся из `src`) |
| `const_server` | Серверная константа (значение берётся из `default` или `src`) |
| `parent` | Переменная родительского модуля (для вложенных модулей) |
| `data` | Данные DataSet |
| `exit_var` | Прерывание модуля (специальное) |
| `break_var` | Прерывание цикла (специальное) |

Если `srctype` не задан или пустой — сервер обрабатывает `src` как
имя GET-параметра (`$_GET[src]`).

---

## Формат `get` / `put`

| Комбинация | Что делает |
|---|---|
| `get="field"` | Модуль читает значение переменной из `field` |
| `put="field"` | Модуль пишет результат в `field` |
| `get=""` | Сервер автогенерирует `g0`, `g1`, … |
| `put=""` | Сервер автогенерирует `p0`, `p1`, … |
| `get="x" put="y"` | Двусторонняя переменная: читается из `x`, пишется в `y` |
| Оба не заданы | Сервер ставит `get` = имя переменной |

Автогенерация (`g0`, `g1`, …) зависит от порядка появления `ModuleVar`
внутри `Module`. Если порядок меняется — меняются имена.

---

## Остальные атрибуты

- **`type`** — тип значения, используется для приведения/валидации:
  `string`, `integer`, `number`, `boolean`, `date`.
- **`query_type`** — способ передачи значения:
  `path` (плейсхолдер в URL), `filter` (фильтр запроса),
  `body` (тело запроса).
- **`default`** — значение по умолчанию. Для `srctype=const_server`
  берётся в первую очередь; для остальных — используется, если
  источник не дал значения.
- **`property`** — имя свойства контрола (при `srctype=ctrl`). Если
  пусто, берётся основное значение (`value`).
- **`ignorenull`** — `true` — не передавать переменную модулю, если
  её значение `null`.

---

## Логика работы

`ModuleVar` не имеет собственных методов, кроме `__construct` и
пустого `Show()`. Вся логика — в `__construct`:

1. **Проверка родителя.** Если `parent->CmpType != 'Module'` —
   печатает «Недопустимо использование компонента ModuleVar не в Module»
   и возвращается.

2. **Обработка `srctype`:**

    - **`session`** — берёт значение из `$_SESSION[strtoupper(src)]` и
      сразу регистрирует переменную через `parent->AddVariable(name, value, null, null)`.
      В `parent->xml` пишет `<var>` с атрибутами `get`, `type`,
      `query_type`, `put`, `property`, `src`, `srctype`.
    - **`const`** — значение из `src`, регистрирует как константу.
    - **`const_server`** — значение из `default` (или `src`).
    - **`parent`** — передаётся в родительский модуль через
      `parent->setVarValue()` при вызове.
    - **`exit_var` / `break_var`** — специальные, обрабатываются
      сервером как сигналы.
    - **Остальные** — стандартная регистрация через
      `parent->AddVariable(name, default, get, put, type)`.
      Если `get=""` — автогенерируется `g0`, `g1`, …
      Если `put=""` — автогенерируется `p0`, `p1`, …

3. **Запись XML.** Для всех типов, кроме `session`, `parent`,
   `const_server`, `exit_var`, `break_var`, пишет в `parent->xml`:

   ```
   <var get="…" type="…" query_type="…" put="…" property="…"
        src="…" srctype="…" ignorenull="…"></var>
   ```

---

## Примеры использования

### 1. Входная переменная

```xml
<cmpModuleVar name="id" src="id" srctype="var" get="id" type="integer"/>
```

Модуль получит значение переменной формы `id` в `$vars['id']`.

### 2. Выходная переменная

```xml
<cmpModuleVar name="code" src="code" srctype="var" put="code"/>
```

После вызова модуля значение `$vars['code']` уйдёт в переменную формы `code`.

### 3. Двусторонняя переменная

```xml
<cmpModuleVar name="value" src="value" srctype="var"
              get="inputValue" put="outputValue" type="string"/>
```

Модуль читает из `$vars['inputValue']`, а результат пишет в
`$vars['outputValue']`.

### 4. Session-переменная

```xml
<cmpModuleVar name="organization" src="LPU" srctype="session"
              get="organization" type="integer" query_type="path"/>
```

Значение берётся из `$_SESSION['LPU']` и передаётся модулю как
`organization` (например, в URL-плейсхолдер).

### 5. Клиентская константа

```xml
<cmpModuleVar name="mode" src="edit" srctype="const" get="mode"/>
```

Модуль получит фиксированное значение `"edit"`.

### 6. Серверная константа

```xml
<cmpModuleVar name="version" src="v1" srctype="const_server" default="v1"/>
```

Сервер сам подставит `default` (или `src`, если `default` пусто).

### 7. Контрол с указанием свойства

```xml
<cmpModuleVar name="caption" src="nameCtrl" srctype="ctrlcaption"
              get="caption" property="caption"/>
```

Возьмёт отображаемый текст контрола `nameCtrl` и передаст модулю
как `caption`.

### 8. Автогенерация имени

```xml
<cmpModuleVar name="a" src="a" srctype="var" get="" put=""/>
```

Сервер заменит `get=""` на `g0`, `put=""` на `p0` (в порядке
появления этого ModuleVar внутри Module).

### 9. Вложенный модуль

```xml
<cmpModule name="OUTER" module="Test/Outer">
    <cmpModuleVar name="data" src="data" srctype="var" get="data"/>
    <cmpModule name="INNER" module="Test/Inner">
        <cmpModuleVar name="parentData" src="data" srctype="parent" get="parentData"/>
        <cmpModuleVar name="result"     src="result" srctype="var" put="result"/>
    </cmpModule>
</cmpModule>
```

Внутренний `ModuleVar` получит значение `data` из внешнего модуля
через `srctype="parent"`.

### 10. Игнорирование null

```xml
<cmpModuleVar name="filter" src="searchFilter" srctype="var"
              get="filter" ignorenull="true"/>
```

Если `searchFilter` не задан — переменная `filter` не будет передана
модулю вообще (а не как `null` или пустая строка).

---

## Поведение в IDE

Компонент **невидимый**. После вставки на холст ничего не появится —
это правильно, потому что в рантайме он тоже невидим.

### В дереве

```
cmpModuleVar name="id" src="id" srctype="var" get="id" type="integer"
```

`ModuleVar` можно перетащить только внутрь `Module`. Ограничение
реализовано через `PARENT_ONLY.cmpmodulevar = 'cmpmodule'` в
`panels.js`. Попытка вставить в другое место заблокирована на
уровне `DomTree._canDrop`.

### В инспекторе

Все атрибуты доступны для редактирования. Разделы:
- HTML attributes
- D3 Base
- Binding

Списки значений:
- `srctype` — 11 вариантов
- `type` — `string | integer | number | boolean | date`
- `query_type` — `path | filter | body`

### Ограничения

- **Drag&drop** — только внутрь `Module`.
- **Events / Styles** пустые.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 data**:

```html
<script src="Component/d3/Module/index.js"></script>
<script src="Component/d3/ModuleVar/index.js"></script>
```

Порядок: `Module` до `ModuleVar`.

### Правки в `ide/canvas.js`

**`_injectIdeStyle` — скрыть в canvas:**

```js
'cmpaction, cmpdataset, cmpscript, cmpmask, cmpbroker, ' +
'cmpcomment, cmpcompleter, cmpdependences, cmpfetch, ' +
'cmpfetchvar, cmplocate, cmpmodule, cmpmodulevar {' +
'  display: none !important; visibility: hidden !important;' +
'  pointer-events: none !important; user-select: none !important;' +
'}'
```

**`XML_SELF_CLOSE` — ModuleVar самозакрывающийся:**

```js
var XML_SELF_CLOSE = {
    cmpactionvar:1, cmpdatasetvar:1, cmpcomboitem:1, cmpsubactionvar:1,
    cmpfetchvar:1, cmpsubfetchvar:1, cmpmodulevar:1,
    cmpimage:1,
    'wb-image':1, cmptagitem:1
};
```

**`CMP_TAGS` — восстановление camelCase:**

```js
'cmpmodule':    'cmpModule',
'cmpmodulevar': 'cmpModuleVar',
```

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmpmodule':    'cmpModule',
'cmpmodulevar': 'cmpModuleVar',
```

### Правки в `ide/panels.js`

**`PARENT_ONLY`:**

```js
var PARENT_ONLY = {
    cmpactionvar:    ['cmpaction', 'cmpsubaction'],
    cmpsubaction:    ['cmpaction', 'cmpsubaction'],
    cmpsubactionvar: 'cmpsubaction',
    cmpdatasetvar:   'cmpdataset',
    cmpfetchvar:     'cmpfetch',
    cmpmodulevar:    'cmpmodule',
    cmpcomboitem:    'cmpcombobox',
    cmpfilteritem:   'cmpfilter',
    cmpcolumn:       'cmpgrid',
    cmpgridfooter:   'cmpgrid',
    cmplayoutrow:    'cmplayout',
    cmplayoutcell:   'cmplayoutrow',
    cmptagitem:      'cmpbuttonedit'
};
```

### `CDATA_CONTAINERS`

Не трогаем — `ModuleVar` не содержит CDATA-блок.

---

## Известные ограничения

1. **`srctype` не валидируется** — если указать неизвестное значение,
   сервер обработает `src` как GET-параметр (без ошибки).

2. **Автогенерация `get` / `put`** — имена `g0`, `g1`, … / `p0`, `p1`, …
   зависят от порядка появления `ModuleVar` внутри `Module`. Не
   полагайтесь на них в критичных местах; задавайте `get` / `put`
   явно, если имя важно.

3. **`parentOnly` проверяется только на сервере** — вне `Module`
   сервер напечатает ошибку «Недопустимо использование компонента
   ModuleVar не в Module». В IDE это предотвращается через `PARENT_ONLY`.

4. **Вложенные модули — только через `srctype="parent"`** — если
   попытаться использовать `srctype="var"` для доступа к переменной
   внешнего модуля, ничего не сработает. `parent` — единственный
   правильный способ.

5. **`session` не пишет `<var>` в XML для `get`** — значение берётся
   на сервере сразу, и в XML пишется сокращённый тег. Если понадобится
   переопределить значение через клиент — используйте `srctype="var"`.

6. **`const_server` подставляет значение до клиента** — если `default`
   пусто, берётся `src`. Это удобно для конфигурационных параметров,
   но не для динамических значений.

7. **`type` не строго валидируется** — тип применяется к значению
   при передаче в модуль, но если данные придут не того типа,
   приведение может не сработать. Проверка — на стороне модуля.

8. **`query_type` не влияет на сам `ModuleVar`** — он прокидывается в
   XML и используется сервером при вызове модуля для формирования
   запроса (путь, фильтр, тело).

9. **`ModuleVar` не содержит детей** — в рантайме самозакрывающийся
   (`<var …/>`). В IDE `preview: null`, `XML_SELF_CLOSE` включён.

10. **`property` работает только с `srctype=ctrl` / `ctrlcaption`** —
    для остальных типов атрибут игнорируется.

---

## Чек-лист добавления нового экземпляра

1. Убедиться, что компонент добавляется **внутрь `cmpModule`** —
   иначе IDE не даст вставить (через `PARENT_ONLY`).
2. В инспекторе задать `name` — имя переменной внутри модуля.
3. Задать `src` — источник:
    - имя переменной формы (при `srctype=var`);
    - имя контрола (при `srctype=ctrl` / `ctrlcaption`);
    - ключ сессионной переменной (при `srctype=session`);
    - значение константы (при `srctype=const` / `const_server`);
    - имя внешней переменной модуля (при `srctype=parent`).
4. Выбрать `srctype` в инспекторе.
5. Задать `get` / `put`:
    - `get="field"` для входной переменной;
    - `put="field"` для выходной;
    - `""` для автогенерации;
    - оба для двусторонней.
6. При необходимости заполнить:
    - `type` (`integer`, `date`, …);
    - `query_type` (`path`, `filter`, `body`);
    - `default`;
    - `property` (для `ctrl` / `ctrlcaption`);
    - `ignorenull`.
7. Проверить в дереве: `cmpModuleVar` должен быть ребёнком `cmpModule`.

---

## См. также

- `Component/d3/Module/README.md` — родительский компонент
- `Component/d3/Fetch/README.md` — аналогичный по структуре контрол
  (родитель → дочерний)
- `ModuleBaseCtrl.inc` — серверный код `ModuleVar` и `Module`
- `Mask.js` — пример контрола, работающего с несколькими целевыми
  контролами через `controls`
