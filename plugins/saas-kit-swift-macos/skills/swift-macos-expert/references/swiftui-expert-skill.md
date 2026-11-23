---
name: swiftui-expert-skill
description: Use when writing, reviewing, or refactoring SwiftUI code for iOS or macOS, including state and `@Observable` data flow, view composition, resizable layouts, safe areas, display scale, performance, lists, environment, localization, animation, Liquid Glass, and API migration. Also use for iPhone Duo, foldable, or large-display layouts (`NavigationSplitView` on large displays, iPhone tab sidebar, two-column reflow, foldable grids, `ArrangementView`, `ReservedRegion`), hinge effects, vertical bars, `@State` initialization or synthesized-property diagnostics, `@ContentBuilder` ambiguity, `reorderable` drag/drop, custom `AsyncImage` `URLSession`, swipe actions outside List, item-bound `alert`/`confirmationDialog`, `ToolbarOverflowMenu`, `AnimatableValues`, Document APIs (`Document`/`DocumentReader`), and Instruments `.trace` capture or analysis.
---

# SwiftUI Expert Skill

## Operating Rules

- Treat each `View` type as an invalidation boundary: give it only the data it reads and keep frequently changing dependencies close to the smallest affected subtree
- Search `swiftui-expert-skill/references/latest-apis.md` when writing, reviewing, or migrating API usage; look up only the APIs relevant to the task
- Replace hard-deprecated APIs with modern equivalents. During feature work, flag soft-deprecated APIs and leave them in place (see `swiftui-expert-skill/references/soft-deprecation.md`)
- Prefer native SwiftUI APIs over UIKit/AppKit bridging unless bridging is necessary
- Focus on correctness and performance; do not enforce specific architectures (MVVM, VIPER, etc.)
- Encourage separating business logic from views for testability without mandating how
- Follow Apple's Human Interface Guidelines and API design patterns
- Only adopt Liquid Glass when explicitly requested by the user (see `swiftui-expert-skill/references/liquid-glass.md`)
- Present performance optimizations as suggestions, not requirements
- Use `#available` gating with sensible fallbacks for version-specific APIs
- For layout and rendering inputs, read the value nearest the SwiftUI view that consumes it; do not substitute process-global screen state

## Task Workflow

### Review existing SwiftUI code
- Read the code under review and identify which topics apply
- Flag deprecated APIs (compare against `swiftui-expert-skill/references/latest-apis.md`); replace hard-deprecated APIs, and flag soft-deprecated APIs without rewriting them unless the user asked to migrate
- Run the Topic Router below for each relevant topic
- Validate `#available` gating and fallback paths for version-specific features
- For broad codebase reviews, first identify smaller focus areas and present them one at a time; if the user requests a whole-codebase review, divide it into a TODO list

### Improve existing SwiftUI code
- Audit current implementation against the Topic Router topics
- Replace hard-deprecated APIs with modern equivalents from `swiftui-expert-skill/references/latest-apis.md`; flag soft-deprecated APIs and do not rewrite them during feature work
- Refactor hot paths to reduce unnecessary state updates
- Extract complex view bodies into separate subviews
- Suggest image downsampling when `UIImage(data:)` is encountered (optional optimization, see `swiftui-expert-skill/references/image-optimization.md`)

### Implement new SwiftUI feature
- Design data flow first: identify owned vs injected state
- Structure views for optimal diffing (extract subviews early)
- Apply correct animation patterns (implicit vs explicit, transitions)
- Use `Button` for all tappable elements; add accessibility grouping and labels
- Gate version-specific APIs with `#available` and provide fallbacks

### Record a new Instruments trace
Trigger when the user asks to "record a trace", "profile the app", "capture a session", etc. Full reference: `swiftui-expert-skill/references/trace-recording.md`.

1. **Confirm target** — attach to a running app, launch an app, or record all processes? If the user didn't say, ask. List connected devices when useful:
   ```bash
   python3 "${SKILL_DIR}/scripts/record_trace.py" --list-devices
   ```
