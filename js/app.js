/* js/app.js */

const toggle = document.getElementById('toggle');
const ripple = document.getElementById('ripple');
const maskCircle = document.getElementById('maskCircle');
const raysGroup = document.getElementById('raysGroup');
const craters = document.getElementById('craters');
const body = document.body;

let isDark = false;
toggle.addEventListener('click', () => {
  const rect = toggle.getBoundingClientRect();
  ripple.style.left = `${rect.left + rect.width/2}px`;
  ripple.style.top = `${rect.top + rect.height/2}px`;
  ripple.classList.add('expand');
  toggle.classList.toggle('rotate');

  setTimeout(() => {
    isDark = !isDark;
    if(isDark) {
      body.classList.add('dark');
      maskCircle.animate([{cx: 30}, {cx: 10}], {duration: 500, fill: 'forwards'});
      raysGroup.classList.remove('visible'); raysGroup.classList.add('hidden');
      craters.classList.add('visible');
    } else {
      body.classList.remove('dark');
      maskCircle.animate([{cx: 10}, {cx: 30}], {duration: 500, fill: 'forwards'});
      raysGroup.classList.remove('hidden'); raysGroup.classList.add('visible');
      craters.classList.remove('visible');
    }
  }, 300);

  setTimeout(() => ripple.classList.remove('expand'), 800);
});

const PRESETS = [['#ffffff', '#f4f4f5'], ['#fee2e2', '#ffedd5'], ['#dbeafe', '#eff6ff'], ['#f3e8ff', '#fae8ff'], ['#d1fae5', '#ecfccb'], ['#18181b', '#27272a'], ['#fff1eb', '#ace0f9'], ['#ff9a9e', '#fecfef']];
const QUICK_PALETTE = ['#222222', '#e5e5e5', '#ef4444', '#f59e0b', '#84cc16', '#06b6d4', '#3b82f6', '#8b5cf6'];

const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const wd = ["ПН","ВТ","СР","ЧТ","ПТ","СБ","ВС"];

const state = {
   layout: 'standard',
   year: 2025,
   paper: {
       size: 'a4',
       orientation: 'landscape' 
   },
   images: Array(12).fill(null),
   holidays: [],
   bg: { mode: 'solid', c1: '#ffffff', c2: '#e4e4e7', angle: 135 },
   title: { mode: 'solid', c1: '#111111', c2: '#555555', angle: 90 },

   // ГРАДИЕНТЫ ДЛЯ ПАЧЕК (ТРИО)
   trioTop: { mode: 'solid', c1: '#ffffff', c2: '#f3f4f6', angle: 90 },
   trioMid: { mode: 'solid', c1: '#ffffff', c2: '#f3f4f6', angle: 90 },
   trioBot: { mode: 'solid', c1: '#ffffff', c2: '#f3f4f6', angle: 90 },
   
   imgTransforms: { scale: 1, rotate: 0, x: 0, y: 0, bg: '#f3f4f6', split: 50 },
   
   // Базовые настройки текста
   textOverlay: {
       content: '', x: 50, y: 50, font: "'Inter', sans-serif", size: 40,
       color: '#ffffff', bold: false, italic: false, vertical: false, angle: 0,
       strokeColor: '#000000', strokeWidth: 0
   },
   selection: new Set(),
   lastSelected: null,
   overrides: {} 
};

window.updatePaperSettings = () => {
    const size = document.getElementById('sel-paper-size').value;
    state.paper.size = size;
    render();
};

window.setOrientation = (orient) => {
    state.paper.orientation = orient;
    const btnP = document.getElementById('btn-orient-port');
    const btnL = document.getElementById('btn-orient-land');
    
    if(orient === 'portrait') {
        btnP.style.background = 'var(--accent)'; btnP.style.color = '#fff'; btnP.style.border = 'none';
        btnL.style.background = 'var(--sidebar-bg)'; btnL.style.color = 'var(--ui-text)'; btnL.style.border = '1px solid var(--ui-border)';
    } else {
        btnL.style.background = 'var(--accent)'; btnL.style.color = '#fff'; btnL.style.border = 'none';
        btnP.style.background = 'var(--sidebar-bg)'; btnP.style.color = 'var(--ui-text)'; btnP.style.border = '1px solid var(--ui-border)';
    }
    render();
};

function toggleSelectAll() {
    state.selection.clear();
    state.lastSelected = null;
    renderSelectionVisuals();
    syncInputs();
}

