---
name: playwright-best-practices
description: Use when writing Playwright tests, fixing flaky tests, debugging failures, implementing Page Object Model, configuring CI/CD, optimizing performance, mocking APIs, handling authentication or OAuth, testing accessibility (axe-core), file uploads/downloads, date/time mocking, WebSockets, geolocation, permissions, multi-tab/popup flows, mobile/responsive layouts, touch gestures, GraphQL, error handling, offline mode, multi-user collaboration, third-party services (payments, email verification), console error monitoring, global setup/teardown, test annotations (skip, fixme, slow), test tags (@smoke, @fast, @critical, filtering with --grep), project dependencies, security testing (XSS, CSRF, auth), performance budgets (Web Vitals, Lighthouse), iframes, component testing, canvas/WebGL, service workers/PWA, test coverage, i18n/localization, Electron apps, or browser extension testing. Covers E2E, component, API, visual, accessibility, security, Electron, and extension testing.
license: MIT
metadata:
  author: currents.dev
  version: "1.2"
---

# Playwright Best Practices

This skill provides comprehensive guidance for all aspects of Playwright test development, from writing new tests to debugging and maintaining existing test suites.

## Activity-Based Reference Guide

Consult these references based on what you're doing:

### Writing New Tests

**When to use**: Creating new test files, writing test cases, implementing test scenarios

| Activity                            | Reference Files                                                                                                                               |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Writing E2E tests**               | [test-suite-structure.md](playwright-best-practices/core/test-suite-structure.md), [locators.md](playwright-best-practices/core/locators.md), [assertions-waiting.md](playwright-best-practices/core/assertions-waiting.md) |
| **Writing component tests**         | [component-testing.md](playwright-best-practices/testing-patterns/component-testing.md), [test-suite-structure.md](playwright-best-practices/core/test-suite-structure.md)                        |
| **Writing API tests**               | [api-testing.md](playwright-best-practices/testing-patterns/api-testing.md), [test-suite-structure.md](playwright-best-practices/core/test-suite-structure.md)                                    |
| **Writing GraphQL tests**           | [graphql-testing.md](playwright-best-practices/testing-patterns/graphql-testing.md), [api-testing.md](playwright-best-practices/testing-patterns/api-testing.md)                                  |
| **Writing visual regression tests** | [visual-regression.md](playwright-best-practices/testing-patterns/visual-regression.md), [canvas-webgl.md](playwright-best-practices/testing-patterns/canvas-webgl.md)                            |
| **Structuring test code with POM**  | [page-object-model.md](playwright-best-practices/core/page-object-model.md), [test-suite-structure.md](playwright-best-practices/core/test-suite-structure.md)                                    |
| **Setting up test data/fixtures**   | [fixtures-hooks.md](playwright-best-practices/core/fixtures-hooks.md), [test-data.md](playwright-best-practices/core/test-data.md)                                                                |
| **Handling authentication**         | [authentication.md](playwright-best-practices/advanced/authentication.md), [authentication-flows.md](playwright-best-practices/advanced/authentication-flows.md)                                  |
| **Testing date/time features**      | [clock-mocking.md](playwright-best-practices/advanced/clock-mocking.md)                                                                                                 |
| **Testing file upload/download**    | [file-operations.md](playwright-best-practices/testing-patterns/file-operations.md), [file-upload-download.md](playwright-best-practices/testing-patterns/file-upload-download.md)                |
| **Testing forms/validation**        | [forms-validation.md](playwright-best-practices/testing-patterns/forms-validation.md)                                                                                   |
| **Testing drag and drop**           | [drag-drop.md](playwright-best-practices/testing-patterns/drag-drop.md)                                                                                                 |
| **Testing accessibility**           | [accessibility.md](playwright-best-practices/testing-patterns/accessibility.md)                                                                                         |
| **Testing security (XSS, CSRF)**    | [security-testing.md](playwright-best-practices/testing-patterns/security-testing.md)                                                                                   |
| **Using test annotations**          | [annotations.md](playwright-best-practices/core/annotations.md)                                                                                                         |
| **Using test tags**                 | [test-tags.md](playwright-best-practices/core/test-tags.md)                                                                                                             |
| **Testing iframes**                 | [iframes.md](playwright-best-practices/browser-apis/iframes.md)                                                                                                         |
| **Testing canvas/WebGL**            | [canvas-webgl.md](playwright-best-practices/testing-patterns/canvas-webgl.md)                                                                                           |
| **Internationalization (i18n)**     | [i18n.md](playwright-best-practices/testing-patterns/i18n.md)                                                                                                           |
| **Testing Electron apps**           | [electron.md](playwright-best-practices/testing-patterns/electron.md)                                                                                                   |
| **Testing browser extensions**      | [browser-extensions.md](playwright-best-practices/testing-patterns/browser-extensions.md)                                                                               |

