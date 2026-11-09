# The Mist Age - Free Actions

A Daggerheart module for Foundry VTT: **free actions** for downtime. After a timeskip (say, 20 days) the GM gives the characters free actions, and every downtime roll spends one:

- a roll on a learn project (The Mist Age - Learn Projects);
- a spell study attempt (The Mist Age - Learn Spell);
- a recipe research attempt and every brewing (The Mist Age - Alchemy).

At 0 nothing is blocked and nothing warns: the roll goes ahead without spending (brewing during a long rest, say, is played out without the mechanic). A roll dialog closed without rolling spends nothing. Each spent action is posted to the chat with what it was spent on and how many are left.

The other modules work without this one; with it active they spend free actions and show "Free actions: N" next to their roll buttons.

## Setting the free actions (GM)

- **The Free actions window** — the *Free actions* button at the top of the Actors sidebar tab. Every player character with their count: type a number, or −1 / +1. On top, the timeskip line: *Add [20]* to the ticked characters (all by default), with one chat line.
- **On the character sheet** — the hourglass counter next to the rest buttons shows what is left; the GM clicks it to set an exact number.
- **Macro** — see below.

Players only see their count (the sheet counter and the line in the other modules' windows); it goes down only through their rolls.

## Data

`flags["mist-age-free-actions"].count` on the actor, a whole number ≥ 0.

## Macro API

```js
const api = game.modules.get("mist-age-free-actions").api;
api.get(actor);              // the count
api.set(actor, 20);          // set
api.add(actor, 20);          // add (negative removes, never below 0)
api.grant(actors, 20);       // GM: add to several characters, one chat line
api.spend(actor, "reason");  // spend one if there is any; false at 0
api.show();                  // GM: the window
```

## Install

Manifest URL:

```
https://github.com/liderako/foundry_daggerheart_free_actions/releases/latest/download/module.json
```
