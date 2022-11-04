;(function () {
  const root = document.body
  let battles = []
  var main = {
    oninit: function () {
      battles = readBattles()
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
        m('h1', 'MF0 Intercept Orbit battles'),
        m('div', { class: 'column', style:"gap: 10px"}, [
          !battles
            ? [
                m('span', 'No battles yet. Grab your bricks, dice and get to it!'),
                m('a', { href: 'index.html' }, 'Go to Fleet builder / PPA calculator'),
              ]
            : Object.entries(battles).map(function (entry) {
                const date = new Date(entry[1].date)
                const id = entry[0]
                return m('div', { class: 'row', style: 'gap: 10px' }, [
                  m('span', `Battle from ${date}`),
                  m('a', { href: `battle.html?${BATTLE_ID_PARAM}=${id}` }, 'Resume'),
                  m(
                    'button',
                    {
                      onclick: function () {
                        delete battles[id]
                        localStorage.setItem(BATTLE_STORAGE_KEY, JSON.stringify(battles))
                      },
                    },
                    'Forfeit',
                  ),
                ])
              }),
        ]),
      ])
    },
  }
  m.mount(root, main)
})()
