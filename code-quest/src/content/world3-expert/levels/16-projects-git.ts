import { call, check, code, defineLevel } from '../../dsl';

export default defineLevel({
  id: 'w3.l16',
  title: 'Real Projects & Git',
  icon: '🌳',
  summary: 'How projects are organized, and what git actually does',
  lang: 'python',
  teaches: ['project-structure'],
  requires: ['classes', 'dicts', 'testing', 'string-manipulation'],
  learn: [
    {
      title: 'How real projects are organized',
      minutes: 3,
      analogy: 'A project is a **well-run kitchen**: ingredients in the pantry (data), recipes in a binder (code split into modules), a label on the door (README), and a taste-tester (tests).',
      body: `Real programs are split across many files. A typical Python project:

\`\`\`
budget-app/
  README.md          ← what it is, how to install & run
  requirements.txt   ← libraries it needs
  .gitignore         ← files git should NOT track
  budget/            ← the code, as a "package"
    __init__.py
    models.py        ← Transaction, Budget classes
    storage.py       ← load/save JSON
  tests/
    test_models.py   ← pytest tests
\`\`\`

Each \`.py\` file is a **module**. One module uses another with \`import\`: \`from budget.models import Budget\`. JavaScript projects look similar, with \`package.json\` and \`import { x } from "./file.js"\`.

**Separation of concerns**: each file has one job, so you know where to look — and where to change.`,
      example: {
        lang: 'python',
        code: code`
          # Imagine these were 3 separate files. Here they share one, as sections.

          # --- models.py ---
          class Task:
              def __init__(self, title):
                  self.title = title
                  self.done = False

          # --- storage.py ---
          import json
          def to_json(tasks):
              return json.dumps([{"title": t.title, "done": t.done} for t in tasks])

          # --- main.py (would say: from models import Task) ---
          tasks = [Task("learn git"), Task("ship it")]
          tasks[0].done = True
          print(to_json(tasks))
        `,
      },
    },
    {
      title: 'Git: save points for code',
      minutes: 3,
      analogy: 'Git is **save points in a video game** for your whole project: you can go back to any save, try risky things on a separate save slot (a branch), and combine progress later.',
      body: `**Git** is a **version control** system: it records the history of your project.

- **Repository (repo)**: a project folder that git tracks.
- **Commit**: a saved snapshot of the files, with a message ("Add login form") and a unique id.
- **Branch**: an independent line of commits — work on a feature without disturbing \`main\`.
- **Merge**: combine a branch's commits back into another branch.
- **Pull request (PR)**: on GitHub, a proposal to merge a branch, where teammates review the changes (the **diff**).

Typical flow: \`git checkout -b feature\` → edit → \`git add .\` → \`git commit -m "message"\` → \`git push\` → open a PR → review → merge.

In the challenge you'll build a tiny version of git's core idea yourself.`,
      example: {
        lang: 'python',
        code: code`
          history = []   # a tiny "repository"

          def commit(message, files):
              history.append({"id": f"c{len(history) + 1}", "message": message, "files": dict(files)})

          commit("Start project", {"README.md": "# App"})
          commit("Add main", {"README.md": "# App", "main.py": "print('hi')"})
          for c in reversed(history):
              print(c["id"], c["message"], sorted(c["files"]))
        `,
      },
    },
  ],
  practice: [
    {
      title: 'Bump the version',
      minutes: 3,
      prompt: `Releases use **semantic versioning**: \`MAJOR.MINOR.PATCH\`, e.g. \`2.4.1\`.

Write \`bump(version, part)\` where part is \`"major"\`, \`"minor"\` or \`"patch"\`. Bumping a part increases it by 1 and resets the parts after it to 0:
\`bump("2.4.1", "minor")\` → \`"2.5.0"\`, \`bump("2.4.1", "major")\` → \`"3.0.0"\`.`,
      starter: 'def bump(version, part):\n    pass\n',
      solution: 'def bump(version, part):\n    major, minor, patch = [int(x) for x in version.split(".")]\n    if part == "major":\n        return f"{major + 1}.0.0"\n    if part == "minor":\n        return f"{major}.{minor + 1}.0"\n    return f"{major}.{minor}.{patch + 1}"\n',
      solutionExplain: 'Split on dots, convert to ints, then guard clauses rebuild the right string for each part.',
      hints: ['`major, minor, patch = [int(x) for x in version.split(".")]`', 'Return a new f-string for each case, resetting the lower parts to 0.'],
      tests: [
        call('bump', ['2.4.1', 'patch'], '2.4.2', 'patch +1'),
        call('bump', ['2.4.1', 'minor'], '2.5.0', 'minor +1, patch reset'),
        call('bump', ['2.4.1', 'major'], '3.0.0', 'major +1, others reset'),
        call('bump', ['0.9.9', 'patch'], '0.9.10', 'Parts are numbers, not digits: 9 → 10.'),
      ],
    },
    {
      title: '.gitignore matcher',
      minutes: 3,
      prompt: `Write \`is_ignored(path, patterns)\` supporting three kinds of .gitignore pattern:

- \`"*.log"\` — any file ending in \`.log\`
- \`"node_modules/"\` — anything inside a folder with that name (at any depth)
- \`".env"\` — a file with exactly that name (at any depth)

\`is_ignored("src/app.log", ["*.log"])\` → True; \`is_ignored("lib/node_modules/x.js", ["node_modules/"])\` → True.`,
      starter: 'def is_ignored(path, patterns):\n    pass\n',
      solution: 'def is_ignored(path, patterns):\n    parts = path.split("/")\n    for pattern in patterns:\n        if pattern.startswith("*."):\n            if path.endswith(pattern[1:]):\n                return True\n        elif pattern.endswith("/"):\n            if pattern[:-1] in parts[:-1]:\n                return True\n        elif parts[-1] == pattern:\n            return True\n    return False\n',
      solutionExplain: 'Splitting the path into parts makes each rule simple: extensions check the end, folder patterns check the directory parts, exact names check the file name.',
      hints: ['Split the path on "/". Handle each pattern type with if / elif.', 'Folder pattern: `pattern[:-1] in parts[:-1]` (folders are all parts except the last). Exact: `parts[-1] == pattern`.'],
      tests: [
        call('is_ignored', ['src/app.log', ['*.log']], true, 'Extension match.'),
        call('is_ignored', ['lib/node_modules/x.js', ['node_modules/']], true, 'Inside node_modules at any depth.'),
        call('is_ignored', ['config/.env', ['.env']], true, 'Exact file name in a subfolder.'),
        call('is_ignored', ['src/main.py', ['*.log', '.env', 'node_modules/']], false, 'Nothing matches.'),
        call('is_ignored', ['my.env.example', ['.env']], false, 'Exact name must match the whole file name.'),
      ],
    },
  ],
  challenges: [
    {
      title: 'Build a mini git',
      minutes: 8,
      prompt: `Build \`CommitLog\`, a tiny version of git's history:

- \`commit(message, files)\` — \`files\` is a dict \`{filename: content}\`. Save a **copy** as a new commit with id \`"c1"\`, \`"c2"\`, … and return the id.
- \`log()\` — list of \`"ID message"\` strings, **newest first**.
- \`checkout(commit_id)\` — return (a copy of) the files dict saved in that commit; raise \`KeyError\` for an unknown id.
- \`diff(old_id, new_id)\` — return \`{"added": [...], "removed": [...], "changed": [...]}\`, each a **sorted** list of file names.

\`\`\`python
repo = CommitLog()
repo.commit("init", {"a.txt": "hi"})                    # "c1"
repo.commit("edit", {"a.txt": "hello", "b.txt": "new"}) # "c2"
repo.diff("c1", "c2")  # {"added": ["b.txt"], "removed": [], "changed": ["a.txt"]}
\`\`\``,
      starter: 'class CommitLog:\n    def __init__(self):\n        self.commits = []\n',
      solution: 'class CommitLog:\n    def __init__(self):\n        self.commits = []\n\n    def commit(self, message, files):\n        commit_id = f"c{len(self.commits) + 1}"\n        self.commits.append({"id": commit_id, "message": message, "files": dict(files)})\n        return commit_id\n\n    def log(self):\n        return [f"{c[\'id\']} {c[\'message\']}" for c in reversed(self.commits)]\n\n    def _find(self, commit_id):\n        for c in self.commits:\n            if c["id"] == commit_id:\n                return c\n        raise KeyError(commit_id)\n\n    def checkout(self, commit_id):\n        return dict(self._find(commit_id)["files"])\n\n    def diff(self, old_id, new_id):\n        old = self._find(old_id)["files"]\n        new = self._find(new_id)["files"]\n        return {\n            "added": sorted([f for f in new if f not in old]),\n            "removed": sorted([f for f in old if f not in new]),\n            "changed": sorted([f for f in new if f in old and new[f] != old[f]]),\n        }\n',
      solutionExplain: 'Each commit stores a copy (`dict(files)`) so later edits to the caller\'s dict can\'t rewrite history — just like real git snapshots. A private helper `_find` (leading underscore = "internal") is reused by checkout and diff. The diff compares the two file dicts with three comprehensions.',
      hints: [
        'Store each commit as a dict with id, message and `dict(files)` (a copy!). For lookups, write a helper that finds a commit by id or raises KeyError.',
        'diff: added = in new but not old; removed = in old but not new; changed = in both with different content. Wrap each in `sorted(...)`.',
      ],
      tests: [
        check('commit ids and log', "r = CommitLog()\nassert r.commit('init', {'a.txt': 'hi'}) == 'c1'\nassert r.commit('edit', {'a.txt': 'yo'}) == 'c2'\nassert r.log() == ['c2 edit', 'c1 init'], str(r.log())", 'Ids count up; log is newest first.'),
        check('checkout', "r = CommitLog()\nr.commit('init', {'a.txt': 'hi'})\nr.commit('edit', {'a.txt': 'yo', 'b.txt': 'b'})\nassert r.checkout('c1') == {'a.txt': 'hi'}, str(r.checkout('c1'))", 'checkout("c1") returns the files from the first commit.'),
        check('Snapshots are copies', "r = CommitLog()\nfiles = {'a.txt': 'hi'}\nr.commit('init', files)\nfiles['a.txt'] = 'CHANGED'\nfiles['x'] = '1'\nassert r.checkout('c1') == {'a.txt': 'hi'}, 'History was rewritten!'\nr.checkout('c1')['a.txt'] = 'tamper'\nassert r.checkout('c1') == {'a.txt': 'hi'}, 'checkout must return a copy'", 'Changing the dict after committing (or after checkout) must not change history.'),
        check('diff', "r = CommitLog()\nr.commit('one', {'a': '1', 'b': '2', 'c': '3'})\nr.commit('two', {'a': '1', 'b': 'TWO', 'd': '4', 'e': '5'})\nassert r.diff('c1', 'c2') == {'added': ['d', 'e'], 'removed': ['c'], 'changed': ['b']}, str(r.diff('c1', 'c2'))", 'Added, removed and changed file names, each sorted.'),
        check('Unknown id', "r = CommitLog()\ntry:\n    r.checkout('c9')\n    assert False, 'No error'\nexcept KeyError:\n    pass", 'checkout of an unknown id raises KeyError.'),
      ],
    },
  ],
  quiz: [
    {
      kind: 'concept',
      prompt: 'What is a git commit?',
      options: ['A backup copy of git itself', 'A saved snapshot of the project with a message', 'A branch', 'A GitHub account'],
      answer: 1,
      explain: 'A commit records the state of your files at a moment, with a message explaining the change.',
    },
    {
      kind: 'concept',
      prompt: 'Why work on a branch instead of directly on main?',
      options: ['Branches run faster', 'To develop a change in isolation, get it reviewed, then merge it', 'main is read-only', 'Git requires it'],
      answer: 1,
      explain: 'Branches let you experiment safely; main stays working until the change is reviewed and merged.',
    },
    {
      kind: 'bug',
      prompt: 'A teammate committed this file. What\'s wrong?',
      code: '# config.py\nAPI_KEY = "sk-live-8f3a9..."',
      codeLang: 'python',
      options: ['Nothing', 'A secret key is committed to the repo — anyone with access can see it. Keep secrets in an ignored .env file', 'Variables must be lowercase', 'Missing a docstring'],
      answer: 1,
      explain: 'Never commit secrets. Load them from environment variables / a .env file listed in .gitignore.',
    },
    {
      kind: 'predict',
      format: 'text',
      prompt: 'Using your mini-git rules: after `commit("a", {})` and `commit("b", {})`, what does log() return? (Write it as a Python list.)',
      code: 'repo = CommitLog()\nrepo.commit("a", {})\nrepo.commit("b", {})\nprint(repo.log())',
      answers: ["['c2 b', 'c1 a']"],
      explain: 'Newest first: c2 then c1.',
    },
  ],
});