### Mobile & Responsive Testing

**When to use**: Testing mobile devices, touch interactions, responsive layouts

| Activity                        | Reference Files                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------- |
| **Device emulation**            | [mobile-testing.md](playwright-best-practices/advanced/mobile-testing.md)                                  |
| **Touch gestures (swipe, tap)** | [mobile-testing.md](playwright-best-practices/advanced/mobile-testing.md)                                  |
| **Viewport/breakpoint testing** | [mobile-testing.md](playwright-best-practices/advanced/mobile-testing.md)                                  |
| **Mobile-specific UI**          | [mobile-testing.md](playwright-best-practices/advanced/mobile-testing.md), [locators.md](playwright-best-practices/core/locators.md) |

### Real-Time & Browser APIs

**When to use**: Testing WebSockets, geolocation, permissions, multi-tab flows

| Activity                        | Reference Files                                                                          |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| **WebSocket/real-time testing** | [websockets.md](playwright-best-practices/browser-apis/websockets.md)                                              |
| **Geolocation mocking**         | [browser-apis.md](playwright-best-practices/browser-apis/browser-apis.md)                                          |
| **Permission handling**         | [browser-apis.md](playwright-best-practices/browser-apis/browser-apis.md)                                          |
| **Clipboard testing**           | [browser-apis.md](playwright-best-practices/browser-apis/browser-apis.md)                                          |
| **Camera/microphone mocking**   | [browser-apis.md](playwright-best-practices/browser-apis/browser-apis.md)                                          |
| **Multi-tab/popup flows**       | [multi-context.md](playwright-best-practices/advanced/multi-context.md)                                            |
| **OAuth popup handling**        | [third-party.md](playwright-best-practices/advanced/third-party.md), [multi-context.md](playwright-best-practices/advanced/multi-context.md) |

### Debugging & Troubleshooting

**When to use**: Test failures, element not found, timeouts, unexpected behavior

| Activity                                          | Reference Files                                                                                                                                |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Debugging test failures**                       | [debugging.md](playwright-best-practices/debugging/debugging.md), [assertions-waiting.md](playwright-best-practices/core/assertions-waiting.md)                                                    |
| **Fixing flaky tests**                            | [flaky-tests.md](playwright-best-practices/debugging/flaky-tests.md), [debugging.md](playwright-best-practices/debugging/debugging.md), [assertions-waiting.md](playwright-best-practices/core/assertions-waiting.md)        |
| **Debugging flaky parallel runs**                 | [flaky-tests.md](playwright-best-practices/debugging/flaky-tests.md), [performance.md](playwright-best-practices/infrastructure-ci-cd/performance.md), [fixtures-hooks.md](playwright-best-practices/core/fixtures-hooks.md) |
| **Ensuring test isolation / avoiding state leak** | [flaky-tests.md](playwright-best-practices/debugging/flaky-tests.md), [fixtures-hooks.md](playwright-best-practices/core/fixtures-hooks.md), [performance.md](playwright-best-practices/infrastructure-ci-cd/performance.md) |
| **Fixing selector issues**                        | [locators.md](playwright-best-practices/core/locators.md), [debugging.md](playwright-best-practices/debugging/debugging.md)                                                                        |
| **Investigating timeout issues**                  | [assertions-waiting.md](playwright-best-practices/core/assertions-waiting.md), [debugging.md](playwright-best-practices/debugging/debugging.md)                                                    |
| **Using trace viewer**                            | [debugging.md](playwright-best-practices/debugging/debugging.md)                                                                                                         |
| **Debugging race conditions**                     | [flaky-tests.md](playwright-best-practices/debugging/flaky-tests.md), [debugging.md](playwright-best-practices/debugging/debugging.md), [assertions-waiting.md](playwright-best-practices/core/assertions-waiting.md)        |
| **Debugging console/JS errors**                   | [console-errors.md](playwright-best-practices/debugging/console-errors.md), [debugging.md](playwright-best-practices/debugging/debugging.md)                                                       |

