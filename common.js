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
                style: 'float: right;margin-right: 15px;text-decoration: none;',
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
      return m('footer', { class: 'float-end', style: 'font-size: small' }, [
        m('span', 'Please '),
        m('a', { target: '_blank', href: 'https://www.patreon.com/Joshua' }, 'support MF0 creator'),
        m('span', ' or '),
        m('a', { target: '_blank', href: 'https://glyphpress.com/talk/mobile-frame-zero-002-intercept-orbit-final-pdf' }, 'buy a rulebook'),
        m('div', { style: 'font-size: smaller' }, [m('span', 'I am not the creator ;)')]),
      ])
    },
  }
}
