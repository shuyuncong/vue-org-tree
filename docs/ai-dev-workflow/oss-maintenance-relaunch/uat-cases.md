# UAT Cases

## Install and render

Given a clean Vue 2.7 fixture, install the locally generated npm tarball, import its CSS, and register it with `Vue.use`. Rendering `<vue2-org-tree :data="tree" />` displays the supplied root label without console errors, and the tarball does not contain a bundled Vue runtime.

## Interact with a collapsible tree

Given a collapsed node with children, click its collapse control. The children become visible and the consumer receives `resetOrg` with the changed node.

## Use custom data fields

Given `{ name, nodes, open }` data and matching `props`, labels and children render using those fields.

## Review project health

A contributor can find the supported Vue line, roadmap, contribution process, security reporting instructions, CI commands, release process, screenshot, and live demo from the repository landing page.

## Validate a release candidate

A maintainer can run the documented verification commands and inspect the npm tarball. A `v*` tag whose version matches `package.json` enters a protected npm environment; missing credentials or a publish failure prevents GitHub Release creation.
