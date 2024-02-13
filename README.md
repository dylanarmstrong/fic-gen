## fic-gen

Generate ePub when given a url.

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
* Title shouldn't have multiple spaces in row https://www.royalroad.com/fiction/65108/death-loot-vampires
* Site Support:
    * Xenforo General
    * Fictionpress
* Royalroad: Support custom style <hr> tags: https://www.royalroad.com/fiction/58643/tenebroum/chapter/992389/ch-01-blood-money
* Tests
* Maybe support for using `got` instead of `curl` on non-ff
