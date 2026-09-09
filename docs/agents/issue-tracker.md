# Issue tracker: GitHub

Issues and specs live in [alexszczurek/typehug](https://github.com/alexszczurek/typehug/issues). Use the `gh` CLI. Pass `--repo alexszczurek/typehug` explicitly so commands also work when the shell starts in another repository.

## Issue operations

Keep issue titles on one line. For multiline bodies and comments, write the exact text to a temporary file and pass its path through `--body-file`. Quote shell arguments so their contents stay literal.

- Create: `gh issue create --repo alexszczurek/typehug --title "<title>" --body-file <file>`.
- Read the body, labels, and discussion: `gh issue view <number> --repo alexszczurek/typehug --json number,title,body,labels,comments`.
- List: `gh issue list --repo alexszczurek/typehug --state open --json number,title,body,labels,comments`. Add `--label` when filtering by triage role.
- Comment: `gh issue comment <number> --repo alexszczurek/typehug --body-file <file>`.
- Edit a body: `gh issue edit <number> --repo alexszczurek/typehug --body-file <file>`.
- Apply or remove labels: `gh issue edit <number> --repo alexszczurek/typehug --add-label "<label>"` or `--remove-label "<label>"`.
- Close: `gh issue close <number> --repo alexszczurek/typehug`. Post any resolution comment first.

When a skill says "publish to the issue tracker", create a GitHub issue. When it says "fetch the relevant ticket", read the issue's body, labels, and comments.

## Pull requests as a triage surface

**PRs as a request surface: no.**

The triage queue contains issues. Change this flag to `yes` to include external pull requests. In that mode, use the corresponding `gh pr` commands, read both the discussion and diff, and apply the same label mapping. Include external authors with `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE` association; exclude `OWNER`, `MEMBER`, and `COLLABORATOR`.

Issues and pull requests share a number space. For an ambiguous reference, try `gh pr view <number> --repo alexszczurek/typehug`, then fall back to `gh issue view`.

## Wayfinding operations

When using `wayfinder`, keep the map in one issue labelled `wayfinder:map`, with Notes, Decisions-so-far, and Fog in its body.

- Link child issues using GitHub sub-issues. If unavailable, use a task list in the map and a `Part of #<map>` line in each child. Label children `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling`, or `wayfinder:task`.
- Represent blockers with native issue dependencies. Add a blocker using `gh api --method POST repos/alexszczurek/typehug/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-database-id>`. Obtain that database ID with `gh api repos/alexszczurek/typehug/issues/<blocker-number> --jq .id`; it differs from the issue number and node ID.
- If native dependencies are unavailable, put `Blocked by: #<number>, #<number>` at the top of the child body.
- Pick the first open, unassigned child in map order with no open blockers. Native `issue_dependencies_summary.blocked_by` counts open blockers. For the text fallback, check each referenced issue's state.
- Claim with `gh issue edit <number> --repo alexszczurek/typehug --add-assignee @me` before working on the child.
- Resolve by posting the answer, closing the child, and adding a short finding with a link to the map's Decisions-so-far.
