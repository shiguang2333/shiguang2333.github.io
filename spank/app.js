/* 属性填涂卡 · 交互
   数据来源：data.js（由 data/short-card.json 生成） */
(() => {
  'use strict';

  const DATA = window.SHORT_CARD;
  if (!DATA || !Array.isArray(DATA.categories)) {
    console.error('缺少 SHORT_CARD 数据，请先运行 node tools/build-site-data.mjs');
    return;
  }

  const STORAGE_KEY = 'spankcard_short_v1';
  const CATEGORY_ORDER = [
    'gender', 'relation', 'intensity', 'clothing', 'rhythm', 'pleasure',
    'cooperation', 'tools', 'parts', 'postures'
  ];
  const LEVEL_LABELS = ['未评', '可接受', '喜欢', '最爱'];
  const SCALE_LEVEL_COLORS = {
    intensity: ['#86efac', '#fbbf24', '#fb923c', '#f87171'],
    clothing: ['#93c5fd', '#67e8f9', '#fbbf24', '#f87171'],
  };
  const PALETTE = {
    violet:  ['#a78bfa', '#8b5cf6'],
    red:     ['#f87171', '#ef4444'],
    amber:   ['#fbbf24', '#f59e0b'],
    orange:  ['#fb923c', '#f97316'],
    rose:    ['#fb7185', '#f43f5e'],
    pink:    ['#f472b6', '#ec4899'],
    blue:    ['#60a5fa', '#3b82f6'],
    cyan:    ['#22d3ee', '#06b6d4'],
    fuchsia: ['#e879f9', '#d946ef']
  };

  const byId = (id) => document.getElementById(id);
  const reducedMotion = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const esc = (value) => String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  const hexToRgb = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const rgba = (hex, alpha) => {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  /* ---------- 分类与条目索引 ---------- */

  const cats = [...DATA.categories].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a.id);
    const ib = CATEGORY_ORDER.indexOf(b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

  for (const cat of cats) {
    const fromName = (cat.color.match(/from-([a-z]+)-400/) || [])[1];
    const toName = (cat.color.match(/to-([a-z]+)-500/) || [])[1];
    const base = (PALETTE[fromName] || [])[0] || '#d2ae72';
    const strong = (PALETTE[toName] || [])[1] || (PALETTE[fromName] || [])[1] || '#c49b5f';
    cat._accent = base;
    cat._strong = strong;
    cat._soft = rgba(base, 0.12);
    cat._line = rgba(base, 0.48);
  }

  const catById = new Map(cats.map((cat) => [cat.id, cat]));
  const itemIndex = new Map();
  for (const cat of cats) {
    for (const item of cat.items) itemIndex.set(item.id, { item, cat });
  }
  const allItems = cats.flatMap((cat) => cat.items);
  const wizardSteps = [
    ...cats.map((cat) => ({ id: `cat-${cat.id}`, title: cat.title, cat })),
    { id: 'notesSection', title: '其他', cat: null }
  ];
  const shortVersion = String(DATA.version || '1.2').replace(/\.0$/, '');
  const TOTAL_ITEMS = Number(DATA.total) || allItems.length;

  /* ---------- DOM ---------- */

  const app = byId('app');
  const catNav = byId('catNav');
  const categoriesEl = byId('categories');
  const notesSection = byId('notesSection');
  const viewButtons = [...document.querySelectorAll('.view-option')];
  const pageFoot = document.querySelector('.page-foot');
  const summaryBtn = byId('summaryBtn');
  const prevBtn = byId('prevBtn');
  const summaryModal = byId('summaryModal');
  const summaryContent = byId('summaryContent');
  const summaryScrollHint = byId('summaryScrollHint');
  const summaryViewSwitch = byId('summaryViewSwitch');
  const summaryViewButtons = [...document.querySelectorAll('[data-summary-view]')];
  const exportImageBtn = byId('exportImageBtn');
  const resetModal = byId('resetModal');
  const confirmReset = byId('confirmReset');
  const resetBtn = byId('resetBtn');
  const toast = byId('toast');
  const progressCount = byId('progressCount');
  const progressTotal = byId('progressTotal');
  const progressFill = byId('progressFill');
  const progressPercent = byId('progressPercent');
  const progressHint = byId('progressHint');
  const progressTrack = byId('progressTrack');
  const dockCount = byId('dockCount');
  const dockTotal = byId('dockTotal');
  const dockPrefix = byId('dockPrefix');
  const dockSuffix = byId('dockSuffix');

  /* ---------- 状态 ---------- */

  let answers = {};
  let profile = emptyProfile();
  let summaryDisplay = 'bottle';
  let viewMode = 'wizard';
  let wizardIndex = 0;
  let currentActive = null;
  let saveTimer = 0;
  let lastFocus = null;

  function emptyProfile() {
    return { hardLimits: '', preferences: '' };
  }

  function sanitizeProfile(raw) {
    const p = raw && typeof raw === 'object' ? raw : {};
    const str = (value, max) => String(value ?? '').slice(0, max);
    return {
      hardLimits: str(p.hardLimits, 600),
      preferences: str(p.preferences, 600)
    };
  }

  function sanitizeAnswers(raw) {
    const clean = {};
    if (!raw || typeof raw !== 'object') return clean;
    for (const cat of cats) {
      let selected = 0;
      const dualGroups = new Set();
      for (const item of cat.items) {
        const value = Number(raw[item.id]);
        if (cat.input === 'bottle') {
          if (Number.isInteger(value) && value >= 1 && value <= 3) clean[item.id] = value;
        } else if (value === 1) {
          if (cat.input === 'dual') {
            const group = item.group || '';
            if (!dualGroups.has(group)) {
              clean[item.id] = 1;
              dualGroups.add(group);
            }
          } else if (cat.input === 'single' || cat.input === 'scale') {
            if (selected === 0) { clean[item.id] = 1; selected += 1; }
          } else if (!cat.maxSelections || selected < cat.maxSelections) {
            clean[item.id] = 1;
            selected += 1;
          }
        }
      }
    }
    return clean;
  }

  /* ---------- 本地存储与分享链接 ---------- */

  function persistNow() {
    try {
      const compact = {};
      for (const [id, value] of Object.entries(answers)) {
        if (Number(value) > 0) compact[id] = Number(value);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        v: 1,
        updatedAt: Date.now(),
        profile,
        answers: compact,
        view: viewMode,
        wizardIndex
      }));
    } catch (error) {
      /* 隐私模式或存储已满时静默失败 */
    }
  }

  function saveState() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persistNow, 180);
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1) {
          profile = sanitizeProfile(saved.profile);
          answers = sanitizeAnswers(saved.answers);
          if (saved.view === 'page' || saved.view === 'wizard') viewMode = saved.view;
          const savedIndex = Number(saved.wizardIndex);
          if (Number.isInteger(savedIndex)) {
            wizardIndex = Math.max(0, Math.min(wizardSteps.length - 1, savedIndex));
          }
        }
      }
    } catch (error) {
      console.warn('读取本地填写记录失败', error);
    }
  }

  function applyScaleDefaults() {
    for (const cat of cats) {
      if (cat.input !== 'scale') continue;
      const hasSelection = cat.items.some((item) => (Number(answers[item.id]) || 0) === 1);
      if (hasSelection) continue;
      for (const item of cat.items) answers[item.id] = 0;
      const index = Math.min(Math.max(0, Number(cat.defaultIndex) || 0), cat.items.length - 1);
      if (cat.items[index]) answers[cat.items[index].id] = 1;
    }
  }

  /* ---------- 渲染 ---------- */

  function renderNav() {
    const chips = cats.map((cat) => (
      `<button type="button" class="cat-chip" data-target="cat-${cat.id}" style="--accent:${cat._accent}" aria-label="跳到${cat.title}"><span class="chip-dot"></span>${cat.title}</button>`
    ));
    chips.push('<button type="button" class="cat-chip" data-target="notesSection" style="--accent:#d2ae72" aria-label="跳到其他"><span class="chip-dot"></span>其他</button>');
    catNav.innerHTML = chips.join('');
  }

  function renderCategories() {
    categoriesEl.innerHTML = cats.map((cat, index) => renderCategory(cat, index)).join('');
  }

  function renderCategory(cat, index) {
    const isScale = cat.input === 'scale';
    const isDual = cat.input === 'dual';
    const typeLabel = isDual
      ? 'PAIR / 组选'
      : isScale
        ? (cat.orientation === 'vertical' ? 'SLIDER / 竖向滑动' : 'SLIDER / 横向滑动')
        : cat.input === 'single'
          ? 'SINGLE / 单选'
          : cat.input === 'multi' ? 'MULTI / 多选' : 'BOTTLE / 小瓶子';
    const maxTag = cat.maxSelections
      ? `<span class="cat-tag">最多 ${cat.maxSelections} 项</span>`
      : '';
    const gridClass = cat.input === 'bottle' ? 'bottle-grid' : 'choice-grid';
    const items = cat.items.map((item) => (
      cat.input === 'bottle' ? renderBottle(cat, item) : renderChoice(cat, item)
    )).join('');
    const quickActions = isScale
      ? `<div class="cat-quick">
           <button type="button" class="text-button" data-action="reset-scale" data-cat="${cat.id}">恢复默认</button>
         </div>`
      : cat.input === 'bottle'
        ? `<div class="cat-quick">
             <button type="button" class="text-button" data-action="fill" data-cat="${cat.id}">未评项设为可接受</button>
             <button type="button" class="text-button" data-action="clear" data-cat="${cat.id}">清空本类</button>
           </div>`
        : `<div class="cat-quick">
             <button type="button" class="text-button" data-action="clear" data-cat="${cat.id}">清空本类</button>
           </div>`;
    const countLabel = isScale
      ? esc(cat.items[selectedScaleIndex(cat)]?.name || '')
      : isDual
        ? `${answeredDualGroupCount(cat)} / ${dualGroupsOf(cat).length}`
        : `0 / ${cat.items.length}`;
    const body = isScale ? renderScale(cat) : isDual ? renderDual(cat) : `<div class="${gridClass}">${items}</div>`;

    return `<section class="cat-card" id="cat-${cat.id}" data-cat="${cat.id}" style="--accent:${cat._accent};--accent-strong:${cat._strong};--accent-soft:${cat._soft};--accent-line:${cat._line};--i:${index}">
      <header class="cat-head">
        <span class="cat-bar" aria-hidden="true"></span>
        <div>
          <p class="cat-kicker"><b class="cat-index">${String(index + 1).padStart(2, '0')}</b> · ${typeLabel}${maxTag}</p>
          <h2>${esc(cat.title)}</h2>
        </div>
        <span class="cat-count" data-count>${countLabel}</span>
      </header>
      ${body}
      ${quickActions}
    </section>`;
  }

  function dualGroupsOf(cat) {
    const groups = new Map();
    for (const item of cat.items) {
      const key = item.group || '';
      if (!groups.has(key)) groups.set(key, { key, label: item.groupLabel || key, items: [] });
      groups.get(key).items.push(item);
    }
    return [...groups.values()];
  }

  function answeredDualGroupCount(cat) {
    return dualGroupsOf(cat).filter((group) => (
      group.items.some((item) => (Number(answers[item.id]) || 0) === 1)
    )).length;
  }

  function renderDual(cat) {
    const groups = dualGroupsOf(cat);
    return `<div class="dual-grid">
      ${groups.map((group) => `
        <div class="dual-group">
          <span class="dual-label">${esc(group.label)}</span>
          <div class="dual-options">
            ${group.items.map((item) => {
              const selected = (Number(answers[item.id]) || 0) === 1;
              const genderClass = item.name === '男'
                ? ' is-male'
                : item.name === '女'
                  ? ' is-female'
                  : item.name === '主'
                    ? ' is-dominant'
                    : item.name === '贝' ? ' is-submissive' : '';
              const symbol = item.name === '男' ? '♂' : item.name === '女' ? '♀' : item.name;
              return `<button type="button" class="dual-choice${genderClass}${selected ? ' is-selected' : ''}" data-item="${item.id}" aria-label="${esc(group.label)}：${esc(item.name)}" aria-pressed="${selected ? 'true' : 'false'}"><span aria-hidden="true">${symbol}</span></button>`;
            }).join('')}
          </div>
        </div>
      `).join('')}
    </div>`;
  }

  function selectedScaleIndex(cat) {
    const index = cat.items.findIndex((item) => (Number(answers[item.id]) || 0) === 1);
    if (index >= 0) return index;
    return Math.min(Math.max(0, Number(cat.defaultIndex) || 0), cat.items.length - 1);
  }

  function renderScale(cat) {
    const index = selectedScaleIndex(cat);
    const count = cat.items.length;
    const percent = count > 1 ? (index / (count - 1)) * 100 : 0;
    const vertical = cat.orientation === 'vertical';
    const valueName = cat.items[index]?.name || '';
    const levelColors = SCALE_LEVEL_COLORS[cat.id] || [];
    const blockStyle = levelColors[index] ? `--level-color:${levelColors[index]};` : '';

    return `<div class="scale-block ${vertical ? 'scale-vertical' : 'scale-horizontal'}" data-scale-block="${cat.id}" style="${blockStyle}">
      <div class="scale-value-row">
        <span>当前档位</span>
        <strong data-scale-value>${esc(valueName)}</strong>
      </div>
      <div class="scale-main">
        <div class="scale-track-wrap">
          <input class="scale-range${vertical ? ' is-vertical' : ''}" type="range" min="0" max="${Math.max(0, count - 1)}" step="1" value="${index}" style="--p:${percent}%" data-scale-cat="${cat.id}" aria-label="${esc(cat.title)}" aria-valuetext="${esc(valueName)}">
        </div>
        <div class="scale-labels ${vertical ? 'is-vertical' : 'is-horizontal'}">
          ${cat.items.map((item, itemIndex) => {
            const ratio = count > 1 ? itemIndex / (count - 1) : 0;
            const color = levelColors[itemIndex] ? `color:${levelColors[itemIndex]};` : '';
            const left = vertical ? `top:calc(12px + (100% - 24px) * ${ratio});` : `left:calc(12px + (100% - 24px) * ${ratio});`;
            const side = vertical ? (itemIndex % 2 === 0 ? ' is-left' : ' is-right') : '';
            return `<button type="button" class="scale-label${side}${itemIndex === index ? ' is-active' : ''}" style="${left}${color}" data-scale-index="${itemIndex}" data-scale-cat-id="${cat.id}">${esc(item.name)}</button>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  }

  function renderChoice(cat, item) {
    return `<button type="button" class="choice ${cat.input}" data-item="${item.id}" aria-pressed="false">
      <span class="choice-mark" aria-hidden="true"></span>
      <span class="choice-name">${esc(item.name)}</span>
    </button>`;
  }

  function renderBottle(cat, item) {
    return `<button type="button" class="bottle-item" data-item="${item.id}" data-level="0" aria-pressed="false" aria-label="${esc(cat.title)}：${esc(item.name)}，未评。点击切换">
      <span class="bottle" aria-hidden="true">
        <span class="bottle-cap"></span>
        <span class="bottle-neck"></span>
        <span class="bottle-body"><span class="bottle-liquid"></span><span class="bottle-shine"></span></span>
      </span>
      <span class="bottle-name">${esc(item.name)}</span>
      <span class="bottle-level" data-level-label>未评</span>
    </button>`;
  }

  const itemEl = (id) => categoriesEl.querySelector(`[data-item="${id}"]`);

  function paintItem(id) {
    const entry = itemIndex.get(id);
    if (!entry) return;
    const el = itemEl(id);
    if (!el) return;
    const value = Number(answers[id]) || 0;
    if (entry.cat.input === 'bottle') {
      el.dataset.level = String(value);
      el.classList.toggle('has-level', value > 0);
      el.setAttribute('aria-pressed', value > 0 ? 'true' : 'false');
      el.setAttribute('aria-label', `${entry.cat.title}：${entry.item.name}，${LEVEL_LABELS[value]}。点击切换`);
      const label = el.querySelector('[data-level-label]');
      if (label) label.textContent = LEVEL_LABELS[value];
    } else {
      el.classList.toggle('is-selected', value === 1);
      el.setAttribute('aria-pressed', value === 1 ? 'true' : 'false');
    }
  }

  function paintScale(cat) {
    const section = byId(`cat-${cat.id}`);
    if (!section) return;
    const index = selectedScaleIndex(cat);
    const count = cat.items.length;
    const percent = count > 1 ? (index / (count - 1)) * 100 : 0;
    const name = cat.items[index]?.name || '';
    const input = section.querySelector('[data-scale-cat]');
    if (input) {
      input.value = String(index);
      input.style.setProperty('--p', `${percent}%`);
      input.setAttribute('aria-valuetext', name);
    }
    const valueEl = section.querySelector('[data-scale-value]');
    if (valueEl) valueEl.textContent = name;
    const block = section.querySelector('[data-scale-block]');
    const levelColors = SCALE_LEVEL_COLORS[cat.id] || [];
    if (block) {
      if (levelColors[index]) block.style.setProperty('--level-color', levelColors[index]);
      else block.style.removeProperty('--level-color');
    }
    section.querySelectorAll('.scale-label').forEach((button, buttonIndex) => {
      button.classList.toggle('is-active', buttonIndex === index);
    });
  }

  function paintAll() {
    for (const item of allItems) paintItem(item.id);
    for (const cat of cats) if (cat.input === 'scale') paintScale(cat);
  }

  /* ---------- 计数与进度 ---------- */

  function answeredCount(items) {
    let count = 0;
    for (const item of items) if ((Number(answers[item.id]) || 0) > 0) count += 1;
    return count;
  }

  function isCategoryComplete(cat) {
    if (cat.input === 'dual') {
      return answeredDualGroupCount(cat) === dualGroupsOf(cat).length;
    }
    return answeredCount(cat.items) > 0;
  }

  function filledCategoryCount() {
    let count = 0;
    for (const cat of cats) {
      if (isCategoryComplete(cat)) count += 1;
    }
    return count;
  }

  function updateCategory(cat) {
    const section = byId(`cat-${cat.id}`);
    if (!section) return;
    const count = answeredCount(cat.items);
    const badge = section.querySelector('[data-count]');
    if (badge) {
      if (cat.input === 'scale') {
        const name = cat.items[selectedScaleIndex(cat)]?.name || '';
        badge.textContent = name;
        badge.classList.toggle('is-complete', true);
        badge.setAttribute('aria-label', `当前档位：${name}`);
        badge.title = `当前档位：${name}`;
      } else if (cat.input === 'dual') {
        const answered = answeredDualGroupCount(cat);
        const totalGroups = dualGroupsOf(cat).length;
        badge.textContent = `${answered} / ${totalGroups}`;
        badge.classList.toggle('is-complete', answered === totalGroups);
        badge.setAttribute('aria-label', `已选 ${answered} 组，共 ${totalGroups} 组`);
        badge.title = `已选 ${answered} 组，共 ${totalGroups} 组`;
      } else {
        badge.textContent = `${count} / ${cat.items.length}`;
        badge.classList.toggle('is-complete', count === cat.items.length);
        badge.setAttribute('aria-label', `已评 ${count} 项，共 ${cat.items.length} 项`);
        badge.title = `已评 ${count} 项，共 ${cat.items.length} 项`;
      }
    }
    const clearButton = section.querySelector('[data-action="clear"]');
    if (clearButton) clearButton.disabled = count === 0;
    const fillButton = section.querySelector('[data-action="fill"]');
    if (fillButton) fillButton.disabled = cat.items.every((item) => (Number(answers[item.id]) || 0) > 0);
    const resetButton = section.querySelector('[data-action="reset-scale"]');
    if (resetButton) resetButton.disabled = selectedScaleIndex(cat) === Math.min(Math.max(0, Number(cat.defaultIndex) || 0), cat.items.length - 1);
  }

  function hasHardLimits() {
    return Boolean(profile.hardLimits.trim() || profile.preferences.trim());
  }

  function updateNavState() {
    for (const cat of cats) {
      const chip = catNav.querySelector(`[data-target="cat-${cat.id}"]`);
      if (chip) chip.classList.toggle('has-answers', answeredCount(cat.items) > 0);
    }
    const notesChip = catNav.querySelector('[data-target="notesSection"]');
    if (notesChip) notesChip.classList.toggle('has-answers', hasHardLimits());
  }

  function updateProgress() {
    const done = filledCategoryCount();
    const totalCategories = cats.length;
    const ratio = totalCategories ? Math.min(1, done / totalCategories) : 0;
    const percent = Math.round(ratio * 100);
    progressCount.textContent = String(done);
    progressTotal.textContent = String(totalCategories);
    progressFill.style.width = `${(ratio * 100).toFixed(2)}%`;
    progressFill.classList.toggle('is-complete', totalCategories > 0 && done >= totalCategories);
    progressPercent.textContent = `${percent}%`;
    progressHint.textContent = done >= totalCategories
      ? '全部分类已填 · 记得保存摘要'
      : done === 0
        ? `${totalCategories} 个分类 · 5 种填法`
        : `还差 ${totalCategories - done} 类 · 随时可以停`;    progressTrack.setAttribute('aria-valuenow', String(percent));
    updateDockProgress();
  }

  function updateDockProgress() {
    const total = cats.length;
    dockTotal.textContent = String(total);
    if (viewMode === 'wizard' && wizardIndex >= total) {
      dockPrefix.hidden = true;
      dockCount.textContent = '其他';
      dockSuffix.hidden = true;
      return;
    }
    dockPrefix.hidden = false;
    dockSuffix.hidden = false;
    dockPrefix.textContent = viewMode === 'wizard' ? '第' : '已填';
    dockCount.textContent = String(viewMode === 'wizard' ? wizardIndex + 1 : filledCategoryCount());
  }

  function updateAll() {
    for (const cat of cats) updateCategory(cat);
    updateNavState();
    updateProgress();
  }

  /* ---------- 交互 ---------- */

  function pulseDenied(el) {
    if (!el) return;
    el.classList.remove('is-denied');
    void el.offsetWidth;
    el.classList.add('is-denied');
    setTimeout(() => el.classList.remove('is-denied'), 420);
  }

  function setScaleIndex(cat, index) {
    const nextIndex = Math.max(0, Math.min(cat.items.length - 1, Number(index)));
    for (const item of cat.items) answers[item.id] = 0;
    if (cat.items[nextIndex]) answers[cat.items[nextIndex].id] = 1;
    paintScale(cat);
    updateCategory(cat);
    updateProgress();
    updateNavState();
    saveState();
  }

  function onScaleInput(input) {
    const cat = catById.get(input.dataset.scaleCat);
    if (!cat) return;
    setScaleIndex(cat, Number(input.value));
  }

  function onScaleLabel(label) {
    const cat = catById.get(label.dataset.scaleCatId);
    if (!cat) return;
    setScaleIndex(cat, Number(label.dataset.scaleIndex));
  }

  function onItemClick(target) {
    const entry = itemIndex.get(target.dataset.item);
    if (!entry) return;
    const { item, cat } = entry;
    const current = Number(answers[item.id]) || 0;

    if (cat.input === 'bottle') {
      answers[item.id] = (current + 1) % 4;
      paintItem(item.id);
      target.classList.remove('is-pop');
      void target.offsetWidth;
      target.classList.add('is-pop');
      setTimeout(() => target.classList.remove('is-pop'), 420);
    } else if (cat.input === 'single') {
      if (current === 1) {
        answers[item.id] = 0;
      } else {
        for (const other of cat.items) answers[other.id] = 0;
        answers[item.id] = 1;
      }
      for (const other of cat.items) paintItem(other.id);
    } else if (cat.input === 'dual') {
      const group = item.group || '';
      if (current === 1) {
        answers[item.id] = 0;
      } else {
        for (const other of cat.items) {
          if ((other.group || '') === group) answers[other.id] = 0;
        }
        answers[item.id] = 1;
      }
      for (const other of cat.items) paintItem(other.id);
    } else {
      if (current === 1) {
        answers[item.id] = 0;
      } else {
        if (cat.maxSelections) {
          const selected = cat.items.filter((other) => (Number(answers[other.id]) || 0) > 0).length;
          if (selected >= cat.maxSelections) {
            showToast(`「${cat.title}」最多选择 ${cat.maxSelections} 项`);
            pulseDenied(target);
            return;
          }
        }
        answers[item.id] = 1;
      }
      paintItem(item.id);
    }

    updateCategory(cat);
    updateProgress();
    updateNavState();
    saveState();
  }

  function onQuickAction(button) {
    const cat = catById.get(button.dataset.cat);
    if (!cat) return;
    if (button.dataset.action === 'reset-scale') {
      for (const item of cat.items) answers[item.id] = 0;
      const defaultIndex = Math.min(Math.max(0, Number(cat.defaultIndex) || 0), cat.items.length - 1);
      if (cat.items[defaultIndex]) answers[cat.items[defaultIndex].id] = 1;
      paintScale(cat);
      showToast(`已恢复「${cat.title}」默认档位`);
    } else if (button.dataset.action === 'clear') {
      for (const item of cat.items) {
        answers[item.id] = 0;
        paintItem(item.id);
      }
      showToast(`已清空「${cat.title}」`);
    } else if (button.dataset.action === 'fill') {
      let changed = 0;
      for (const item of cat.items) {
        if ((Number(answers[item.id]) || 0) === 0) {
          answers[item.id] = 1;
          paintItem(item.id);
          changed += 1;
        }
      }
      showToast(changed ? `未评项已设为可接受 · ${changed} 项` : '这一类已经全部评过了');
    }
    updateAll();
    saveState();
  }

  /* ---------- 导航 ---------- */

  function centerChip(chip) {
    const target = chip.offsetLeft - (catNav.clientWidth - chip.offsetWidth) / 2;
    catNav.scrollTo({
      left: Math.max(0, target),
      behavior: reducedMotion() ? 'auto' : 'smooth'
    });
  }

  function setActiveNav(targetId, center) {
    currentActive = targetId;
    if (targetId === 'notesSection') {
      wizardIndex = cats.length;
    } else {
      const index = cats.findIndex((cat) => `cat-${cat.id}` === targetId);
      if (index >= 0) wizardIndex = index;
    }
    for (const chip of catNav.querySelectorAll('.cat-chip')) {
      const active = chip.dataset.target === targetId;
      chip.classList.toggle('is-active', active);
      if (active && center) centerChip(chip);
    }
  }

  function currentSectionId() {
    const offset = catNav.getBoundingClientRect().height + 20;
    let active = `cat-${cats[0].id}`;
    for (const cat of cats) {
      const section = byId(`cat-${cat.id}`);
      if (section && section.getBoundingClientRect().top - offset <= 0) {
        active = `cat-${cat.id}`;
      }
    }
    if (notesSection.getBoundingClientRect().top - offset <= 0) active = 'notesSection';
    return active;
  }

  function syncActiveNav(force) {
    if (app.hidden || viewMode !== 'page') return;
    const active = currentSectionId();
    if (!force && active === currentActive) return;
    setActiveNav(active, true);
  }

  /* ---------- 逐类视图 ---------- */

  function updateDock() {
    const wizard = viewMode === 'wizard';
    prevBtn.hidden = !wizard;
    prevBtn.disabled = !wizard || wizardIndex <= 0;
    if (wizard) {
      if (wizardIndex < cats.length) {
        summaryBtn.innerHTML = '下一类 <span aria-hidden="true">→</span>';
        summaryBtn.setAttribute('aria-label', '下一类');
      } else {
        summaryBtn.innerHTML = '查看结果 <span aria-hidden="true">→</span>';
        summaryBtn.setAttribute('aria-label', '查看结果');
      }
    } else {
      summaryBtn.innerHTML = '查看结果 <span aria-hidden="true">→</span>';
      summaryBtn.setAttribute('aria-label', '查看结果');
    }
    updateDockProgress();
  }

  function applyViewMode() {
    const wizard = viewMode === 'wizard';
    wizardIndex = Math.max(0, Math.min(wizardSteps.length - 1, wizardIndex));
    app.classList.toggle('is-wizard', wizard);
    catNav.hidden = wizard;
    if (pageFoot) pageFoot.hidden = wizard;

    for (const button of viewButtons) {
      const active = button.dataset.view === viewMode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    }

    if (wizard) {
      const onNotes = wizardIndex >= cats.length;
      categoriesEl.hidden = onNotes;
      notesSection.hidden = !onNotes;
      cats.forEach((cat, index) => {
        const section = byId(`cat-${cat.id}`);
        if (section) section.hidden = index !== wizardIndex;
      });
    } else {
      categoriesEl.hidden = false;
      notesSection.hidden = false;
      for (const cat of cats) {
        const section = byId(`cat-${cat.id}`);
        if (section) section.hidden = false;
      }
    }
    updateDock();
  }

  function animateStepCard() {
    const target = wizardIndex < cats.length
      ? byId(`cat-${cats[wizardIndex].id}`)
      : notesSection;
    if (!target) return;
    target.classList.remove('is-step-enter');
    void target.offsetWidth;
    target.classList.add('is-step-enter');
    setTimeout(() => target.classList.remove('is-step-enter'), 480);
  }

  function scrollToWizardCard() {
    const target = wizardIndex < cats.length
      ? byId(`cat-${cats[wizardIndex].id}`)
      : notesSection;
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - 9;
    window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion() ? 'auto' : 'smooth' });
  }

  function goToStep(index) {
    wizardIndex = Math.max(0, Math.min(wizardSteps.length - 1, index));
    if (viewMode !== 'wizard') viewMode = 'wizard';
    applyViewMode();
    saveState();
    requestAnimationFrame(() => {
      scrollToWizardCard();
      animateStepCard();
    });
  }

  function wizardNext() {
    if (wizardIndex < wizardSteps.length - 1) {
      goToStep(wizardIndex + 1);
    } else {
      openSummary();
    }
  }

  function setView(mode) {
    if ((mode !== 'page' && mode !== 'wizard') || mode === viewMode) return;

    if (mode === 'wizard') {
      const activeId = currentSectionId();
      if (activeId === 'notesSection') {
        wizardIndex = cats.length;
      } else {
        const index = cats.findIndex((cat) => `cat-${cat.id}` === activeId);
        if (index >= 0) wizardIndex = index;
      }
      viewMode = 'wizard';
      applyViewMode();
      saveState();
      requestAnimationFrame(() => {
        scrollToWizardCard();
        animateStepCard();
      });
      return;
    }

    const targetId = wizardIndex < cats.length
      ? `cat-${cats[wizardIndex].id}`
      : 'notesSection';
    viewMode = 'page';
    applyViewMode();
    saveState();
    requestAnimationFrame(() => {
      const target = byId(targetId);
      if (!target) return;
      target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
      setActiveNav(targetId, true);
    });
  }

  /* ---------- 弹窗 / 摘要 ---------- */

  function openModal(modal) {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => modal.classList.add('is-open'));
    const closeButton = modal.querySelector('[data-close]');
    if (closeButton) closeButton.focus({ preventScroll: true });
  }

  function closeModal(modal) {
    if (!modal || modal.hidden) return;
    modal.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    setTimeout(() => { modal.hidden = true; }, 200);
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus({ preventScroll: true });
    }
  }

  function collectSummary() {
    return cats.map((cat) => ({
      cat,
      chosen: cat.items
        .filter((item) => (Number(answers[item.id]) || 0) > 0)
        .map((item) => ({ item, level: Number(answers[item.id]) || 0 }))
    })).filter((group) => group.chosen.length > 0);
  }

  function summaryHardLimits() {
    return profile.hardLimits.trim();
  }

  function summaryPreferences() {
    return profile.preferences.trim();
  }

  function openSummary() {
    renderSummary();
    openModal(summaryModal);
    requestAnimationFrame(updateSummaryScrollHint);
    setTimeout(updateSummaryScrollHint, 80);
  }

  function updateSummaryScrollHint() {
    if (summaryModal.hidden) return;
    summaryScrollHint.hidden = summaryContent.scrollHeight <= summaryContent.clientHeight + 4;
  }

  function summaryBottleMarkup(cat, item, level) {
    return `<span class="bottle-item summary-bottle has-level" data-level="${level}" style="--accent:${cat._accent};--accent-strong:${cat._strong};--accent-soft:${cat._soft};--accent-line:${cat._line}" title="${esc(item.name)} · ${LEVEL_LABELS[level]}">
      <span class="bottle" aria-hidden="true">
        <span class="bottle-cap"></span>
        <span class="bottle-neck"></span>
        <span class="bottle-body"><span class="bottle-liquid"></span><span class="bottle-shine"></span></span>
      </span>
      <span class="bottle-name">${esc(item.name)}</span>
      <span class="bottle-level">${LEVEL_LABELS[level]}</span>
    </span>`;
  }

  function renderSummary() {
    const groups = collectSummary();
    const totalItems = groups.reduce((sum, group) => sum + group.chosen.length, 0);
    const hardLimits = summaryHardLimits();
    const preferences = summaryPreferences();
    const hasBottleGroups = groups.some((group) => group.cat.input === 'bottle');

    summaryViewSwitch.hidden = !hasBottleGroups;
    for (const button of summaryViewButtons) {
      const active = button.dataset.summaryView === summaryDisplay;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    }

    let html = `<div class="summary-headline">
      <span class="eyebrow">SHORT CARD V${esc(shortVersion)}</span>
      <p class="summary-stat"><b>${groups.length}</b> / ${cats.length} 类已填</p>
    </div>`;

    if (!groups.length && !hardLimits && !preferences) {
      html += `<div class="summary-empty">
        <span class="empty-mark" aria-hidden="true">◌</span>
        <span>还没有填写任何项目。<br>回去点几个瓶子，或者勾选一项。</span>
      </div>`;
    } else if (groups.length) {
      for (const { cat, chosen } of groups) {
        const useBottles = cat.input === 'bottle' && summaryDisplay === 'bottle';
        const body = useBottles
          ? `<div class="summary-bottle-grid">${chosen.map(({ item, level }) => summaryBottleMarkup(cat, item, level)).join('')}</div>`
          : `<div class="summary-items">${chosen.map(({ item, level }) => {
              const label = cat.input === 'dual' ? `${item.groupLabel} · ${item.name}` : item.name;
              return cat.input === 'bottle'
                ? `<span class="sum-item"><b>${esc(item.name)}</b><i>${LEVEL_LABELS[level]}</i></span>`
                : `<span class="sum-item">${esc(label)}</span>`;
            }).join('')}</div>`;
        html += `<section class="summary-group" style="--accent:${cat._accent}">
          <div class="summary-group-head">
            <span class="dot" aria-hidden="true"></span>
            <h3>${esc(cat.title)}</h3>
            <span>${chosen.length}</span>
          </div>
          ${body}
        </section>`;
      }
    }

    if (hardLimits) {
      html += `<div class="summary-notes">
        <h3>其他</h3>
        <p class="summary-limits">${esc(hardLimits)}</p>
      </div>`;
    }

    if (preferences) {
      html += `<div class="summary-notes">
        <h3>偏爱</h3>
        <p class="summary-limits">${esc(preferences)}</p>
      </div>`;
    }

    summaryContent.innerHTML = html;
    const hasContent = totalItems > 0 || Boolean(hardLimits) || Boolean(preferences);
    exportImageBtn.disabled = !hasContent;
    summaryContent.scrollTop = 0;
    requestAnimationFrame(updateSummaryScrollHint);
  }

  const CANVAS_FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';

  function canvasFont(size, weight = 400) {
    return `${weight} ${size}px ${CANVAS_FONT}`;
  }

  function canvasRoundRect(ctx, x, y, w, h, radius) {
    const r = Math.min(radius, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function canvasWrap(ctx, text, maxWidth) {
    const lines = [];
    for (const paragraph of String(text).split('\n')) {
      if (!paragraph) {
        lines.push('');
        continue;
      }
      let line = '';
      for (const char of Array.from(paragraph)) {
        const next = line + char;
        if (line && ctx.measureText(next).width > maxWidth) {
          lines.push(line);
          line = char;
        } else {
          line = next;
        }
      }
      lines.push(line);
    }
    return lines.length ? lines : [''];
  }

  function drawCanvasBottle(ctx, x, y, w, h, accent, strong, level) {
    const capH = 8;
    const neckH = 14;
    const bodyY = y + capH + neckH;
    const bodyH = h - capH - neckH;

    canvasRoundRect(ctx, x + w / 2 - w * 0.19, y, w * 0.38, capH, 2);
    ctx.fillStyle = '#4a4034';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - w * 0.14, y + capH);
    ctx.lineTo(x + w / 2 - w * 0.14, bodyY);
    ctx.moveTo(x + w / 2 + w * 0.14, y + capH);
    ctx.lineTo(x + w / 2 + w * 0.14, bodyY);
    ctx.stroke();

    canvasRoundRect(ctx, x, bodyY, w, bodyH, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fill();
    ctx.strokeStyle = rgba(accent, 0.5);
    ctx.lineWidth = 2;
    ctx.stroke();

    const ratios = [0, 0.34, 0.67, 1];
    const fillH = bodyH * (ratios[level] || 0);
    if (fillH > 0) {
      ctx.save();
      canvasRoundRect(ctx, x, bodyY, w, bodyH, 10);
      ctx.clip();
      const grad = ctx.createLinearGradient(0, bodyY + bodyH - fillH, 0, bodyY + bodyH);
      grad.addColorStop(0, accent);
      grad.addColorStop(1, strong);
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.88;
      ctx.fillRect(x, bodyY + bodyH - fillH, w, fillH);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.32)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 6, bodyY + 8);
    ctx.lineTo(x + 6, bodyY + bodyH - 14);
    ctx.stroke();
    ctx.lineCap = 'butt';
  }

  function exportSummaryImage() {
    const groups = collectSummary();
    const hardLimits = summaryHardLimits();
    const preferences = summaryPreferences();
    const totalItems = groups.reduce((sum, group) => sum + group.chosen.length, 0);
    if (!groups.length && !hardLimits && !preferences) return;

    const width = 1080;
    const margin = 44;
    const pad = 58;
    const contentX = margin + pad;
    const contentW = width - (margin + pad) * 2;
    const measure = document.createElement('canvas').getContext('2d');

    const setFont = (ctx, size, weight = 400) => {
      ctx.font = canvasFont(size, weight);
    };

    const header = {
      eyebrowY: margin + pad + 4,
      titleY: margin + pad + 36,
      statY: margin + pad + 112
    };
    let y = header.statY + 66;
    const groupLayouts = [];
    const hasBottleGroups = groups.some((group) => group.cat.input === 'bottle');
    const useBottleDisplay = summaryDisplay === 'bottle' && hasBottleGroups;

    for (const { cat, chosen } of groups) {
      const headerY = y;
      const contentY = headerY + 50;
      if (cat.input === 'bottle' && useBottleDisplay) {
        const gap = 12;
        const cols = 5;
        const cellW = (contentW - gap * (cols - 1)) / cols;
        const cellH = 158;
        const rows = Math.ceil(chosen.length / cols);
        const height = rows * cellH;
        groupLayouts.push({ cat, chosen, bottle: true, headerY, contentY, cols, cellW, cellH, gap, height });
        y = contentY + height + 30;
      } else {
        setFont(measure, 20, 400);
        const gap = 10;
        const chipH = 44;
        let cx = 0;
        let row = 0;
        const chips = [];
        for (const entry of chosen) {
          const displayName = cat.input === 'dual' ? `${entry.item.groupLabel} · ${entry.item.name}` : entry.item.name;
          const suffix = cat.input === 'bottle' ? LEVEL_LABELS[entry.level] : '';
          const nameW = measure.measureText(displayName).width;
          let suffixW = 0;
          if (suffix) {
            setFont(measure, 17, 400);
            suffixW = measure.measureText(suffix).width;
            setFont(measure, 20, 400);
          }
          const chipW = Math.min(contentW, 28 + nameW + (suffix ? 10 + suffixW : 0));
          if (cx > 0 && cx + chipW > contentW) {
            row += 1;
            cx = 0;
          }
          chips.push({ ...entry, displayName, suffix, nameW, chipW, x: cx, row });
          cx += chipW + gap;
        }
        const rows = row + 1;
        const height = rows * chipH + (rows - 1) * gap;
        groupLayouts.push({ cat, chosen, bottle: false, headerY, contentY, chips, chipH, gap, height });
        y = contentY + height + 30;
      }
    }

    let notesLayout = null;
    if (hardLimits) {
      setFont(measure, 20, 400);
      const lines = canvasWrap(measure, hardLimits, contentW - 40);
      const noteY = y;
      const noteH = 20 * 2 + 26 + 8 + lines.length * 30;
      notesLayout = { y: noteY, h: noteH, lines };
      y = noteY + noteH + 20;
    }

    let preferencesLayout = null;
    if (preferences) {
      setFont(measure, 20, 400);
      const lines = canvasWrap(measure, preferences, contentW - 40);
      const noteY = y;
      const noteH = 20 * 2 + 26 + 8 + lines.length * 30;
      preferencesLayout = { y: noteY, h: noteH, lines };
      y = noteY + noteH + 20;
    }

    const footerY = y + 8;
    const height = footerY + 44 + margin;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = Math.max(height, 640);
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';

    ctx.fillStyle = '#121110';
    ctx.fillRect(0, 0, width, canvas.height);
    const glow = ctx.createRadialGradient(width / 2, 0, 0, width / 2, 0, width * 0.72);
    glow.addColorStop(0, 'rgba(170,137,87,0.16)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, canvas.height);

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 38;
    ctx.shadowOffsetY = 18;
    canvasRoundRect(ctx, margin, margin, width - margin * 2, canvas.height - margin * 2, 36);
    ctx.fillStyle = '#1c1a18';
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(201,157,85,0.34)';
    ctx.lineWidth = 2;
    canvasRoundRect(ctx, margin, margin, width - margin * 2, canvas.height - margin * 2, 36);
    ctx.stroke();

    ctx.fillStyle = '#b19577';
    setFont(ctx, 18, 500);
    ctx.fillText('NOCTURNE ARCHIVE · SHORT CARD', contentX, header.eyebrowY);
    ctx.fillStyle = '#f1ece5';
    setFont(ctx, 52, 300);
    ctx.fillText('我的属性卡', contentX, header.titleY);
    setFont(ctx, 22, 400);
    ctx.fillStyle = '#d2ae72';
    const stat = `${groups.length} / ${cats.length} 类已填`;
    ctx.fillText(stat, contentX, header.statY);
    const statWidth = ctx.measureText(stat).width;
    ctx.fillStyle = '#8e8881';
    ctx.fillText(` · ${totalItems} 项`, contentX + statWidth, header.statY);
    ctx.strokeStyle = 'rgba(210,174,114,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(contentX, header.statY + 46);
    ctx.lineTo(contentX + contentW, header.statY + 46);
    ctx.stroke();

    groupLayouts.forEach((layout, index) => {
      const { cat, chosen, headerY, contentY, height, bottle } = layout;
      ctx.fillStyle = cat._accent;
      canvasRoundRect(ctx, contentX, headerY, 4, 32, 2);
      ctx.fill();
      ctx.fillStyle = '#eae4dc';
      setFont(ctx, 28, 500);
      ctx.fillText(cat.title, contentX + 18, headerY - 1);
      ctx.fillStyle = '#77716a';
      setFont(ctx, 18, 400);
      ctx.textAlign = 'right';
      ctx.fillText(String(chosen.length), contentX + contentW, headerY + 5);
      ctx.textAlign = 'left';

      if (bottle) {
        const { cols, cellW, cellH, gap } = layout;
        chosen.forEach((entry, itemIndex) => {
          const col = itemIndex % cols;
          const row = Math.floor(itemIndex / cols);
          const cellX = contentX + col * (cellW + gap);
          const cellY = contentY + row * cellH;
          canvasRoundRect(ctx, cellX, cellY, cellW, cellH - 8, 16);
          ctx.fillStyle = 'rgba(255,255,255,0.028)';
          ctx.fill();
          ctx.strokeStyle = rgba(cat._accent, 0.22);
          ctx.lineWidth = 1;
          ctx.stroke();
          drawCanvasBottle(ctx, cellX + cellW / 2 - 24, cellY + 10, 48, 82, cat._accent, cat._strong, entry.level);
          ctx.textAlign = 'center';
          ctx.fillStyle = '#d8d1c8';
          setFont(ctx, 18, 400);
          ctx.fillText(entry.item.name, cellX + cellW / 2, cellY + 102, cellW - 12);
          ctx.fillStyle = cat._accent;
          setFont(ctx, 15, 400);
          ctx.fillText(LEVEL_LABELS[entry.level], cellX + cellW / 2, cellY + 126);
          ctx.textAlign = 'left';
        });
      } else {
        const { chips, chipH, gap } = layout;
        for (const chip of chips) {
          const x = contentX + chip.x;
          const cy = contentY + chip.row * (chipH + gap);
          canvasRoundRect(ctx, x, cy, chip.chipW, chipH, chipH / 2);
          ctx.fillStyle = 'rgba(255,255,255,0.035)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.09)';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#d7d0c8';
          setFont(ctx, 20, 400);
          ctx.fillText(chip.displayName, x + 14, cy + chipH / 2);
          if (chip.suffix) {
            ctx.fillStyle = cat._accent;
            setFont(ctx, 17, 400);
            ctx.fillText(chip.suffix, x + 14 + chip.nameW + 10, cy + chipH / 2);
          }
          ctx.textBaseline = 'top';
        }
      }

      if (index < groupLayouts.length - 1) {
        ctx.strokeStyle = 'rgba(255,255,255,0.055)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(contentX, contentY + height + 14);
        ctx.lineTo(contentX + contentW, contentY + height + 14);
        ctx.stroke();
      }
    });

    if (notesLayout) {
      const { y: noteY, h: noteH, lines } = notesLayout;
      canvasRoundRect(ctx, contentX, noteY, contentW, noteH, 18);
      ctx.fillStyle = 'rgba(210,174,114,0.045)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(210,174,114,0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#b19577';
      setFont(ctx, 18, 500);
      ctx.fillText('其他', contentX + 20, noteY + 18);
      ctx.fillStyle = '#cec6bc';
      setFont(ctx, 20, 400);
      lines.forEach((line, lineIndex) => {
        ctx.fillText(line, contentX + 20, noteY + 52 + lineIndex * 30);
      });
    }

    if (preferencesLayout) {
      const { y: noteY, h: noteH, lines } = preferencesLayout;
      canvasRoundRect(ctx, contentX, noteY, contentW, noteH, 18);
      ctx.fillStyle = 'rgba(210,174,114,0.045)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(210,174,114,0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#b19577';
      setFont(ctx, 18, 500);
      ctx.fillText('偏爱', contentX + 20, noteY + 18);
      ctx.fillStyle = '#cec6bc';
      setFont(ctx, 20, 400);
      lines.forEach((line, lineIndex) => {
        ctx.fillText(line, contentX + 20, noteY + 52 + lineIndex * 30);
      });
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(contentX, footerY - 16);
    ctx.lineTo(contentX + contentW, footerY - 16);
    ctx.stroke();
    ctx.fillStyle = '#6f6a64';
    setFont(ctx, 17, 400);
    ctx.fillText(`NOCTURNE ARCHIVE · 简短版 v${shortVersion} · 18+`, contentX, footerY);
    ctx.textAlign = 'right';
    ctx.fillText(new Date().toLocaleDateString('zh-CN'), contentX + contentW, footerY);
    ctx.textAlign = 'left';

    canvas.toBlob((blob) => {
      if (!blob) {
        showToast('图片导出失败，请重试');
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `属性填涂卡-${timestamp()}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      showToast('已导出图片');
    }, 'image/png');
  }

  function timestamp() {
    const date = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
  }

  /* ---------- Toast ---------- */

  let toastTimer = 0;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  }

  /* ---------- 资料与重置 ---------- */

  function syncProfileInputs() {
    byId('hardLimits').value = profile.hardLimits;
    byId('preferences').value = profile.preferences;
  }

  function resetCard() {
    answers = {};
    profile = emptyProfile();
    viewMode = 'wizard';
    wizardIndex = 0;
    summaryDisplay = 'bottle';
    applyScaleDefaults();
    syncProfileInputs();
    paintAll();
    updateAll();
    applyViewMode();
    try { localStorage.removeItem(STORAGE_KEY); } catch (error) { /* ignore */ }
    try {
      if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    } catch (error) { /* ignore */ }
    closeModal(resetModal);
    showToast('已清空整张卡');
    window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
  }

  /* ---------- 事件绑定 ---------- */

  function bindEvents() {
    resetBtn.addEventListener('click', () => openModal(resetModal));
    summaryBtn.addEventListener('click', () => {
      if (viewMode === 'wizard' && wizardIndex < cats.length) {
        goToStep(wizardIndex + 1);
        return;
      }
      openSummary();
    });
    prevBtn.addEventListener('click', () => {
      if (viewMode === 'wizard' && wizardIndex > 0) goToStep(wizardIndex - 1);
    });

    for (const button of viewButtons) {
      button.addEventListener('click', () => setView(button.dataset.view));
    }
    categoriesEl.addEventListener('click', (event) => {
      const action = event.target.closest('[data-action]');
      if (action) {
        if (!action.disabled) onQuickAction(action);
        return;
      }
      const scaleLabel = event.target.closest('[data-scale-index]');
      if (scaleLabel) {
        onScaleLabel(scaleLabel);
        return;
      }
      const target = event.target.closest('[data-item]');
      if (target) onItemClick(target);
    });

    categoriesEl.addEventListener('input', (event) => {
      const scaleInput = event.target.closest('[data-scale-cat]');
      if (scaleInput) onScaleInput(scaleInput);
    });

    catNav.addEventListener('click', (event) => {
      const chip = event.target.closest('[data-target]');
      if (!chip) return;
      const target = byId(chip.dataset.target);
      if (!target) return;
      target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
      setActiveNav(chip.dataset.target, true);
    });

    for (const modal of [summaryModal, resetModal]) {
      modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal(modal);
      });
      modal.querySelectorAll('[data-close]').forEach((button) => {
        button.addEventListener('click', () => closeModal(modal));
      });
    }
    summaryContent.addEventListener('scroll', updateSummaryScrollHint, { passive: true });
    if ('ResizeObserver' in window) {
      new ResizeObserver(() => updateSummaryScrollHint()).observe(summaryContent);
    }

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const open = [summaryModal, resetModal].find((modal) => !modal.hidden);
      if (open) closeModal(open);
    });

    document.addEventListener('keydown', (event) => {
      if (viewMode !== 'wizard') return;
      if (!summaryModal.hidden || !resetModal.hidden) return;
      const target = event.target;
      const tag = target && target.tagName ? target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (target && target.isContentEditable)) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        wizardNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToStep(wizardIndex - 1);
      }
    });

    const limitsField = byId('hardLimits');
    limitsField.addEventListener('input', () => {
      profile.hardLimits = limitsField.value;
      updateNavState();
      saveState();
    });

    const preferencesField = byId('preferences');
    preferencesField.addEventListener('input', () => {
      profile.preferences = preferencesField.value;
      updateNavState();
      saveState();
    });

    exportImageBtn.addEventListener('click', () => {
      exportSummaryImage();
    });
    confirmReset.addEventListener('click', resetCard);

    for (const button of summaryViewButtons) {
      button.addEventListener('click', () => {
        const next = button.dataset.summaryView;
        if (next !== 'text' && next !== 'bottle') return;
        if (next === summaryDisplay) return;
        summaryDisplay = next;
        renderSummary();
      });
    }

    let scrollQueued = false;
    window.addEventListener('scroll', () => {
      if (scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(() => {
        scrollQueued = false;
        syncActiveNav(false);
      });
    }, { passive: true });

    window.addEventListener('resize', () => syncActiveNav(true));
    window.addEventListener('pagehide', () => {
      clearTimeout(saveTimer);
      persistNow();
    });
  }

  /* ---------- 初始化 ---------- */

  function init() {
    renderNav();
    renderCategories();
    loadState();
    applyScaleDefaults();
    syncProfileInputs();
    paintAll();
    bindEvents();
    updateAll();
    applyViewMode();

    syncActiveNav(true);

    byId('versionTag').textContent = `v${shortVersion}`;
    byId('footVersion').textContent = `简短版 v${shortVersion} · ${TOTAL_ITEMS} 项 · 数据仅保存在本机浏览器`;
  }

  init();
})();