function handleSelection(index, e) {
    const isCtrl = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;

    if (isShift && state.lastSelected !== null) {
        const start = Math.min(state.lastSelected, index);
        const end = Math.max(state.lastSelected, index);
        for (let i = start; i <= end; i++) { state.selection.add(i); }
    } else if (isCtrl) {
        if (state.selection.has(index)) state.selection.delete(index);
        else { state.selection.add(index); state.lastSelected = index; }
    } else {
        state.selection.clear(); state.selection.add(index); state.lastSelected = index;
    }
    renderSelectionVisuals(); syncInputs();
}
window.handleSelection = handleSelection;

function renderSelectionVisuals() {
    const isAll = state.selection.size === 0;
    const btnAll = document.getElementById('btn-all');
    const statusText = document.getElementById('status-text');

    if (isAll) {
        btnAll.classList.add('active');
        statusText.textContent = `Редактируем весь ${state.year} год`;
    } else {
        btnAll.classList.remove('active');
        const sorted = Array.from(state.selection).sort((a,b)=>a-b);
        const names = sorted.map(i => months[i]);
        
        // Для Трио индексы 0, 1, 2 - это Шапка и Разделители
        if (state.layout === 'trio') {
             const trioNames = ["Шапка", "Разделитель 1", "Разделитель 2"];
             const selectedTrio = sorted.map(i => trioNames[i] || i);
             statusText.textContent = selectedTrio.join(', ');
        } else {
             if(names.length <= 3) statusText.textContent = names.join(', ');
             else statusText.textContent = `Выбрано месяцев: ${names.length}`;
        }
    }

    // Подсветка для Стандарта/Планера
    document.querySelectorAll('.card-container-outer').forEach((el, idx) => {
        if (state.selection.has(idx)) el.classList.add('selected');
        else el.classList.remove('selected');
    });
    
    // Подсветка для Трио
    document.querySelectorAll('.trio-separator-wrapper').forEach((el, idx) => {
         // Для Трио индексы 0, 1, 2 соответствуют элементам
         // Но так как querySelectorAll возвращает их по порядку в DOM,
         // и у нас 3 разделителя, можно использовать idx.
         if (state.selection.has(idx)) el.classList.add('selected');
         else el.classList.remove('selected');
    });
}

window.selectTemplate = (layoutType) => {
    state.layout = layoutType;

    document.querySelectorAll('.template-card').forEach(el => el.classList.remove('active'));
    
    const cards = document.querySelectorAll('.template-card');
    if(layoutType === 'standard' && cards[0]) cards[0].classList.add('active');
    if(layoutType === 'planner' && cards[1]) cards[1].classList.add('active');
    if(layoutType === 'trio' && cards[2]) cards[2].classList.add('active');

    const orientControl = document.getElementById('control-orientation');
    const splitControl = document.getElementById('control-split');
    const trioPrintControl = document.getElementById('control-trio-print'); 
    
    const trioBgCtrl = document.getElementById('trio-bg-controls');

    if(layoutType === 'planner') {
        if(orientControl) orientControl.style.display = 'none';
        if(splitControl) splitControl.style.display = 'none';
        
        if(trioPrintControl) trioPrintControl.style.display = 'none';
        if(trioBgCtrl) trioBgCtrl.style.display = 'none';
        
        state.paper.orientation = 'portrait';
    } 
    else if (layoutType === 'trio') {
        if(orientControl) orientControl.style.display = 'none';
        if(splitControl) splitControl.style.display = 'none';
        
        // Показываем настройки Трио
        if(trioPrintControl) trioPrintControl.style.display = 'block';
        if(trioBgCtrl) trioBgCtrl.style.display = 'block'; 
        
        setTrioPrintMode('blocks');
    } 
    else {
        if(orientControl) orientControl.style.display = 'block';
        if(splitControl) splitControl.style.display = 'block';
        
        if(trioPrintControl) trioPrintControl.style.display = 'none';
        if(trioBgCtrl) trioBgCtrl.style.display = 'none';
    }

    switchTab('design');
    render();
};

window.setTrioPrintMode = (mode) => {
    document.body.classList.remove('print-mode-blocks', 'print-mode-separators');
    if(mode === 'blocks') document.body.classList.add('print-mode-blocks');
    else if (mode === 'separators') document.body.classList.add('print-mode-separators');
};

function getImgConfig(mIndex) {
    if (state.overrides[mIndex] && state.overrides[mIndex].imgTransforms) {
        return { ...state.imgTransforms, ...state.overrides[mIndex].imgTransforms };
    }
    return state.imgTransforms;
}

