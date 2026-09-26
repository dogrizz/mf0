# 02: Spike — total/role as Vue computed instead of imperative recalculate

**What to build:** A throwaway prototype (not merged as-is) answering: can `player.total` and
`player.role` become Vue `computed` properties, derived from `ppa`/`hva`/`tas` across the roster,
instead of the current imperative `recalculate(player, players)` / `determineRole(players)` calls
scattered across battle mutations (`changePlayerHva`, `changePlayerTas`, `applySystemDamage`,
`toggleCompanyFuel`, plus the one-time call on `vue-battle-player.js` mount)?

If yes, this removes a whole category of "did every mutation remember to call recalculate" bugs —
but `total`/`role` are currently persisted as plain fields in the stored battle JSON, so going
computed means `readBattle` stops expecting them and they get recomputed on load instead. That's
a real (if small) change to what gets serialized, which is why this is a spike before a decision,
not a decision made on paper.

**Blocked by:** 01 (touches the same battle-domain mutation functions; land after the split so the
diff isn't compounded)

**Status:** ready

- [ ] Prototype demonstrates `total`/`role` as `computed`, correctly reactive across HVA/TAS/PPA
      changes and system-damage-driven TAS changes, matching current `recalculate`/`determineRole`
      output exactly for the same inputs
- [ ] Prototype demonstrates (or rules out) not persisting `total`/`role` in the stored battle JSON
      and recomputing them on `readBattle`
- [ ] Decision recorded (in this ticket's Comments, or a new ADR if it turns out to be genuinely
      hard-to-reverse/surprising) on whether to land this for real, and if so, whether it needs a
      migration step for already-stored battles that have `total`/`role` baked into their JSON

## Comments
