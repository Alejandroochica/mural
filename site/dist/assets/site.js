(() => {
  const headline = document.querySelector('#headline');
  const language = document.querySelector('#headline-language');
  const toggle = document.querySelector('#motion-toggle');
  if (!headline || !language || !toggle) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const versions = [
    {lang:'en', name:'English', lines:['The language app','you eventually delete']},
    {lang:'es', name:'Español', lines:['La app de idiomas','que acabarás borrando']},
    {lang:'fr', name:'Français', lines:['L’appli de langues','que vous finirez par supprimer']},
    {lang:'de', name:'Deutsch', lines:['Die Sprachlern-App,','die du irgendwann löschst']},
    {lang:'pt', name:'Português', lines:['A app de línguas','que um dia vais apagar']},
    {lang:'ja', name:'日本語', lines:['いつか削除する、','語学学習アプリ']}
  ];
  let index = 0, paused = reduced.matches, timer, transition;
  function stop() { clearTimeout(timer); clearTimeout(transition); headline.classList.remove('changing'); }
  function schedule() {
    stop();
    if (paused || document.hidden) return;
    timer = setTimeout(() => {
      headline.classList.add('changing');
      transition = setTimeout(() => {
        index = (index + 1) % versions.length;
        const next = versions[index];
        headline.querySelector('span').textContent = next.lines[0];
        headline.querySelector('em').textContent = next.lines[1];
        headline.lang = next.lang; language.textContent = next.name;
        headline.classList.remove('changing');
        schedule();
      }, 450);
    }, index === 0 ? 8500 : 7000);
  }
  function reflect() {
    document.body.classList.toggle('motion-paused', paused);
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? 'Play headline and background animations' : 'Pause headline and background animations');
    toggle.innerHTML = paused ? '<svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12"><path d="m4 2 6 4-6 4Z" fill="currentColor"/></svg>' : '<svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12"><path d="M4 2v8M8 2v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    schedule();
  }
  toggle.addEventListener('click', () => { paused = !paused; reflect(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; reflect(); });
  document.addEventListener('visibilitychange', schedule);
  reflect();
})();
