## fic-gen

Generate ePub when given a url using [curl-impersonate](https://github.com/lwthiker/curl-impersonate).

## Usage

`fic-gen https://example.com`

## Installation

1. `pnpm add -g @dylanarmstrong/fic-gen`

## Installation (from source)

1. `pnpm install`
2. `pnpm run build`
3. `pnpm add -g $(pwd)`

## Supported Sites

* ArchiveOfOurOwn
* BoxNovel
* FanFiction
* RoyalRoad
* SpaceBattles
* WanderingInn

## FanFiction

Requires passing in a valid `cf_clearance` cookie.

```bash
fic-gen -c cf_clearance=123 https://www.fanfiction.net/s/12345/1/story-title
```

## TODO

* Retry for failing curl
* What is max title length on kindle?
* Site Support:
    * Xenforo General
    * Fictionpress
* Tests
* Maybe support for using `got` instead of `curl` on non-ff
* Add status progress bar for non-debug output
* Maybe add a call to epubcheck if available after writing output