window.updateImgTransform = (prop, delta) => {
    const inp = document.getElementById(`inp-img-${prop}`);
    if(inp) {
        let val = parseFloat(inp.value) || 0;
        val = parseFloat((val + delta).toFixed(2));
        if(prop === 'scale') { if(val < 0.5) val = 0.5; if(val > 3) val = 3; }
        inp.value = val;
        applyImgTransform();
        const rng = document.getElementById(`rng-img-${prop}`);
        if(rng) rng.value = val;
    }
};

window.applyImgTransform = () => {
    const scale = parseFloat(document.getElementById('inp-img-scale').value) || 1;
    const rotate = parseFloat(document.getElementById('inp-img-rotate').value) || 0;
    const x = parseFloat(document.getElementById('rng-img-x').value) || 0;
    const y = parseFloat(document.getElementById('rng-img-y').value) || 0;
    const split = parseFloat(document.getElementById('inp-img-split').value) || 50;
    const bgInput = document.getElementById('picker-img-bg-input');
    const bg = bgInput ? bgInput.value : '#f3f4f6';
    
    const newTransform = { scale, rotate, x, y, split, bg };

    const isAll = state.selection.size === 0;
    if(isAll) state.imgTransforms = newTransform;
    else {
        state.selection.forEach(idx => {
            if(!state.overrides[idx]) state.overrides[idx] = {};
            state.overrides[idx].imgTransforms = newTransform;
        });
    }
    renderImgTransforms();
};

function renderImgTransforms() {
    for(let m=0; m<12; m++) {
        // Поддержка ТРИО
        if(state.layout === 'trio') {
            const sep = document.getElementById(`trio-img-${m}`);
            if(sep) {
                const layer = sep.querySelector('.img-layer');
                if(layer) {
                     const config = getImgConfig(m);
                     layer.style.transform = `scale(${config.scale}) rotate(${config.rotate}deg) translate(${config.x}%, ${config.y}%)`;
                     layer.style.backgroundColor = config.bg;
                }
            }
            // В режиме трио не прерываем, так как могут быть и другие элементы, но в данном случае достаточно
            if(m > 2) continue; 
            continue;
        }

        const card = document.getElementById(`card-${m}`);
        if(!card) continue;
        const imgContainer = card.querySelector('.card-img');
        const imgLayer = card.querySelector('.img-layer');
        const cardBody = card.querySelector('.card-body');
        if(!imgLayer) continue;
        const config = getImgConfig(m);
        imgLayer.style.transform = `scale(${config.scale}) rotate(${config.rotate}deg) translate(${config.x}%, ${config.y}%)`;
        imgContainer.style.backgroundColor = config.bg;
        
        if (state.layout === 'planner') {
             imgContainer.style.height = config.split + '%'; imgContainer.style.width = '100%';
             cardBody.style.height = (100 - config.split) + '%'; cardBody.style.width = '100%';
        } else if (state.layout === 'standard') {
            if (state.paper.orientation === 'portrait') {
                imgContainer.style.height = config.split + '%'; imgContainer.style.width = '100%';
                cardBody.style.height = (100 - config.split) + '%'; cardBody.style.width = '100%';
            } else {
                imgContainer.style.width = config.split + '%'; imgContainer.style.height = '100%';
                cardBody.style.width = (100 - config.split) + '%'; cardBody.style.height = '100%';
            }
        }
    }
}

function getOverlayConfig(mIndex) {
    if (state.overrides[mIndex] && state.overrides[mIndex].textOverlay) return { ...state.textOverlay, ...state.overrides[mIndex].textOverlay };
    return state.textOverlay;
}

function updateOverlayProperty(prop, value) {
    const isAll = state.selection.size === 0;
    if (isAll) state.textOverlay[prop] = value;
    else {
        state.selection.forEach(idx => {
            if(!state.overrides[idx]) state.overrides[idx] = {};
            if(!state.overrides[idx].textOverlay) state.overrides[idx].textOverlay = {};
            state.overrides[idx].textOverlay[prop] = value;
        });
    }
    renderTextOverlays(); 
}
window.updateOverlayProperty = updateOverlayProperty;

