# UAT Cases

## Understand the project in ten seconds

Open the repository README or live demo. The viewer sees the title “Vue Hierarchy Visualization Framework” and direct links/cards for Organization Chart, Permission Tree, Genealogy, and Large Dataset examples.

## Explore a lazy hierarchy

Open the large-data example and expand an unloaded node. A loading state appears, children are added once, and collapsing/re-expanding does not make a duplicate request.

## Edit a hierarchy

Enable editing and drag a node onto a valid new parent. The connector and JSON document update. Attempt to drag an ancestor below its descendant; the graph stays unchanged and an error is shown.

## Search and customize

Search for a deep loaded node. Its ancestors expand, the matching node is highlighted and selected, and a custom node slot remains intact.

## Review genealogy relationships

Open Genealogy. A child is connected to two parents through a shared family ID, multiple current/former spouse relationships have distinct lines, adoption/step-parent labels are visible, and a labeled cross relationship does not change ancestry.

Drag a person onto another person. Genealogy adds another parent without deleting an existing one. Remove one selected parent, spouse, or cross relationship and confirm only that edge disappears. In Organization or Permission Tree, the same drag gesture replaces the previous parent.

## Configure permissions

Check a permission parent and observe enabled descendants become checked. A shared descendant synchronizes through every parent path. Uncheck it from another path and observe global synchronization. Disabled nodes and their descendant subgraphs retain state, while parents calculate checked/indeterminate state using only participating children.

## Exchange and export data

Export JSON, import it again, and observe the same graph. Export PNG and SVG and confirm a downloadable image is produced.

## Validate the package

Install the generated tarball in a clean Vue 3 + TypeScript fixture. Import `HierarchyView`, CSS, types, validation/search/editing helpers, and render a document without bundling a second Vue runtime.
