import { check, code, defineLevel } from '../../dsl';

const TODO_HTML = `<h2>To-do</h2>
<input id="task" placeholder="New task">
<button id="add">Add</button>
<ul id="list"></ul>
<p id="count">0 tasks</p>`;

export default defineLevel({
  id: 'w2.l16',
  title: 'The DOM',
  icon: '🖱️',
  summary: 'Make web pages react: querySelector, textContent, events',
  lang: 'javascript',
  teaches: ['dom', 'events'],
  requires: ['js-objects', 'js-functions', 'js-arrays'],
  learn: [
    {
      title: 'The page is a tree of objects',
      minutes: 3,
      analogy: 'A web page is a **family tree** of boxes: the page contains a body, which contains headings and buttons. JS can find any box and change what\'s inside it.',
      body: `Web pages are written in **HTML**: tags like \`<h1>Title</h1>\` and \`<button id="go">Go</button>\`. The **id** attribute gives an element a unique name.

The browser turns HTML into the **DOM** (Document Object Model) — a tree of objects JS can read and change, starting from \`document\`.

\`\`\`js
const heading = document.querySelector("#title"); // # = find by id
heading.textContent = "Hello!";                     // change its text
heading.style.color = "purple";                     // change its style
\`\`\`

\`querySelector\` takes a **CSS selector**: \`"#id"\`, \`".class"\` or a tag name like \`"p"\`. It returns the first match, or \`null\` if nothing matches.

Press ▶ Run to see the page change.`,
      example: {
        lang: 'javascript',
        dom: { html: '<h1 id="title">Old title</h1>\n<p class="note">Some text</p>' },
        code: code`
          const heading = document.querySelector("#title");
          heading.textContent = "Hello from JavaScript!";
          heading.style.color = "purple";
          document.querySelector(".note").textContent = "I was changed by code.";
        `,
      },
    },
    {
      title: 'Events: reacting to clicks',
      minutes: 3,
      analogy: 'An **event listener** is a **doorbell**: you wire it up once, and every time someone presses the button, your function runs.',
      body: `An **event** is something that happens on the page: a click, a key press, typing in a box. Attach a function to run when it happens:

\`\`\`js
button.addEventListener("click", () => {
  count++;
  output.textContent = \`Clicked \${count} times\`;
});
\`\`\`

Building new elements:

\`\`\`js
const li = document.createElement("li");  // make a new <li>
li.textContent = "Buy milk";
list.appendChild(li);                     // put it on the page
\`\`\`

- \`input.value\` is the text typed into an \`<input>\`.
- \`element.remove()\` deletes an element.`,
      example: {
        lang: 'javascript',
        dom: { html: '<button id="btn">Click me</button>\n<p id="out">Not clicked yet</p>\n<ul id="log"></ul>' },
        code: code`
          let count = 0;
          const btn = document.querySelector("#btn");
          btn.addEventListener("click", () => {
            count++;
            document.querySelector("#out").textContent = \`Clicked \${count} times\`;
            const li = document.createElement("li");
            li.textContent = \`Click number \${count}\`;
            document.querySelector("#log").appendChild(li);
          });
        `,
      },
    },
  ],
  practice: [
    {
      title: 'Change the heading',
      minutes: 2,
      prompt: 'Change the text of the `<h1>` with id `title` to `Code Quest`, and the paragraph with id `sub` to `Level 16`.',
      starter: '// find the elements and set their textContent\n',
      dom: { html: '<h1 id="title">Loading…</h1>\n<p id="sub">…</p>' },
      solution: 'document.querySelector("#title").textContent = "Code Quest";\ndocument.querySelector("#sub").textContent = "Level 16";\n',
      solutionExplain: '`querySelector("#id")` finds each element; assigning `textContent` replaces its text.',
      hints: ['Use `document.querySelector("#title")`.', 'Then `.textContent = "Code Quest";` — same for `#sub`.'],
      tests: [
        check('Heading says Code Quest', "assert(textOf('#title') === 'Code Quest', 'Heading is: ' + textOf('#title'));", 'Set the h1 text to "Code Quest".'),
        check('Subtitle says Level 16', "assert(textOf('#sub') === 'Level 16', 'Subtitle is: ' + textOf('#sub'));", 'Set the paragraph text to "Level 16".'),
      ],
    },
    {
      title: 'Click counter',
      minutes: 3,
      prompt: 'Each click on the `#plus` button should increase the number shown in `#count` by 1 (it starts at `0`).',
      starter: 'let count = 0;\n// add a click listener to #plus\n',
      dom: { html: '<button id="plus">+1</button>\n<span id="count">0</span>' },
      solution: 'let count = 0;\ndocument.querySelector("#plus").addEventListener("click", () => {\n  count++;\n  document.querySelector("#count").textContent = count;\n});\n',
      solutionExplain: 'The listener runs on every click: it updates the variable, then shows it on the page.',
      hints: ['`document.querySelector("#plus").addEventListener("click", () => { ... });`', 'Inside: `count++;` then set `#count`\'s textContent to `count`.'],
      tests: [
        check('Starts at 0', "assert(textOf('#count') === '0');", 'Before any click it shows 0.'),
        check('Counts clicks', "click('#plus'); click('#plus'); click('#plus');\nassert(textOf('#count') === '3', 'After 3 clicks it shows ' + textOf('#count'));", 'After 3 clicks the count should show 3.'),
      ],
    },
  ],
  challenges: [
    {
      title: 'To-do list',
      minutes: 7,
      prompt: `Make a working to-do list on this page:

\`\`\`html
${TODO_HTML}
\`\`\`

1. Clicking **#add** adds the text from **#task** as a new \`<li>\` in **#list**, then clears the input.
2. Ignore empty input (after trimming spaces with \`.trim()\`).
3. Clicking a to-do item **removes** it.
4. **#count** always shows \`N tasks\` (e.g. \`2 tasks\`).

Tip: write a small \`updateCount()\` function and call it after every change. \`document.querySelectorAll("#list li").length\` counts the items.`,
      starter: 'const input = document.querySelector("#task");\nconst list = document.querySelector("#list");\n\n// your code\n',
      dom: { html: TODO_HTML },
      solution: 'const input = document.querySelector("#task");\nconst list = document.querySelector("#list");\nconst countEl = document.querySelector("#count");\n\nfunction updateCount() {\n  const n = document.querySelectorAll("#list li").length;\n  countEl.textContent = `${n} tasks`;\n}\n\ndocument.querySelector("#add").addEventListener("click", () => {\n  const text = input.value.trim();\n  if (text === "") return;\n  const li = document.createElement("li");\n  li.textContent = text;\n  li.addEventListener("click", () => {\n    li.remove();\n    updateCount();\n  });\n  list.appendChild(li);\n  input.value = "";\n  updateCount();\n});\n',
      solutionExplain: 'The add listener reads and trims the input, returns early if it\'s empty, builds an `<li>` with its own click-to-remove listener, appends it, clears the input and refreshes the count. Keeping the count logic in one function avoids repeating yourself.',
      hints: [
        'In the #add click listener: read `input.value.trim()`, `return` if empty, otherwise `document.createElement("li")`, set its text, `list.appendChild(li)`.',
        'Give each new `li` its own listener: `li.addEventListener("click", () => { li.remove(); updateCount(); });` and reset `input.value = ""`.',
      ],
      tests: [
        check('Adds a task', "typeInto('#task', 'Buy milk'); click('#add');\nconst items = [...document.querySelectorAll('#list li')].map(li => li.textContent.trim());\nassert(items.length === 1 && items[0] === 'Buy milk', 'List has: ' + JSON.stringify(items));", 'Typing "Buy milk" and clicking Add should add one <li> with that text.'),
        check('Clears the input', "assert(document.querySelector('#task').value === '', 'Input still has: ' + document.querySelector('#task').value);", 'After adding, the input box should be empty.'),
        check('Ignores empty input', "typeInto('#task', '   '); click('#add');\nassert(document.querySelectorAll('#list li').length === 1, 'Blank task was added');", 'Blank or spaces-only input must not add an item.'),
        check('Count text updates', "typeInto('#task', 'Walk dog'); click('#add');\nassert(textOf('#count') === '2 tasks', 'Count shows: ' + textOf('#count'));", 'With two tasks, #count should say "2 tasks".'),
        check('Click removes a task', "document.querySelector('#list li').dispatchEvent(new MouseEvent('click', { bubbles: true }));\nconst items = [...document.querySelectorAll('#list li')].map(li => li.textContent.trim());\nassert(items.length === 1 && items[0] === 'Walk dog', 'List has: ' + JSON.stringify(items));\nassert(textOf('#count') === '1 tasks', 'Count shows: ' + textOf('#count'));", 'Clicking the first item removes it, and the count drops to "1 tasks".'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'concept',
      prompt: 'What does `document.querySelector("#score")` return?',
      options: ['The text "#score"', 'The first element with id "score" (or null)', 'All elements with class score', 'A new element'],
      answer: 1,
      explain: '`#` means id. It returns the element object, or null if there is none.',
    },
    {
      kind: 'bug',
      prompt: 'This throws `TypeError: Cannot set properties of null`. Most likely cause?',
      code: 'document.querySelector("#titel").textContent = "Hi";',
      codeLang: 'javascript',
      options: ['textContent is read-only', 'No element has id "titel" (typo?), so querySelector returned null', 'Need innerText', 'Strings need backticks'],
      answer: 1,
      explain: 'querySelector found nothing. Check the id spelling against the HTML.',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'The page has `<p id="n">5</p>`. After this runs and the user never clicks, what does #n show?',
      code: 'const p = document.querySelector("#n");\ndocument.body.addEventListener("click", () => {\n  p.textContent = "clicked";\n});',
      codeLang: 'javascript',
      answers: ['5'],
      explain: 'The listener only runs when a click happens. With no clicks, the text stays 5.',
    },
  ],
});
