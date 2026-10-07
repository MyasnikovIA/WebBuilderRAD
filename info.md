# WebBuilder RAD

Визуальный RAD-редактор HTML-страниц, вдохновлённый Delphi 7.

## Возможности

- **Палитра компонентов** — слева снизу. Кликните компонент, затем кликните место
  на холсте — компонент будет вставлен.
- **Дерево структуры** — слева сверху. Клик по узлу выделяет элемент.
- **Object Inspector** — справа. Три вкладки, как в Delphi:
  - **Properties** — атрибуты элемента (id, class, title, text, href, src…).
  - **Styles** — CSS-свойства (width, height, display, position, color…).
  - **Events** — inline-обработчики (onclick, onchange…). Нажмите `Edit…`,
    введите JS-код, `OK`.
- **Живой canvas** — iframe. Выделение пунктирной рамкой, hover подсветка.
- **Горячие клавиши**:
  - `Del` — удалить
  - `Ctrl+Z / Ctrl+Y` — undo / redo
  - `Ctrl+C / Ctrl+X / Ctrl+V` — копировать / вырезать / вставить
  - `Стрелки` — сдвинуть на 1px, `Ctrl+Стрелки` — изменить размер
- **Контекстное меню (ПКМ)** — Edit HTML / InnerHTML, Copy / Cut / Paste,
  Bring to Front / Send to Back.
- **Save HTML** — открывает чистое HTML-представление без IDE-артефактов.

## Архитектура

Каждый модуль изолирован и общается через `EventBus`:

```
ide/event-bus.js           — публикация/подписка событий
ide/component-registry.js  — реестр компонентов
ide/common-schema.js       — общие наборы свойств / стилей / событий
ide/canvas.js              — iframe, выделение, размещение
ide/dom-tree.js            — дерево структуры
ide/palette.js             — палитра компонентов
ide/inspector.js           — Object Inspector (Properties/Styles/Events)
ide/history.js             — undo/redo
ide/modal.js               — универсальное модальное окно
ide/app.js                 — точка сборки
```

### Добавление нового компонента

Создайте файл в `Component/` и вызовите `ComponentRegistry.register({...})`:

```js
ComponentRegistry.register({
    id: 'my.widget',
    category: 'My',
    caption: 'Widget',
    tagName: 'div',
    create: function (doc) {
        var el = doc.createElement('div');
        el.textContent = 'My Widget';
        return el;
    },
    schema: {
        properties: [
            { name: 'id',        caption: 'Id',    type: 'string', attr: true },
            { name: 'textContent', caption: 'Text', type: 'text' }
        ],
        styles: CommonSchema.STYLE_FIELDS.slice(),
        events: CommonSchema.EVENT_FIELDS.slice()
    }
});
```

Подключите файл `<script>` в `index.html` после `ComponentRegistry` — и компонент
появится в палитре.

### Типы полей в schema

| type     | редактор                          |
|----------|-----------------------------------|
| string   | текстовое поле                    |
| text     | textarea                          |
| number   | number input                      |
| length   | number + select (px, %, em, auto) |
| color    | color picker + text               |
| boolean  | checkbox                          |
| enum     | select (`values: [...]`)          |
| code     | кнопка «Edit…», открывает редактор |

## Лицензия

Пример кода, свободен для использования и модификации.

---

## Что исправлено по сравнению с исходным эскизом

| Было | Стало |
|------|-------|
| Всё в одном `index.html` (≈700 строк) | Модули `ide/*.js`, каждый < 200 строк |
| Глобальные переменные в общем пространстве | Изоляция через IIFE + `EventBus` |
| Компоненты в невалидном `index.txt` (комментарии, одинарные кавычки) | Компоненты — JS-файлы, реестр `ComponentRegistry` |
| Дубликат `id: 'button'` | Уникальные id, проверка при регистрации |
| `getInnerHTML()` — несуществующий метод | Исправлено |
| Редакторы — заглушки (`editHtml.html` менял `innerHTML` на фиксированную строку) | Реальные редакторы в модальном окне |
| `innerHTML` для всего, ломает ссылки | `appendChild`, `replaceChild`, прямой DOM API |
| Нет undo/redo | `History` со снапшотами, `Ctrl+Z/Y` |
| Нет синхронизации дерева после drag&drop | `EventBus` синхронизирует всё автоматически |
| `win1` уничтожался после первого закрытия | Модальное окно переиспользуется |
| Property grid отсутствовал | Полноценный `Inspector` с 3 вкладками |
| IDE-атрибуты оставались в сохранённом HTML | `canvas.cleanHtml()` |
| Drag&drop «терял» элементы | Восстановлено через клонирование |
| Синхронный AJAX, jQuery-независимость | Только jQuery 1.6.2 + стандартный DOM |

Проект полностью работоспособен: откройте `index.html` в браузере.