function syncInputs() {
    let textConfig, imgConfig;
    if (state.selection.size === 0) {
        textConfig = state.textOverlay; imgConfig = state.imgTransforms;
    } else {
        const firstIdx = Array.from(state.selection)[0];
        textConfig = getOverlayConfig(firstIdx); imgConfig = getImgConfig(firstIdx);
    }
    document.getElementById('inp-overlay-text').value = textConfig.content || '';
    document.getElementById('sel-font-overlay').value = textConfig.font;
    document.getElementById('inp-overlay-size').value = textConfig.size;
    document.getElementById('inp-overlay-angle').value = textConfig.angle;
    document.getElementById('chk-overlay-vertical').checked = textConfig.vertical;
    document.getElementById('chk-overlay-bold').checked = textConfig.bold;
    document.getElementById('chk-overlay-italic').checked = textConfig.italic;
    document.getElementById('inp-overlay-stroke-w').value = textConfig.strokeWidth;
    setPickerColor('picker-overlay-color', textConfig.color, null, true);
    setPickerColor('picker-overlay-stroke', textConfig.strokeColor, null, true);

    document.getElementById('inp-img-scale').value = imgConfig.scale;
    document.getElementById('rng-img-scale').value = imgConfig.scale;
    document.getElementById('inp-img-rotate').value = imgConfig.rotate;
    document.getElementById('rng-img-x').value = imgConfig.x;
    document.getElementById('rng-img-y').value = imgConfig.y;
    document.getElementById('inp-img-split').value = imgConfig.split;
    document.getElementById('rng-img-split').value = imgConfig.split;
    setPickerColor('picker-img-bg', imgConfig.bg, null, true, false, true); 
}

window.stepInput = (id, delta, isAngle = false, propOverride = null) => {
    const inp = document.getElementById(id);
    let val = parseFloat(inp.value) || 0;
    val += delta;
    if(!isAngle && val < 0) val = 0;
    inp.value = val;
    if(propOverride) updateOverlayProperty(propOverride, val);
    else if(id === 'inp-overlay-size') updateOverlayProperty('size', val);
    else if(id === 'inp-overlay-angle') updateOverlayProperty('angle', val);
};

// --- УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ОТРИСОВКИ ТЕКСТА ---
function renderTextOverlays() {
    // Цикл 0..11 покрывает и месяцы календаря, и 3 блока Трио
    for(let m=0; m<12; m++) {
        let imgContainer = null;
        
        // 1. Проверяем обычные календари
        const card = document.getElementById(`card-${m}`);
        if(card) {
            imgContainer = card.querySelector('.card-img');
        }
        // 2. Проверяем Трио
        else {
            const trioImg = document.getElementById(`trio-img-${m}`);
            if(trioImg) imgContainer = trioImg;
        }

        if(!imgContainer) continue;

        let overlayEl = imgContainer.querySelector('.overlay-text');
        const config = getOverlayConfig(m);
        
        // Если текста нет - удаляем и идем дальше
        if (!config.content) { if (overlayEl) overlayEl.remove(); continue; }
        
        // Создаем элемент, если его нет
        if (!overlayEl) {
            overlayEl = document.createElement('div');
            overlayEl.className = 'overlay-text';
            overlayEl.onmousedown = (e) => handleTextDrag(e, m, overlayEl);
            imgContainer.appendChild(overlayEl);
        }
        
        // Применяем стили
        overlayEl.textContent = config.content;
        overlayEl.style.left = config.x + '%'; overlayEl.style.top = config.y + '%';
        overlayEl.style.fontFamily = config.font; overlayEl.style.fontSize = config.size + 'px';
        overlayEl.style.color = config.color; overlayEl.style.fontWeight = config.bold ? '700' : '400';
        overlayEl.style.fontStyle = config.italic ? 'italic' : 'normal';
        overlayEl.style.transform = `translate(-50%, -50%) rotate(${config.angle}deg)`;
        
        if(config.vertical) { overlayEl.style.writingMode = 'vertical-rl'; overlayEl.style.textOrientation = 'upright'; } 
        else { overlayEl.style.writingMode = 'horizontal-tb'; overlayEl.style.textOrientation = 'mixed'; }
        
        if (config.strokeWidth > 0) overlayEl.style.webkitTextStroke = `${config.strokeWidth}px ${config.strokeColor}`;
        else overlayEl.style.webkitTextStroke = '0';
    }
}
window.renderTextOverlays = renderTextOverlays;

function handleTextDrag(e, mIndex, el) {
    e.stopPropagation(); e.preventDefault();
    el.classList.add('is-dragging');
    const container = el.parentElement; const rect = container.getBoundingClientRect();
    const onMove = (moveEvent) => {
        const x = moveEvent.clientX - rect.left; const y = moveEvent.clientY - rect.top;
        el.style.left = (x / rect.width) * 100 + '%'; el.style.top = (y / rect.height) * 100 + '%';
    };
    const onUp = (upEvent) => {
        el.classList.remove('is-dragging');
        document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp);
        const x = upEvent.clientX - rect.left; const y = upEvent.clientY - rect.top;
        const currentConfig = getOverlayConfig(mIndex);
        if(!state.overrides[mIndex]) state.overrides[mIndex] = {};
        state.overrides[mIndex].textOverlay = { ...currentConfig, x: (x/rect.width)*100, y: (y/rect.height)*100 };
    };
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
}

