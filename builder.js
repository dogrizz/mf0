;(function () {
  var root = document.body

  var players = []
  var trackShips = false
  var syncShips = false
  const LOCAL_STORAGE_KEY = 'mf0-tools'

  function recalculatePPA() {
    calculatePPA(players, syncShips)
    saveState()
  }

  function saveState() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ players: players, track: trackShips, sync: syncShips }))
  }

  function SystemComponent() {
    var secondSystem = false

    function changeClass(system, newClass) {
      system.class = newClass
      if (system.class === ShipSystem.ATTACK) {
        changeAttackType(system, AttackType.POINT_DEFENSE)
      }
      recalculatePPA()
    }

    function changeAttackType(system, newType) {
      system.attackType = newType
      saveState()
    }

    function changeAttackType2(system, newType) {
      system.attackType2 = newType
      saveState()
    }

    function flipSecondSystem(system) {
      secondSystem = !secondSystem
      if (!secondSystem) {
        delete system.attackType2
      }
      saveState()
    }

    return {
      oninit: function (vnode) {
        var system = vnode.attrs.system
        secondSystem = system.attackType2
      },
      view: function (vnode) {
        var system = vnode.attrs.system
        var weapons = [
          m('option', { value: AttackType.POINT_DEFENSE }, 'Point defence'),
          m('option', { value: AttackType.ASSAULT }, 'Assault'),
          m('option', { value: AttackType.SUPPORT }, 'Support'),
        ]
        return m('div', { class: 'col row' }, [
          m(
            'select',
            {
              class: 'col form-control',
              value: system.class,
              oninput: function (e) {
                changeClass(system, e.target.value)
              },
            },
            [
              m('option', { value: '' }, ''),
              m('option', { value: ShipSystem.ATTACK }, 'Attack'),
              m('option', { value: ShipSystem.DEFENSE }, 'Defence'),
              m('option', { value: ShipSystem.SENSOR }, 'Sensors'),
              m('option', { value: ShipSystem.CATAPULT }, 'Catapult'),
            ],
          ),
          system.class === ShipSystem.ATTACK
            ? m('div', { class: 'col row gap-0' }, [
                m(
                  'select',
                  {
                    class: 'col form-control',
                    value: system.attackType,
                    oninput: function (e) {
                      changeAttackType(system, e.target.value)
                    },
                  },
                  weapons,
                ),
                secondSystem
                  ? m(
                      'select',
                      {
                        class: 'col form-control',
                        value: system.attackType2,
                        oninput: function (e) {
                          changeAttackType2(system, e.target.value)
                        },
                      },
                      weapons,
                    )
                  : null,
                m(
                  'button',
                  {
                    class: 'col-1 btn btn-sm ' + (secondSystem ? 'btn-outline-warning' : 'btn-outline-success'),
                    onclick: function () {
                      flipSecondSystem(system)
                    },
                  },
                  secondSystem ? '-' : '+',
                ),
              ])
            : null,
        ])
      },
    }
  }

  function MechCompanies() {
    function shipCatapults(ship) {
      if (ship.hasOwnProperty('systems')) {
        return ship.systems.filter(function (system) {
          return system.class === ShipSystem.CATAPULT
        })
      }
      return []
    }

    function setAce(hasAce, ship, fleet) {
      ship.hasAce = hasAce
      fleet.aceSelected = hasAce
      if (!hasAce) {
        delete ship.aceType
      }
      saveState()
    }

    return {
      view: function (vnode) {
        var ship = vnode.attrs.ship
        var fleet = vnode.attrs.fleet
        var catapults = shipCatapults(ship)

        return [
          catapults.length > 0
            ? m('div', { class: 'row border rounded-2' }, [
                m(
                  'div',
                  { class: 'column' },
                  catapults.map(function (_) {
                    return m('div', 'Mech company')
                  }),
                ),
                m(
                  'label',
                  { hidden: fleet.aceSelected && !ship.hasAce },
                  'Has ace',
                  m('input', {
                    type: 'checkbox',
                    disabled: fleet.aceSelected && !ship.hasAce,
                    checked: ship.hasAce,
                    onclick: function (e) {
                      setAce(e.target.checked, ship, fleet)
                    },
                  }),
                ),
                m(
                  'select',
                  {
                    class: 'form-control',
                    value: ship.aceType,
                    disabled: !ship.hasAce,
                    hidden: !ship.hasAce,
                    oninput: function (e) {
                      ship.aceType = e.target.value
                      saveState()
                    },
                  },
                  [
                    m('option', { value: 'red' }, 'Red Ace'),
                    m('option', { value: 'blue' }, 'Blue Ace'),
                    m('option', { value: 'green' }, 'Green Ace'),
                    m('option', { value: 'yellow' }, 'Yellow Ace'),
                  ],
                ),
              ])
            : null,
        ]
      },
    }
  }

  function ShipComponent() {
    function changeName(ship, newName) {
      ship.name = newName
    }

    function changeClass(ship, newClass) {
      if (ship.class !== newClass) {
        ship.class = newClass
        ship.systems = []
        var systems = MAX_SYSTEMS.hasOwnProperty(newClass) ? MAX_SYSTEMS[newClass] : 0
        for (var i = 0; i < systems; i++) {
          ship.systems.push({ class: '' })
        }
        saveState()
      }
    }

    function remove(fleet, ship) {
      var position = fleet.ships.indexOf(ship)
      fleet.ships.splice(position, 1)
      if (ship.hasAce) {
        fleet.aceSelected = false
      }
      recalculatePPA()
    }

    function duplicate(fleet, ship) {
      var position = fleet.ships.indexOf(ship)
      fleet.ships.splice(position, 0, copy(ship))
      if (ship.hasAce) {
        ship.hasAce = false
        delete ship.aceType
      }
      recalculatePPA()
    }

    return {
      oninit: function (vnode) {
        var ship = vnode.attrs.ship
        if (!ship.class) {
          ship.name = randomShipName()
          changeClass(ship, ShipType.FRIGATE)
        }
      },
      view: function (vnode) {
        var ship = vnode.attrs.ship
        var fleet = vnode.attrs.fleet

        return m('div', { class: 'ship col border border-black rounded-3 p-2 bg-dark' }, [
          m('div', { class: 'row row-gap-2 justify-content-start align-items-center' }, [
            m(
              'div',
              { class: 'col-5' },
              m('input', {
                type: 'text',
                class: 'form-control',
                value: ship.name,
                oninput: function (e) {
                  changeName(ship, e.target.value)
                },
              }),
            ),
            m(
              'div',
              { class: 'col-1' },
              m(
                'button',
                {
                  class: 'btn btn-sm btn-outline-light',
                  title: 'Copy',
                  onclick: function () {
                    duplicate(fleet, ship)
                  },
                },
                '📋',
              ),
            ),
            m(
              'div',
              { class: 'col-1' },
              m(
                'button',
                {
                  class: 'btn btn-sm btn-outline-danger',
                  title: 'Remove',
                  onclick: function () {
                    remove(fleet, ship)
                  },
                },
                '×',
              ),
            ),
            m('span', { class: 'col-2' }, dice(ship)),
          ]),
          m('div', { class: 'ship-systems row row-cols-1 p-2 justify-content-start gap-2' }, [
            m(
              'div',
              { class: 'col row mb-2' },
              m(
                'select',
                {
                  class: 'form-control',
                  value: ship.class,
                  oninput: function (e) {
                    changeClass(ship, e.target.value)
                  },
                },
                [m('option', { value: ShipType.CAPITAL }, 'Capital'), m('option', { value: ShipType.FRIGATE }, 'Frigate')],
              ),
            ),
            ship.hasOwnProperty('systems')
              ? ship.systems.map(function (system) {
                  return m(SystemComponent, { system: system })
                })
              : null,
          ]),
          m(MechCompanies, { ship: ship, fleet: fleet }),
        ])
      },
    }
  }

  function FleetComponent() {
    function add(fleet) {
      fleet.ships.push({ systems: [] })
      recalculatePPA()
    }

    return {
      oninit: function (vnode) {
        var fleet = vnode.attrs.fleet
        if (!fleet.hasOwnProperty('ships')) {
          fleet.ships = []
          for (var i = 0; i < fleet.tas; i++) {
            fleet.ships.push({})
          }
        }
      },
      view: function (vnode) {
        var fleet = vnode.attrs.fleet
        return m('div', { id: 'fleet-' + fleet.name, class: 'col border rounded-4 p-3 bg-dark-subtle' }, [
          m('h3', fleet.name),
          m('div', { class: 'ships-list row  row-cols-2' }, [
            fleet.ships.map(function (ship) {
              return m(ShipComponent, { ship: ship, fleet: fleet })
            }),
          ]),
          m(
            'button',
            {
              class: 'mt-2 btn btn-outline-success',
              onclick: function () {
                add(fleet)
              },
            },
            'Add ship',
          ),
        ])
      },
    }
  }

  function ShipTrackerComponent() {
    function setShips(newSyncShips) {
      syncShips = newSyncShips
      recalculatePPA()
    }

    return {
      view: function () {
        return [
          m(
            'div',
            m(
              'label',
              'Sync PPA calculations with fleet builder ',
              m('input', {
                onclick: function (e) {
                  setShips(e.target.checked)
                },
                type: 'checkbox',
                checked: syncShips,
              }),
            ),
          ),
          m(
            'div',
            { class: 'mt-3 row row-gap-1 row-cols-1' },
            players.map(function (player) {
              return m(FleetComponent, { fleet: player })
            }),
          ),
        ]
      },
    }
  }

  function PlayerComponent() {
    function changeName(player, newName) {
      player.name = newName
    }
    function changeHva(player, newHva) {
      player.hva = parseInt(newHva)
      recalculatePPA()
    }

    function changeTas(player, newTas) {
      player.tas = parseInt(newTas)
      recalculatePPA()
    }

    function changeSystems(player, newSystems) {
      player.systems = parseInt(newSystems)
      recalculatePPA()
    }

    function remove(player) {
      var position = players.indexOf(player)
      players.splice(position, 1)
      recalculatePPA()
    }

    return {
      view: function (vnode) {
        var player = vnode.attrs.player
        return m(
          'div',
          { class: 'col-2 row row-cols-1 justify-content-start row-gap-1' },
          m(
            'div',
            { class: 'col row row-cols-2 gap-2 g-0 align-items-center' },
            m(
              'div',
              { class: 'col-10' },
              m('input', {
                value: player.name,
                class: 'form-control',
                oninput: function (e) {
                  changeName(player, e.target.value)
                },
              }),
            ),
            m(
              'div',
              { class: 'col-1 ml-2' },
              m(
                'button',
                {
                  title: 'Remove',
                  class: 'btn btn-sm btn-outline-danger',
                  onclick: function () {
                    remove(player)
                  },
                },
                '×',
              ),
            ),
          ),
          m('input', {
            type: 'number',
            class: 'col form-control',
            min: 0,
            value: player.hva,
            oninput: function (e) {
              changeHva(player, e.target.value)
            },
          }),
          m('input', {
            type: 'number',
            class: 'col form-control',
            min: 0,
            disabled: syncShips,
            value: player.tas,
            oninput: function (e) {
              changeTas(player, e.target.value)
            },
          }),
          m('input', {
            type: 'number',
            class: 'col form-control',
            min: 0,
            disabled: syncShips,
            value: player.systems,
            oninput: function (e) {
              changeSystems(player, e.target.value)
            },
          }),
          m('span', { class: 'col form-label' }, player.ppa),
          m('span', { class: 'col form-label' }, player.ppa * (player.hva + player.tas)),
        )
      },
    }
  }

  var main = {
    oninit: function () {
      let oldData = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (oldData !== null) {
        data = JSON.parse(oldData)
        players = data.players
        syncShips = data.sync
        trackShips = data.track
      }
    },
    view: function () {
      function add() {
        players.push({
          name: 'Player',
          hva: 3,
          tas: 5,
          systems: 10,
          ppa: 5,
          ships: [],
        })
        recalculatePPA()
      }

      function setShips(newTrackShips) {
        trackShips = newTrackShips
        if (!trackShips) {
          syncShips = false
        }
      }

      return [
        m(OptionsComponent, {}),
        m('main', { class: 'container' }, [
          m('h1', 'MF0 Intercept Orbit points per asset calculator'),
          m('div', { class: 'row gap-3 border rounded-4 p-2 justify-content-start' }, [
            m(
              'div',
              { class: 'col-1 row row-cols-1 mt-2 gap-2' },
              m('span', { class: 'form-label' }, 'Fleet id'),
              m('span', { class: 'form-label' }, 'HVA'),
              m('span', { class: 'form-label' }, 'TAs'),
              m('span', { class: 'form-label' }, 'Systems'),
              m('span', { class: 'form-label' }, 'PPA'),
              m('span', { class: 'form-label' }, 'Total'),
            ),
            players.map(function (player) {
              return m(PlayerComponent, { player: player })
            }),
            m('button', { onclick: add, class: 'col-1 btn btn-outline-primary' }, 'Add player'),
          ]),
          m(
            'div',
            {
              class: 'row mt-1 gy-4 row-cols-1',
            },
            [
              m(
                'button',
                {
                  disabled: players.length === 0,
                  class: 'col mb-4 btn btn-lg btn-outline-success',
                  onclick: function () {
                    location.href = 'battle.html?' + BATTLE_ID_PARAM + '=' + storeBattle(players, trackShips, syncShips)
                  },
                },
                'Fight!',
              ),
              m(
                'div',
                { class: 'col p-0 m-0' },
                m(
                  'div',
                  {
                    id: 'fleetBuildingAccordion',
                    class: 'accordion',
                  },
                  m('div', { class: 'accordion-item' }, [
                    m(
                      'h2',
                      { class: 'accordion-header' },
                      m(
                        'button',
                        {
                          class: 'accordion-button ' + (trackShips ? '' : 'collapsed'),
                          ['data-bs-toggle']: 'collapse',
                          ['data-bs-target']: '#collapseOne',
                          onclick: function (_) {
                            setShips(!trackShips)
                          },
                        },
                        'Fleet builder',
                      ),
                    ),
                    m(
                      'div',
                      {
                        id: 'collapseOne',
                        class: 'accordion-collapse collapse ' + (trackShips ? 'show' : ''),
                        ['data-bs-parent']: '#fleetBuildingAccordion',
                      },
                      m('div', { class: 'accordion-body' }, m(ShipTrackerComponent)),
                    ),
                  ]),
                ),
              ),
            ],
          ),
          m(FooterComponent, {}),
        ]),
      ]
    },
  }

  m.mount(root, main)
})()
