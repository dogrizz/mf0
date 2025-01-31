; (function() {
  const root = document.body
  let battles = []
  var main = {
    oninit: function() {
      battles = readBattles()
    },
    view: function() {
      return [
        m(OptionsComponent, { hideBattleLink: true }),
        m('main', { class: 'container' }, [
          m('h1', 'MF0 Intercept Orbit battles'),
          m('div', { class: 'battle list row row-cols-1 gap-3' }, [
            !battles || Object.entries(battles).length === 0
              ? [
                m('span', 'No battles yet. Grab your bricks, dice and get to it!'),
                m('a', { href: 'index.html' }, 'Go to Fleet builder / PPA calculator'),
              ]
              : Object.entries(battles).map(function(entry) {
                const date = new Date(entry[1].date)
                const id = entry[0]
                return m('div', { class: 'battle col row align-items-center justify-content-start gap-2' }, [
                  m('span', { class: 'col fs-5' }, `Battle from ${date.toLocaleString()}`),
                  m('a', { class: 'col-2 btn btn-outline-success', href: `battle.html?${BATTLE_ID_PARAM}=${id}` }, 'Resume'),
                  m(
                    'button',
                    {
                      class: 'col-2 btn btn-outline-danger',
                      onclick: function() {
                        delete battles[id]
                        localStorage.setItem(BATTLE_STORAGE_KEY, JSON.stringify(battles))
                      },
                    },
                    'Forfeit',
                  ),
                ])
              }),
          ]),
          m(FooterComponent, {}),
        ]),
      ]
    },
  }
  m.mount(root, main)
})()
