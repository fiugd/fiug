const deps = ['../shared.styl'];

const initSvcPattern = () => {
    let solution;
    const logIndent = 4;
    const logLeftSideSize = 5;
    let lastScopeId = 0;
    let lastLoggedScopeId = 0;

    const _writeLog = (str) => {
      const output = document.createElement('div');
      document.body.appendChild(output)
      output.innerHTML += `\n${str}`;
    };

    const colors = [
      'green', 'yellow', '#3B8EEA', "magenta",
    ].map(c => (...args) => `<span style="color:${c}">${args}</span>` );
    const style = (id) => {
      return colors[id % colors.length]
    };

    const _log = (type, given, scope, description) => {
      const isUninterruptedSequence = { [given.scopeId]: true, [scope.scopeId]: true }[lastLoggedScopeId];
      if (scope.scopeDepth === given.scopeDepth) var arrow = '↑'.padStart(scope.scopeDepth * logIndent);
      if (scope.scopeDepth < given.scopeDepth) arrow = '↗'.padStart(scope.scopeDepth * logIndent);
      if (scope.scopeDepth > given.scopeDepth) arrow = '↖'.padStart(scope.scopeDepth * logIndent);
      if (!isUninterruptedSequence) arrow = '←'.padEnd(scope.scopeDepth * logIndent, '─');
      if (!scope.scopeParentId) arrow = '→'.padStart(scope.scopeDepth * logIndent);
      lastLoggedScopeId = scope.scopeId;

      //if (type === 'catch') description = chalk.redBright(description);
      //try { description += ` (${_logWatcher(scope)})`; } catch (ignored) { /* do nothing */ }
      const id = String(isUninterruptedSequence && scope.scopeId || given.scopeId || scope.scopeId);

      _writeLog(`${style(id)(id.padStart(logLeftSideSize))} ${style(scope.scopeId)(arrow)} ${description}\n`);

    };
    const _desc = ({ desc, ...scope }, n) =>
       desc[n]
       //desc[n].replace(/${(.+?)}/g, (_, k) => get(scope, k));

    const _wrapClosureAroundNextStep = (prev, prevIndex, _onDone) => (...arg) => {
      let { type, func, desc, methodOpts, scopeDepth = -1, scopeId = ++lastScopeId } = prev;
      const error = arg.find((a, i) => a instanceof Error && arg.splice(i, 1));
      const given = Object.assign({ scopeDepth }, ...arg);

      // transfer scope
      const isFirstStep = prevIndex === -1;
      if (isFirstStep) scopeDepth = given.scopeDepth + 1;
      if (isFirstStep) methodOpts = arg.find(a => a.Model);
      const scopeParentId = isFirstStep ? given.scopeId : scopeId;
      if (isFirstStep && style(scopeId) === style(given.scopeId)) scopeId = ++lastScopeId;
      if (isFirstStep && style(scopeId) === style(lastLoggedScopeId)) scopeId = ++lastScopeId;
      const scope = { ...prev, ...given, ...methodOpts, methodOpts, type, func, desc, error, scopeDepth, scopeId, scopeParentId };

      // determine next step
      if (isFirstStep) _onDone = arg.find(o => typeof o === 'function') || _onDone;
      const index = type.indexOf(error ? 'catch' : 'step', prevIndex + 1);
      const nextStep = _wrapClosureAroundNextStep(scope, index, _onDone);

      // handle errors
      if (error && type[prevIndex] === 'step') error.message = `couldn't ${_desc(scope, prevIndex)} : ${error.message}`;
      if (typeof func[index] !== 'function') return void _onDone(error, ...arg, { scopeDepth, scopeId });

      // execute step function
      _log(type[index], given, scope, _desc(scope, index));
      try { return func[index](scope, nextStep, ...arg); } catch (e) { return nextStep(error || e, ...arg); }
    };

    window.Solution = (desc, func) => {
      solution = {};
      solution.desc = [desc];
      solution.func = [func];
      solution.type = ['step'];
      const onDone = error => error && console.log(error.stack);
      return _wrapClosureAroundNextStep(solution, -1, onDone);
    };

    window.Step = (desc, func) => {
      solution.func.push(func);
      solution.desc.push(desc);
      solution.type.push('step');
    };
}

(async () => {

  await appendUrls(deps);
  initSvcPattern();

  const doThing = Solution('do a bunch of cool things', (context, next) => { next(); });
  
  Step('do one thing', (context, next) => { next(); });
  Step('do two thing', (context, next) => { next(); });
  Step('do three thing', (context, next) => { next(); });

  doThing();
  doThing();
  doThing();
  doThing();
  doThing();
  doThing();

})()
