# cmpModule

Служебный контрол для вызова серверных модулей (`.mdl`-файлов или классов
из `Modules/…`) и передачи им переменных через дочерние `cmpModuleVar`.

В рантайме не рендерит видимого HTML — только скрытый `<div>`, через который
сервер пишет XML и подключает файл модуля. Клиентских обработчиков нет:
всё работает на сервере через `Show()` / `ShowXML()`.

---

## Расположение

```
Component/d3/Module/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `ModuleCtrl.inc` | class `Module extends ModuleBase` — пустой наследник |
| `ModuleBaseCtrl.inc` | class `ModuleBase extends BaseCtrl` — вся логика `Show` / `ShowXML` |
| `ModuleBaseCtrl.inc` | class `ModuleVar extends BaseCtrl` — дочерние переменные модуля |

---

## Тег и ID

- **XML-тег:** `cmpModule`
- **Регистрация в IDE:** `id: 'd3.module'`
- **Категория:** D3
- **Вид в палитре:** `Module`
- **Видимость:** невидимый (скрыт в canvas через `_injectIdeStyle`)

---

## Разметка в рантайме

Серверный `Module::Show()` пишет XML-обёртку в `SetSysInfo()` родителя:

```
<cmpModule name="ACT_MODULE">
    …
</cmpModule>
```

Плюс собственный XML для вызова модуля:

```xml
<component module="Test/Some/ModuleName" method="exec" async="false">
```

Видимой разметки нет — контрол полностью служебный. Дочерние
`cmpModuleVar` пишут XML-теги `<var …>` внутрь этой обёртки.

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style` — стандартные HTML-атрибуты

### D3 Base
- **`name`** — идентификатор модуля (обязателен, по нему вызывается `ShowXML()`)

### Module
- **`module`** — путь к модулю без расширения. Резолвится в
  `Modules/<module>.mdl` или `Modules/<module>/index.php`
- **`method`** — имя метода класса модуля (по умолчанию `exec`)
- **`async`** — `true` / `false` (по умолчанию `false`)

### Events
Пусто — Module не инициализирует клиентских событий.

### Styles
Пусто — служебный контрол.

---

## Дочерние компоненты

Внутрь `Module` можно вкладывать `ModuleVar` — переменные модуля.
Один `ModuleVar` описывает одну входную или выходную переменную.

**parentOnly:** `cmpmodule` — `ModuleVar` не может быть вставлен вне
`Module`. В IDE ограничение реализовано через `PARENT_ONLY` в
`panels.js`.

**Пример полной структуры:**

```xml
<cmpModule name="ACT_MODULE" module="Test/Some/ModuleName" method="exec">
    <cmpModuleVar name="organization" src="LPU" srctype="session"
                  get="organization" type="integer" query_type="path"/>
    <cmpModuleVar name="id" src="id" srctype="var"
                  get="id" type="integer" query_type="path"/>
    <cmpModuleVar name="code" src="code" srctype="var" put="code"/>
    <cmpModuleVar name="name" src="name" srctype="var" put="name"/>
</cmpModule>
```

---

## Формат переменных (`ModuleVar`)

### Атрибут `srctype`

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

Если `srctype` не задан — сервер обрабатывает `src` как имя GET-параметра.

### Атрибуты `get` и `put`

- **`get="field"`** — имя поля чтения (входная переменная).
- **`put="field"`** — имя поля записи (выходная переменная).
- **`get=""` / `put=""`** — сервер автогенерирует `g0, g1, …` / `p0, p1, …`.
- Заданы оба → переменная двусторонняя: читается из `get`, пишется в `put`.

### Остальные атрибуты

- **`type`** — `string` | `integer` | `number` | `boolean` | `date`
- **`query_type`** — `path` | `filter` | `body`
- **`default`** — значение по умолчанию
- **`property`** — свойство контрола (при `srctype=ctrl`)
- **`ignorenull`** — не передавать null-значение

---

## Логика работы

### Порядок вызовов

