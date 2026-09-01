# Basic Strategy source and assumptions

The strategy data is transcribed from the official Blackjack Apprenticeship 2024 charts:

- H17: https://www.blackjackapprenticeship.com/wp-content/uploads/2024/09/H17-Basic-Strategy.pdf
- S17: https://www.blackjackapprenticeship.com/wp-content/uploads/2024/09/S17-Basic-Strategy.pdf

The two charts include pair splitting, soft totals, hard totals, and late surrender. `strategyTables/h17.ts` and `strategyTables/s17.ts` preserve those rows as data. No count deviations are included.

MVP table assumptions are explicit in `constants.ts`: late surrender and double after split (DAS) are available. The pure lookup also accepts availability overrides and applies each chart's printed fallback: double-or-hit, double-or-stand, and split only when DAS is offered.

`domain/strategyFeedback.ts` derives a complete pattern explanation from these same tables. `getBasicStrategyFeedback(playerHand, dealerUpcard, rules, availability)` returns the hand classification, exact action, broader pattern, active rules, and any surrender/double/split/DAS fallback caveat. Generated questions carry that result so correct and incorrect answer states always show identical rule reinforcement.
