; (function() {
  const root = document.body
  let battle = {}

  function CompanyComponent() {
    let company = ''
    let fleet = ''

    function systemStateChange(system, newState) {
      system.disabled = newState
      if (company.systems.filter((system) => !system.disabled).length === 0) {
        company.destroyed = true
        fleet.tas--
        recalculate(fleet, battle.roster)
      } else if (company.destroyed) {
        company.destroyed = false
        fleet.tas++
        recalculate(fleet, battle.roster)
      }
      store(battle)
    }

    function fuelChange(comp) {
      comp.outOfFuel = !comp.outOfFuel
      if (comp.outOfFuel) {
        fleet.tas--
      } else {
        fleet.tas++
      }
      recalculate(fleet, battle.roster)
      store(battle)
    }

    return {
      view: function(vnode) {
        company = vnode.attrs.company
        fleet = vnode.attrs.fleet

        return m('div', { class: 'company col-3 row row-cols-1 p-1 m-0 rounded-3 ' + (company.destroyed || company.outOfFuel ? 'dead' : ' bg-dark') }, [
          m('div', { class: 'row justify-content-start' }, [
            m(
              'h4',
              { class: 'col text-capitalize' },
              company.aceType ? `${company.aceType} ace` : 'company',
            ),
            m('div', { class: 'col-1' },
              m(
                'button',
                {
                  class: 'btn btn-sm btn-outline-warning',
                  disabled: company.destroyed,
                  title: 'Fuel state',
                  onclick: function() {
                    fuelChange(company)
                  },
                },
                '⛽',
              )),
          ]),
          m('span', { class: 'col' }, companyDice(company)),
          m('span', { class: 'col' }, `origin: ${company.origin}`),
          company.systems.map(function(system) {
            return m('div', { class: 'col form-check' }, m(
              'label', { class: 'form-check-label' },
              m('input', {
                class: 'form-check-input',
                type: 'checkbox',
                checked: system.disabled,
                disabled: company.outOfFuel,
                onclick: function(e) {
                  systemStateChange(system, e.target.checked)
                },
              }),
              system.class,
            ))
          }),
        ])
      },
    }
  }

  function ShipComponent() {
    let ship = ''
    let fleet = ''

    function systemStateChange(system, newState) {
      system.disabled = newState
      if (ship.systems.filter((system) => !system.disabled).length === 0) {
        ship.destroyed = true
        fleet.tas--
        recalculate(fleet, battle.roster)
      } else if (ship.destroyed) {
        ship.destroyed = false
        fleet.tas++
        recalculate(fleet, battle.roster)
      }
      store(battle)
    }

    function startTransfer(ship) {
      if (battle.roster.length === 2) {
        transfer(ship, battle.roster.filter((f) => f != fleet)[0])
      } else {
        ship.showPopup = true
      }
    }

    function transfer(ship, targetFleet) {
      fleet.tas--
      targetFleet.tas++
      fleet.ships.splice(fleet.ships.indexOf(ship), 1)
      targetFleet.ships.push(ship)
      store(battle)
    }

    return {
      view: function(vnode) {
        ship = vnode.attrs.ship
        fleet = vnode.attrs.fleet

        return m('div', { class: 'ship col-3 row row-cols-1 rounded-3 p-1 m-0 ' +  (ship.destroyed ? ' dead' : 'bg-dark')}, [
          m('div', { class: 'row justify-content-start' }, [
            m('h4', { class: 'col ' + (ship.owner !== fleet.id ? ' captured' : ''), title: (ship.name + (ship.destroyed ? ' dead ' : ' ') + (ship.owner !== fleet.id ? 'captured' : '')) }, ship.name || 'noname'),
            m('div', { class: 'col-1' },
              m(
                'button',
                {
                  class: 'btn btn-sm btn-outline-info',
                  title: 'Transfer',
                  hidden: ship.destroyed,
                  onclick: function() {
                    startTransfer(ship)
                  },
                },
                '⇌',
              )),
            m(
              'div',
              { class: ship.showPopup ? 'overlay overlay-show' : 'overlay' },
              m('div', { class: 'column popup', style: 'gap: 10px' }, [
                m('div', { class: 'row', style: 'justify-content: space-between;margin-bottom: 10px' }, [
                  m('h3', `Transfer ship ${ship.name} to:`),
                  m(
                    'button',
                    {
                      style: 'float: right',
                      onclick: function() {
                        ship.showPopup = false
                      },
                    },
                    '×',
                  ),
                ]),
                battle.roster
                  .filter((f) => f !== fleet)
                  .map((player) =>
                    m(
                      'button',
                      {
                        onclick: function() {
                          ship.showPopup = false
                          transfer(ship, player)
                        },
                      },
                      player.name,
                    ),
                  ),
              ]),
            ),
          ]),
          m('span', { class: 'col' }, dice(ship)),
          ship.systems.map(function(system) {
            let systemText = system.class
            if (system.class === ShipSystem.ATTACK) {
              systemText = `${systemText} ${system.attackType}`
              if (system.attackType2) {
                systemText = `${systemText}/${system.attackType2}`
              }
            }
            return m('div', { class: 'col system form-check' }, m(
              'label', { class: 'form-check-label' },
              m('input', {
                class: 'form-check-input',
                type: 'checkbox',
                checked: system.disabled,
                onclick: function(e) {
                  systemStateChange(system, e.target.checked)
                },
              }),
              systemText,
            ))
          }),
        ])
      },
    }
  }

  function FleetComponent() {
    return {
      view: function(vnode) {
        const fleet = vnode.attrs.fleet
        return m('div', { class: 'col row row-cols-1 border rounded-4 p-2 gap-2 bg-dark-subtle' }, [
          m('h3', { class: 'col' }, fleet.name),
          m('div', { class: 'ships col row justify-content-start gap-2' }, [fleet.ships.map((ship) => m(ShipComponent(), { ship: ship, fleet: fleet }))]),
          m('div', { class: 'companies col row justify-content-start gap-2' }, [
            fleet.companies.map((company) => m(CompanyComponent(), { company: company, fleet: fleet })),
          ]),
        ])
      },
    }
  }

  function ShipTrackerComponent() {
    return {
      view: function() {
        return m('div', { class: 'row row-cols-1 gap-2 mt-2' }, [
          battle.roster.map((fleet) => m(FleetComponent(), { fleet: fleet })),
        ])
      },
    }
  }

  function PlayerComponent() {
    function changeHva(player, newHva) {
      player.hva = parseInt(newHva)
      recalculate(player, battle.roster)
      store(battle)
    }

    function changeTas(player, newTas) {
      player.tas = parseInt(newTas)
      recalculate(player, battle.roster)
      store(battle)
    }

    return {
      oninit: function(vnode) {
        const player = vnode.attrs.player
        recalculate(player, battle.roster)
      },
      view: function(vnode) {
        const player = vnode.attrs.player
        return m('div', { class: 'col-2 row row-cols-1 p-0 gap-1' }, [
          m('label', { class: 'col fs-5' }, player.name),
          m('div', { class: 'col' },
            m('input', {
              class: 'form-control',
              type: 'number',
              min: 0,
              value: player.hva,
              oninput: function(e) {
                changeHva(player, e.target.value)
              },
            })),
          m('div', { class: 'col' },
            m('input', {
              class: 'form-control',
              type: 'number',
              min: 0,
              disabled: battle.sync,
              value: player.tas,
              oninput: function(e) {
                changeTas(player, e.target.value)
              },
            })),
          m('span', { class: 'col form-label' }, player.ppa),
          m('span', { class: 'col form-label' }, player.total),
          m('span', { class: 'col form-label' }, player.role),
        ])
      },
    }
  }

  var main = {
    oninit: function() {
      const params = new URLSearchParams(window.location.search)
      if (params.has(BATTLE_ID_PARAM)) {
        battle = readBattle(params.get(BATTLE_ID_PARAM))
      }
    },
    view: function() {
      return [
        m(OptionsComponent, {}),
        m('main', { class: 'container' }, [
          m('h1', 'MF0 Intercept Orbit battle tracker'),
          !battle
            ? "Can't find your battle"
            : [
              m('div', { class: 'row gap-2 justify-content-start p-2 border rounded-4' }, [
                m(
                  'div',
                  { class: 'col-1 row row-cols-1 p-0 mt-2 gap-1' },
                  m('span', { class: 'col form-label' }, 'Fleet id'),
                  m('span', { class: 'col form-label' }, 'HVA'),
                  m('span', { class: 'col form-label' }, 'TAs'),
                  m('span', { class: 'col form-label' }, 'PPA'),
                  m('span', { class: 'col form-label' }, 'Total'),
                  m('span', { class: 'col form-label' }, 'Role'),
                ),
                battle.roster.map(function(player) {
                  return m(PlayerComponent, { player: player })
                }),
              ]),
              battle.sync ? m(ShipTrackerComponent) : null,
            ],
          m(FooterComponent, {}),
        ]),
      ]
    },
  }
  m.mount(root, main)
})()
