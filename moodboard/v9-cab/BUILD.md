# v9 · The Cab — workspaces 3 and 4

Agreed 5 Nov 2026 (rounds 1 and 2). This is why the manual and settings look the
way they do; what is on screen is in `DESIGN.md`, how it is built is in
`HANDOFF.md`.

## The idea

The desk (workspace 1) is the view from the crane. A lesson (workspace 2) is
the climb up the mast. The manual and settings (workspaces 3 and 4) are the
cab: you are sitting inside, the tools are on panes of glass in front of you,
and the city is behind them, out of focus.

## Decisions (round 1)

- **The bar stays, slim, in the new style.** The icon strip down the left
  edge (the rail) is gone, from every workspace and every width; the bar
  names this workspace's windows instead, and the launcher (Alt+Enter) and
  the apps button still open anything.
- **Behind the windows: the desk's city**, out of focus and dimmed, in
  tonight's scene. The skull-garden wallpaper is retired from the screen.
- **Scenes follow the desk:** Night and Late are dark, Ice is light.
- **The focused window has a warm lamp-coloured edge** (`#ffb46b`), the same
  warm light that marks you on the climb. Every other edge is a hairline.
- **The manual is set like a lesson page** (Inter for words, the climb's code
  wells for examples) but keeps the man-page frame: the header line
  (`LUAU-VARIABLES(2)`, `MIMEI manual`, the page count), section heads in
  small capitals, and the footer (`◀ ▶`, `man 1/11`, `top`, `q close`).
- **One voice with the climb:** Inter and IBM Plex Mono, white and city blue
  on Night, slate on Ice, no accent colour.

## Decisions (round 2)

- **Kept as they are:** the lamp edge on the window in front, the glass
  (its blur and dimming), the bar's middle naming this workspace's windows
  as words, and the faint dot on a window that is open but not in front.
- **The terminal greets you with the 未 mark**, the crane's mark from the
  bar and the desk (snow at Night and Late, slate in Ice), instead of the
  old PETSCII mark.

Small follow-ups made at the same time:

- In a narrow manual (beside the terminal and the files) a line's note
  drops under its code instead of squeezing it.
- The bar's blur follows the effects level, like the windows'.
- Holding Alt lights the workspace numbers, as a hint for `Alt+1…4`.
- "Wallpaper only" is now **the city only** (`Alt+B`, settings, the
  launcher); `Esc` brings everything back.
- Settings has the scene (Night or Ice; Late comes by itself from 01:30).

## Stills

`cab-night-ws3.jpg` (the manual, the terminal and the files at Night),
`cab-ice-ws3.jpg` (the same in Ice), `cab-night-manual.jpg` (the manual
alone), `cab-night-settings.jpg` and `cab-ice-settings.jpg`, and
`cab-launcher.jpg` (Alt+Enter over the cab). 1440×900, taken on Linux
Chromium without a GPU.