function updateStyleState(cssVar, value) {
    const isAll = state.selection.size === 0;
    if (isAll) document.documentElement.style.setProperty(cssVar, value);
    else {
        state.selection.forEach(idx => {
            if(!state.overrides[idx]) state.overrides[idx] = {};
            state.overrides[idx][cssVar] = value;
            const card = document.getElementById(`card-${idx}`);
            if(card) card.style.setProperty(cssVar, value);
        });
    }
}

function renderSimplePicker(containerId, cssVar, initialColor, isOverlay = false, isImgBg = false) {
    const container = document.getElementById(containerId);
    let html = `<div class="color-row"><div class="main-color-btn" style="background:${initialColor}" id="${containerId}-main"><input type="color" value="${initialColor}" id="${containerId}-input"></div><div class="palette-swatches">${QUICK_PALETTE.map(c => `<div class="swatch" style="background:${c}" onclick="setPickerColor('${containerId}', '${c}', '${cssVar}', true, ${isOverlay}, ${isImgBg})"></div>`).join('')}</div></div>`;
    container.innerHTML = html;
    const inp = document.getElementById(`${containerId}-input`);
    inp.addEventListener('input', (e) => { setPickerColor(containerId, e.target.value, cssVar, false, isOverlay, isImgBg); });
}

window.setPickerColor = (containerId, color, cssVar, updateInput = true, isOverlay = false, isImgBg = false) => {
    const mainBtn = document.getElementById(`${containerId}-main`);
    if(mainBtn) mainBtn.style.background = color;
    if(updateInput) { const inp = document.getElementById(`${containerId}-input`); if(inp) inp.value = color; }
    if (isOverlay) {
         if(containerId === 'picker-overlay-color') updateOverlayProperty('color', color);
         if(containerId === 'picker-overlay-stroke') updateOverlayProperty('strokeColor', color);
    } else if (isImgBg) applyImgTransform();
    else if (cssVar) updateStyleState(cssVar, color);
};

renderSimplePicker('picker-grid', '--col-grid', '#e5e5e5');
renderSimplePicker('picker-bg-day', '--cal-bg-day', 'transparent'); 
renderSimplePicker('picker-text', '--col-text', '#222222');
renderSimplePicker('picker-weekend', '--col-weekend', '#ef4444');
renderSimplePicker('picker-holiday', '--col-holiday', '#f59e0b');
renderSimplePicker('picker-bg-weekend', '--bg-weekend', 'transparent');
renderSimplePicker('picker-bg-holiday', '--bg-holiday', 'transparent');
renderSimplePicker('picker-overlay-color', null, '#ffffff', true);
renderSimplePicker('picker-overlay-stroke', null, '#000000', true);
renderSimplePicker('picker-img-bg', null, '#f3f4f6', false, true);

// --- ИНИЦИАЛИЗАЦИЯ ГРАДИЕНТОВ ТРИО ---
renderGrad('trio-top-editor', 'trioTop', '--trio-bg-top');
renderGrad('trio-mid-editor', 'trioMid', '--trio-bg-mid');
renderGrad('trio-bot-editor', 'trioBot', '--trio-bg-bot');

// --- ГРАДИЕНТЫ ---
window.setMode = (key, mode, id, cssVar, isText) => { state[key].mode = mode; updateGrad(key, id, cssVar, isText); renderGrad(id, key, cssVar, isText); };
window.setColor = (key, param, val, id, cssVar, isText) => { state[key][param] = val; updateGrad(key, id, cssVar, isText); };
window.setAngle = (key, val, id, cssVar, isText) => { state[key].angle = val; updateGrad(key, id, cssVar, isText); const container = document.getElementById(id); if (container) { const input = container.querySelector('.angle-input'); if (input && input.value != val) input.value = val; } };
window.changeAngle = (key, delta, id, cssVar, isText) => { let currentAngle = parseInt(state[key].angle); if (isNaN(currentAngle)) currentAngle = 90; setAngle(key, currentAngle + delta, id, cssVar, isText); };
window.setPreset = (key, c1, c2, id, cssVar, isText) => { state[key].c1 = c1; state[key].c2 = c2; updateGrad(key, id, cssVar, isText); renderGrad(id, key, cssVar, isText); };

