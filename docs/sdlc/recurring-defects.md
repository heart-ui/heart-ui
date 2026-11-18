# Recurring defects

One line per defect: what it looks like, then the severity.

- An axe or visual test that sees only the demo state open on load, when the spec lists more states (closed, each size, each variant, 375 px): high.
- A spec line that promises a failure ("a missing title fails the browser test") with no test that triggers it: high.
- A client that types data from the network or disk (registry items, config) with fields it never validates, such as a file `path` or `target` that may be absolute, contain `..`, or point into `.git`: high.
- A catch-all that prints a raw system or library error message (`EACCES: …`, `fetch failed`) instead of a fixed line: high.
