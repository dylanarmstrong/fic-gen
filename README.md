## fic-gen

Generate ePub when given a url.

## Usage

Download the latest [curl-impersonate](https://github.com/lwthiker/curl-impersonate/releases) and
move the files into the `curl-impersonate` folder.

If you are unsure where the `curl-impersonate` folder is, run the program once with `fic-gen` and
the path will be shown as an error message.

`fic-gen https://www.example.com/`

## Installation

1. `pnpm add -g @dylanarmstrong/fic-gen`

## Installation (from source)

1. `pnpm install`
2. `pnpm run build`

## Working Sites

* ArchiveOfOurOwn
* BoxNovel
* FanFiction
* RoyalRoad
* SpaceBattles

## FanFiction

Requires passing in a valid `cf_clearance` cookie.

```bash
fic-gen -c cf_clearance=123 https://www.fanfiction.net/s/12345/1/story-title
```

## TODO

* Retry for failing curl
* What is max title length on kindle
* Title shouldn't have multiple spaces in row (https://www.royalroad.com/fiction/65108/death-loot-vampires)
* Site Support:
    * Xenforo General
    * Fictionpress