function updateGrad(key, id, cssVar, isText) {
   const s = state[key];
   const val = s.mode === 'solid' ? s.c1 : `linear-gradient(${s.angle}deg, ${s.c1}, ${s.c2})`;
   const wrapC1 = document.querySelector(`#${id} .c1-display`);
   const wrapC2 = document.querySelector(`#${id} .c2-display`);
   if(wrapC1) wrapC1.style.background = s.c1;
   if(wrapC2) wrapC2.style.background = s.c2;
   const c2Row = document.querySelector(`#${id} .c2-row`);
   if(c2Row) c2Row.style.display = s.mode === 'solid' ? 'none' : 'flex';
   updateStyleState(cssVar, val);
   
   if(isText) {
      const selector = state.selection.size === 0 
          ? '.m-name, .ph-month, .trio-m-name, .tb-month' 
          : Array.from(state.selection).map(i => `#card-${i} .m-name, #card-${i} .ph-month, #card-${i} .trio-m-name, #card-${i} .tb-month`).join(',');
      document.querySelectorAll(selector).forEach(el => {
         if(s.mode === 'gradient') { el.classList.add('text-gradient'); el.classList.remove('text-solid'); }
         else { el.classList.add('text-solid'); el.classList.remove('text-gradient'); }
      });
   }
}

function renderGrad(id, key, cssVar, isText = false) {
   const s = state[key];
   document.getElementById(id).innerHTML = `<div class="grad-top-row"><div class="grad-mode-switch"><button class="grad-mode-btn ${s.mode==='solid'?'active':''}" onclick="setMode('${key}', 'solid', '${id}', '${cssVar}', ${isText})">Сплошной</button><button class="grad-mode-btn ${s.mode==='gradient'?'active':''}" onclick="setMode('${key}', 'gradient', '${id}', '${cssVar}', ${isText})">Градиент</button></div>${s.mode==='gradient' ? `<div class="angle-control-wrap"><button class="btn-angle" onclick="changeAngle('${key}', -10, '${id}', '${cssVar}', ${isText})">–</button><span class="angle-icon">∠</span><input type="number" class="angle-input" value="${s.angle}" onchange="setAngle('${key}', this.value, '${id}', '${cssVar}', ${isText})"><button class="btn-angle" onclick="changeAngle('${key}', 10, '${id}', '${cssVar}', ${isText})">+</button></div>` : ''}</div><div class="color-row"><div class="main-color-btn" style="background:${s.c1}"><div class="c1-display" style="width:100%;height:100%"></div><input type="color" value="${s.c1}" oninput="setColor('${key}', 'c1', this.value, '${id}', '${cssVar}', ${isText})"></div><div class="palette-swatches">${PRESETS.map(p => `<div class="swatch" style="background:${p[0]}" onclick="setColor('${key}', 'c1', '${p[0]}', '${id}', '${cssVar}', ${isText})"></div>`).join('')}</div></div><div class="color-row c2-row" style="display:${s.mode==='solid'?'none':'flex'}"><div class="main-color-btn" style="background:${s.c2}"><div class="c2-display" style="width:100%;height:100%"></div><input type="color" value="${s.c2}" oninput="setColor('${key}', 'c2', this.value, '${id}', '${cssVar}', ${isText})"></div><div class="palette-swatches">${PRESETS.map(p => `<div class="swatch" style="background:${p[1]}" onclick="setColor('${key}', 'c2', '${p[1]}', '${id}', '${cssVar}', ${isText})"></div>`).join('')}</div></div>`;
}

renderGrad('bg-editor', 'bg', '--cal-bg');
renderGrad('title-editor', 'title', '--title-color', true);

// --- EVENT LISTENERS ---
document.getElementById('sel-font-title').onchange = e => updateStyleState('--font-title', e.target.value);
document.getElementById('sel-font-grid').onchange = e => updateStyleState('--font-grid', e.target.value);
document.getElementById('rng-radius').oninput = e => updateStyleState('--cal-radius', e.target.value + 'px');
document.getElementById('chk-substrate').onchange = e => document.querySelectorAll('.card-container-outer').forEach(el => e.target.checked ? el.classList.add('show-substrate') : el.classList.remove('show-substrate'));
document.getElementById('chk-holes').onchange = e => {
    const val = e.target.checked ? 'calc(24px + 7mm)' : '24px';
    updateStyleState('--body-pad-top', val);
};