### Error & Edge Case Testing

**When to use**: Testing error states, offline mode, network failures, validation

| Activity                       | Reference Files                                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| **Error boundary testing**     | [error-testing.md](playwright-best-practices/debugging/error-testing.md)                                                        |
| **Network failure simulation** | [error-testing.md](playwright-best-practices/debugging/error-testing.md), [network-advanced.md](playwright-best-practices/advanced/network-advanced.md)   |
| **Offline mode testing**       | [error-testing.md](playwright-best-practices/debugging/error-testing.md), [service-workers.md](playwright-best-practices/browser-apis/service-workers.md) |
| **Service worker testing**     | [service-workers.md](playwright-best-practices/browser-apis/service-workers.md)                                                 |
| **Loading state testing**      | [error-testing.md](playwright-best-practices/debugging/error-testing.md)                                                        |
| **Form validation testing**    | [error-testing.md](playwright-best-practices/debugging/error-testing.md)                                                        |

### Multi-User & Collaboration Testing

**When to use**: Testing features involving multiple users, roles, or real-time collaboration

| Activity                       | Reference Files                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| **Multiple users in one test** | [multi-user.md](playwright-best-practices/advanced/multi-user.md)                                              |
| **Real-time collaboration**    | [multi-user.md](playwright-best-practices/advanced/multi-user.md), [websockets.md](playwright-best-practices/browser-apis/websockets.md) |
| **Role-based access testing**  | [multi-user.md](playwright-best-practices/advanced/multi-user.md)                                              |
| **Concurrent action testing**  | [multi-user.md](playwright-best-practices/advanced/multi-user.md)                                              |

### Architecture Decisions

**When to use**: Choosing test patterns, deciding between approaches, planning test architecture

| Activity                     | Reference Files                                           |
| ---------------------------- | --------------------------------------------------------- |
| **POM vs fixtures decision** | [pom-vs-fixtures.md](playwright-best-practices/architecture/pom-vs-fixtures.md)     |
| **Test type selection**      | [test-architecture.md](playwright-best-practices/architecture/test-architecture.md) |
| **Mock vs real services**    | [when-to-mock.md](playwright-best-practices/architecture/when-to-mock.md)           |
| **Test suite structure**     | [test-suite-structure.md](playwright-best-practices/core/test-suite-structure.md)   |

### Framework-Specific Testing

**When to use**: Testing React, Angular, Vue, or Next.js applications

| Activity                  | Reference Files                     |
| ------------------------- | ----------------------------------- |
| **Testing React apps**    | [react.md](playwright-best-practices/frameworks/react.md)     |
| **Testing Angular apps**  | [angular.md](playwright-best-practices/frameworks/angular.md) |
| **Testing Vue/Nuxt apps** | [vue.md](playwright-best-practices/frameworks/vue.md)         |
| **Testing Next.js apps**  | [nextjs.md](playwright-best-practices/frameworks/nextjs.md)   |

### Refactoring & Maintenance

**When to use**: Improving existing tests, code review, reducing duplication

| Activity                             | Reference Files                                                                                            |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **Refactoring to Page Object Model** | [page-object-model.md](playwright-best-practices/core/page-object-model.md), [test-suite-structure.md](playwright-best-practices/core/test-suite-structure.md) |
| **Improving test organization**      | [test-suite-structure.md](playwright-best-practices/core/test-suite-structure.md), [page-object-model.md](playwright-best-practices/core/page-object-model.md) |
| **Extracting common setup/teardown** | [fixtures-hooks.md](playwright-best-practices/core/fixtures-hooks.md)                                                                |
| **Replacing brittle selectors**      | [locators.md](playwright-best-practices/core/locators.md)                                                                            |
| **Removing explicit waits**          | [assertions-waiting.md](playwright-best-practices/core/assertions-waiting.md)                                                        |
| **Creating test data factories**     | [test-data.md](playwright-best-practices/core/test-data.md)                                                                          |
| **Configuration setup**              | [configuration.md](playwright-best-practices/core/configuration.md)                                                                  |

### Infrastructure & Configuration

**When to use**: Setting up projects, configuring CI/CD, optimizing performance

