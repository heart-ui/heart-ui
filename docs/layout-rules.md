# Layout rules

These rules decide arrangement, which tokens cannot express. They ship to
users and agents as-is, and every block and layout in `registry/` obeys
them.

## Screen workflow

1. Write a brief: the user, the one primary task, content ranked by
   importance, the primary action.
2. Pick one layout from the catalog below. Justify it against `useWhen`.
3. Fill each region with blocks. Add bare components only where no block fits.
4. Build the empty, loading, error, and long-content states.
5. Screenshot at 375, 768, and 1280 px. Run `trevui audit`. Fix findings.

## Rules

### Page structure

- Every signed-in screen sits inside `app-shell`. Never rebuild navigation
  per page.
- Content width is capped at `content-max`. Forms and reading text use
  `content-narrow`.
- One `page-header` per screen: title, optional description, actions on
  the trailing side.
- Vertical rhythm between sections is `section-gap`. Do not mix other gaps
  at the section level.

### Actions

- One primary button per view. Other actions are secondary or ghost.
- Page-level actions go in `page-header`. Row actions go in a trailing
  menu on the row. Bulk actions appear in the table toolbar only while
  rows are selected.
- Destructive actions use the `danger` variant and a `confirm-dialog`.
- In dialogs and form footers, the primary action is last in reading order.

### Lists and data

- Table when rows share columns that users compare or sort. Cards when
  items are visual or differ in shape.
- Filters sit directly above the data they filter, in `filter-bar`. More
  than four filters collapse into a "Filters" popover.
- Search is the first control in `filter-bar`.
- Pagination sits below the data, trailing side. Use it past 50 rows.
- Numbers align to the end of the cell; text aligns to the start.

### Detail and editing

- Side drawer for quick view or edit while keeping list context. Modal for
  a short, blocking decision. Full page when the task has more than about
  eight fields or needs its own URL.
- Never open a modal from a modal.
- Forms are one column. Group related fields under `form-section` with a
  heading. Labels sit above fields.
- Validate on blur and on submit. Show the message under the field.
- Forms longer than about twelve fields become a wizard or split sections.

### States

- Every data region renders four states: `empty`, `loading`, `error`,
  `long`. Empty states name the next action. Loading uses skeletons that
  match the final layout. Errors offer retry.
- A first-use empty state differs from a no-results state. Use
  `first-run-state` and `no-results-state`.

### Responsive

- Design at 375 px first. Nothing scrolls sideways except tables, which
  scroll inside their own container.
- Below 768 px the sidebar becomes a drawer, `list-detail` shows one pane
  at a time, and `page-header` actions collapse into a menu past two.
- Touch targets are at least `control-md` tall below 768 px.

## Layout catalog

| Layout | `useWhen` | Regions |
| --- | --- | --- |
| `app-shell` | Any signed-in screen that shares navigation | `sidebar`, `topbar`, `default` |
| `list-filters` | Users scan, search, and filter many records of one type | `header`, `filters`, `data`, `pagination` |
| `list-detail` | Users move between records and read each in place | `header`, `list`, `detail` |
| `dashboard` | Users monitor several measures at a glance | `header`, `stats`, `main`, `aside` |
| `form-page` | Users create or edit one record; `steps` prop turns it into a wizard | `header`, `default`, `footer` |
| `settings` | Users change independent options grouped by topic | `header`, `nav`, `default` |
| `detail-page` | Users study one record with related data and actions | `header`, `summary`, `main`, `aside` |
| `auth` | Sign in, sign up, reset password | `brand`, `default`, `footer` |

## Block catalog

| Block | Category | Fits region |
| --- | --- | --- |
| `page-header` | Chrome | `header` |
| `breadcrumb-bar` | Chrome | `topbar`, `header` |
| `user-menu` | Chrome | `topbar`, `sidebar` |
| `notification-list` | Chrome | `topbar` popover, `aside` |
| `filter-bar` | Data | `filters` |
| `table-toolbar` | Data | `data` (table with selection, bulk actions) |
| `stats-row` | Data | `stats`, `summary` |
| `chart-card` | Data | `main`, `aside` |
| `activity-feed` | Data | `aside`, `main` |
| `form-section` | Forms | `default` |
| `inline-edit-row` | Forms | `default`, `summary` |
| `confirm-dialog` | Forms | Overlay |
| `wizard-footer` | Forms | `footer` |
| `file-upload-panel` | Forms | `default` |
| `first-run-state` | States | Any data region |
| `skeleton-page` | States | `default` |
| `error-state` | States | Any data region |
| `no-results-state` | States | Any data region |
| `sign-in-card` | Account | `default` of `auth` |
| `profile-summary` | Account | `summary`, `aside` |
