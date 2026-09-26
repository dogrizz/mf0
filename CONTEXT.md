# Mobile Frame Zero: Intercept Orbit

Tools for managing games of *Mobile Frame Zero: Intercept Orbit* — building a fleet, then tracking
its battle system by system.

## Language

**Internal system**:
A ship's baseline hull/structure systems (2 per ship, dice notation `W`). The Fleet Builder treats
these as a fixed, always-undamaged baseline and doesn't represent them as discrete systems. The
Battle Tracker materializes them as two explicit `internal`-class systems on each ship, so individual
damage can disable them.
_Avoid_: white system (dice-notation slang, not the domain term), hull points

**Builder-shaped ship/roster**:
A ship or roster as it exists in the Fleet Builder: no internal systems and no mech companies
materialized yet, since the Fleet Builder doesn't track per-system damage.
_Avoid_: pre-battle ship

**Battle-shaped ship/roster**:
A builder-shaped ship or roster after the Battle Tracker's one-time migration (on first opening a
battle that requested per-system tracking) backfills its internal systems and mech companies, so
individual systems can take damage.
_Avoid_: in-battle ship, live ship
