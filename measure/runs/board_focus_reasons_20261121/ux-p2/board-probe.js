(() => {
  const expected = ['Planned', 'In progress', 'Waits for PM', 'Waits for Daniel', 'Done']
  const repos = [...document.querySelectorAll('section.repo')].map(repo => ({
    repo: repo.dataset.repo,
    columns: [...repo.querySelectorAll('.column')].map(col => ({
      key: col.dataset.column,
      name: col.querySelector('.col-name')?.textContent.replace('▸', '').trim(),
      total: Number(col.querySelector('.col-count')?.textContent),
      visibleCards: col.querySelectorAll('[data-card]').length,
    })),
    header: repo.querySelector('.counts')?.innerText,
  }))
  const cards = [...document.querySelectorAll('[data-card]')].map(card => {
    const reasonNodes = [...card.querySelectorAll('.card-line')]
    const reason = reasonNodes.map(n => n.textContent.trim())
    return {
      repo: card.closest('[data-repo]')?.dataset.repo,
      column: card.closest('[data-column]')?.dataset.column,
      title: card.querySelector('.card-title')?.textContent.trim(),
      task: card.querySelector('.card-task')?.textContent.trim(),
      note: card.querySelector('.card-note')?.textContent.trim(),
      reason,
      comments: card.querySelectorAll('[data-action="open-comment"]').length,
      commentKey: card.querySelector('[data-action="open-comment"]')?.dataset.key,
      stale: !!card.closest('.stale-cards'),
    }
  })
  const open = cards.filter(c => c.column !== 'done')
  const stateOf = reason => reason.match(/^(Waits for PM|Waits for Daniel|Running|Next in line):\s*(.+)$/)
  return {
    at: new Date().toISOString(),
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    repos,
    cards,
    checks: {
      columnOrder: repos.every(r => JSON.stringify(r.columns.map(c => c.name)) === JSON.stringify(expected)),
      onePlainReason: open.every(c => c.reason.length === 1 && !!stateOf(c.reason[0])),
      oldLabelElements: document.querySelectorAll('.line-label').length,
      bareBlockerReasons: open.filter(c => c.reason.some(r => /^Blocker\b/i.test(r))).length,
      commentOnlyOnDaniel: cards.every(c => c.comments === (c.column === 'waiting' ? 1 : 0)),
      waitingCount: repos.reduce((sum,r) => sum+(r.columns.find(c => c.key === 'waiting')?.total ?? 0),0),
      renderedWaiting: cards.filter(c => c.column === 'waiting').length,
      openCards: open.length,
      summary: document.querySelector('.page-summary')?.innerText,
      emptyColumns: [...document.querySelectorAll('.column .empty')].map(x=>x.innerText),
    },
  }
})()
