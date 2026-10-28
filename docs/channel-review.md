# Channel browser review — 2026-10-28

Scope: Channel 1.2.0 and the explicitly unpublished author runtime from main
commit `b83382e9c9d82a104f9b8d9bab23dfb777507ce4`. The runtime provenance records
its exact file hashes and dirty-snapshot flag; no official release is implied.

## Interactive review

Used an isolated local showcase with synthetic app/service data on macOS.
The No-root UI was operated in the browser in Russian, with pointer clicks and
arrow/Enter/Back input. Checked Channel/Classic switching, Inputs, the simulated
Network settings action, standard Settings, column selection (auto, 4, 5 and 8),
held OK/reorder/cancel, scrolling to Add app, adding Photo & Video, hiding it
and Undo. The main user's open preview was kept separate from the audit state.

Observed and corrected: selected text disappeared against blue while reordering;
multiple columns used only half of the screen; the library panel/Close retained
generic rounded gray styling. Rows, header controls and icon cells are larger;
selection details have an app icon and position count; scrolling clips below
the fixed header. Settings retain trusted standard styling.

Independent source review also caught duplicate selection artwork after a
Classic/scroll/Channel cycle, refocusing a failed icon, and the five-column
compact threshold. Each correction has a runnable browser regression.

## Automated coverage

`node tests/themes/channel-ui.cjs` in the main repository exercises both Root
and No-root: reorder label/background contrast, 1/2/4/5/8 columns, library
appearance, keyboard Close without accidental app addition, Classic brand-color
restoration, a single artwork node across theme cycles, and failed-image hiding.
The standard geometry, theme policy/compiler/runtime, Columns and trusted-dialog
isolation suites also passed. The full main-project `scripts/test.sh` passed in
the prepared project Python environment; targeted browser and compatibility
checks were rerun for the final edge-case corrections.

The toolkit suite checks actual candidate compilation, glyph contrast, live
Classic/Channel switching, persistence precedence, request isolation and screenshot
capture. Preview images and `terminal/previews/provenance.json` are regenerated
together from the accepted candidate.

## Limits

This is browser/service simulation, with no TV connection. Root was checked by
automated browser tests, not a manual device run. Physical TV model, firmware,
webOS version and remote: untested. Installation, real app launches/input
switching, sound, standby, cold boot, OTA and rollback: untested.

## Navigation follow-up

Reproduced the reported Up-navigation failure with actual animations enabled:
after scrolling to the end and parking the pointer over row eight, Up to row
five selected row seven instead. Content moved beneath the stationary cursor
and mouseover overrode keyboard focus. The regression now runs in both editions
and confirms every Up selects exactly the preceding row, and genuine pointer
movement restores hover.

Channel 1.2.1 uses one immediate row highlight; its enlarged travelling glass
and row/stage transitions are disabled. The selected row remains readable during
reorder. Classic retains its existing glass/motion behavior. No hardware claim
is added by these browser results.

Navigation follow-up candidate source: `a1b6a7aa399e8202df2383f802e33752b7264ad0`.
The TV/preview check groups passed; final first-pointer and parked-pointer
regressions passed separately after the simplified input ownership fix.