2. **Pick a template based on target kind** — the `SwiftUI` template populates the SwiftUI lane on any **real device**: a physical iOS/iPadOS device **or the host Mac**. The only exception is the **iOS Simulator**, where the SwiftUI lane comes back empty — switch to `--template "Time Profiler"` in that case (still gives Time Profiler + Hangs + Animation Hitches). Always check `--list-devices`: `simulators` kind → `Time Profiler`; `devices` kind (real devices and the host Mac) → default `SwiftUI`. Full decision table in `swiftui-expert-skill/references/trace-recording.md`.
3. **Start the recording**. For agent-driven sessions where the user says "I'll tell you when I'm done", start in the background and use a stop-file:
   ```bash
   python3 "${SKILL_DIR}/scripts/record_trace.py" \
       --device "<name|udid>" --attach "<AppName>" \
       --stop-file /tmp/stop-trace --output ~/Desktop/session.trace
   ```
   For interactive sessions, just tell the user to press Ctrl+C when done.
4. **Signal stop** — when the user says they've finished exercising the app, `touch /tmp/stop-trace`. The script cleanly SIGINTs xctrace and waits up to 60s for finalisation.
5. **Analyse** the resulting trace (flow into the "Trace-driven improvement" workflow below).

### Trace-driven improvement (Instruments `.trace` provided)
Trigger whenever the user's request references a `.trace` file. A target SwiftUI source file is **optional** — if given, cite specific lines; if not, recommend where to look based on view names and symbols the trace already reveals.

Full reference: `swiftui-expert-skill/references/trace-analysis.md`. Summary of the composition pattern:

1. **Scope the analysis.** Ask yourself: does the user want the whole trace, or a slice?
   - "focus on X / after X / between X and Y / during X" → **resolve to a window first** (see step 2).
   - No scoping cue → analyse the whole trace.
2. **Resolve a window (only if the user scoped).** The parser exposes two discovery modes:
   ```bash
   # Find a log that marks the start/end of the region of interest:
   python3 "${SKILL_DIR}/scripts/analyze_trace.py" --trace <path> \
       --list-logs --log-message-contains "loaded feed" --log-limit 5
   # Or list os_signpost intervals (paired begin/end), filterable by name:
   python3 "${SKILL_DIR}/scripts/analyze_trace.py" --trace <path> \
       --list-signposts --signpost-name-contains "ImageDecode"
   ```
   Both modes accept `--window START_MS:END_MS` to scope discovery. Pick the `time_ms` (for logs) or `start_ms`/`end_ms` (for signposts) that match the user's description. Build a window like `--window 10400:11700`.
3. **Run the main analysis** (with or without `--window`):
   ```bash
   python3 "${SKILL_DIR}/scripts/analyze_trace.py" --trace <path> \
       --json-only --top 10 [--window START_MS:END_MS]
   ```
4. **Interpret with `swiftui-expert-skill/references/trace-analysis.md`** — key diagnostics:
   - `main_running_coverage_pct` inside each correlation (<25% = blocked; ≥75% = CPU-bound).
   - `swiftui-causes.top_sources` reveals *why* updates keep happening — high-edge-count sources like `UserDefaultObserver.send()` or wide `EnvironmentWriter` entries are structural invalidation bugs. Fixing one often collapses many downstream hot views.
5. **When a specific view shows as expensive, ask who's invalidating it.** Use `--fanin-for "<view name>"` to get the ranked list of source nodes driving the updates.
6. **Optionally ground in source.** If the user pointed at a file, read it and match view names / user-code symbols against identifiers there. If not, recommend which files to open based on the view names SwiftUI reported.
7. **Return a prioritised plan.** Cite evidence (coverage %, hot symbol, overlapping view, log timestamp, cause-graph edges) and route each recommendation to a Topic Router reference.
8. Only edit code if the user asked for edits.

### Topic Router

Consult the reference file for each topic relevant to the current task:

