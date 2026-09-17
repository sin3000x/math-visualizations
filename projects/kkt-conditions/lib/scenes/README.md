# Scene model

A **Scene** is one self-contained 1920×1080 screen in a concept explanation.
A concept such as KKT conditions is assembled from an ordered list of Scenes.

- `id` is a stable internal reference and is never used as display copy.
- `conceptId` groups Scenes into one explanation.
- `order` controls sequencing and can change without renaming a Scene.
- `route` points to the page that renders the Scene.
- `viewport` records the 16:9 design contract.

Register new Scenes in `registry.ts`. Keep IDs descriptive and stable; use gaps
such as 10, 20, and 30 for `order` so a Scene can be inserted later.
