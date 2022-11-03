;(function () {
  const root = document.body
  let battle = []

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
            href: '#',
            style: 'float: right;text-decoration: none;',
            onclick: function () {
              document.body.classList.toggle('dark-mode')
            },
          },
          '🌓',
        ),
        m('h1', 'MF0 Intercept Orbit battle tracker'),
        JSON.stringify(battle, (pretty = true)),
      ])
    },
  }
  m.mount(root, main)
})()