1. `Module::__construct()` — разбирает атрибуты, инициализирует `$this->xml`.
2. `ModuleVar::__construct()` — регистрирует переменную в `parent->Variables`.
3. `Module::Show()` — пишет XML-обёртку в `SetSysInfo()` родителя.
4. `Module::ShowXML()` — вызывается отдельным запросом (`type: 'Module'`):
    1. Подключает `.mdl`-файл или `index.php` из `Modules/<module>`.
    2. Собирает `$vars` из `$this->Variables` (входные значения).
    3. Ищет функцию `ExecModule` или класс `\Modules\<module>`.
    4. Вызывает `$function($vars, $this)` или `$obj->{$method}()`.
    5. Складывает результаты обратно в `$vars` и отдаёт клиенту как JSON.

### Резолвинг модуля

`ShowXML()` пробует три источника:

1. `getModuleContent("Modules/{$this->module}", '', true)` — ищет папку.
2. `D3Api::includeOnce("Modules/{$this->module}.mdl")` — файл `.mdl`.
3. `class_exists("\\Modules\\{$this->attrs['module']}")` — класс.

### Обработка ошибок

`ModuleBase::ShowXML()` оборачивает всё в `try/catch`:

- ошибки подключения → `"error": "<message>"`
- исключения в модуле → `"error": "<message>"`
- при `is_debug()` дополнительно прикладывает файл, строку и стек.

Ответ всегда в формате:

```json
{
  "ACT_MODULE": {
    "type": "Module",
    "data": { "code": "…", "name": "…" },
    "error": "…"
  }
}
```

---

## Примеры использования

### 1. Простой вызов

```xml
<cmpModule name="ACT_MODULE" module="Test/Some/ModuleName" method="exec">
    <cmpModuleVar name="id"   src="id"   srctype="var" get="id" type="integer"/>
    <cmpModuleVar name="name" src="name" srctype="var" put="name"/>
</cmpModule>
```

Серверный `.mdl`:

```php
function ExecModule($vars, $module) {
    $id = $vars['id'];
    // … обработка …
    $vars['name'] = 'Result for ' . $id;
    return true;
}
```

После вызова `$vars['name']` уйдёт в переменную формы `name`.

### 2. Модуль с session-переменной

```xml
<cmpModule name="ACT_LOAD" module="Stat/Report/Load">
    <cmpModuleVar name="organization" src="LPU" srctype="session"
                  get="organization" type="integer" query_type="path"/>
    <cmpModuleVar name="id" src="id" srctype="var"
                  get="id" type="integer" query_type="path"/>
    <cmpModuleVar name="code" src="code" srctype="var" put="code"/>
    <cmpModuleVar name="name" src="name" srctype="var" put="name"/>
</cmpModule>
```

Модуль получит `organization` из `$_SESSION['LPU']`, `id` из переменной
формы, а результаты положит в `code` и `name`.

### 3. Модуль-класс

```xml
<cmpModule name="ACT_PARSE" module="Parsers/FormParser" method="parse">
    <cmpModuleVar name="xml"    src="xmlContent" srctype="var" get="xml"/>
    <cmpModuleVar name="result" src="result"     srctype="var" put="result"/>
</cmpModule>
```

Серверный класс `\Modules\Parsers\FormParser`:

```php
namespace Modules\Parsers;

class FormParser {
    private $vars;
    public function __construct(&$vars, $module) {
        $this->vars = &$vars;
    }
    public function parse() {
        $this->vars['result'] = 'parsed: ' . $this->vars['xml'];
        return true;
    }
}
```

### 4. Вложенные модули

```xml
<cmpModule name="ACT_OUTER" module="Test/Outer">
    <cmpModuleVar name="data" src="data" srctype="var" get="data"/>
    <cmpModule name="ACT_INNER" module="Test/Inner">
        <cmpModuleVar name="parentData" src="data" srctype="parent" get="parentData"/>
        <cmpModuleVar name="result"     src="result" srctype="var" put="result"/>
    </cmpModule>
</cmpModule>
```

Внутренний модуль получит `data` из внешнего через `srctype="parent"`.

### 5. Вызов через JS

```js
executeModule('ACT_MODULE', function(result) {
    console.log('module done', result);
});
```

Сервер выполнит `ShowXML()` и вернёт JSON с результатами.

---

## Поведение в IDE

