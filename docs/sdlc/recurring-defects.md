# Recurring defects

One line per defect: what it looks like, then the severity.

- An axe or visual test that sees only the demo state open on load, when the spec lists more states (closed, each size, each variant, 375 px): high.
- A spec line that promises a failure ("a missing title fails the browser test") with no test that triggers it: high.
- A client that types data from the network or disk (registry items, config) with fields it never validates, such as a file `path` or `target` that may be absolute, contain `..`, or point into `.git`: high.
- A catch-all that prints a raw system or library error message (`EACCES: …`, `fetch failed`) instead of a fixed line: high.
- A command printed for the user to paste, or passed to a shell, that holds text from a registry or other untrusted source: high.
- A file edit through temp-and-rename that replaces a symlink, or follows one out of the project: high.
- A setup step that writes its "already set up" marker before the rest, so a failed run blocks every re-run: high.
- Deciding whether the user changed a copied file by comparing it with the latest upstream content instead of the hash recorded at install: high.
- A step promised to leave nothing behind ("a failed add leaves files and the lock as they were") whose later step (an install) runs outside the rollback: high.
