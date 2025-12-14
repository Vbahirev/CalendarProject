/* js/templates/planner.js */

window.renderPlanner = function(state, root) {
    console.log("Rendering Monthly Planner (Clean Footer)...");
    root.innerHTML = '';
    root.className = `cards-wrapper layout-planner paper-${state.paper.size} orient-portrait`; 

    const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    const wd = ["ПН","ВТ","СР","ЧТ","ПТ","СБ","ВС"];

    const isGrad = state.title.mode === 'gradient';
    const titleClass = isGrad ? 'text-gradient' : 'text-solid';

    // 1. СЧИТЫВАЕМ НАСТРОЙКИ
    const showLegend = document.getElementById('chk-legend') ? document.getElementById('chk-legend').checked : true;
    const showList = document.getElementById('chk-list') ? document.getElementById('chk-list').checked : true;

    for(let m = 0; m < 12; m++) {
        const date = new Date(state.year, m, 1);
        const daysInMonth = new Date(state.year, m+1, 0).getDate();
        let skip = date.getDay() === 0 ? 6 : date.getDay() - 1;

        const wrapper = document.createElement('div');
        wrapper.className = 'card-container-outer';
        if(state.selection.has(m)) wrapper.classList.add('selected');
        
        wrapper.innerHTML = `<div class="substrate-layer">${state.paper.size.toUpperCase()} PORTRAIT</div>`;

        const card = document.createElement('div');
        card.className = 'card planner-card'; 
        card.id = `card-${m}`;
        
        if(state.overrides[m]) {
             Object.entries(state.overrides[m]).forEach(([prop, val]) => {
                 if(prop !== 'textOverlay' && prop !== 'imgTransforms') card.style.setProperty(prop, val);
             });
        }

        card.onclick = (e) => {
            if(e.target.closest('.btn-up') || e.target.closest('.overlay-text')) return;
            if(window.handleSelection) window.handleSelection(m, e);
        };

        // --- ФОТО ---
        const imgContainer = document.createElement('div');
        imgContainer.className = 'card-img';
        
        const imgLayer = document.createElement('div');
        imgLayer.className = 'img-layer';
        if(state.images[m]) imgLayer.style.backgroundImage = `url(${state.images[m]})`;
        
        let imgConfig = state.imgTransforms;
        if(state.overrides[m] && state.overrides[m].imgTransforms) {
            imgConfig = { ...state.imgTransforms, ...state.overrides[m].imgTransforms };
        }
        
        imgLayer.style.transform = `scale(${imgConfig.scale}) rotate(${imgConfig.rotate}deg) translate(${imgConfig.x}%, ${imgConfig.y}%)`;
        imgContainer.style.backgroundColor = imgConfig.bg;
        
        imgContainer.appendChild(imgLayer);
        
        const overlayDiv = document.createElement('div');
        overlayDiv.className = 'img-overlay';
        overlayDiv.innerHTML = `<span class="btn-up">Сменить</span>`;
        overlayDiv.onclick = () => window.upSingle(m);
        imgContainer.appendChild(overlayDiv);
        
        imgContainer.ondragover = (e) => { e.preventDefault(); imgContainer.classList.add('drag-over'); };
        imgContainer.ondragleave = (e) => { e.preventDefault(); imgContainer.classList.remove('drag-over'); };
        imgContainer.ondrop = (e) => {
             e.preventDefault(); imgContainer.classList.remove('drag-over');
             const file = e.dataTransfer.files[0];
             if(file && file.type.startsWith('image/')) {
                 const r = new FileReader();
                 r.onload = (ev) => { state.images[m] = ev.target.result; imgLayer.style.backgroundImage = `url(${ev.target.result})`; };
                 r.readAsDataURL(file);
             }
        };

        // --- ТЕЛО ---
        const body = document.createElement('div');
        body.className = 'card-body planner-body';
        
        const head = document.createElement('div');
        head.className = 'planner-header';
        head.innerHTML = `<span class="ph-month m-name ${titleClass}">${months[m]}</span> <span class="ph-year">${state.year}</span>`;
        
        const gridHead = document.createElement('div');
        gridHead.className = 'planner-week-header';
        wd.forEach(d => gridHead.innerHTML += `<div>${d}</div>`);

        const grid = document.createElement('div');
        grid.className = 'planner-main-grid';

        for(let i=0; i<skip; i++) grid.innerHTML += '<div class="p-cell empty"></div>';
        
        let monthHolidays = [];

        for(let d=1; d<=daysInMonth; d++) {
            const dateObj = new Date(state.year, m, d);
            const dow = dateObj.getDay();
            const hol = state.holidays.find(h => h.d===d && h.m===m+1);
            let cls = 'p-cell';
            
            if(hol) {
                cls += ' holiday';
                let name = hol.name;
                const regex = new RegExp(`^${d}[\\.\\s]+`, 'i');
                if (regex.test(name)) name = name.replace(regex, '');
                name = name.charAt(0).toUpperCase() + name.slice(1);
                monthHolidays.push({ day: d, name: name });
            } 
            else if(dow===0 || dow===6) {
                cls += ' weekend';
            }

            let html = `<div class="p-date">${d}</div>`;
            grid.innerHTML += `<div class="${cls}">${html}</div>`;
        }

        // --- ПОДВАЛ ---
        const notes = document.createElement('div');
        notes.className = 'planner-notes';

        let footerHtml = '';

        // 1. ЛЕГЕНДА
        if (showLegend) {
            footerHtml += `
                <div class="planner-legend-row">
                    <div class="pl-item"><div class="dot" style="background:var(--col-weekend)"></div><span>Выходные</span></div>
                    <div class="pl-item"><div class="dot" style="background:var(--col-holiday)"></div><span>Праздники</span></div>
                </div>
            `;
        }

        // 2. СПИСОК ПРАЗДНИКОВ (Без заголовка "Праздники:")
        if (showList && monthHolidays.length > 0) {
            // Убрали <span class="notes-label">Праздники:</span>
            footerHtml += `<div class="holiday-footer-list">`;
            monthHolidays.forEach(h => {
                footerHtml += `<div class="h-footer-item"><span>${h.day}</span> ${h.name}</div>`;
            });
            footerHtml += `</div>`;
        } else {
            // Если списка нет - выводим поле для заметок
            footerHtml += '<span class="notes-label">Заметки:</span><div class="notes-lines"></div><div class="notes-lines"></div>';
        }

        notes.innerHTML = footerHtml;

        body.append(head, gridHead, grid, notes);
        card.append(imgContainer, body);
        wrapper.appendChild(card);
        root.appendChild(wrapper);
    }
    
    if(window.renderTextOverlays) window.renderTextOverlays();
};