Компонент **невидимый**. После вставки на холст ничего не появится —
это правильно, потому что в рантайме он тоже невидим.

### В дереве

```
cmpModule name="ACT_MODULE" module="Test/Some/ModuleName" method="exec"
  cmpModuleVar name="id"   src="id"   srctype="var" get="id" type="integer"
  cmpModuleVar name="code" src="code" srctype="var" put="code"
```

`ModuleVar` можно перетащить только внутрь `Module` — ограничение
задано через `PARENT_ONLY.cmpmodulevar = 'cmpmodule'`.

### В инспекторе

Все атрибуты доступны для редактирования. У `Module` — простые поля
(`module`, `method`, `async`). У дочерних `ModuleVar` — расширенный
набор (`srctype`, `get`, `put`, `type`, `query_type`, `default`,
`property`, `ignorenull`).

### Ограничения

- **Drag&drop** — `ModuleVar` только внутрь `Module`.
- **Events / Styles** пустые у обоих.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 data**:

```html
<script src="Component/d3/Module/index.js"></script>
<script src="Component/d3/ModuleVar/index.js"></script>
```

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
cmpmodulevar: 'cmpmodule',
```

### `CDATA_CONTAINERS`

Не трогаем — `Module` не содержит CDATA-блок.

---

## Известные ограничения

1. **Нет клиентского контрола** — `D3Api.ModuleCtrl` не существует.
   Управление только через серверный `ShowXML()` и JS-функцию
   `executeModule(name, callback)`.

2. **`srctype` не валидируется на клиенте** — неизвестное значение
   обработается как GET-параметр.

3. **`parentOnly` проверяется только на сервере** — `ModuleVar` вне
   `Module` напечатает ошибку «Недопустимо использование компонента
   ModuleVar не в Module». В IDE это предотвращается через `PARENT_ONLY`.

4. **`get=""` / `put=""` — автогенерация** — сервер подставит `g0`/`p0`/
   `g1`/`p1` в порядке появления. Порядок меняется → меняется имя.
   Не полагайтесь на автогенерацию в критичных местах.

5. **`method` по умолчанию `'exec'`** — если в классе нет метода `exec`,
   сервер выбросит исключение.

6. **`module` резолвится относительно `Modules/`** — путь без расширения.
   Пример: `module="Test/Some/ModuleName"` →
   `Modules/Test/Some/ModuleName.mdl` или
   `Modules/Test/Some/ModuleName/index.php`.

7. **`async` в текущей версии не используется** — сервер читает его в
   `__construct`, но `ShowXML()` синхронный. Значение сохраняется,
   логика асинхронности реализуется на клиенте.

8. **Вложенные модули** — `Module` может содержать другой `Module`.
   Связь «внутренний ← внешний» — через `srctype="parent"`.

9. **Ошибки возвращаются в поле `error`** — ответ всегда содержит
   `"error": json_encode($message)`. Клиент может показать через
   `D3Api.notify`.

---

## Чек-лист добавления нового модуля

1. В палитре выбрать **D3 → Module**.
2. В инспекторе задать `name` (например `ACT_LOAD_DATA`).
3. Задать `module` — путь без расширения (`Test/Reports/Load`).
4. Задать `method`, если в классе модуля нужен не `exec`.
5. Добавить в `Module` нужные `ModuleVar` через палитру.
6. Для каждой переменной:
    - `name` — имя внутри модуля;
    - `src` — источник;
    - `srctype` — тип источника (`var`, `ctrl`, `session`, `const`, …);
    - `get` — имя поля чтения (или `""` для автогенерации);
    - `put` — имя поля записи (или `""`);
    - `type`, `query_type`, `default` — по необходимости.
7. Вызвать модуль в нужном месте формы:
   ```js
   executeModule('ACT_LOAD_DATA', function(result) {
       // result.data — объект с переменными put
   });
   ```

---

## См. также

- `Component/d3/Fetch/README.md` — аналогичный по структуре контрол
  (родитель → дочерний)
- `Component/d3/Action/README.md` — Action, часто вызываемый внутри модуля
- `ModuleCtrl.inc` — пустой наследник `ModuleBase`
- `ModuleBaseCtrl.inc` — серверная логика `Module` и `ModuleVar`
