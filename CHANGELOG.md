# CHANGE LOG
## Unpublished
- Update `@dylanarmstrong/nodepub` version
- Remove unused `uuid` dependency
- Styling on chapter title and first letter of chapter
- Add setup code to automatically download `curl-impersonate`
- Scaffolding for tests added
- Switch to `@dylanarmstrong/meow` from `argparse`
- Remove `display: none` lines from RoyalRoad
- Rename `transformContent` -> `transformChapter` to better fit what it does

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