| Topic | Reference |
|-------|-----------|
| State management | `swiftui-expert-skill/references/state-management.md` |
| Environment and `@Entry` | `swiftui-expert-skill/references/environment-patterns.md` |
| View composition | `swiftui-expert-skill/references/view-structure.md` |
| View modifiers and identity | `swiftui-expert-skill/references/modifier-patterns.md` |
| Performance | `swiftui-expert-skill/references/performance-patterns.md` |
| Lists and ForEach | `swiftui-expert-skill/references/list-patterns.md` |
| Resizable layout, safe areas, two-column reflow, foldable grids, arrangements, and reserved regions | `swiftui-expert-skill/references/layout-best-practices.md` |
| iPhone Duo, foldable, or large-display screens (read first to choose the technique) | `swiftui-expert-skill/references/iphone-duo.md` |
| Sheets, navigation, `NavigationSplitView` on large displays, and tab bar/sidebar (`sidebarAdaptable`) | `swiftui-expert-skill/references/sheet-navigation-patterns.md` |
| ScrollView, scroll position, and scroll geometry | `swiftui-expert-skill/references/scroll-patterns.md` |
| Focus management | `swiftui-expert-skill/references/focus-patterns.md` |
| Animations (basics) | `swiftui-expert-skill/references/animation-basics.md` |
| Animations (transitions) | `swiftui-expert-skill/references/animation-transitions.md` |
| Animations (advanced) | `swiftui-expert-skill/references/animation-advanced.md` |
| Accessibility | `swiftui-expert-skill/references/accessibility-patterns.md` |
| Swift Charts | `swiftui-expert-skill/references/charts.md` |
| Charts accessibility | `swiftui-expert-skill/references/charts-accessibility.md` |
| Image optimization and display scale | `swiftui-expert-skill/references/image-optimization.md` |
| Toolbars | `swiftui-expert-skill/references/toolbar-patterns.md` |
| Document-based apps | `swiftui-expert-skill/references/document-apps.md` |
| WebKit | `swiftui-expert-skill/references/webkit-integration.md` |
| Styled text editing | `swiftui-expert-skill/references/styled-text-editing.md` |
| Liquid Glass (iOS 26+) | `swiftui-expert-skill/references/liquid-glass.md` |
| macOS scenes | `swiftui-expert-skill/references/macos-scenes.md` |
| macOS window styling | `swiftui-expert-skill/references/macos-window-styling.md` |
| macOS views | `swiftui-expert-skill/references/macos-views.md` |
| Text patterns | `swiftui-expert-skill/references/text-patterns.md` |
| Localization | `swiftui-expert-skill/references/localization.md` |
| Deprecated API lookup | `swiftui-expert-skill/references/latest-apis.md` |
| Handling soft-deprecated APIs | `swiftui-expert-skill/references/soft-deprecation.md` |
| Previews | `swiftui-expert-skill/references/previews.md` |
| Instruments trace analysis | `swiftui-expert-skill/references/trace-analysis.md` |
| Instruments trace recording | `swiftui-expert-skill/references/trace-recording.md` |

## Correctness Checklist

These are hard rules -- violations are always bugs:

- [ ] `@State` properties are `private`
- [ ] `@Binding` only where a child modifies parent state
- [ ] Changing parent-owned inputs are not stored as `@State`/`@StateObject`; intentional state seeds are documented as one-time
- [ ] `@StateObject` for view-owned objects; `@ObservedObject` for injected
- [ ] iOS 17+: `@State` with `@Observable`; `@Bindable` for injected observables needing bindings
- [ ] `ForEach` uses stable identity (never `.indices`/`\.offset`; id outlives the view and isn't derived from mutable content)
- [ ] Constant number of views per `ForEach` element; `List` rows are unary
- [ ] No closures stored in custom `@Environment`/`@FocusedValue` keys
- [ ] Custom `@Entry` default values are stable (no `Model()`/`Date()`/`UUID()` expressions)
- [ ] SwiftUI display scale comes from `@Environment(\.displayScale)`, not global screen state
- [ ] Safe-area content does not double-apply `GeometryProxy.safeAreaInsets`
- [ ] `.animation(_:value:)` always includes the `value` parameter
- [ ] `@FocusState` properties are `private`
- [ ] No redundant `@FocusState` writes inside tap gesture handlers on `.focusable()` views
- [ ] Version-specific APIs are gated with `#available` and have sensible fallbacks
- [ ] `import Charts` present in files using chart types
- [ ] Previews use self-contained mock data; no dependency on live services or network
