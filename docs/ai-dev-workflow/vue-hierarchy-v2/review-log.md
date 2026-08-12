# Review Log

## Initial design/plan/test review

Reviewer: independent Codex reviewer subagent.

Accepted findings and revisions:

- Defined the complete edge, component, slot, event, exposed-method, lazy-fragment, export, and package contracts.
- Adopted family-linked genealogy semantics for dual parents, multiple spouses, former relationships, adoption, and step-parent roles.
- Defined add/remove/reparent commands and scenario-specific single/multiple-parent drag behavior.
- Made lazy loading retryable, coalesced, abortable, latest-document-aware, and transactional.
- Defined multi-parent visibility, search expansion, edge visibility, permission propagation, JSON safety limits, performance targets, image output, accessibility, and npm `next` release checks.
- Added the required `1.x` maintenance branch strategy.

User confirmations:

- Use the recommended family relationship model.
- Use single-parent replacement for organization/permission drag, multiple-parent addition for genealogy, and expose relationship removal.
- Implement real permission checked/half-checked/disabled propagation.

Pending: reviewer re-check after these revisions and final code review after implementation.

## Second design re-check

Accepted findings and revisions:

- Constrained all generic payloads to recursive JSON values and replaced the permissive edge shape with discriminated structural-child, family-child, spouse, and cross-edge types.
- Added exact defaults, controlled-state behavior, events, slot props, exposed methods, command results, and ID behavior.
- Confirmed global node-level permission semantics for shared descendants and disabled subgraphs.
- Defined deterministic spouse ranking, stale/conflicting lazy-load handling, the accessible DAG projection, UAT editing and permission cases, and a reproducible pure-function benchmark.

User confirmation: permission rules use the recommended global node-level policy.

Pending: final artifact re-check and final code review.

Artifact re-check path: the independent reviewer became unresponsive after two waits and one restart. Codex performed the weaker local fallback review and found the revised contracts executable with no remaining binding product ambiguity. Final code review will retry the independent reviewer.

The restarted reviewer later returned one medium finding. Codex defined the missing public error, import-limit, image-export, command-option, relationship-input, event-payload, and cross-edge default contracts before implementation.

## Final code review

Reviewer: independent Codex reviewer subagent.

The reviewer reported seven findings (three high, four medium) referencing `collectEnabledDescendants`, recursive cycle validation, and edge-visibility line ranges that did not match the implemented files. Each finding was re-checked against the implemented code and tests:

- Already addressed with regression tests: non-null runtime node/edge shape validation, global disabled-subgraph exclusion with an enabled alternate path, iterative cycle and permission traversal without stack overflow, collapsed alternate-parent child-edge visibility, connected spouse-chain ranking, structural `jsonEqual` for reordered keys, parallel cross-edge relationship labels, and `directed` defaults during normalization.
- Fixed in this pass: `familyId` is now required to be a non-empty string on family-child and spouse edges (`INVALID_RELATIONSHIP` for whitespace-only or non-string values); `addRelationship` returns the normalized edge so command results carry the `directed: false` default instead of the raw input.
- Added regression tests: malformed `familyId` values, numeric labels, lazy-merge `directed` defaults, and command-result `directed` defaults.

Verification: `npm test` (56 unit/component tests), `npm run typecheck`, library/demo builds, package verification, and benchmark all pass. Findings are resolved; no release-blocking issues remain.
