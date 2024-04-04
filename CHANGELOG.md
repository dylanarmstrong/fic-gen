# CHANGE LOG

## Unpublished

## 2024-04-04 v0.2.0

- Use `file-type` to determine file extension when missing
- Remove multiple spaces in title
- Remove default exports on sites
- Fix Wandering Inn valid chapter check to detect patreon only chapters
- Add support for `WeTriedLtd`
- Update dependencies
- Add `eslint-plugin-unicorn`
- Move initial setup behind --setup flag, to allow user to manually install

## 2024-02-13 v0.1.0

- Update `@dylanarmstrong/nodepub` version
- Remove unused `uuid` dependency
- Styling on chapter title and first letter of chapter
- Add setup code to automatically download `curl-impersonate`
- Scaffolding for tests added
- Switch to `meow` from `argparse`
- Remove `display: none` lines from RoyalRoad
- Rename `transformContent` -> `transformChapter` to better fit what it does
- Update to new `sanitize-html` for empty attributes to be removed
- Remove empty image tags
- Xenforo now adds `<p>` tags around lines
- Remove zero-width whitespace characters
- base64 download for images
- Output epub titles are more accurate now
- Add support for The Wandering Inn
- Refactor into using a App class to avoid global variables
- Resize large images to maximum resolution on Kindle Paperwhite
- Update `curl-impersonate` to `v0.6.0`

## 2023-07-04 - v0.0.8

- Publish with types

## 2023-07-04 - v0.0.7

- Switch to `@dylanarmstrong/tsconfig` for shared TS config
- Add `LICENSE` file

## 2023-07-04 - v0.0.6

- Update `@dylanarmstrong/nodepub` version along with `images` -> `resources`
- **FIX**: Clean story title to avoid `&`
- **FIX**: Remove all empty attributes instead of just `img`

## 2023-07-03 - v0.0.5

- **FIX**: Remove empty attributes from `img` tags

## 2023-07-03 - v0.0.4

- Use version for `-v` from `package.json` instead of hardcoded
- Update default user agent, useful on CF protected sites

## 2023-07-03 - v0.0.3

- **FIX**: Append a suffix to fanfiction.net cover url, so type is proper
- **FIX**: Have default chapter title of `Chapter 1`, etc.

## 2023-07-03 - v0.0.2

- Update nodepub version

## 2023-07-03 - v0.0.1

- Initial release
