;(function () {
  const root = document.body
  let battle = []

  function PlayerComponent() {
    function changeHva(player, newHva) {
      player.hva = parseInt(newHva)
      recalculate(player, battle.roster)
      storeBattle(battle)
    }

    function changeTas(player, newTas) {
      player.tas = parseInt(newTas)
      recalculate(player, battle.roster)
      storeBattle(battle)
    }

    function changeSystems(player, newSystems) {
      player.systems = parseInt(newSystems)
      storeBattle(battle)
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
          m('input', {
            type: 'number',
            min: 0,
            disabled: battle.sync,
            value: player.systems,
            oninput: function (e) {
              changeSystems(player, e.target.value)
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
        m('div', { class: 'row', style: 'gap: 10px' }, [
          m(
            'div',
            { class: 'column-justified' },
            m('span', 'Fleet id'),
            m('span', 'HVA'),
            m('span', 'TAS'),
            m('span', 'Systems'),
            m('span', 'PPA'),
            m('span', 'Total'),
            m('span', 'Role'),
          ),
          battle.roster.map(function (player) {
            return m(PlayerComponent, { player: player })
          }),
        ]),
      ])
    },
  }
  m.mount(root, main)
})()