document.getElementById('inp-overlay-text').oninput = e => updateOverlayProperty('content', e.target.value);
document.getElementById('sel-font-overlay').onchange = e => updateOverlayProperty('font', e.target.value);
document.getElementById('inp-overlay-size').oninput = e => updateOverlayProperty('size', e.target.value);
document.getElementById('inp-overlay-stroke-w').oninput = e => updateOverlayProperty('strokeWidth', e.target.value);
document.getElementById('chk-overlay-bold').onchange = e => updateOverlayProperty('bold', e.target.checked);
document.getElementById('chk-overlay-italic').onchange = e => updateOverlayProperty('italic', e.target.checked);
document.getElementById('chk-overlay-vertical').onchange = e => updateOverlayProperty('vertical', e.target.checked);

document.getElementById('inp-year').oninput = e => { state.year = e.target.value; render(); };
document.getElementById('inp-holidays').oninput = render;
document.getElementById('sel-grid-style').onchange = render;
document.getElementById('chk-legend').onchange = render;
document.getElementById('chk-list').onchange = render;

window.switchTab = (tab) => {
   document.querySelectorAll('.panel-section').forEach(p => p.style.display = 'none');
   document.getElementById('tab-'+tab).style.display = 'block';
   document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
   event.target.classList.add('active');
};

function parseHolidays() {
   state.holidays = [];
   document.getElementById('inp-holidays').value.split('\n').forEach(l => {
      const m = l.match(/^(\d{1,2})\.(\d{1,2})\s+(.+)?$/);
      if(m) state.holidays.push({d:parseInt(m[1]), m:parseInt(m[2]), name: m[3] || ''});
   });
}

function renderStandard() {
   const root = document.getElementById('calendar-root');
   root.innerHTML = '';
   root.className = `cards-wrapper paper-${state.paper.size} orient-${state.paper.orientation}`;

   const gridStyle = document.getElementById('sel-grid-style').value;
   const showLegend = document.getElementById('chk-legend').checked;
   const showList = document.getElementById('chk-list').checked;
   const showSubstrate = document.getElementById('chk-substrate').checked;

   for(let m=0; m<12; m++) {
      const date = new Date(state.year, m, 1);
      const daysInMonth = new Date(state.year, m+1, 0).getDate();
      let skip = date.getDay() === 0 ? 6 : date.getDay() - 1;

      const wrapper = document.createElement('div');
      wrapper.className = 'card-container-outer' + (showSubstrate ? ' show-substrate' : '');
      if(state.selection.has(m)) wrapper.classList.add('selected');
      
      wrapper.innerHTML = `<div class="substrate-layer">${state.paper.size.toUpperCase()} ${state.paper.orientation}</div>`;

      const card = document.createElement('div');
      card.className = 'card';
      card.id = `card-${m}`;
      
      card.onclick = (e) => {
         if(e.target.closest('.btn-up') || e.target.closest('.overlay-text')) return;
         handleSelection(m, e); 
      };

      if(state.overrides[m]) {
          Object.entries(state.overrides[m]).forEach(([prop, val]) => {
              if(prop !== 'textOverlay' && prop !== 'imgTransforms') card.style.setProperty(prop, val);
          });
      }

      const imgContainer = document.createElement('div');
      imgContainer.className = 'card-img';
      
      const imgLayer = document.createElement('div');
      imgLayer.className = 'img-layer';
      if(state.images[m]) {
          imgLayer.style.backgroundImage = `url(${state.images[m]})`;
      }
      
      const imgConfig = getImgConfig(m);
      imgLayer.style.transform = `scale(${imgConfig.scale}) rotate(${imgConfig.rotate}deg) translate(${imgConfig.x}%, ${imgConfig.y}%)`;
      imgContainer.style.backgroundColor = imgConfig.bg;

      if (state.paper.orientation === 'portrait') {
          imgContainer.style.height = imgConfig.split + '%';
          imgContainer.style.width = '100%';
      } else {
          imgContainer.style.width = imgConfig.split + '%';
          imgContainer.style.height = '100%';
      }

      imgContainer.appendChild(imgLayer);
      
      const overlayDiv = document.createElement('div');
      overlayDiv.className = 'img-overlay';
      overlayDiv.innerHTML = `<span class="btn-up">Сменить</span>`;
      overlayDiv.onclick = () => upSingle(m);
      imgContainer.appendChild(overlayDiv);
      
      imgContainer.ondragover = (e) => { e.preventDefault(); imgContainer.classList.add('drag-over'); };
      imgContainer.ondragleave = (e) => { e.preventDefault(); imgContainer.classList.remove('drag-over'); };
      imgContainer.ondrop = (e) => {
          e.preventDefault(); imgContainer.classList.remove('drag-over');
          const file = e.dataTransfer.files[0];
          if(file && file.type.startsWith('image/')) {
              const reader = new FileReader();
              reader.onload = (ev) => { 
                  state.images[m] = ev.target.result; 
                  imgLayer.style.backgroundImage = `url(${ev.target.result})`; 
              };
              reader.readAsDataURL(file);
          }
      };


      const body = document.createElement('div');
      body.className = 'card-body';
      
      if (state.paper.orientation === 'portrait') {
          body.style.height = (100 - imgConfig.split) + '%';
          body.style.width = '100%';
      } else {
          body.style.width = (100 - imgConfig.split) + '%';
          body.style.height = '100%';
      }
      
      const head = document.createElement('div');
      head.className = 'month-header font-title';
      const isGrad = state.title.mode === 'gradient';
      head.innerHTML = `<span class="m-name ${isGrad?'text-gradient':'text-solid'}">${months[m]}</span><span class="m-year">${state.year}</span>`;

      const gHead = document.createElement('div');
      gHead.className = 'grid-header font-grid';
      wd.forEach(d => gHead.innerHTML += `<div class="d-name">${d}</div>`);

      const grid = document.createElement('div');
      grid.className = `grid-days font-grid ${gridStyle}`;
      for(let i=0; i<skip; i++) grid.innerHTML += '<div></div>';
      
      for(let d=1; d<=daysInMonth; d++) {
         const dow = (skip+d-1)%7;
         const hol = state.holidays.find(h => h.d===d && h.m===m+1);
         let cls = 'day';
         if(hol) cls += ' holiday'; 
         else if(dow>4) cls += ' weekend';
         grid.innerHTML += `<div class="${cls}">${d}</div>`;
      }
      body.append(head, gHead, grid);

      if (showLegend || (showList)) {
          const footer = document.createElement('div');
          footer.className = 'card-footer';
          if(showLegend) footer.innerHTML += `<div class="legend"><div class="legend-item"><div class="dot" style="background:var(--col-weekend)"></div><span>Выходные</span></div><div class="legend-item"><div class="dot" style="background:var(--col-holiday)"></div><span>Праздники</span></div></div>`;
          if(showList) {
             let html = '<div class="holiday-list">';
             const mHolidays = state.holidays.filter(h => h.m===m+1);
             if(mHolidays.length > 0) {
                 mHolidays.forEach(h => html += `<div class="h-item"><span>${h.d}.${String(m+1).padStart(2,'0')}</span> — ${h.name}</div>`);
                 footer.innerHTML += html + '</div>';
                 body.appendChild(footer);
             } else if (showLegend) {
                 body.appendChild(footer);
             }
          }
      }
      card.append(imgContainer, body);
      wrapper.appendChild(card);
      root.appendChild(wrapper);
   }
   
   renderTextOverlays(); 
}