| Activity                                | Reference Files                                                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Configuring Playwright project**      | [configuration.md](playwright-best-practices/core/configuration.md), [projects-dependencies.md](playwright-best-practices/core/projects-dependencies.md)                     |
| **Setting up CI/CD pipelines**          | [ci-cd.md](playwright-best-practices/infrastructure-ci-cd/ci-cd.md), [github-actions.md](playwright-best-practices/infrastructure-ci-cd/github-actions.md)                   |
| **GitHub Actions setup**                | [github-actions.md](playwright-best-practices/infrastructure-ci-cd/github-actions.md)                                                              |
| **GitLab CI setup**                     | [gitlab.md](playwright-best-practices/infrastructure-ci-cd/gitlab.md)                                                                              |
| **Other CI providers**                  | [other-providers.md](playwright-best-practices/infrastructure-ci-cd/other-providers.md)                                                            |
| **Docker/container setup**              | [docker.md](playwright-best-practices/infrastructure-ci-cd/docker.md)                                                                              |
| **Global setup & teardown**             | [global-setup.md](playwright-best-practices/core/global-setup.md)                                                                                  |
| **Project dependencies**                | [projects-dependencies.md](playwright-best-practices/core/projects-dependencies.md)                                                                |
| **Optimizing test performance**         | [performance.md](playwright-best-practices/infrastructure-ci-cd/performance.md), [test-suite-structure.md](playwright-best-practices/core/test-suite-structure.md)           |
| **Configuring parallel execution**      | [parallel-sharding.md](playwright-best-practices/infrastructure-ci-cd/parallel-sharding.md), [performance.md](playwright-best-practices/infrastructure-ci-cd/performance.md) |
| **Isolating test data between workers** | [fixtures-hooks.md](playwright-best-practices/core/fixtures-hooks.md), [performance.md](playwright-best-practices/infrastructure-ci-cd/performance.md)                       |
| **Test coverage**                       | [test-coverage.md](playwright-best-practices/infrastructure-ci-cd/test-coverage.md)                                                                |
| **Test reporting/artifacts**            | [reporting.md](playwright-best-practices/infrastructure-ci-cd/reporting.md)                                                                        |

### Advanced Patterns

**When to use**: Complex scenarios, API mocking, network interception

| Activity                             | Reference Files                                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| **Mocking API responses**            | [test-suite-structure.md](playwright-best-practices/core/test-suite-structure.md), [network-advanced.md](playwright-best-practices/advanced/network-advanced.md) |
| **Network interception**             | [network-advanced.md](playwright-best-practices/advanced/network-advanced.md), [assertions-waiting.md](playwright-best-practices/core/assertions-waiting.md)     |
| **GraphQL mocking**                  | [network-advanced.md](playwright-best-practices/advanced/network-advanced.md)                                                          |
| **HAR recording/playback**           | [network-advanced.md](playwright-best-practices/advanced/network-advanced.md)                                                          |
| **Custom fixtures**                  | [fixtures-hooks.md](playwright-best-practices/core/fixtures-hooks.md)                                                                  |
| **Advanced waiting strategies**      | [assertions-waiting.md](playwright-best-practices/core/assertions-waiting.md)                                                          |
| **OAuth/SSO mocking**                | [third-party.md](playwright-best-practices/advanced/third-party.md), [multi-context.md](playwright-best-practices/advanced/multi-context.md)                     |
| **Payment gateway mocking**          | [third-party.md](playwright-best-practices/advanced/third-party.md)                                                                    |
| **Email/SMS verification mocking**   | [third-party.md](playwright-best-practices/advanced/third-party.md)                                                                    |
| **Failing on console errors**        | [console-errors.md](playwright-best-practices/debugging/console-errors.md)                                                             |
| **Security testing (XSS, CSRF)**     | [security-testing.md](playwright-best-practices/testing-patterns/security-testing.md)                                                  |
| **Performance budgets & Web Vitals** | [performance-testing.md](playwright-best-practices/testing-patterns/performance-testing.md)                                            |
| **Lighthouse integration**           | [performance-testing.md](playwright-best-practices/testing-patterns/performance-testing.md)                                            |
| **Test annotations (skip, fixme)**   | [annotations.md](playwright-best-practices/core/annotations.md)                                                                        |
| **Test tags (@smoke, @fast)**        | [test-tags.md](playwright-best-practices/core/test-tags.md)                                                                            |
| **Test steps for reporting**         | [annotations.md](playwright-best-practices/core/annotations.md)                                                                        |

