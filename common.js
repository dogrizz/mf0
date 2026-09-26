function OptionsComponent() {
  return {
    view: function (vnode) {
      return [
        vnode.attrs.hideBattleLink
          ? null
          : m(
              'a',
              {
                title: 'Browse running battles',
                href: 'battles.html',
                class: 'page-nav-link',
              },
              'Saved battles',
            ),
      ]
    },
  }
}

function FooterComponent() {
  return {
    view: function () {
      return m('footer', { class: 'app-footer' }, [
        m('div', [
          m('span', 'Please '),
          m('a', { target: '_blank', href: 'https://www.patreon.com/Joshua' }, 'support MF0 creator'),
          m('span', ' or '),
          m(
            'a',
            { target: '_blank', href: 'https://glyphpress.com/talk/mobile-frame-zero-002-intercept-orbit-final-pdf' },
            'buy a rulebook',
          ),
        ]),
        m('div', { class: 'app-footer-note' }, [m('span', 'I am not the creator ;)')]),
      ])
    },
  }
}
