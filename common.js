function OptionsComponent() {
  return {
    view: function (vnode) {
      return [
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
        vnode.attrs.hideBattleLink
          ? null
          : m(
              'a',
              {
                title: 'Browse running battles',
                href: 'battles.html',
                style: 'float: right;margin-right: 15px;text-decoration: none;',
              },
              '🕮',
            ),
      ]
    },
  }
}

function FooterComponent() {
  return {
    view: function () {
      return m('footer', [
        m('span', 'Please '),
        m('a', { target: '_blank', href: 'https://www.patreon.com/Joshua' }, 'support MF0 creator'),
        m('span', ' or '),
        m('a', { target: '_blank', href: 'https://glyphpress.com/talk/mobile-frame-zero-002-intercept-orbit-final-pdf' }, 'buy a rulebook'),
        m('div', { class: 'disclaimer' }, [m('span', 'I am not the creator ;)')]),
      ])
    },
  }
}
