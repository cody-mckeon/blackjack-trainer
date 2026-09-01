# Running Count Trainer

This feature trains only the Hi-Lo running count. It deliberately excludes basic strategy decisions, true-count conversion, betting ramps, deviations, and casino gameplay.

## Architecture

- `lib/blackjack/hiLo.ts` owns pure Hi-Lo scoring and category logic.
- `lib/blackjack/shoe.ts` owns N-deck composition, Fisher-Yates shuffle, and hidden-card removal.
- `domain/` owns checkpoints, cancellation chunks, endless stream reshuffling, personal-best rules, summaries, and deterministic coaching.
- `components/modes/` keeps each of the six drills independent while sharing card/timer/answer UI.
- `storage/` is an AsyncStorage adapter behind a small interface so a future cloud adapter can replace it without changing drill logic.
- `context/` coordinates settings, recent summaries, and deck/mode-specific records.

The Endless Stream draws from valid shuffled shoes and replaces the internal shoe after exhaustion. It never tells the user that the ongoing stream is one physically finite casino shoe.

## Roadmap

Enabled: True Count Trainer, Basic Strategy Trainer, Running Count Trainer.

Coming soon: Deck Estimation Trainer, Combined Count Trainer, Casino Simulation, and Deviations.

Deck Estimation will eventually include a visual discard tray, configurable starting shoe size, whole-deck and half-deck estimation, later quarter-deck estimation, immediate feedback, and adaptive practice for commonly confused visual amounts. The discard tray should grow as cards are played in Casino Simulation. A later combined drill will join Running Count + Decks Remaining Estimate + True Count. None of those visuals or combined behaviors are implemented here.
