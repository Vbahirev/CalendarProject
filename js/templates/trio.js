/* js/templates/trio.js */

window.renderTrio = function(state, root) {
    console.log("Rendering Trio (Rich Text Support)...");
    root.innerHTML = '';
    root.className = `layout-trio`; 

    const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    const wd = ["ПН","ВТ","СР","ЧТ","ПТ","СБ","ВС"];
    const gridStyleSelect = document.getElementById('sel-grid-style');
    const activeGridStyle = gridStyleSelect ? gridStyleSelect.value : 'style-rounded';
    const titleClass = state.title.mode === 'gradient' ? 'text-gradient' : 'text-solid';

    function getISOWeek(d) {
        const date = new Date(d.valueOf());
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        const week1 = new Date(date.getFullYear(), 0, 4);
        return 1 + Math.round(((date - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    }

    // 1. РАЗДЕЛИТЕЛИ
    const separatorsLayer = document.createElement('div');
    separatorsLayer.className = 'trio-separators-layer';
    separatorsLayer.innerHTML = '<div class="trio-section-label">Разделители</div>';

    const separatorsConfig = [
        { id: 0, title: "ШАПКА (305x218)", desc: "Верх", isHeader: true },
        { id: 1, title: "РАЗДЕЛИТЕЛЬ 1 (305x188)", desc: "Середина", isHeader: false },
        { id: 2, title: "РАЗДЕЛИТЕЛЬ 2 (305x188)", desc: "Низ", isHeader: false }
    ];

    separatorsConfig.forEach((conf) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'trio-separator-wrapper';
        if(state.selection.has(conf.id)) wrapper.classList.add('selected');
        
        // Клик для выбора (выделяем рамкой, чтобы менять настройки текста/фото)
        wrapper.onclick = (e) => { 
            if(!e.target.closest('.btn-up') && !e.target.closest('.overlay-text')) {
                window.handleSelection(conf.id, e); 
            }
        };

        const separator = document.createElement('div');
        separator.className = `trio-separator trio-bleed-box ${conf.isHeader ? 'header-mode' : ''}`;
        
        wrapper.innerHTML += `<div class="sep-label-badge">${conf.title}</div>`;

        const content = document.createElement('div');
        content.className = 'sep-content';

        const sepAd = document.createElement('div');
        sepAd.className = 'sep-ad-area';
        sepAd.innerHTML = `<span>${conf.desc}</span>`;
        
        // --- ЗОНА ФОТО ---
        const sepPhoto = document.createElement('div');
        sepPhoto.className = 'sep-photo-area';
        // ВАЖНО: ID для поиска контейнера в app.js -> renderTextOverlays
        sepPhoto.id = `trio-img-${conf.id}`; 
        
        if(conf.isHeader) sepPhoto.innerHTML += '<div class="grommet-mark"></div>';

        let imgConfig = state.imgTransforms;
        if(state.overrides[conf.id]?.imgTransforms) {
            imgConfig = { ...state.imgTransforms, ...state.overrides[conf.id].imgTransforms };
        }
        
        // Слой картинки
        const imgLayer = document.createElement('div');
        imgLayer.className = 'img-layer';
        imgLayer.style.width = '100%'; imgLayer.style.height = '100%';
        imgLayer.style.backgroundSize = 'cover'; imgLayer.style.backgroundPosition = 'center';
        imgLayer.style.backgroundColor = imgConfig.bg; 
        
        if(state.images[conf.id]) imgLayer.style.backgroundImage = `url(${state.images[conf.id]})`;
        imgLayer.style.transform = `scale(${imgConfig.scale}) rotate(${imgConfig.rotate}deg) translate(${imgConfig.x}%, ${imgConfig.y}%)`;

        const overlay = document.createElement('div');
        overlay.className = 'img-overlay';
        overlay.innerHTML = `<span class="btn-up">Загрузить</span>`;
        overlay.onclick = () => window.upSingle(conf.id);

        // Добавляем слои: фон и кнопку. Текст добавится через renderTextOverlays()
        sepPhoto.append(imgLayer, overlay);
        
        // Drag and Drop файлов
        sepPhoto.ondragover = (e) => { e.preventDefault(); sepPhoto.style.opacity = '0.7'; };
        sepPhoto.ondragleave = (e) => { e.preventDefault(); sepPhoto.style.opacity = '1'; };
        sepPhoto.ondrop = (e) => {
             e.preventDefault(); sepPhoto.style.opacity = '1';
             const f = e.dataTransfer.files[0];
             if(f && f.type.startsWith('image/')) {
                 const r = new FileReader();
                 r.onload = (ev) => { state.images[conf.id] = ev.target.result; imgLayer.style.backgroundImage = `url(${ev.target.result})`; };
                 r.readAsDataURL(f);
             }
        };

        content.append(sepAd, sepPhoto);
        separator.innerHTML = `<div class="trim-guide"></div><div class="crop-marks"><div class="cm cm-tl"></div><div class="cm cm-tr"></div><div class="cm cm-bl"></div><div class="cm cm-br"></div></div>`;
        separator.appendChild(content);
        wrapper.appendChild(separator);
        separatorsLayer.appendChild(wrapper);
    });

    // 2. БЛОКИ (Календарные сетки)
    const blocksLayer = document.createElement('div');
    blocksLayer.className = 'trio-blocks-layer';
    blocksLayer.innerHTML = '<div class="trio-section-label">Сетки</div>';

    function createBlock(targetDate, type) {
        const ty = targetDate.getFullYear();
        const tm = targetDate.getMonth();
        const block = document.createElement('div');
        block.className = 'trio-block trio-bleed-box';
        const typeVar = type === 0 ? 'var(--trio-bg-top)' : (type === 1 ? 'var(--trio-bg-mid)' : 'var(--trio-bg-bot)');
        block.style.setProperty('--trio-bg-current', typeVar);

        block.innerHTML = `<div class="trim-guide"></div><div class="crop-marks"><div class="cm cm-tl"></div><div class="cm cm-tr"></div><div class="cm cm-bl"></div><div class="cm cm-br"></div></div><div class="bind-line"></div>`;

        const safeArea = document.createElement('div');
        safeArea.className = 'trio-safe-area';
        const header = document.createElement('div');
        header.className = 'tb-header';
        header.innerHTML = `<div class="tb-month ${titleClass}">${months[tm]}</div><div class="tb-year">${ty}</div>`;
        const gridWrapper = document.createElement('div');
        gridWrapper.className = 'tb-grid-wrapper';
        const daysHeader = document.createElement('div');
        daysHeader.className = 'tb-days-header';
        daysHeader.innerHTML = '<div class="tb-week-head">№</div>';
        wd.forEach((d, i) => { daysHeader.innerHTML += `<div class="tb-day-name ${i>=5?'weekend':''}">${d}</div>`; });
        const datesGrid = document.createElement('div');
        datesGrid.className = `tb-dates-grid ${activeGridStyle}`;

        const firstDay = new Date(ty, tm, 1);
        let skip = firstDay.getDay(); skip = skip === 0 ? 6 : skip - 1;
        let iterDate = new Date(ty, tm, 1 - skip);

        for (let row = 0; row < 6; row++) {
            datesGrid.innerHTML += `<div class="tb-week-num">${getISOWeek(iterDate)}</div>`;
            for (let day = 0; day < 7; day++) {
                const isCurrent = iterDate.getMonth() === tm;
                if (isCurrent) {
                    const d = iterDate.getDate();
                    const dow = iterDate.getDay();
                    const isWk = (dow === 0 || dow === 6);
                    const hol = state.holidays.find(h => h.d === d && h.m === tm + 1);
                    let cls = 'tb-cell';
                    if (hol) cls += ' holiday'; else if (isWk) cls += ' weekend';
                    datesGrid.innerHTML += `<div class="${cls}"><span>${d}</span></div>`;
                } else {
                    datesGrid.innerHTML += `<div class="tb-cell empty"></div>`;
                }
                iterDate.setDate(iterDate.getDate() + 1);
            }
        }
        gridWrapper.append(daysHeader, datesGrid);
        safeArea.append(header, gridWrapper);
        block.appendChild(safeArea);
        return block;
    }

    for(let m = 0; m < 12; m++) {
        const sheet = document.createElement('div');
        sheet.className = 'trio-print-sheet'; 
        sheet.appendChild(createBlock(new Date(state.year, m - 1, 1), 0));
        sheet.appendChild(createBlock(new Date(state.year, m, 1), 1));
        sheet.appendChild(createBlock(new Date(state.year, m + 1, 1), 2));
        blocksLayer.appendChild(sheet);
    }
    root.append(separatorsLayer, blocksLayer);
    
    // ВАЖНО: Вызываем отрисовку текста, так как элементы созданы
    if(window.renderTextOverlays) window.renderTextOverlays();
};