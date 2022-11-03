;(function () {
  const root = document.body
  let battle = {}

  function CompanyComponent() {
    return {
      view: function (vnode) {
        return m('span', 'asd')
      },
    }
  }

  function ShipComponent() {
    function systemStateChange(system, newState) {
      system.disabled = newState
    }

    return {
      view: function (vnode) {
        const ship = vnode.attrs.ship
        return m('div', { class: 'column' }, [
          m('h4', { class: ship.dead ? 'dead' : '' }, ship.name),
          m('span', dice(ship)),
          ship.systems.map(function (system) {
            let systemText = system.class
            if(system.class === 'attack'){
              systemText = `${systemText} ${system.attackType}`
              if(system.attackType2){
                systemText = `${systemText}/${system.attackType2}`
              }
            }
            return m(
              'label',
              m('input', {
                type: 'checkbox',
                checked: system.disabled,
                onclick: function (e) {
                  systemStateChange(system, e.target.checked)
                },
              }),
              systemText,
            )
          }),
        ])
      },
    }
  }

  function FleetComponent() {
    return {
      view: function (vnode) {
        const fleet = vnode.attrs.fleet
        return [
          m('h3', fleet.name),
          m('div', { class: 'row', style: 'gap: 10px' }, [
            fleet.ships.map((ship) => m(ShipComponent(), { ship: ship })),
            fleet.companies.map((company) => m(CompanyComponent(), { company: company })),
          ]),
        ]
      },
    }
  }

  function ShipTrackerComponent() {
    return {
      view: function () {
        return m('div', { class: 'column', style: 'margin-top: 15px' }, [
          battle.roster.map((fleet) => m(FleetComponent(), { fleet: fleet })),
        ])
      },
    }
  }

  function PlayerComponent() {
    function changeHva(player, newHva) {
      player.hva = parseInt(newHva)
      recalculate(player, battle.roster)
      storeBattle(battle, battle.id)
    }

    function changeTas(player, newTas) {
      player.tas = parseInt(newTas)
      recalculate(player, battle.roster)
      storeBattle(battle, battle.id)
    }

    return {
      oninit: function (vnode) {
        const player = vnode.attrs.player
        recalculate(player, battle.roster)
      },
      view: function (vnode) {
        const player = vnode.attrs.player
        return m('div', { class: 'column-justified' }, [
          m('span', player.name),
          m('input', {
            type: 'number',
            min: 0,
            value: player.hva,
            oninput: function (e) {
              changeHva(player, e.target.value)
            },
          }),
          m('input', {
            type: 'number',
            min: 0,
            disabled: battle.sync,
            value: player.tas,
            oninput: function (e) {
              changeTas(player, e.target.value)
            },
          }),
          m('span', player.ppa),
          m('span', player.total),
          m('span', player.role),
        ])
      },
    }
  }

  var main = {
    oninit: function () {
      const params = new URLSearchParams(window.location.search)
      if (params.has(BATTLE_ID_PARAM)) {
        battle = readBattle(params.get(BATTLE_ID_PARAM))
      }
    },
    view: function () {
      return m('main', { class: 'main' }, [
        m(
          'a',
          {
            title: 'Dark/Light mode',
            href: '#',
            style: 'float: right;text-decoration: none;',
            onclick: function () {
              document.body.classList.toggle('dark-mode')
            },
          },
          '🌓',
        ),
        m('h1', 'MF0 Intercept Orbit battle tracker'),
        !battle
          ? "Can't find your battle"
          : [
              m('div', { class: 'row', style: 'gap: 10px' }, [
                m(
                  'div',
                  { class: 'column-justified' },
                  m('span', 'Fleet id'),
                  m('span', 'HVA'),
                  m('span', 'TAs'),
                  m('span', 'PPA'),
                  m('span', 'Total'),
                  m('span', 'Role'),
                ),
                battle.roster.map(function (player) {
                  return m(PlayerComponent, { player: player })
                }),
              ]),
              battle.sync ? m(ShipTrackerComponent) : null,
            ],
      ])
    },
  }
  m.mount(root, main)
})()
