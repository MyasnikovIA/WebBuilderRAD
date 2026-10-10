
## Что теперь работает

### 1. Свойства с JS-обработчиками

- В таблице **Component Properties** появилась колонка **JS onChange**.
- Двойной клик по пустому полю → генерируется имя (`onMyComponentColorChange`), пишется в поле, редактор переключается на **JS**-подвкладку, в конец дописывается шаблон функции, курсор ставится внутрь тела.
- Двойной клик по заполненному полю → ищет функцию в JS; если не найдена — дописывает в конец, курсор — в тело.
- На runtime: как только атрибут-свойство меняется, `MutationObserver` вызывает указанную функцию с контекстом `{ name, value, oldValue, component, el }`.

### 2. Component Events

- Новая подвкладка **Component Events** с таблицей: имя события, заголовок, обработчик.
- Двойной клик по полю обработчика — та же навигация/генерация.
- На runtime: слушатель вешается на корневой элемент компонента (`el.addEventListener(ev.name, ...)`), при срабатывании вызывает указанную функцию с контекстом `{ type, originalEvent, data, component, el }`.

### 3. Доступ к компоненту в JS

После запуска проекта (или preview) в JS доступно:

```js
// По cmptype:
var cmp = WbComponent.get('my.component');

// По id:
var cmp = WbComponent.get('cmp_xxx');

// По DOM-элементу:
var cmp = WbComponent.get(document.querySelector('[data-wb-user-comp]'));

// Все экземпляры данного cmptype:
var list = WbComponent.all('my.component');
```

У инстанса есть:

```js
cmp.el                            // корневой DOM-элемент
cmp.id, cmp.cmptype, cmp.name     // метаданные
cmp.get('color')                  // получить значение свойства
cmp.set('color', '#ff0')          // установить (вызовет onChange)
cmp.color                         // то же самое через accessor
cmp.color = '#ff0'                // (вызовет onChange)
cmp.on('myEvent', handler)        // подписка на пользовательское событие
cmp.off('myEvent', handler)
cmp.emit('myEvent', { any: 1 })   // вызвать событие
```

### 4. Функции события/свойства — глобальные

JS-код компонента вставляется как `<script data-wb-user-comp-script>`, содержимое исполняется в глобальном скоупе окна проекта. Значит, функции, объявленные там, доступны по имени (`window.onMyEventHandler`), и `WbComponent` их находит через `resolveFn`. Поддерживаются точечные пути: `MyComp.onColorChange`.

### 5. Что попадает в `project.json`

```json
{
  "type": "component",
  "component": {
    "cmptype": "my.component",
    "customProperties": [
      { "name": "color", "type": "color", "onChangeFunc": "onMyComponentColorChange" }
    ],
    "customEvents": [
      { "name": "myEvent", "caption": "Моё событие", "handlerFunc": "onMyComponentMyEvent" }
    ],
    "nestingMode": "list",
    "nestingRules": [{ "kind": "tag", "value": "input" }],
    ...
  }
}
```

### 6. Что НЕ попадает в дерево и CodeView

- `<style data-wb-user-comp-style>`, `<script data-wb-user-comp-script>`, `<link data-wb-user-comp-asset>` — фильтруются (патчи `canvas-format.js`, `code-view.js` из предыдущего шага).
- Bootstrap `<script data-wb-user-comp-bootstrap="1">` — фильтруется тем же `code-view.js` (см. правило для `data-wb-user-comp-*`) — если нужно гарантированно, добавьте `data-wb-user-comp-bootstrap` в `stripUserCompServiceNodes`.