## Quick Decision Tree

```
What are you doing?
│
├─ Writing a new test?
│  ├─ E2E test → playwright-best-practices/core/test-suite-structure.md, playwright-best-practices/core/locators.md, playwright-best-practices/core/assertions-waiting.md
│  ├─ Component test → playwright-best-practices/testing-patterns/component-testing.md
│  ├─ API test → playwright-best-practices/testing-patterns/api-testing.md, playwright-best-practices/core/test-suite-structure.md
│  ├─ GraphQL test → playwright-best-practices/testing-patterns/graphql-testing.md
│  ├─ Visual regression → playwright-best-practices/testing-patterns/visual-regression.md
│  ├─ Visual/canvas test → playwright-best-practices/testing-patterns/canvas-webgl.md, playwright-best-practices/core/test-suite-structure.md
│  ├─ Accessibility test → playwright-best-practices/testing-patterns/accessibility.md
│  ├─ Mobile/responsive test → playwright-best-practices/advanced/mobile-testing.md
│  ├─ i18n/locale test → playwright-best-practices/testing-patterns/i18n.md
│  ├─ Electron app test → playwright-best-practices/testing-patterns/electron.md
│  ├─ Browser extension test → playwright-best-practices/testing-patterns/browser-extensions.md
│  ├─ Multi-user test → playwright-best-practices/advanced/multi-user.md
│  ├─ Form validation test → playwright-best-practices/testing-patterns/forms-validation.md
│  └─ Drag and drop test → playwright-best-practices/testing-patterns/drag-drop.md
│
├─ Testing specific features?
│  ├─ File upload/download → playwright-best-practices/testing-patterns/file-operations.md, playwright-best-practices/testing-patterns/file-upload-download.md
│  ├─ Date/time dependent → playwright-best-practices/advanced/clock-mocking.md
│  ├─ WebSocket/real-time → playwright-best-practices/browser-apis/websockets.md
│  ├─ Geolocation/permissions → playwright-best-practices/browser-apis/browser-apis.md
│  ├─ OAuth/SSO mocking → playwright-best-practices/advanced/third-party.md, playwright-best-practices/advanced/multi-context.md
│  ├─ Payments/email/SMS → playwright-best-practices/advanced/third-party.md
│  ├─ iFrames → playwright-best-practices/browser-apis/iframes.md
│  ├─ Canvas/WebGL/charts → playwright-best-practices/testing-patterns/canvas-webgl.md
│  ├─ Service workers/PWA → playwright-best-practices/browser-apis/service-workers.md
│  ├─ i18n/localization → playwright-best-practices/testing-patterns/i18n.md
│  ├─ Security (XSS, CSRF) → playwright-best-practices/testing-patterns/security-testing.md
│  └─ Performance/Web Vitals → playwright-best-practices/testing-patterns/performance-testing.md
│
├─ Architecture decisions?
│  ├─ POM vs fixtures → playwright-best-practices/architecture/pom-vs-fixtures.md
│  ├─ Test type selection → playwright-best-practices/architecture/test-architecture.md
│  ├─ Mock vs real services → playwright-best-practices/architecture/when-to-mock.md
│  └─ Test suite structure → playwright-best-practices/core/test-suite-structure.md
│
├─ Framework-specific testing?
│  ├─ React app → playwright-best-practices/frameworks/react.md
│  ├─ Angular app → playwright-best-practices/frameworks/angular.md
│  ├─ Vue/Nuxt app → playwright-best-practices/frameworks/vue.md
│  └─ Next.js app → playwright-best-practices/frameworks/nextjs.md
│
├─ Authentication testing?
│  ├─ Basic auth patterns → playwright-best-practices/advanced/authentication.md
│  └─ Complex flows (MFA, reset) → playwright-best-practices/advanced/authentication-flows.md
│
├─ Test is failing/flaky?
│  ├─ Flaky test investigation → playwright-best-practices/debugging/flaky-tests.md
│  ├─ Element not found → playwright-best-practices/core/locators.md, playwright-best-practices/debugging/debugging.md
│  ├─ Timeout issues → playwright-best-practices/core/assertions-waiting.md, playwright-best-practices/debugging/debugging.md
│  ├─ Race conditions → playwright-best-practices/debugging/flaky-tests.md, playwright-best-practices/debugging/debugging.md
│  ├─ Flaky only with multiple workers → playwright-best-practices/debugging/flaky-tests.md, playwright-best-practices/infrastructure-ci-cd/performance.md
│  ├─ State leak / isolation → playwright-best-practices/debugging/flaky-tests.md, playwright-best-practices/core/fixtures-hooks.md
│  ├─ Console/JS errors → playwright-best-practices/debugging/console-errors.md, playwright-best-practices/debugging/debugging.md
│  └─ General debugging → playwright-best-practices/debugging/debugging.md
│
├─ Testing error scenarios?
│  ├─ Network failures → playwright-best-practices/debugging/error-testing.md, playwright-best-practices/advanced/network-advanced.md
│  ├─ Offline (unexpected) → playwright-best-practices/debugging/error-testing.md
│  ├─ Offline-first/PWA → playwright-best-practices/browser-apis/service-workers.md
│  ├─ Error boundaries → playwright-best-practices/debugging/error-testing.md
│  └─ Form validation → playwright-best-practices/testing-patterns/forms-validation.md, playwright-best-practices/debugging/error-testing.md
│
├─ Refactoring existing code?
│  ├─ Implementing POM → playwright-best-practices/core/page-object-model.md
│  ├─ Improving selectors → playwright-best-practices/core/locators.md
│  ├─ Extracting fixtures → playwright-best-practices/core/fixtures-hooks.md
│  ├─ Creating data factories → playwright-best-practices/core/test-data.md
│  └─ Configuration setup → playwright-best-practices/core/configuration.md
│
├─ Setting up infrastructure?
│  ├─ CI/CD → playwright-best-practices/infrastructure-ci-cd/ci-cd.md
│  ├─ GitHub Actions → playwright-best-practices/infrastructure-ci-cd/github-actions.md
│  ├─ GitLab CI → playwright-best-practices/infrastructure-ci-cd/gitlab.md
│  ├─ Other CI providers → playwright-best-practices/infrastructure-ci-cd/other-providers.md
│  ├─ Docker/containers → playwright-best-practices/infrastructure-ci-cd/docker.md
│  ├─ Sharding/parallel → playwright-best-practices/infrastructure-ci-cd/parallel-sharding.md
│  ├─ Reporting/artifacts → playwright-best-practices/infrastructure-ci-cd/reporting.md
│  ├─ Global setup/teardown → playwright-best-practices/core/global-setup.md
│  ├─ Project dependencies → playwright-best-practices/core/projects-dependencies.md
│  ├─ Test performance → playwright-best-practices/infrastructure-ci-cd/performance.md
│  ├─ Test coverage → playwright-best-practices/infrastructure-ci-cd/test-coverage.md
│  └─ Project config → playwright-best-practices/core/configuration.md, playwright-best-practices/core/projects-dependencies.md
│
├─ Organizing tests?
│  ├─ Skip/fixme/slow tests → playwright-best-practices/core/annotations.md
│  ├─ Test tags (@smoke, @fast) → playwright-best-practices/core/test-tags.md
│  ├─ Filtering tests (--grep) → playwright-best-practices/core/test-tags.md
│  ├─ Test steps → playwright-best-practices/core/annotations.md
│  └─ Conditional execution → playwright-best-practices/core/annotations.md
│
└─ Running subset of tests?
   ├─ By tag (@smoke, @critical) → playwright-best-practices/core/test-tags.md
   ├─ Exclude slow/flaky tests → playwright-best-practices/core/test-tags.md
   ├─ PR vs nightly tests → playwright-best-practices/core/test-tags.md, playwright-best-practices/infrastructure-ci-cd/ci-cd.md
   └─ Project-specific filtering → playwright-best-practices/core/test-tags.md, playwright-best-practices/core/configuration.md
```

## Test Validation Loop

After writing or modifying tests:

1. **Run tests**: `npx playwright test --reporter=list`
2. **If tests fail**:
   - Review error output and trace (`npx playwright show-trace`)
   - Fix locators, waits, or assertions
   - Re-run tests
3. **Only proceed when all tests pass**
4. **Run multiple times** for critical tests: `npx playwright test --repeat-each=5`
