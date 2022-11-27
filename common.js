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
