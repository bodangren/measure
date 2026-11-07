// Hand-written client bundle in the Lazy-CJS format the DSH web loader reads
// (design §8). No build step, no JSX, no Harness Client package: the only
// module-table request is `react`. The bundle registers the session band in the
// conversation input dock, the root-scoped Measure panel with its sidebar
// entry, and the `measure-status` command decoration.
window.__ModuleLoader__.load({
  id: 'dsh-measure-guard',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    /** The locale namespace of every own label. */
    const NS = 'measure-guard'
    /** The Host route of FR-15 (src/client-state.js serves it). */
    const STATE_PATH = '/measure-guard/state'
    /** The band and the panel poll the route while they are mounted. */
    const POLL_MS = 2000

    // The parity-bound core text (the band line and the status text) ships in
    // English by design §14; these dictionaries cover the plugin's own chrome.
    const en = {
      panel: 'Measure',
      panelTitle: 'Measure status',
      setup: 'No measure/ folder in this project. Create one to start a track.',
      problems: 'Problems',
      guards: 'Guards',
      goal: 'Goal',
      setupSetUp: 'Set up Measure',
      setupOff: 'Turn off for session',
      guardsOn: 'on',
      guardsSession: 'off for this session',
      guardsRepo: 'off for this repository',
      session: 'Session',
      empty: 'No session is open. Open or create a conversation to see its Measure status.',
      loading: 'Loading…',
      refresh: 'Refresh',
    }
    const zh = {
      panel: 'Measure',
      panelTitle: 'Measure 状态',
      setup: '本项目没有 measure/ 文件夹。创建一个以开始轨道。',
      problems: '问题',
      guards: '守卫',
      goal: '目标',
      setupSetUp: '设置 Measure',
      setupOff: '本会话关闭',
      guardsOn: '已开启',
      guardsSession: '本会话已关闭',
      guardsRepo: '本仓库已关闭',
      session: '会话',
      empty: '当前没有会话。打开或创建一个对话以查看其 Measure 状态。',
      loading: '加载中…',
      refresh: '刷新',
    }

    /** The English fallback used only if the slot did not inject `t`. */
    const fallbackOf = dictionary => key => (dictionary[key] === undefined ? key : dictionary[key])

    /** The localized bypass wording. */
    const guardsLabel = (t, guardsOff) => {
      if (guardsOff === 'repo') return t('guardsRepo')
      if (guardsOff === 'session') return t('guardsSession')
      return t('guardsOn')
    }

    /** A style shared by the band and the panel chrome; theme tokens only. */
    const textStyle = {
      fontFamily: 'var(--dsw-font-family)',
      fontSize: '12px',
      lineHeight: 1.5,
      color: 'var(--dsw-alias-label-secondary)',
    }

    /** The band container: a full-width strip above the composer. */
    const bandStyle = {
      ...textStyle,
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'baseline',
      gap: '8px',
      margin: '0 0 6px',
      padding: '4px 10px',
      border: '1px solid var(--dsw-alias-border-l1)',
      borderRadius: 'var(--dsw-radius-sm)',
      background: 'var(--dsw-alias-bg-layer-2)',
    }

    const primaryStyle = { color: 'var(--dsw-alias-label-primary)', fontWeight: 600 }

    const panelStyle = {
      ...textStyle,
      display: 'grid',
      gap: '12px',
      padding: '14px',
      border: '1px solid var(--dsw-alias-border-l1)',
      borderRadius: 'var(--dsw-radius-sm)',
      background: 'var(--dsw-alias-bg-layer-2)',
    }

    const buttonStyle = {
      ...textStyle,
      padding: '3px 10px',
      border: '1px solid var(--dsw-alias-border-l1)',
      borderRadius: 'var(--dsw-radius-sm)',
      background: 'var(--dsw-alias-bg-layer-2)',
      color: 'var(--dsw-alias-label-primary)',
      cursor: 'pointer',
    }

    const statusStyle = {
      margin: 0,
      padding: '10px',
      whiteSpace: 'pre-wrap',
      overflow: 'auto',
      maxHeight: '60vh',
      fontFamily: 'var(--ds-font-family-code)',
      fontSize: '12px',
      lineHeight: 1.5,
      color: 'var(--dsw-alias-label-primary)',
      border: '1px solid var(--dsw-alias-border-l1)',
      borderRadius: 'var(--dsw-radius-sm)',
      background: 'var(--dsw-alias-bg-layer-2)',
    }

    /** Polls the Host state route for one session; keeps the last good value. */
    function useStatusView(sessionId, revision) {
      const [view, setView] = React.useState(null)
      React.useEffect(() => {
        // A new session (or an explicit refresh) starts from no value, so a
        // failed fetch can never show another session's status.
        setView(null)
        if (typeof sessionId !== 'string' || sessionId === '') return undefined
        const controller = new AbortController()
        let live = true
        let timer = null
        const load = async () => {
          try {
            const response = await fetch(STATE_PATH + '?sessionId=' + encodeURIComponent(sessionId), {
              signal: controller.signal,
            })
            if (!response.ok) return
            const body = await response.json()
            if (live && body !== null && typeof body === 'object') setView(body)
          } catch {
            // A failed poll keeps the last value and never throws: the band
            // renders the previous state instead of blanking its slot.
          }
        }
        load()
        timer = setInterval(load, POLL_MS)
        return () => {
          live = false
          if (timer !== null) clearInterval(timer)
          controller.abort()
        }
      }, [sessionId, revision])
      return view
    }

    /** Subscribes to the session-list snapshot store while the panel is mounted. */
    function useSessionList(list) {
      const read = () => (list === null || typeof list.getSnapshot !== 'function' ? null : list.getSnapshot())
      const [snapshot, setSnapshot] = React.useState(read)
      React.useEffect(() => {
        if (list === null || typeof list.subscribe !== 'function') return undefined
        const update = () => setSnapshot(read())
        update()
        return list.subscribe(update)
      }, [list])
      return snapshot
    }

    /**
     * Catches a render error inside one slot entry so the rest of the slot
     * survives (references/practices.md: a throwing component blanks its entry).
     */
    class SlotBoundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { failed: false }
      }
      static getDerivedStateFromError() {
        return { failed: true }
      }
      componentDidCatch() {
        // The entry renders nothing; the page keeps working.
      }
      render() {
        return this.state.failed ? null : this.props.children
      }
    }

    /** The compact problem rows of the band. */
    function ProblemList(props) {
      if (!Array.isArray(props.problems) || props.problems.length === 0) return null
      return h(
        'span',
        { style: { display: 'inline-flex', flexWrap: 'wrap', gap: '6px', alignItems: 'baseline' } },
        h('span', { style: primaryStyle }, props.t('problems') + ':'),
        h(
          'span',
          { style: { display: 'inline-flex', flexWrap: 'wrap', gap: '6px' } },
          props.problems.map((problem, index) =>
            h('span', { key: String(index), style: { color: 'var(--dsw-alias-label-secondary)' } }, problem),
          ),
        ),
      )
    }

    /** Answer the setup offer from the band: one POST, then refetch the view. */
    const postSetup = (sessionId, choice, done) => {
      return fetch('/measure-guard/setup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId, choice }),
      })
        .then(() => done())
        .catch(() => done())
    }

    /** The setup answer buttons, shown while the offer has no answer. */
    function SetupActions(props) {
      const t = props.t || fallbackOf(en)
      if (props.setup === null || props.setup === undefined || props.setup.choice !== null) return null
      return h(
        'span',
        { style: { display: 'inline-flex', gap: '6px' } },
        h('button', { type: 'button', style: buttonStyle, onClick: () => postSetup(props.sessionId, 'setup', props.answered) }, t('setupSetUp')),
        h('button', { type: 'button', style: buttonStyle, onClick: () => postSetup(props.sessionId, 'off', props.answered) }, t('setupOff')),
      )
    }

    /** The band body: the Host band line, the localized bypass, the goal, the setup answer, and the problems. */
    function BandBody(props) {
      const t = props.t || fallbackOf(en)
      const sessionId = props.session && typeof props.session.sessionId === 'string' ? props.session.sessionId : null
      const [revision, setRevision] = React.useState(0)
      const view = useStatusView(sessionId, revision)
      if (view === null) return null
      const setupText = view.setup && view.setup.text ? view.setup.text : null
      const band = setupText !== null ? setupText : view.band === null || view.band === undefined ? t('setup') : view.band
      const answered = () => setRevision(value => value + 1)
      return h(
        'div',
        { 'data-measure-guard': 'band', style: bandStyle },
        h('span', { style: primaryStyle }, band),
        view.guardsOff === null || view.guardsOff === undefined
          ? null
          : h('span', { style: { color: 'var(--dsw-alias-label-secondary)' } }, t('guards') + ': ' + guardsLabel(t, view.guardsOff)),
        view.goal === null || view.goal === undefined
          ? null
          : h(
              'span',
              { style: { color: 'var(--dsw-alias-label-secondary)' } },
              t('goal') + ': ' + view.goal.phase + ' · round ' + view.goal.round + '/' + view.goal.maxRounds + ' · ' + view.goal.objective,
            ),
        h(SetupActions, { t, sessionId, setup: view.setup, answered }),
        h(ProblemList, { problems: view.problems, t }),
      )
    }

    /** The registered band: the boundary keeps a render error inside this entry. */
    function Band(props) {
      return h(SlotBoundary, null, h(BandBody, props))
    }

    /** The panel component bound to the one Client Context (the session list). */
    const makePanel = ctx =>
      function PanelBody(props) {
        const t = props.t || fallbackOf(en)
        const list = ctx.sessions && ctx.sessions.list ? ctx.sessions.list : null
        const sessions = useSessionList(list)
        const ids = sessions && Array.isArray(sessions.ids) ? sessions.ids : []
        const byId = sessions && sessions.byId && typeof sessions.byId === 'object' ? sessions.byId : {}
        const [picked, setPicked] = React.useState(null)
        const [revision, setRevision] = React.useState(0)
        const sessionId = picked !== null && ids.includes(picked) ? picked : ids.length > 0 ? ids[0] : null
        const view = useStatusView(sessionId, revision)

        const choices = ids.map(id => {
          const row = byId[id]
          const label = row && typeof row.displayTitle === 'string' && row.displayTitle !== '' ? row.displayTitle : id
          return h('option', { key: id, value: id }, label)
        })

        return h(
          'div',
          { 'data-measure-guard': 'panel', style: panelStyle },
          h(
            'div',
            { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' } },
            h('span', { style: { ...primaryStyle, fontSize: '14px' } }, t('panelTitle')),
            h(
              'button',
              {
                type: 'button',
                onClick: () => setRevision(value => value + 1),
                disabled: sessionId === null,
                style: buttonStyle,
              },
              t('refresh'),
            ),
          ),
          sessionId === null
            ? h('div', { style: { color: 'var(--dsw-alias-label-secondary)' } }, t('empty'))
            : h(
                'div',
                { style: { display: 'grid', gap: '10px' } },
                h(
                  'label',
                  { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                  h('span', null, t('session')),
                  h(
                    'select',
                    {
                      value: sessionId,
                      onChange: event => setPicked(event.target.value),
                      style: buttonStyle,
                    },
                    choices,
                  ),
                ),
                view === null
                  ? h('div', { style: { color: 'var(--dsw-alias-label-secondary)' } }, t('loading'))
                  : h(
                      'div',
                      { style: { display: 'grid', gap: '8px' } },
                      h(
                        'div',
                        { style: { color: 'var(--dsw-alias-label-secondary)' } },
                        t('guards') + ': ' + guardsLabel(t, view.guardsOff),
                      ),
                      h('pre', { style: statusStyle }, view.status),
                    ),
              ),
        )
      }

    /** The registered panel: same boundary protection as the band. */
    const wrapPanel = Component => props => h(SlotBoundary, null, h(Component, props))

    /** The sidebar icon: artwork only, inherits the theme through currentColor. */
    function MeasureIcon(props) {
      const size = props && typeof props.size === 'number' ? props.size : 16
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 16 16',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.5,
          'aria-hidden': true,
          style: { display: 'block' },
        },
        h('rect', { x: 2.5, y: 2.5, width: 11, height: 11, rx: 2 }),
        h('path', { d: 'M5 8.5l2 2 4-4.5' }),
      )
    }

    return {
      inject: ['slots', 'sessions', 'locale', 'layout', 'commandUi'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { en, zh }))
        const t = ctx.locale.bind(NS)

        // The band: session-scoped, above the composer. The dock props carry
        // the SessionSnapshot; the component polls the Host route itself.
        ctx.slots.inject('conversation.input.dock', () =>
          ctx.slots.register({ name: 'conversation.input.dock', id: 'measure-guard', order: 20, locale: NS }, Band),
        )

        // The panel: the root-scoped keyed `main` slot under key `measure`,
        // matching the sidebar entry id (the pair the sidebar README expects).
        const Panel = wrapPanel(makePanel(ctx))
        ctx.slots.inject('main', function* () {
          yield ctx.slots.register({ name: 'main', key: 'measure', locale: NS }, Panel)
        })
        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            { name: 'sidebar.panellist', id: 'measure', order: 10, label: () => t('panel'), locale: NS },
            MeasureIcon,
          ),
        )

        // A decoration of the Host `/measure-status` command, never a same-name
        // contribution (a collision with the Host catalog fails loud). The
        // action consumes the trigger and opens the panel without a prompt.
        ctx.effect(() =>
          ctx.commandUi.decorate({
            name: 'measure-status',
            available: () => true,
            ui: {
              kind: 'action',
              run() {
                ctx.layout.selectPanel('measure')
              },
            },
          }),
        )
      },
    }
  },
})