function render() {
    const root = document.getElementById('calendar-root');
    parseHolidays();

    if (state.layout === 'planner') {
        if (typeof window.renderPlanner === 'function') {
            window.renderPlanner(state, root);
        } else {
            root.innerHTML = '<div style="padding:20px; text-align:center; color:red">Ошибка: Файл js/templates/planner.js не загружен</div>';
        }
    } 
    else if (state.layout === 'trio') {
        if (typeof window.renderTrio === 'function') {
            window.renderTrio(state, root);
        } else {
            root.innerHTML = '<div style="padding:20px; text-align:center; color:red">Ошибка: Файл js/templates/trio.js не загружен</div>';
        }
    }
    else {
        renderStandard();
    }
}


let upIdx = -1;
window.upSingle = (i) => { upIdx=i; document.getElementById('single-up').click(); };
document.getElementById('single-up').onchange = e => {
   const r = new FileReader();
   r.onload = ev => { 
       state.images[upIdx] = ev.target.result; 
       // Апдейт для стандартного
       const card = document.getElementById(`card-${upIdx}`);
       if(card) {
           const layer = card.querySelector('.img-layer');
           if(layer) layer.style.backgroundImage = `url(${ev.target.result})`;
       }
       // Апдейт для Трио
       const trio = document.getElementById(`trio-img-${upIdx}`);
       if(trio) {
           const layer = trio.querySelector('.img-layer');
           if(layer) layer.style.backgroundImage = `url(${ev.target.result})`;
       }
   };
   if(e.target.files[0]) r.readAsDataURL(e.target.files[0]);
};
document.getElementById('multi-up').onchange = e => {
   Array.from(e.target.files).slice(0,12).forEach((f,i) => {
      const r = new FileReader();
      r.onload = ev => { state.images[i] = ev.target.result; if(i===e.target.files.length-1) render(); };
      r.readAsDataURL(f);
   });
};

/* --- INITIALIZATION --- */
setOrientation('landscape');
render();