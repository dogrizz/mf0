const test = require('node:test')
const assert = require('node:assert/strict')
const { loadPage, settle } = require('./helpers/load-page')

// These load the real index.html/builder.js/support.js from the repo (not
// synthetic snippets) and drive them through Alpine's own public $data() API
// - the same thing the real buttons/selects call - so a regression in the
// actual markup or component wiring shows up here. See
// .ai/alpine-migration.md for the bugs each of these locks in.

test('removing a ship removes the correct one and adding another afterwards still works (bug #4: x-for key)', async () => {
  const dom = loadPage('index.html')
  const { window } = dom
  await settle()

  window.Alpine.store('builder').addPlayer()
  await settle()

  const fleetEl = window.document.querySelector('[id^="fleet-"]')
  const fleet = window.Alpine.$data(fleetEl)

  fleet.addShip()
  await settle()
  window.Alpine.$data(fleetEl.querySelector('.ship')).changeName('Ship A')

  fleet.addShip()
  await settle()
  window.Alpine.$data(Array.from(fleetEl.querySelectorAll('.ship'))[1]).changeName('Ship B')

  fleet.addShip()
  await settle()
  window.Alpine.$data(Array.from(fleetEl.querySelectorAll('.ship'))[2]).changeName('Ship C')

  let ships = Array.from(fleetEl.querySelectorAll('.ship'))
  assert.deepEqual(
    ships.map((el) => window.Alpine.$data(el).ship.name),
    ['Ship A', 'Ship B', 'Ship C'],
  )

  window.Alpine.$data(ships[1]).remove()
  await settle()

  ships = Array.from(fleetEl.querySelectorAll('.ship'))
  assert.deepEqual(
    ships.map((el) => window.Alpine.$data(el).ship.name),
    ['Ship A', 'Ship C'],
    'removing the middle ship should not remove the last one',
  )

  fleet.addShip()
  await settle()
  ships = Array.from(fleetEl.querySelectorAll('.ship'))
  assert.equal(ships.length, 3, 'adding a ship after a removal should still work')
})

test('changing ship class replaces its systems and edits land on the live objects, not stale ones (bug #4: array replacement)', async () => {
  const dom = loadPage('index.html')
  const { window } = dom
  await settle()

  window.Alpine.store('builder').addPlayer()
  await settle()

  const fleetEl = window.document.querySelector('[id^="fleet-"]')
  window.Alpine.$data(fleetEl).addShip()
  await settle()

  const shipEl = fleetEl.querySelector('.ship')
  const ship = window.Alpine.$data(shipEl)
  assert.equal(ship.ship.class, 'frigate')

  ship.changeClass('capital')
  await settle()

  const systemEls = Array.from(shipEl.querySelectorAll('select.col.form-select'))
  assert.equal(systemEls.length, 4, 'capital ships have 4 system slots')

  const firstSystem = window.Alpine.$data(systemEls[0].parentElement)
  firstSystem.changeClass('catapult')
  await settle()

  assert.equal(ship.ship.systems[0].class, 'catapult', 'the edit should land on the object actually stored in ship.systems')
  assert.equal(ship.catapults.length, 1)
  assert.match(ship.dice, /K/, 'dice string should include a catapult die')
  assert.ok(shipEl.textContent.includes('Mech company'), 'a mech company slot should appear for the selected catapult')
})

test('ship class and system selections persist across a page reload (bug #3: select/option binding order)', async () => {
  const dom1 = loadPage('index.html')
  await settle()

  dom1.window.Alpine.store('builder').addPlayer()
  await settle()
  const fleetEl1 = dom1.window.document.querySelector('[id^="fleet-"]')
  dom1.window.Alpine.$data(fleetEl1).addShip()
  await settle()

  const shipEl1 = fleetEl1.querySelector('.ship')
  const ship1 = dom1.window.Alpine.$data(shipEl1)
  ship1.changeClass('capital')
  await settle()

  const systemEls1 = Array.from(shipEl1.querySelectorAll('select.col.form-select'))
  dom1.window.Alpine.$data(systemEls1[0].parentElement).changeClass('catapult')
  await settle()

  const saved = dom1.window.localStorage.getItem('mf0-tools')
  assert.ok(saved, 'builder state should have been persisted')

  const dom2 = loadPage('index.html', { seedLocalStorage: { 'mf0-tools': saved } })
  await settle()

  const shipEl2 = dom2.window.document.querySelector('.ship')
  const shipClassSelect2 = shipEl2.querySelector('.col.row.mb-2 select')
  assert.equal(shipClassSelect2.value, 'capital', 'ship class select should show the saved value, not fall back to blank')

  const systemSelects2 = Array.from(shipEl2.querySelectorAll('select.col.form-select'))
  assert.equal(systemSelects2[0].value, 'catapult', 'system select should show the saved value, not fall back to blank')
})

test('the ace/mech-company checkbox is reachable from a nested system component (bug #1: this-scoping across x-data)', async () => {
  const dom = loadPage('index.html')
  const { window } = dom
  await settle()

  window.Alpine.store('builder').addPlayer()
  await settle()
  const fleetEl = window.document.querySelector('[id^="fleet-"]')
  window.Alpine.$data(fleetEl).addShip()
  await settle()

  const shipEl = fleetEl.querySelector('.ship')
  const ship = window.Alpine.$data(shipEl)
  const systemEls = Array.from(shipEl.querySelectorAll('select.col.form-select'))

  // calling changeClass on a nested systemComponent must reach the shared
  // store (this.$store.builder.recalculatePPA()) without throwing
  assert.doesNotThrow(() => {
    window.Alpine.$data(systemEls[0].parentElement).changeClass('catapult')
  })
  await settle()

  assert.ok(shipEl.textContent.includes('Has ace'), 'the ace checkbox should render once a catapult/mech company exists')
})

test('boolean attributes do not render truthy for freshly-created (undefined) fields (bug #2)', async () => {
  const dom = loadPage('index.html')
  const { window } = dom
  await settle()

  window.Alpine.store('builder').addPlayer()
  await settle()
  const fleetEl = window.document.querySelector('[id^="fleet-"]')
  window.Alpine.$data(fleetEl).addShip()
  await settle()

  const shipEl = fleetEl.querySelector('.ship')
  window.Alpine.$data(Array.from(shipEl.querySelectorAll('select.col.form-select'))[0].parentElement).changeClass('catapult')
  await settle()

  const aceCheckbox = shipEl.querySelector('input[type="checkbox"]')
  assert.equal(aceCheckbox.checked, false, 'a freshly-created ship has hasAce === undefined, which must render as unchecked, not checked')
})
