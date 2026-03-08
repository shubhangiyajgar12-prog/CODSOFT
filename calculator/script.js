const state = {
  current:    '',
  previous:   '',
  operator:   null,
  justEquals: false,
  history:    [],
};

const resultEl     = document.getElementById('result');
const expressionEl = document.getElementById('expression');
const historyList  = document.getElementById('historyList');
const cursor       = document.querySelector('.display-cursor');
const allBtns      = document.querySelectorAll('.btn');

function updateDisplay(value, expression = '') {
  let display = value === '' ? '0' : value;
  if (display.length > 14) {
    const n = parseFloat(display);
    display = isFinite(n) ? n.toExponential(5) : 'Error';
  }
  resultEl.textContent     = display;
  expressionEl.textContent = expression || '\u00a0';
}

function popAnimation() {
  resultEl.classList.remove('pop');
  void resultEl.offsetWidth;
  resultEl.classList.add('pop');
  setTimeout(() => resultEl.classList.remove('pop'), 200);
}

function setCursorActive(on) {
  cursor.classList.toggle('active', on);
}

function inputNumber(digit) {
  if (state.justEquals) {
    state.current = ''; state.previous = '';
    state.operator = null; state.justEquals = false;
  }
  if (state.current === '0' && digit !== '.') {
    state.current = digit;
  } else {
    if (digit === '.' && state.current.includes('.')) return;
    if (state.current.replace('-','').replace('.','').length >= 12) return;
    state.current += digit;
  }
  updateDisplay(state.current, buildExpression());
  setCursorActive(true);
}

function inputOperator(op) {
  if (state.current !== '' && state.previous !== '' && state.operator) {
    calculate(false);
  }
  if (state.current !== '') {
    state.previous = state.current;
    state.current  = '';
  }
  state.operator   = op;
  state.justEquals = false;
  updateDisplay(state.previous, buildExpression());
  highlightOperator(op);
  setCursorActive(false);
}

function calculate(final = true) {
  if (state.previous === '' || state.operator === null) return;
  const b  = state.current !== '' ? state.current : state.previous;
  const fa = parseFloat(state.previous);
  const fb = parseFloat(b);
  let result;
  switch (state.operator) {
    case '+': result = fa + fb; break;
    case '−': result = fa - fb; break;
    case '×': result = fa * fb; break;
    case '÷':
      if (fb === 0) { showError(); return; }
      result = fa / fb; break;
    default: return;
  }
  result = +parseFloat(result.toPrecision(12));
  const expr   = `${state.previous} ${state.operator} ${b} =`;
  const resStr = String(result);
  if (final) {
    addHistory(expr, resStr);
    popAnimation();
    state.previous = ''; state.operator = null;
    state.justEquals = true;
    clearOperatorHighlight();
    setCursorActive(false);
  }
  state.current = resStr;
  updateDisplay(resStr, final ? expr : buildExpression());
}

function clearAll() {
  state.current = ''; state.previous = '';
  state.operator = null; state.justEquals = false;
  updateDisplay('0', '');
  clearOperatorHighlight();
  setCursorActive(false);
  popAnimation();
}

function toggleSign() {
  if (state.current === '' || state.current === '0') return;
  state.current = state.current.startsWith('-')
    ? state.current.slice(1) : '-' + state.current;
  updateDisplay(state.current, buildExpression());
}

function applyPercent() {
  if (state.current === '') return;
  const val  = parseFloat(state.current);
  const base = state.previous !== '' ? parseFloat(state.previous) : 100;
  const result = (val / 100) * (
    state.operator && (state.operator === '+' || state.operator === '−') ? base : 1
  );
  state.current = String(+parseFloat(result.toPrecision(12)));
  updateDisplay(state.current, buildExpression());
}

function buildExpression() {
  if (state.previous !== '' && state.operator) {
    return `${state.previous} ${state.operator}${state.current ? ' ' + state.current : ''}`;
  }
  return '';
}

function showError() {
  resultEl.textContent = 'Error';
  expressionEl.textContent = 'Division by zero';
  state.current = ''; state.previous = '';
  state.operator = null; state.justEquals = true;
  setTimeout(clearAll, 1600);
}

function addHistory(expr, result) {
  state.history.unshift({ expr, result });
  if (state.history.length > 8) state.history.pop();
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = '';
  for (const item of state.history) {
    const li = document.createElement('li');
    li.innerHTML = `${item.expr} <span>${item.result}</span>`;
    historyList.appendChild(li);
  }
}

function highlightOperator(op) {
  clearOperatorHighlight();
  allBtns.forEach(btn => {
    if (btn.dataset.action === 'operator' && btn.dataset.value === op)
      btn.classList.add('active-op');
  });
}
function clearOperatorHighlight() {
  document.querySelectorAll('.btn-op').forEach(b => b.classList.remove('active-op'));
}

function triggerRipple(btn) {
  btn.classList.remove('ripple');
  void btn.offsetWidth;
  btn.classList.add('ripple');
}

allBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    triggerRipple(btn);
    const { action, value } = btn.dataset;
    if      (action === 'number')   inputNumber(value);
    else if (action === 'decimal')  inputNumber('.');
    else if (action === 'operator') inputOperator(value);
    else if (action === 'equals')   calculate(true);
    else if (action === 'clear')    clearAll();
    else if (action === 'sign')     toggleSign();
    else if (action === 'percent')  applyPercent();
  });
});

const keyMap = {
  '0':'0','1':'1','2':'2','3':'3','4':'4',
  '5':'5','6':'6','7':'7','8':'8','9':'9',
  '.':'.', '+':'+', '-':'−', '*':'×', '/':'÷',
  'Enter':'=', '=':'=', 'Backspace':'backspace',
  'Escape':'clear', '%':'percent',
};

document.addEventListener('keydown', e => {
  const mapped = keyMap[e.key];
  if (!mapped) return;
  e.preventDefault();
  if ('0123456789.'.includes(mapped))       inputNumber(mapped);
  else if (['+','−','×','÷'].includes(mapped)) inputOperator(mapped);
  else if (mapped === '=')                   calculate(true);
  else if (mapped === 'clear')               clearAll();
  else if (mapped === 'percent')             applyPercent();
  else if (mapped === 'backspace') {
    if (state.current.length > 0 && !state.justEquals) {
      state.current = state.current.slice(0, -1);
      updateDisplay(state.current || '0', buildExpression());
    }
  }
});

updateDisplay('0');