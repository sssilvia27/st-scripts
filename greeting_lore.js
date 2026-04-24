//name: 开场白管理器 (含动态世界书控制)
//description: V9.0 (Integrated)
//author: Yellows & Claude & User

(function() {
    const STORAGE_KEY_AUTO_CLOSE = 'gj_auto_close_setting_v1';
    const STORAGE_KEY_TOUR = 'gj_tour_completed_v1';
    let saveTimeout = null;
    let isSortingMode = false;
    const _loreCache = { charId: null, uids: null };
    let _isSyncing = false;

    // --- 正则定义 ---
    // 容错：冒号可为 : 或 ：，空白可为半角空格、制表符、全角空格 \u3000
    const TITLE_REGEX = /<!---?[\s\u3000]*title[\s\u3000]*[:：][\s\u3000]*(.*?)[\s\u3000]*-?-->[\r\n]*/i;
    const DESC_REGEX = /<!---?[\s\u3000]*desc[\s\u3000]*[:：][\s\u3000]*(.*?)[\s\u3000]*-?-->[\r\n]*/i;
    const LORE_REGEX = /<!---?[\s\u3000]*lore[\s\u3000]*[:：][\s\u3000]*([\d,\s\u3000,,]+)[\s\u3000]*-?-->[\r\n]*/i;
    const EXCLUDE_REGEX = /<!---?[\s\u3000]*exclude[\s\u3000]*[:：][\s\u3000]*([\d,\s\u3000,,]+)[\s\u3000]*-?-->[\r\n]*/i;
    const STYLE_ID = 'greeting-jumper-css-v8-0'; 

    $('[id^=greeting-jumper-css]').remove();
    $('head').append(`
        <style id="${STYLE_ID}">
            .swal2-popup { width: 98% !important; max-width: 1600px !important; height: 95vh !important; padding: 0 !important; border-radius: 8px !important; display: flex !important; flex-direction: column; }
            .swal2-html-container { flex-grow: 1; overflow: hidden; padding: 0 !important; margin: 0 !important; text-align: left !important; }
            *:focus { outline: none !important; box-shadow: none !important; }
            .gj-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; background: var(--smart-theme-bg); position: relative; }
            .gj-header-wrapper { flex-shrink: 0; background: var(--smart-theme-content-bg); border-bottom: 1px solid var(--smart-theme-border-color-1); display: flex; flex-direction: column; z-index: 100; }
            .gj-header-row-1 { display: flex; align-items: center; justify-content: space-between; padding: 12px 15px; border-bottom: 1px solid rgba(0,0,0,0.05); position: relative; min-height: 24px; }
            .gj-header-row-2 { display: flex; justify-content: space-between; align-items: center; padding: 8px 15px; gap: 10px; position: relative; }
            .gj-sort-controls { display: flex; gap: 8px; align-items: center; z-index: 101; position: relative; }
            .gj-sort-toggle-btn { font-size: 0.9em; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-weight: bold; border: 1px solid var(--smart-theme-border-color-2); background: transparent; color: var(--smart-theme-body-color); display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
            .gj-sort-toggle-btn:hover { background: rgba(0,0,0,0.05); }
            .gj-sort-save-btn { background: #4caf50; color: white; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-weight: bold; display: none; align-items: center; gap: 6px; pointer-events: auto !important; }
            .gj-sort-save-btn:hover { background: #43a047; }
            .gj-sort-cancel-btn { background: #757575; color: white; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-weight: bold; display: none; align-items: center; gap: 6px; pointer-events: auto !important; }
            .gj-sort-cancel-btn:hover { background: #616161; }
            .gj-sorting-active .gj-sort-toggle-btn { display: none; }
            .gj-sorting-active .gj-sort-save-btn, .gj-sorting-active .gj-sort-cancel-btn { display: flex; }
            .gj-app-title { font-weight: bold; font-size: 1.2em; color: var(--smart-theme-body-color); }
            .gj-header-right { display: flex; align-items: center; gap: 10px; }
            .gj-auto-close-wrapper { display: flex; align-items: center; gap: 4px; font-size: 0.75em; opacity: 0.7; }
            .gj-checkbox-label { cursor: pointer; user-select: none; color: var(--smart-theme-body-color); display: flex; align-items: center; gap: 4px; }
            .gj-center-tool-container { position: absolute; left: 50%; transform: translateX(-50%); }
            .gj-top-btn { background: transparent; border: 1px solid var(--smart-theme-border-color-2); color: var(--smart-theme-body-color); border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 0.9em; display: flex; align-items: center; gap: 6px; transition: all 0.2s; opacity: 0.85; font-weight: bold; }
            .gj-top-btn:hover { opacity: 1; background: var(--smart-theme-border-color-1); transform: translateY(-1px); }
            .gj-top-btn i { color: #7a9a83; }
            .gj-icon-group { display: flex; gap: 5px; margin-left: auto; }
            .gj-icon-btn { background: transparent; border: none; color: var(--smart-theme-body-color); width: 34px; height: 34px; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0.6; font-size: 1.1em; transition: all 0.2s; }
            .gj-icon-btn:hover { background: rgba(0,0,0,0.05); opacity: 1; transform: scale(1.1); color: #7a9a83; }
            .gj-scroll-area { flex-grow: 1; overflow-y: auto; padding: 10px 8px 10px 8px; scroll-behavior: smooth; position: relative; }
            .gj-sortable-placeholder { border: 2px dashed #4caf50; background: rgba(76, 175, 80, 0.1); border-radius: 6px; margin-bottom: 12px; visibility: visible !important; height: 60px !important; }
            .gj-sortable-helper { opacity: 0.9; box-shadow: 0 15px 30px rgba(0,0,0,0.3); z-index: 10000 !important; cursor: grabbing !important; transform: scale(1.01); }
            .gj-main-footer { flex-shrink: 0; padding: 10px; background: var(--smart-theme-content-bg); border-top: 1px solid var(--smart-theme-border-color-1); display: flex; justify-content: center; }
            .gj-main-close-btn { width: 100%; max-width: 400px; padding: 10px; border: 1px solid var(--smart-theme-border-color-2); background: transparent; color: var(--smart-theme-body-color); border-radius: 6px; font-weight: bold; cursor: pointer; transition: all 0.2s; }
            .gj-main-close-btn:hover { background: rgba(0,0,0,0.05); border-color: var(--smart-theme-border-color-1); }
            .gj-card { background: var(--smart-theme-content-bg); border: 1px solid var(--smart-theme-border-color-1); border-radius: 6px; margin-bottom: 12px; display: flex; flex-direction: column; flex-shrink: 0; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all 0.2s; }
            .gj-card.active { background: rgba(122, 154, 131, 0.05) !important; border-left: 4px solid #7a9a83; }
            .gj-card.sorting-enabled .gj-card-body, .gj-card.sorting-enabled .gj-card-header-tools { display: none !important; }
            .gj-card.sorting-enabled .gj-header-right { display: none; }
            .gj-card.sorting-enabled .gj-card-header-main { cursor: grab; background: rgba(0,0,0,0.02); border-bottom: none; padding: 15px 10px; border: 1px dashed rgba(0,0,0,0.1); touch-action: none !important; }
            .gj-card.sorting-enabled .gj-card-header-main:hover { background: rgba(0,0,0,0.05); }
            .gj-card.sorting-enabled .gj-card-header-main:active { cursor: grabbing; background: rgba(76, 175, 80, 0.1); border-color: #4caf50; }
            .gj-card-header-main { display: flex; align-items: flex-start; padding: 10px; gap: 10px; min-height: 30px; }
            .gj-card.editing .gj-card-header-main { border-bottom: 1px solid var(--smart-theme-border-color-1); background: rgba(0,0,0,0.02); }
            .gj-btn-max { color: var(--smart-theme-body-color); opacity: 0.4; cursor: pointer; background: transparent; border: none; padding: 2px; font-size: 0.9em; flex-shrink: 0; margin-top: 3px; }
            .gj-btn-max:hover { opacity: 1; color: #7a9a83; transform: scale(1.1); }
            .gj-title-area { flex-grow: 1; display: block; word-break: break-all; white-space: normal; line-height: 1.4; pointer-events: none; }
            .gj-title-main { font-weight: bold; font-size: 1.05em; color: var(--smart-theme-body-color); margin-right: 6px; }
            .gj-title-sub { font-size: 0.9em; color: var(--smart-theme-body-color); opacity: 0.7; }
            .gj-desc-line { font-size: 0.82em; color: var(--smart-theme-body-color); opacity: 0.5; margin-top: 2px; line-height: 1.3; }
            .gj-header-right { margin-left: auto; flex-shrink: 0; display:flex; gap:5px; }
            .gj-btn-edit-toggle { border: 1px solid transparent; background: transparent; color: var(--smart-theme-body-color); border-radius: 4px; padding: 4px 10px; cursor: pointer; font-size: 0.9em; opacity: 0.6; display: flex; align-items: center; gap: 5px; }
            .gj-btn-edit-toggle:hover { opacity: 1; background: rgba(0,0,0,0.05); }
            .gj-btn-icon-only { border: 1px solid transparent; background: transparent; color: var(--smart-theme-body-color); border-radius: 4px; width: 28px; height: 28px; cursor: pointer; font-size: 0.9em; opacity: 0.6; display: flex; align-items: center; justify-content: center; }
            .gj-btn-icon-only:hover { opacity: 1; background: rgba(0,0,0,0.05); }
            .gj-btn-save { color: #4caf50; font-weight: bold; display:none; } 
            .gj-btn-save:hover { background: rgba(76, 175, 80, 0.1); }
            .gj-btn-cancel { color: #f44336; font-weight: bold; display:none; } 
            .gj-btn-cancel:hover { background: rgba(244, 67, 54, 0.1); }
            .gj-card.editing .gj-btn-edit-toggle { display: none; }
            .gj-card.editing .gj-btn-save { display: flex; }
            .gj-card.editing .gj-btn-cancel { display: flex; }
            .gj-card-header-tools { display: none; flex-direction: column; padding: 8px 10px; gap: 8px; background: rgba(0,0,0,0.02); border-bottom: 1px solid var(--smart-theme-border-color-1); }
            .gj-card.editing .gj-card-header-tools { display: flex; }
            .gj-subtitle-input, .gj-desc-input { width: 100%; height: 32px; box-sizing: border-box; background: var(--smart-theme-bg); border: 1px solid var(--smart-theme-border-color-1); color: var(--smart-theme-body-color); padding: 0 8px; border-radius: 4px; font-size: 0.9em; }
            .gj-desc-input { opacity: 0.8; }
            .gj-tools-row { display: flex; justify-content: space-between; align-items: center; width: 100%; }
            .gj-btn-new-item { background: transparent; border: 1px dashed var(--smart-theme-border-color-2); color: #7a9a83; border-radius: 4px; padding: 4px 10px; font-size: 0.85em; cursor: pointer; display: flex; align-items: center; gap: 6px; opacity: 0.9; }
            .gj-btn-new-item:hover { background: rgba(122, 154, 131, 0.1); opacity: 1; border-color: #7a9a83; }
            .gj-tools-right { display: flex; gap: 5px; }
            .gj-action-btn { width: 28px; height: 28px; border: 1px solid var(--smart-theme-border-color-1); background: var(--smart-theme-bg); color: var(--smart-theme-body-color); border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0.7; font-size: 0.85em; }
            .gj-action-btn:hover { opacity: 1; transform: translateY(-1px); }
            .gj-action-btn.del:hover { color: #ff6b6b; border-color: #ff6b6b; }
            .gj-action-btn.lore { color: #9c27b0; border-color: #9c27b0; font-weight:bold; width: auto; padding: 0 8px; }
            .gj-action-btn.lore:hover { background: rgba(156, 39, 176, 0.1); color: #9c27b0; }
            .gj-action-btn.lore.has-data { background: #9c27b0; color: white; }
            .gj-action-btn.lore.has-data:hover { background: #7b1fa2; }
            .gj-card-body { padding: 0; display: flex; flex-direction: column; }
            .gj-textarea { width: 100%; min-height: 80px; height: 100px; resize: vertical; border: none; background: transparent; padding: 10px; color: var(--smart-theme-body-color); font-family: inherit; font-size: 0.95em; line-height: 1.5; box-sizing: border-box; outline: none; transition: height 0.2s; }
            .gj-textarea.expanded { height: 400px !important; }
            .gj-textarea[readonly] { opacity: 0.8; cursor: default; }
            .gj-textarea:not([readonly]) { background: var(--smart-theme-input-bg); }
            .gj-expand-bar { width: 100%; text-align: center; background: rgba(0,0,0,0.03); border-top: 1px solid var(--smart-theme-border-color-1); color: var(--smart-theme-body-color); font-size: 0.8em; padding: 2px 0; cursor: pointer; opacity: 0.6; transition: all 0.2s; }
            .gj-expand-bar:hover { opacity: 1; background: rgba(0,0,0,0.08); }
            .gj-footer { display: flex; gap: 10px; padding: 10px; border-top: 1px solid var(--smart-theme-border-color-1); }
            .gj-footer-btn { border-radius: 4px; font-weight: bold; font-size: 0.9em; padding: 8px 0; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; height: 36px; }
            .gj-footer-btn.insert { flex: 4; background: transparent; border: 1px solid var(--smart-theme-border-color-2); color: var(--smart-theme-body-color); opacity: 0.8; }
            .gj-footer-btn.insert:hover { background: rgba(0,0,0,0.03); opacity: 1; border-color: var(--smart-theme-body-color); }
            .gj-footer-btn.switch { flex: 6; background: transparent; border: 1px solid var(--smart-theme-border-color-2); color: var(--smart-theme-body-color); opacity: 0.9; }
            .gj-footer-btn.switch:hover { border-color: #7a9a83; color: #7a9a83; background: rgba(122, 154, 131, 0.05); }
            .gj-footer-btn.active { background: #7a9a83; color: white; border: none; cursor: pointer; opacity: 1; transition: all 0.2s; }
            .gj-footer-btn.active:hover { background: #64826b; box-shadow: 0 0 8px rgba(122,154,131,0.5); }
            .gj-lore-popup-content { display: flex; flex-direction: column; height: 60vh; text-align: left; }
            .gj-lore-list { flex-grow: 1; overflow-y: auto; border: 1px solid var(--smart-theme-border-color-1); border-radius: 4px; padding: 5px; background: rgba(0,0,0,0.02); margin-top: 10px; }
            .gj-lore-item { display: flex; align-items: center; padding: 12px 10px; border-bottom: 1px solid var(--smart-theme-border-color-1); cursor: pointer; transition: all 0.1s; background: var(--smart-theme-content-bg); margin-bottom: 2px; }
            .gj-lore-item:hover { background: rgba(0,0,0,0.05); }
            .gj-lore-item.checked { background: rgba(156, 39, 176, 0.1); border-left: 4px solid #9c27b0; }
            .gj-lore-cb { margin-right: 15px; transform: scale(1.5); cursor: pointer; }
            .gj-lore-uid { font-family: monospace; font-size: 0.9em; opacity: 0.6; width: 50px; text-align: center; margin-right: 15px; border-right: 1px solid var(--smart-theme-border-color-2); }
            .gj-lore-name { font-size: 1.05em; font-weight: bold; color: var(--smart-theme-body-color); flex-grow: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .gj-lore-item.excluded { background: rgba(244, 67, 54, 0.08); border-left: 4px solid #f44336; }
            .gj-lore-actions { display: flex; gap: 4px; flex-shrink: 0; margin-left: 8px; }
            .gj-lore-toggle { padding: 2px 8px; border-radius: 3px; font-size: 0.78em; cursor: pointer; border: 1px solid; font-weight: bold; transition: all 0.15s; white-space: nowrap; }
            .gj-lore-toggle.include { border-color: #9c27b0; color: #9c27b0; background: transparent; }
            .gj-lore-toggle.include.on { background: #9c27b0; color: white; }
            .gj-lore-toggle.exclude { border-color: #f44336; color: #f44336; background: transparent; }
            .gj-lore-toggle.exclude.on { background: #f44336; color: white; }
            .gj-lore-toggle:hover { opacity: 0.85; transform: scale(1.03); }
            .gj-lore-warn { font-size: 0.75em; color: #e6a23c; margin-left: 6px; flex-shrink: 0; white-space: nowrap; }
            .gj-lore-entry-info { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }
            .gj-lore-status-row { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 3px; align-items: center; }
            .gj-lore-dot { display: inline-flex; align-items: center; font-size: 0.7em; padding: 1px 6px; border-radius: 8px; white-space: nowrap; line-height: 1.4; }
            .gj-lore-dot.enabled { background: rgba(156,39,176,0.12); color: #9c27b0; }
            .gj-lore-dot.excluded { background: rgba(244,67,54,0.1); color: #f44336; }
            .gj-lore-dot.default { background: rgba(128,128,128,0.06); color: inherit; opacity: 0.45; }
            .gj-lore-dot.current { font-weight: bold; border: 1px dashed currentColor; }
            .gj-fullscreen-editor { display: flex; flex-direction: column; height: 100%; width: 100%; background: var(--smart-theme-bg); position: relative; }
            .gj-fs-header { padding: 8px 12px; background: var(--smart-theme-content-bg); border-bottom: 1px solid var(--smart-theme-border-color-1); display: flex; flex-direction: column; gap: 6px; transition: all 0.2s; flex-shrink: 0; }
            .gj-fs-header.collapsed .gj-fs-tools-container { display: none; }
            .gj-fs-title-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
            .gj-fs-title-input { flex-grow: 1; background: transparent; border: 1px solid transparent; font-weight: bold; font-size: 1.05em; color: var(--smart-theme-body-color); padding: 4px; border-radius: 4px; }
            .gj-fs-title-input:hover, .gj-fs-title-input:focus { border-color: var(--smart-theme-border-color-1); background: var(--smart-theme-input-bg); }
            .gj-fs-toggle-btn { background: transparent; border: none; color: var(--smart-theme-body-color); cursor: pointer; opacity: 0.6; padding: 5px; }
            .gj-fs-tools-container { display: flex; flex-direction: column; gap: 6px; padding-top: 4px; }
            .gj-fs-row { display: flex; align-items: center; gap: 6px; width: 100%; }
            .gj-fs-icon { width: 20px; text-align: center; opacity: 0.6; font-size: 0.9em; flex-shrink: 0; }
            .gj-fs-input { flex: 1; min-width: 0; height: 28px; background: var(--smart-theme-input-bg); border: 1px solid var(--smart-theme-border-color-1); color: var(--smart-theme-body-color); padding: 0 6px; border-radius: 4px; font-size: 0.9em; }
            .gj-fs-btn { width: 30px; height: 30px; border-radius: 4px; flex-shrink: 0; background: var(--smart-theme-content-bg); border: 1px solid var(--smart-theme-border-color-2); color: var(--smart-theme-body-color); cursor: pointer; display: flex; align-items: center; justify-content: center; }
            .gj-fs-btn:hover { background: var(--smart-theme-border-color-1); }
            .gj-fs-btn.replace { color: #e6a23c; border-color: #e6a23c; background: rgba(230,162,60,0.1); }
            .gj-fs-btn.replace:hover { background: #e6a23c; color: white; }
            .gj-fs-textarea-wrapper { flex-grow: 1; position: relative; overflow: hidden; display: flex; }
            .gj-fullscreen-textarea { flex-grow: 1; padding: 15px; padding-bottom: 35vh; font-size: 1.1em; line-height: 1.6; background: var(--smart-theme-bg); color: var(--smart-theme-body-color); border: none; outline: none; resize: none; width: 100%; height: 100%; box-sizing: border-box; }
            .gj-parse-container { display: flex; flex-direction: column; height: 100%; min-height: 400px; text-align: left; padding-bottom: 10px; box-sizing: border-box; }
            .gj-tabs-header { display: flex; border-bottom: 1px solid var(--smart-theme-border-color-1); margin-bottom: 10px; flex-shrink: 0; }
            .gj-tab { flex: 1; text-align: center; padding: 10px; cursor: pointer; font-weight: bold; opacity: 0.7; border-bottom: 3px solid transparent; transition: all 0.2s; }
            .gj-tab:hover { opacity: 1; background: rgba(0,0,0,0.02); }
            .gj-tab.active { opacity: 1; color: #7a9a83; border-bottom-color: #7a9a83; }
            .gj-tab-content { display: none; flex-direction: column; flex-grow: 1; overflow: hidden; }
            .gj-tab-content.active { display: flex; }
            .gj-parse-textarea-wrapper { flex-grow: 1; display: flex; flex-direction: column; margin-top: 5px; height: 100%; overflow: hidden; }
            .gj-parse-textarea { flex-grow: 1; width: 100%; resize: none; padding: 10px; background: var(--smart-theme-input-bg); border: 1px solid var(--smart-theme-border-color-1); color: var(--smart-theme-body-color); border-radius: 4px; font-size: 0.95em; outline: none; }
            .gj-parse-textarea:focus { border-color: #7a9a83; }
            .gj-parse-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; flex-shrink: 0; }
            .gj-parse-hint { font-size: 0.95em; opacity: 0.9; font-weight: bold; }
            .gj-parse-preview-header { display: flex; justify-content: space-between; align-items: center; padding: 5px 0 10px 0; border-bottom: 1px solid var(--smart-theme-border-color-1); margin-bottom: 5px; flex-shrink: 0; }
            .gj-parse-info { font-size: 0.95em; }
            .gj-parse-start-select-group { display: flex; align-items: center; gap: 5px; font-size: 0.85em; }
            .gj-parse-select { background: var(--smart-theme-input-bg); border: 1px solid var(--smart-theme-border-color-1); color: var(--smart-theme-body-color); padding: 3px 6px; border-radius: 3px; font-size: 1em; }
            .gj-parse-preview-list { flex-grow: 1; border: 1px solid var(--smart-theme-border-color-1); border-radius: 4px; overflow-y: auto; background: rgba(0,0,0,0.02); padding: 5px; margin-bottom: 10px; }
            .gj-parse-item { display: flex; gap: 8px; padding: 8px; border-bottom: 1px solid var(--smart-theme-border-color-1); align-items: flex-start; background: var(--smart-theme-content-bg); margin-bottom: 4px; border-radius: 4px; }
            .gj-parse-row-select { background: #7a9a83; color: white; padding: 4px 2px; border-radius: 3px; border: 1px solid transparent; font-size: 0.8em; white-space: nowrap; font-weight: bold; margin-top: 2px; cursor: pointer; outline: none; max-width: 90px; }
            .gj-parse-row-select.error { background: #d32f2f; border-color: #ff6b6b; animation: shake 0.3s; }
            .gj-parse-row-textarea { flex: 1; background: var(--smart-theme-input-bg); border: 1px solid var(--smart-theme-border-color-1); color: var(--smart-theme-body-color); padding: 6px; font-size: 0.95em; border-radius: 4px; resize: vertical; min-height: 42px; line-height: 1.4; }
            .gj-parse-row-textarea:focus { border-color: #7a9a83; outline: none; }
            .gj-parse-custom-footer { display: flex; gap: 10px; justify-content: flex-end; align-items: center; margin-top: auto; flex-shrink: 0; }
            .gj-custom-btn { padding: 8px 16px; border-radius: 4px; border: 1px solid var(--smart-theme-border-color-2); background: transparent; color: var(--smart-theme-body-color); cursor: pointer; font-size: 0.95em; display: flex; align-items: center; justify-content: center; gap: 6px; }
            .gj-custom-btn:hover { background: rgba(0,0,0,0.05); }
            .gj-custom-btn.primary { background: #7a9a83; color: white; border: none; }
            .gj-custom-btn.primary:hover { filter: brightness(1.1); }
            .gj-custom-btn.danger { background: #d32f2f; color: white; border: none; }
            .gj-custom-btn.danger:hover { filter: brightness(1.1); }
            .gj-custom-btn.success { background: #4caf50; color: white; border: none; }
            .gj-custom-btn.success:hover { filter: brightness(1.1); }
            .gj-progress-popup { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 20px; }
            .gj-spinner { width: 40px; height: 40px; border: 4px solid rgba(0,0,0,0.1); border-top-color: #7a9a83; border-radius: 50%; animation: gj-spin 1s linear infinite; }
            @keyframes gj-spin { to { transform: rotate(360deg); } }
            .gj-progress-text { font-size: 1.2em; font-weight: bold; color: var(--smart-theme-body-color); }
            .gj-progress-sub { font-size: 0.9em; opacity: 0.7; color: var(--smart-theme-body-color); }
            .gj-search-results-container { padding-bottom: 120px; max-height: 80vh !important; overflow-y: auto; }
            .gj-search-top-bar { padding: 0 5px 8px 5px; border-bottom: 1px solid var(--smart-theme-border-color-1); margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 5px; }
            .gj-search-group { margin-bottom: 8px; border: 1px solid var(--smart-theme-border-color-1); border-radius: 4px; overflow: hidden; }
            .gj-search-header { background: rgba(0,0,0,0.05); padding: 5px 10px; font-weight: bold; font-size: 0.9em; display: flex; justify-content: space-between; align-items: center; color: #7a9a83; }
            .gj-search-row { padding: 6px 10px; border-top: 1px solid var(--smart-theme-border-color-1); display: flex; flex-direction: column; gap: 4px; }
            .gj-search-context { font-size: 0.9em; opacity: 0.9; white-space: pre-wrap; line-height: 1.4; color: var(--smart-theme-body-color); background: rgba(0,0,0,0.02); padding: 4px; border-radius: 3px; font-family: monospace; }
            .gj-highlight { background: rgba(255, 235, 59, 0.4); color: inherit; font-weight: bold; padding: 0 1px; border-radius: 2px; }
            .gj-search-actions { display: flex; gap: 8px; justify-content: flex-end; width: 100%; margin-top: 2px; }
            .gj-search-btn { padding: 3px 10px; font-size: 0.85em; border-radius: 3px; border: 1px solid var(--smart-theme-border-color-2); background: transparent; color: var(--smart-theme-body-color); cursor: pointer; }
            .gj-search-btn:hover { background: rgba(0,0,0,0.05); }
            .gj-search-btn.edit { color: #5b8db8; border-color: #5b8db8; font-weight: bold; }
            .gj-search-btn.replace-all-global { background: #d32f2f; color: white; border: none; padding: 4px 8px; border-radius: 3px; }
            .gj-search-btn.replace { color: #e6a23c; border-color: #e6a23c; }
            .gj-back-home-btn { display: flex; align-items: center; justify-content: center; gap: 6px; margin: 15px auto 5px; padding: 8px 20px; border: 1px solid #7a9a83; border-radius: 6px; background: rgba(122,154,131,0.08); color: #7a9a83; cursor: pointer; font-weight: bold; font-size: 0.95em; transition: all 0.2s; max-width: 200px; }
            .gj-back-home-btn:hover { background: rgba(122,154,131,0.2); transform: translateY(-1px); }
            .gj-homebtn-dl { display: flex; flex-direction: column; gap: 10px; padding: 6px 4px; color: var(--smart-theme-body-color); }
            .gj-homebtn-dl ol { margin: 6px 0; }
            .gj-homebtn-preview-inline { display: flex; align-items: center; justify-content: center; }
            .gj-tour-panel { position: absolute; background: rgba(0,0,0,0.6); z-index: 10000; pointer-events: auto; transition: all 0.3s ease; }
            .gj-tour-glow { position: absolute; z-index: 10000; border: 2px solid rgba(122,154,131,0.8); border-radius: 6px; pointer-events: none; box-shadow: 0 0 20px rgba(122,154,131,0.4), inset 0 0 8px rgba(122,154,131,0.15); transition: all 0.3s ease; }
            .gj-tour-tooltip { position: absolute; z-index: 10001; isolation: isolate; border: 2px solid #7a9a83; border-radius: 10px; padding: 18px 22px; max-width: 400px; min-width: 290px; box-shadow: 0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(122,154,131,0.2); color: var(--smart-theme-body-color, #ddd); animation: gj-tour-fadein 0.25s ease; pointer-events: auto; }
            .gj-tour-tooltip::before { content: ''; position: absolute; inset: 0; border-radius: inherit; background: var(--smart-theme-bg, #1e1e2e); z-index: -2; }
            .gj-tour-tooltip::after { content: ''; position: absolute; inset: 0; border-radius: inherit; background: var(--smart-theme-content-bg, rgba(255,255,255,0.06)); z-index: -1; }
            @keyframes gj-tour-fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            .gj-tour-title { font-weight: bold; font-size: 1.1em; margin-bottom: 8px; color: #7a9a83; }
            .gj-tour-desc { font-size: 0.95em; line-height: 1.6; margin-bottom: 14px; }
            .gj-tour-footer { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
            .gj-tour-step-info { font-size: 0.8em; opacity: 0.5; white-space: nowrap; }
            .gj-tour-btns { display: flex; gap: 8px; margin-left: auto; }
            .gj-tour-btn { padding: 6px 14px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.9em; border: 1px solid var(--smart-theme-border-color-2, rgba(122,154,131,0.3)); background: transparent; color: var(--smart-theme-body-color, #ddd); transition: all 0.2s; }
            .gj-tour-btn:hover { background: rgba(122,154,131,0.1); }
            .gj-tour-btn.primary { background: #7a9a83; color: white; border: none; }
            .gj-tour-btn.primary:hover { filter: brightness(1.1); }
            .gj-tour-role-btns { display: flex; gap: 12px; margin-top: 14px; }
            .gj-tour-role-btn { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 18px 12px; border: 2px solid var(--smart-theme-border-color-2, rgba(122,154,131,0.3)); border-radius: 8px; background: transparent; color: var(--smart-theme-body-color, #ddd); cursor: pointer; transition: all 0.2s; }
            .gj-tour-role-btn:hover { border-color: #7a9a83; background: rgba(122,154,131,0.1); transform: translateY(-2px); }
            .gj-tour-role-btn i { font-size: 1.8em; color: #7a9a83; }
            .gj-tour-role-title { font-weight: bold; font-size: 1.05em; }
            .gj-tour-role-sub { font-size: 0.8em; opacity: 0.6; }
            .gj-help-content { padding: 15px; text-align: left; color: var(--smart-theme-body-color); max-height: 65vh; overflow-y: auto; }
            .gj-help-section { margin-bottom: 14px; }
            .gj-help-section h3 { font-size: 1.05em; color: #7a9a83; margin: 0 0 6px 0; display: flex; align-items: center; gap: 6px; }
            .gj-help-section p { font-size: 0.9em; line-height: 1.5; opacity: 0.85; margin: 0 0 4px 0; }
            .gj-help-divider { border: none; border-top: 1px solid var(--smart-theme-border-color-1); margin: 12px 0; }
            .gj-dir-guide { background: rgba(122,154,131,0.1); border: 1px solid rgba(122,154,131,0.3); border-radius: 6px; padding: 10px 14px; margin-bottom: 10px; font-size: 0.9em; line-height: 1.6; display: flex; align-items: flex-start; gap: 8px; color: var(--smart-theme-body-color); }
            .gj-dir-guide i { color: #7a9a83; margin-top: 3px; flex-shrink: 0; }
            .gj-regex-chooser { display: flex; flex-direction: column; gap: 14px; padding: 6px; color: var(--smart-theme-body-color); text-align: left; }
            .gj-regex-card { border: 1px solid var(--smart-theme-border-color-1); border-radius: 8px; padding: 16px; cursor: default; transition: border-color 0.2s; }
            .gj-regex-card:hover { border-color: #7a9a83; }
            .gj-regex-card-title { font-weight: bold; font-size: 1em; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; text-align: left; }
            .gj-regex-card-title i { color: #7a9a83; }
            .gj-regex-card-desc { font-size: 0.88em; opacity: 0.75; line-height: 1.5; margin-bottom: 12px; text-align: left; }
            .gj-regex-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
            .gj-gen-regex-btn { font-size: 0.85em !important; padding: 6px 12px !important; border: 1px solid var(--smart-theme-border-color-2); border-radius: 4px; cursor: pointer; background: linear-gradient(135deg, #7a9a83, #5a8a6a); color: white; display: flex; align-items: center; gap: 6px; font-weight: bold; transition: all 0.2s; white-space: nowrap; }
            .gj-gen-regex-btn:hover { filter: brightness(1.15); }
            .gj-adv-beauty-container { display: flex; flex-direction: column; gap: 12px; padding: 10px; color: var(--smart-theme-body-color); position: relative; max-height: 75vh; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; }
            .gj-adv-header-row { display: flex; align-items: center; justify-content: space-between; }
            .gj-adv-config-btn { background: transparent; border: 1px solid var(--smart-theme-border-color-1, #444); color: var(--smart-theme-body-color); padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.85em; opacity: 0.6; transition: all 0.2s; }
            .gj-adv-config-btn:hover { opacity: 1; border-color: #7a9a83; }
            .gj-adv-input { width: 100%; min-height: 250px; resize: vertical; background: var(--smart-theme-input-bg); color: var(--smart-theme-body-color); border: 1px solid var(--smart-theme-border-color-1); border-radius: 4px; padding: 10px; font-size: 0.95em; box-sizing: border-box; outline: none; }
            .gj-adv-input:focus { border-color: #7a9a83; }
            .gj-adv-input-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; flex-shrink: 0; flex-wrap: wrap; }
            .gj-adv-editor-section { display: flex; flex-direction: column; gap: 4px; }
            .gj-adv-label { font-weight: bold; font-size: 0.9em; color: #7a9a83; display: flex; align-items: center; gap: 6px; }
            .gj-adv-result-header { display: flex; justify-content: space-between; align-items: center; }
            .gj-adv-result-editor { width: 100%; min-height: 200px; max-height: 45vh; resize: vertical; background: var(--smart-theme-input-bg); color: var(--smart-theme-body-color); border: 1px solid var(--smart-theme-border-color-1); border-radius: 4px; padding: 10px; font-size: 0.95em; box-sizing: border-box; outline: none; }
            .gj-adv-result-editor:focus { border-color: #7a9a83; }
            .gj-adv-preview { border: 1px solid var(--smart-theme-border-color-1, #444); border-radius: 6px; min-height: 120px; overflow: visible; background: #fff; position: relative; }
            .gj-adv-preview-header { display: flex; align-items: center; justify-content: space-between; }
            .gj-adv-fullscreen-btn { background: transparent; border: none; color: var(--smart-theme-body-color); cursor: pointer; opacity: 0.5; font-size: 0.85em; padding: 2px 6px; transition: opacity 0.2s; }
            .gj-adv-fullscreen-btn:hover { opacity: 1; }
            .gj-adv-fs-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); display: flex; flex-direction: column; z-index: 2147483647; }
            .gj-adv-fs-topbar { display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; background: rgba(0,0,0,0.6); color: #fff; flex-shrink: 0; }
            .gj-adv-fs-topbar span { font-size: 0.95em; font-weight: bold; }
            .gj-adv-fs-close { background: transparent; border: 1px solid rgba(255,255,255,0.3); color: #fff; padding: 4px 14px; border-radius: 4px; cursor: pointer; font-size: 0.9em; transition: all 0.2s; }
            .gj-adv-fs-close:hover { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.6); }
            .gj-adv-fs-iframe { flex-grow: 1; width: 100%; border: none; background: #fff; }
            .gj-adv-refine-bar { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
            .gj-adv-refine-input { flex: 1 1 0; min-width: 0; background: var(--smart-theme-input-bg); color: var(--smart-theme-body-color); border: 1px solid var(--smart-theme-border-color-1); border-radius: 4px; padding: 8px 12px; font-size: 0.9em; box-sizing: border-box; outline: none; }
            .gj-adv-refine-input:focus { border-color: #7a9a83; }
            .gj-adv-refine-input::placeholder { opacity: 0.4; }
            .gj-adv-refine-btn { padding: 8px 12px !important; flex-shrink: 0; }
            .gj-adv-loading { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; border-radius: 8px; z-index: 10; }
            .gj-adv-spinner { width: 36px; height: 36px; border: 3px solid rgba(122,154,131,0.3); border-top-color: #7a9a83; border-radius: 50%; animation: gj-spin 0.8s linear infinite; }
            @keyframes gj-spin { to { transform: rotate(360deg); } }
            .gj-adv-loading-text { color: #ccc; font-size: 0.9em; }
            .gj-stream-bar { display: none; margin: 4px 0 8px; padding: 8px 12px; border-radius: 6px; background: linear-gradient(135deg, rgba(122,154,131,0.12), rgba(122,154,131,0.04)); border: 1px solid rgba(122,154,131,0.35); display: flex; align-items: center; gap: 10px; font-size: 0.88em; }
            .gj-stream-bar.active { display: flex; animation: gj-stream-glow 1.8s ease-in-out infinite; }
            @keyframes gj-stream-glow { 0%,100% { box-shadow: 0 0 0 0 rgba(122,154,131,0.35); } 50% { box-shadow: 0 0 0 4px rgba(122,154,131,0.08); } }
            .gj-stream-dot { width: 10px; height: 10px; border-radius: 50%; background: #7a9a83; flex-shrink: 0; position: relative; animation: gj-stream-pulse 1s ease-in-out infinite; }
            .gj-stream-dot::after { content: ''; position: absolute; inset: -4px; border-radius: 50%; border: 2px solid rgba(122,154,131,0.5); animation: gj-stream-ring 1.6s ease-out infinite; }
            @keyframes gj-stream-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.3); opacity: 0.7; } }
            @keyframes gj-stream-ring { 0% { transform: scale(0.8); opacity: 0.9; } 100% { transform: scale(2); opacity: 0; } }
            .gj-stream-text { flex: 1; color: var(--smart-theme-body-color); font-weight: 600; letter-spacing: 0.2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .gj-stream-count { font-weight: normal; opacity: 0.55; font-size: 0.85em; margin-left: 6px; font-variant-numeric: tabular-nums; }
            .gj-stream-progress { flex: 1; min-width: 80px; height: 4px; background: rgba(122,154,131,0.15); border-radius: 2px; overflow: hidden; position: relative; }
            .gj-stream-progress::after { content: ''; position: absolute; top: 0; left: -40%; width: 40%; height: 100%; background: linear-gradient(90deg, transparent, #7a9a83, transparent); animation: gj-stream-slide 1.2s linear infinite; }
            @keyframes gj-stream-slide { to { left: 100%; } }
            .gj-stream-cancel { padding: 4px 12px; border-radius: 4px; border: 1px solid rgba(229,115,115,0.6); background: rgba(229,115,115,0.12); color: #e57373; cursor: pointer; font-size: 0.85em; font-weight: 600; transition: all 0.15s; flex-shrink: 0; }
            .gj-stream-cancel:hover { background: rgba(229,115,115,0.25); border-color: #e57373; color: #fff; }
            .gj-stream-cancel:active { transform: scale(0.96); }
            /* PC 端：让 ST Popup 包裹我们扩展内容时变宽，贴近原生开场白面板的宽度 */
            @media (min-width: 769px) {
                dialog.popup:has(.gj-wrapper),
                dialog.popup:has(.gj-parse-container),
                dialog.popup:has(.gj-adv-beauty-container),
                dialog.popup:has(.gj-lore-popup-content),
                dialog.popup:has(.gj-prompt-container) {
                    width: 85vw !important;
                    max-width: 900px !important;
                    height: 85vh !important;
                    max-height: 85vh !important;
                    box-sizing: border-box !important;
                }
                dialog.popup:has(.gj-wrapper) .popup-content,
                dialog.popup:has(.gj-parse-container) .popup-content,
                dialog.popup:has(.gj-adv-beauty-container) .popup-content,
                dialog.popup:has(.gj-lore-popup-content) .popup-content,
                dialog.popup:has(.gj-prompt-container) .popup-content {
                    width: 100% !important;
                    max-width: 100% !important;
                    height: 100% !important;
                    display: flex !important;
                    flex-direction: column !important;
                }
                dialog.popup:has(.gj-wrapper) .popup-content > div,
                dialog.popup:has(.gj-parse-container) .popup-content > div,
                dialog.popup:has(.gj-adv-beauty-container) .popup-content > div,
                dialog.popup:has(.gj-lore-popup-content) .popup-content > div,
                dialog.popup:has(.gj-prompt-container) .popup-content > div {
                    flex: 1 1 auto;
                    min-height: 0;
                }
            }
            @media (max-width: 768px) {
                .gj-adv-beauty-container { max-height: 80vh; padding: 6px; gap: 8px; }
                .gj-adv-phase { display: flex; flex-direction: column; gap: 8px; }
                .gj-adv-input { min-height: 120px; }
                .gj-adv-result-editor { min-height: 80px; max-height: 20vh; font-size: 0.85em; padding: 6px; }
                .gj-adv-preview { min-height: 60px; max-height: 22vh; overflow: auto; }
                .gj-adv-refine-bar { gap: 4px; overflow: hidden; }
                .gj-adv-refine-input { padding: 6px 8px; font-size: 0.85em; }
                .gj-adv-refine-btn { padding: 6px 10px !important; font-size: 0.85em; }
                .gj-adv-input-footer { gap: 6px; }
                .gj-adv-input-footer .gj-custom-btn { font-size: 0.85em; padding: 6px 10px; }
                .gj-adv-label { font-size: 0.82em; }
                .gj-adv-editor-section { gap: 4px; }
            }
            @media (max-width: 480px) {
                .gj-adv-beauty-container { padding: 4px; gap: 6px; }
                .gj-adv-result-editor { min-height: 60px; max-height: 15vh; font-size: 0.8em; padding: 4px; }
                .gj-adv-preview { min-height: 50px; max-height: 18vh; }
                .gj-adv-refine-input { padding: 5px 6px; font-size: 0.8em; }
                .gj-adv-refine-btn { padding: 5px 8px !important; font-size: 0.8em; }
                .gj-adv-input-footer .gj-custom-btn { font-size: 0.8em; padding: 5px 8px; }
                .gj-adv-fullscreen-btn { font-size: 0.75em; }
            }
            .gj-upload-zone { display: block; border: 1px solid var(--smart-theme-border-color-1); border-radius: 8px; padding: 28px 20px; text-align: center; cursor: pointer; transition: all 0.2s; background: rgba(0,0,0,0.02); color: var(--smart-theme-body-color); }
            .gj-upload-zone:hover { border-color: #7a9a83; background: rgba(122,154,131,0.05); }
            .gj-upload-zone.dragover { border-color: #7a9a83; background: rgba(122,154,131,0.12); transform: scale(1.01); }
            .gj-upload-zone i.gj-upload-icon { font-size: 2em; opacity: 0.4; display: block; margin-bottom: 10px; pointer-events: none; }
            .gj-upload-zone .gj-upload-hint { font-size: 0.9em; opacity: 0.6; margin-top: 6px; pointer-events: none; }
            .gj-upload-zone .gj-upload-main { pointer-events: none; }
            .gj-sb-source-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--smart-theme-border-color-1); margin-bottom: 8px; }
            .gj-sb-source-tab, .gj-sb-wb-tab { flex: 1; padding: 8px 12px; border: none; background: transparent; color: var(--smart-theme-body-color); cursor: pointer; font-size: 0.9em; border-bottom: 2px solid transparent; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 6px; opacity: 0.6; }
            .gj-sb-source-tab:hover, .gj-sb-wb-tab:hover { opacity: 0.9; background: rgba(122,154,131,0.05); }
            .gj-sb-source-tab.active, .gj-sb-wb-tab.active { opacity: 1; border-bottom-color: #7a9a83; color: #7a9a83; font-weight: 600; }
            .gj-sb-source-panel { }
            .gj-sb-file-card { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; border: 2px solid #7a9a83; background: rgba(122,154,131,0.08); color: var(--smart-theme-body-color); }
            .gj-sb-file-card i.gj-fc-icon { font-size: 1.8em; color: #7a9a83; flex-shrink: 0; }
            .gj-sb-file-card .gj-fc-info { flex: 1; min-width: 0; text-align: left; }
            .gj-sb-file-card .gj-fc-name { font-weight: bold; font-size: 0.95em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .gj-sb-file-card .gj-fc-detail { font-size: 0.8em; opacity: 0.6; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .gj-sb-file-card .gj-fc-remove { background: none; border: none; color: var(--smart-theme-body-color); opacity: 0.4; cursor: pointer; padding: 4px; font-size: 1.1em; }
            .gj-sb-file-card .gj-fc-remove:hover { opacity: 0.8; color: #e74c3c; }
            .gj-sb-worldbook { width: 100%; min-height: 60px; resize: vertical; background: var(--smart-theme-input-bg); border: 1px solid var(--smart-theme-border-color-1); color: var(--smart-theme-body-color); border-radius: 4px; padding: 8px; font-size: 0.9em; font-family: monospace; box-sizing: border-box; outline: none; transition: min-height 0.25s ease, height 0.25s ease; }
            .gj-sb-worldbook:focus,
            .gj-sb-worldbook.gj-sb-expanded { border-color: #7a9a83; }
            .gj-sb-worldbook.gj-sb-expanded { min-height: 220px !important; height: 220px; }
            .gj-sb-upgrade-cta { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px 20px; border: none; border-radius: 8px; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; font-size: 1.05em; font-weight: bold; cursor: pointer; transition: all 0.2s; }
            .gj-sb-upgrade-cta:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99,102,241,0.3); }
            .gj-sb-upgrade-cta:disabled { opacity: 0.4; cursor: not-allowed; filter: none; transform: none; }
            .gj-sb-result-banner { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 8px; font-weight: bold; font-size: 0.95em; }
            .gj-sb-result-banner.success { background: rgba(122,154,131,0.12); border: 1px solid #7a9a83; color: #7a9a83; }
            .gj-sb-result-banner .gj-sb-suggested-regex { font-weight: normal; font-size: 0.85em; opacity: 0.7; font-family: monospace; margin-left: 4px; word-break: break-all; }
            .gj-sb-btn-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 8px; }
            .gj-sb-btn-row .gj-custom-btn { padding: 8px 16px; border-radius: 6px; font-size: 0.9em; }
        </style>
    `);

    // --- 辅助功能 ---
    function isMobile() { return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent); }

    function parseMessageContent(raw) {
        if (!raw) return { title: "", desc: "", lore: [], exclude: [], body: "" };
        let body = raw;
        let title = "", desc = "";
        let lore = [], exclude = [];
        const titleMatch = body.match(TITLE_REGEX);
        if (titleMatch) { title = titleMatch[1].trim(); body = body.replace(titleMatch[0], ''); }
        const descMatch = body.match(DESC_REGEX);
        if (descMatch) { desc = descMatch[1].trim(); body = body.replace(descMatch[0], ''); }
        const loreMatch = body.match(LORE_REGEX);
        if (loreMatch) { lore = loreMatch[1].split(/[,，]/).map(s => parseInt(s.trim())).filter(n => !isNaN(n)); body = body.replace(loreMatch[0], ''); }
        const excludeMatch = body.match(EXCLUDE_REGEX);
        if (excludeMatch) { exclude = excludeMatch[1].split(/[,，]/).map(s => parseInt(s.trim())).filter(n => !isNaN(n)); body = body.replace(excludeMatch[0], ''); }
        return { title, desc, lore, exclude, body };
    }

    function composeMessageContent(title, loreArray, body, desc, excludeArray) {
        if (typeof loreArray === 'string' && body === undefined) { body = loreArray; loreArray = []; desc = ""; excludeArray = []; }
        let prefix = "";
        if (title && title.trim()) prefix += `<!-- title: ${title.trim()} -->\n`;
        if (desc && desc.trim()) prefix += `<!-- desc: ${desc.trim()} -->\n`;
        if (loreArray && Array.isArray(loreArray) && loreArray.length > 0) prefix += `<!-- lore: ${loreArray.join(',') } -->\n`;
        if (excludeArray && Array.isArray(excludeArray) && excludeArray.length > 0) prefix += `<!-- exclude: ${excludeArray.join(',')} -->\n`;
        return prefix + body;
    }

    async function forceSave(charId) {
        _loreCache.charId = null; _loreCache.uids = null;
        if (saveTimeout) clearTimeout(saveTimeout);
        try {
            const charObj = SillyTavern.characters[charId];
            if (charObj) {
                if (!charObj.data) charObj.data = {};
                if (!Array.isArray(charObj.data.alternate_greetings)) charObj.data.alternate_greetings = [];
                charObj.data.alternate_greetings = charObj.data.alternate_greetings.map(x => (x === null || x === undefined) ? "" : String(x));
            }
            if (typeof SillyTavern.saveCharacter === 'function') { await SillyTavern.saveCharacter(Number(charId)); await new Promise(r => setTimeout(r, 200)); } 
            else if (typeof window.saveCharacterDebounced === 'function') { await window.saveCharacterDebounced(); await new Promise(r => setTimeout(r, 2000)); }
        } catch (e) { console.error("Save failed:", e); toastr.error("保存失败，请检查控制台"); }
    }

    // 覆盖角色卡中的某条局部正则脚本（scoped regex）
    // 原理：就地改 charObj.data.extensions.regex_scripts，然后触发原生 description 输入框的
    //     input 事件，让 ST 的自动保存顺带把我们改过的 extensions 一起存盘。
    // idx: 要覆盖的脚本索引；patch: { replaceString?, findRegex?, scriptName? }
    // 返回：{ ok: true } 或 { ok: false, reason: '...' }
    async function overwriteScopedRegex(idx, patch) {
        try {
            const charId = SillyTavern.characterId;
            if (charId === undefined || charId === null) return { ok: false, reason: "未选中角色卡" };

            const charObj = SillyTavern.characters?.[charId] || window.characters?.[charId];
            if (!charObj) return { ok: false, reason: "找不到当前角色对象" };
            if (!charObj.data) charObj.data = {};
            if (!charObj.data.extensions) charObj.data.extensions = {};

            const scripts = charObj.data.extensions.regex_scripts;
            if (!Array.isArray(scripts)) return { ok: false, reason: "角色卡内没有局部正则脚本数组" };
            if (idx < 0 || idx >= scripts.length) return { ok: false, reason: `索引 ${idx} 越界（共 ${scripts.length} 条）` };

            // 重新生成数组引用 + 条目引用，强制 ST 的保存 diff 机制识别到变化
            const updated = { ...scripts[idx], ...patch };
            charObj.data.extensions.regex_scripts = scripts.map((s, i) => (i === idx ? updated : s));

            // 触发原生角色输入框的 input 事件，让 ST 的自动保存把整个 char 存盘（含我们刚改的 extensions）
            const $target = $('#description_textarea, textarea[name="description"]').first();
            if (!$target.length) return { ok: false, reason: "未找到原生 description 输入框，无法触发保存" };
            const cur = $target.val();
            $target.val(cur + ' ').trigger('input').trigger('change');
            await new Promise(r => setTimeout(r, 400));
            $target.val(cur).trigger('input').trigger('change');
            await new Promise(r => setTimeout(r, 2500));

            // 校验
            const verifyItem = (SillyTavern.characters?.[charId] || window.characters?.[charId])
                ?.data?.extensions?.regex_scripts?.[idx];
            if (!verifyItem) return { ok: false, reason: "保存后读回失败" };
            if (patch.replaceString && verifyItem.replaceString !== patch.replaceString) {
                return { ok: false, reason: "保存后 replaceString 未更新（内存已改但磁盘可能未同步）" };
            }
            if (patch.findRegex && verifyItem.findRegex !== patch.findRegex) {
                return { ok: false, reason: "保存后 findRegex 未更新" };
            }
            return { ok: true };
        } catch (e) {
            console.error('[GJ] overwriteScopedRegex error:', e);
            return { ok: false, reason: (e && e.message) ? e.message : String(e) };
        }
    }

    function updateNativeCharacterUI(newText) {
        if (typeof newText !== 'string') return;
        const $nativeInput = $('textarea[name="first_mes"], #first_mes');
        if ($nativeInput.length) {
            if ($nativeInput.val() === newText) return;
            $nativeInput.val(newText).trigger('input').trigger('change');
        }
    }

    // --- 滚动逻辑 ---
    function scrollToCursorPC($textarea, pos) {
        if (!$textarea || $textarea.length === 0) return;
        const textarea = $textarea[0]; const val = textarea.value; const textBefore = val.substring(0, pos);
        const lines = textBefore.split("\n").length; const lineHeight = 24; const containerHeight = textarea.clientHeight;
        const targetScroll = Math.max(0, lines * lineHeight - (containerHeight * 0.33)); textarea.scrollTop = targetScroll;
    }

    function scrollToCursorMobile($textarea, pos) {
        if (!$textarea || $textarea.length === 0) return;
        const textarea = $textarea[0]; const div = document.createElement('div'); const computed = window.getComputedStyle(textarea);
        const stylesToCopy = ['font-family', 'font-size', 'font-weight', 'font-style', 'letter-spacing', 'line-height', 'text-transform', 'word-spacing', 'text-indent', 'white-space', 'word-wrap', 'word-break', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border-width', 'box-sizing', 'width'];
        stylesToCopy.forEach(prop => div.style[prop] = computed[prop]);
        div.style.position = 'absolute'; div.style.visibility = 'hidden'; div.style.top = '0'; div.style.left = '-9999px'; div.style.overflow = 'hidden'; div.style.height = 'auto';
        div.textContent = textarea.value.substring(0, pos); const span = document.createElement('span'); span.textContent = '|'; div.appendChild(span);
        document.body.appendChild(div); const cursorTop = span.offsetTop + parseInt(computed['paddingTop']);
        const targetScroll = Math.max(0, cursorTop - 60); textarea.scrollTop = targetScroll; document.body.removeChild(div);
    }
    const performScroll = ($textarea, pos) => { if (isMobile()) scrollToCursorMobile($textarea, pos); else scrollToCursorPC($textarea, pos); };

    // --- 还原旧版正则格式 ---
    const generateRegexJson = (format) => {
        const baseHtml = `<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<style>\n    .prologue-container { font-family: sans-serif; padding: 15px; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid #e0e0e0; color: #333333; }\n    .prologue-title { font-weight: bold; margin-bottom: 12px; font-size: 1.1em; color: #333333; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px; }\n    .prologue-grid { display: flex; flex-direction: column; gap: 8px; }\n    .prologue-btn { background: #f8f9fa; border: 1px solid #e9ecef; padding: 10px 12px; border-radius: 6px; cursor: pointer; text-align: left; transition: all 0.2s; color: #495057; }\n    .prologue-btn:hover { background: #e2e6ea; border-color: #ced4da; color: #212529; transform: translateX(2px); }\n    .btn-index { font-weight: bold; margin-right: 8px; color: #7a9a83; }\n    .btn-desc { display: block; font-size: 0.82em; opacity: 0.55; margin-top: 3px; padding-left: 2px; color: #6c757d; }\n</style>\n</head>\n<body>\n<template id="prologue-data">$1</template>\n<template id="prologue-item-tpl"><div class="prologue-btn"><span class="btn-index">#{INDEX}</span> {TITLE}<span class="btn-desc">{DESC}</span></div></template>\n<div class="prologue-container">\n    <div class="prologue-title">开场白目录</div>\n    <div id="prologue-list" class="prologue-grid"></div>\n</div>\n</body>\n</html>`;
        const withScript = injectNavScript(baseHtml);
        const replaceStr = '```html\n' + withScript + '\n```';
        return { "id": "feca6226-9be4-474d-acb0-b5a622993a2e", "scriptName": `开场白跳转`, "findRegex": "<greetings>([\\s\\S]*)</greetings>", "replaceString": replaceStr, "trimStrings": [], "placement": [2], "disabled": false, "markdownOnly": true, "promptOnly": false, "runOnEdit": true, "substituteRegex": 0, "minDepth": 0, "maxDepth": 0 };
    };

    const downloadRegex = (format) => {
        const json = generateRegexJson(format); const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json, null, 2));
        const anchor = document.createElement('a'); anchor.href = dataStr; anchor.download = `Regex_Greeting_Jumper_White.json`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); toastr.success("正则脚本已下载，请在扩展中导入");
    };

    // --- 高级美化融合 (AI-Powered) ---
    const AI_CONFIG_KEY = 'gj_ai_config';
    const NAVIGATION_SCRIPT = `
<scr` + `ipt>
(async function() {
    var waitForHelper = function() { return new Promise(function(resolve) {
        if (window.TavernHelper) return resolve(window.TavernHelper);
        var timer = setInterval(function() { if (window.TavernHelper) { clearInterval(timer); resolve(window.TavernHelper); } }, 100);
    }); };
    function buildTitleMap() {
        try {
            var charObj = SillyTavern.characters[SillyTavern.characterId];
            if (!charObj) return {};
            // 容错：title 后可为英文冒号或中文冒号，前后允许任意空白（含全角）
            var tr = /<!---?[\\s\\u3000]*title[\\s\\u3000]*[:：][\\s\\u3000]*(.*?)[\\s\\u3000]*-?-->/i;
            var map = {};
            var normKey = function(s) { return s.replace(/[\\s\\u3000]+/g, ' ').trim(); };
            var ext = function(raw) { if (!raw) return ''; var m = raw.match(tr); return m ? normKey(m[1]) : ''; };
            var t0 = ext(charObj.first_mes); if (t0) map[t0] = 0;
            (charObj.data && charObj.data.alternate_greetings || []).forEach(function(g, i) { var t = ext(g); if (t) map[t] = i + 1; });
            return map;
        } catch(e) { return {}; }
    }
    try {
        var helper = await waitForHelper();
        var tpl = document.getElementById('prologue-data');
        if (!tpl) return;
        // 规范化空白：把全角空格、不间断空格都当作普通空格处理
        var rawText = tpl.innerHTML.replace(/[\\u3000\\u00A0]/g, ' ').trim();
        // 容错：编号分隔符接受 . 。 、 ． : ： ) ） ；标题/描述分隔符接受半角 | 或全角 ｜
        var regex = /^[\\s]*(\\d+)[\\s]*[.。、．:：)）][\\s]*(.+?)(?:[\\s]*[|｜][\\s]*(.+?))?[\\s]*$/gm;
        var normKey = function(s) { return String(s).replace(/[\\s\\u3000]+/g, ' ').trim(); };
        var titleMap = buildTitleMap();
        var listEl = document.getElementById('prologue-list');
        var itemTpl = document.getElementById('prologue-item-tpl');
        if (!listEl || !itemTpl) return;
        var itemHtml = itemTpl.innerHTML;
        var match;
        while ((match = regex.exec(rawText)) !== null) {
            var idx = match[1], title = normKey(match[2]), desc = match[3] ? normKey(match[3]) : '';
            var html = itemHtml.replace(/\\{INDEX\\}/g, idx).replace(/\\{TITLE\\}/g, title).replace(/\\{DESC\\}/g, desc);
            var wrapper = document.createElement('div');
            wrapper.innerHTML = html;
            var el = wrapper.firstElementChild || wrapper;
            if (wrapper.firstElementChild) el = wrapper.firstElementChild;
            else { el = wrapper; }
            (function(t, i) {
                el.style.cursor = 'pointer';
                el.addEventListener('click', async function() {
                    var sid = (titleMap[t] !== undefined) ? titleMap[t] : parseInt(i);
                    try {
                        await helper.setChatMessages([{ message_id: 0, swipe_id: sid }], { refresh: 'none' });
                        await helper.setChatMessages([{ message_id: 0 }], { refresh: 'affected' });
                        this.style.opacity = '0.5';
                        var self = this;
                        setTimeout(function() { self.style.opacity = ''; }, 300);
                    } catch(e) { console.error('Jump failed:', e); }
                });
            })(title, idx);
            listEl.appendChild(el);
        }
    } catch (err) { console.error('Navigation Error:', err); }
})();
</scr` + `ipt>`;

    const AI_MERGE_SYSTEM_PROMPT = `You are an HTML integration specialist for SillyTavern greeting card navigation.

Your task: take the user's beautified HTML directory page and PREPARE it for dynamic data injection. You do NOT need to write any navigation JavaScript — that will be injected automatically by our tool.

CRITICAL RULES:
1. KEEP all existing CSS, visual styling, decorations, backgrounds, fonts, animations, and layout EXACTLY as-is. Do NOT simplify, remove, or alter any visual element.
2. KEEP the existing HTML structure, class names, and inline styles.
3. KEEP ALL existing JavaScript functions and code EXACTLY as-is. Do NOT remove, rename, wrap in IIFE, or move any existing function. All functions that were in global scope MUST remain in global scope.
4. ADD this hidden data source tag somewhere in the body: <template id="prologue-data">$1</template>
   ($1 is a regex placeholder — keep it literally as the two characters $1)
5. REMOVE any hardcoded directory/entry/item data (arrays, objects, or inline HTML list items that represent the directory entries). The list container must be EMPTY.
6. Set the list container element's id to "prologue-list" (this is where items will be dynamically injected).
7. ADD a <template id="prologue-item-tpl"> element containing the HTML for ONE list item, using these placeholders:
   - {INDEX} — the entry number
   - {TITLE} — the entry title text
   - {DESC} — the entry description text (may be empty)
   The template must use the EXACT SAME CSS classes, nested elements, and styles as the original list items.
   Example: if the original item looks like:
     <div class="item"><span class="num">01</span><span class="title">Title</span><span class="desc">Desc</span></div>
   Then the template should be:
     <template id="prologue-item-tpl"><div class="item"><span class="num">{INDEX}</span><span class="title">{TITLE}</span><span class="desc">{DESC}</span></div></template>
8. Do NOT add any navigation <script>. Our tool will inject the navigation script automatically.
9. Do NOT remove or replace any existing onclick, href, or event handlers on NON-list elements.
10. Output a COMPLETE standalone HTML document. Do NOT wrap in markdown fences.
11. Do NOT add any explanation, commentary, or markdown. Output ONLY the raw HTML.
12. The outermost containers (html, body) MUST have margin:0 and padding:0. No extra whitespace around the content. The page should fill width with no unnecessary outer spacing.`;

    const AI_STATUSBAR_SYSTEM_PROMPT = `You are an HTML/CSS beautification specialist for SillyTavern regex status panels.

The user will give you an HTML template used as a regex replaceString in SillyTavern. This HTML renders a character status panel (HP, mood, location, affection, etc.) using data captured by a regex from AI responses.

Your task: BEAUTIFY the visual presentation of this HTML while preserving all functional logic.

CRITICAL RULES:
1. PRESERVE every $1, $2, $3, ... regex capture group reference EXACTLY as-is. These are filled at runtime by the regex engine. Do NOT rename, reorder, remove, or wrap them in a way that changes their meaning.
2. PRESERVE ALL existing JavaScript code EXACTLY. Do NOT remove, rename, refactor, or move any function or variable. If a script parses $1 data, keep that logic intact.
3. PRESERVE ALL <template> tags and their content.
4. You MAY freely modify: CSS styles, colors, fonts, layout, spacing, borders, backgrounds, shadows, animations, gradients, icons, and decorative elements.
5. You MAY restructure HTML elements for better layout (e.g. flexbox, grid) as long as the same data ($1, $2, ...) is displayed.
6. Ensure the design works well in both light and dark themes — use semi-transparent backgrounds and relative colors where possible.
7. Ensure mobile-friendly responsive design.
8. Output a COMPLETE standalone HTML document.
9. Do NOT wrap output in markdown fences. Output ONLY the raw HTML.
10. Do NOT add explanation or commentary.
11. The outermost containers (html, body) MUST have margin:0 and padding:0. No extra whitespace around the panel. The status panel should fill width with no unnecessary outer spacing.`;

    const AI_STATUSBAR_UPGRADE_PROMPT = `Upgrade a SillyTavern regex status bar from multi-capture-group ($1,$2,$3...) to single $1 + JS parsing.

CONVERSION: Old regex has many groups (e.g. HP:(\\d+).*?心情:(\\w+)) with HTML using $1,$2,$3 directly. New regex captures ALL text in one group (e.g. <status>([\\s\\S]*?)<\\/status>), HTML has hidden div with $1 and a script that parses key:value pairs.

NEW HTML STRUCTURE:
- Hidden div: <div id="sb-raw-ID" style="display:none">$1</div> (ID = random suffix)
- Visible panel: <div id="sb-panel-ID"></div>
- IIFE script: read hidden div textContent, split by /\\r?\\n/, parse each line with a TOLERANT regex, build key-value map, render all fields into panel. Render unknown fields too.

MANDATORY TOLERANT PARSING REGEX (copy this shape exactly):
  /^[\\s\\u3000]*(.+?)[\\s\\u3000]*[:：][\\s\\u3000]*(.+?)[\\s\\u3000]*$/
Rules the parser MUST handle:
- Both English colon (:) and Chinese colon (：).
- Leading/trailing half-width spaces, tabs AND full-width spaces (\\u3000) on both key and value.
- Both LF (\\n) and CRLF (\\r\\n) line endings.
- Blank lines must be skipped.
- Key comparison should be whitespace-normalized (replace /[\\s\\u3000]+/g with a single space, then trim, then compare) so "HP ", " HP", "HP\\u3000" all match "HP".
- Value keeps original internal spacing but is trimmed on both ends.

OUTPUT FORMAT:
Line 1: <!-- findRegex: /pattern/flags -->
Then: A COMPLETE standalone HTML document starting with <!DOCTYPE html>, including <html>, <head> with <meta charset="UTF-8">, <style>, </head>, <body>, inline JS, </body>, </html>. No markdown fences, no explanation.
If world book provided, append: <!-- WORLDBOOK_START -->...<!-- WORLDBOOK_END -->
ALWAYS append sample data block at the very end:
<!-- SAMPLE_START -->
(realistic example values matching the new key:value format, one per line, using the ACTUAL field names from the original regex/world book with plausible values, e.g.:
HP:85/100
心情:愉悦
好感度:72
外观:穿着白色连衣裙)
<!-- SAMPLE_END -->

SAMPLE DATA RULES:
- Use the EXACT field names (keys) from the original regex capture groups or world book definition.
- Generate realistic, varied values — NOT generic placeholders like "示例" or "正常". Use concrete numbers, descriptive text, specific states.
- The sample should look like what a real AI character response would output inside <status> tags.
- Number fields: use realistic numbers (not just 50 or 100).
- Text fields: use vivid, descriptive values that make sense for the field name.
- Format: one key:value pair per line, no extra markup.

RULES:
- $1 is the ONLY data source. Preserve ALL original fields.
- Modern design, dark/light theme compatible (semi-transparent bg), responsive.
- Keep original visual structure where possible.
- Use IIFE, unique IDs to avoid conflicts.
- The outermost container (html, body and root wrapper) MUST have margin:0 and padding:0. No extra whitespace around the panel. The status panel should fill the width with no unnecessary outer spacing.
- World book should use new tag format with key:value per line.`;

    const getAiConfig = () => {
        try { return JSON.parse(localStorage.getItem(AI_CONFIG_KEY)) || {}; } catch { return {}; }
    };
    const saveAiConfig = (cfg) => localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(cfg));

    const isAbortError = (e) => !!e && (e.name === 'AbortError' || /aborted|cancell?ed/i.test(String(e.message || e)));

    const streamSSE = async (resp, onLine, signal) => {
        if (!resp.ok) throw new Error(`API ${resp.status}: ${await resp.text().catch(() => resp.statusText)}`);
        if (!resp.body || !resp.body.getReader) throw new Error('当前环境不支持流式读取 (ReadableStream)');
        const reader = resp.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        const onAbort = () => { try { reader.cancel(); } catch (_) {} };
        if (signal) {
            if (signal.aborted) { onAbort(); throw new DOMException('Aborted', 'AbortError'); }
            signal.addEventListener('abort', onAbort, { once: true });
        }
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (signal && signal.aborted) throw new DOMException('Aborted', 'AbortError');
                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split(/\r?\n/);
                buffer = parts.pop() || '';
                for (const line of parts) {
                    const t = line.trim();
                    if (!t || !t.startsWith('data:')) continue;
                    const payload = t.slice(5).trim();
                    if (!payload || payload === '[DONE]') continue;
                    try { onLine(JSON.parse(payload)); } catch (_) { /* ignore bad chunk */ }
                }
            }
        } finally {
            if (signal) signal.removeEventListener('abort', onAbort);
        }
    };

    const streamOpenAI = async (endpoint, config, messages, onDelta, signal) => {
        const body = { model: config.model || 'gpt-4o-mini', messages, temperature: 0.2, max_tokens: 16000, stream: true };
        const resp = await fetch(endpoint + '/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + config.key },
            body: JSON.stringify(body),
            signal
        });
        let full = '';
        await streamSSE(resp, (json) => {
            const delta = json?.choices?.[0]?.delta?.content
                       ?? json?.choices?.[0]?.message?.content
                       ?? '';
            if (delta) { full += delta; if (onDelta) onDelta(full); }
        }, signal);
        return full;
    };

    const streamAnthropic = async (endpoint, config, messages, onDelta, signal) => {
        const systemMsg = messages.find(m => m.role === 'system');
        const nonSystem = messages.filter(m => m.role !== 'system');
        const body = {
            model: config.model || 'claude-sonnet-4-20250514',
            max_tokens: 16000,
            system: systemMsg ? systemMsg.content : '',
            messages: nonSystem,
            stream: true
        };
        const resp = await fetch(endpoint + '/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.key,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify(body),
            signal
        });
        let full = '';
        await streamSSE(resp, (json) => {
            if (json?.type === 'content_block_delta' && json?.delta?.type === 'text_delta') {
                full += json.delta.text || '';
                if (onDelta) onDelta(full);
            }
        }, signal);
        return full;
    };

    const hasMainApi = () => {
        return (window.TavernHelper && typeof window.TavernHelper.generateRaw === 'function')
            || (typeof SillyTavern !== 'undefined' && typeof SillyTavern.generateRaw === 'function');
    };

    const tryStopMainApi = () => {
        try {
            const ctx = (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') ? SillyTavern.getContext() : null;
            if (ctx?.stopGeneration && typeof ctx.stopGeneration === 'function') { ctx.stopGeneration(); return true; }
            if (typeof window.stopGeneration === 'function') { window.stopGeneration(); return true; }
            const btn = document.getElementById('mes_stop');
            if (btn && btn.offsetParent !== null) { btn.click(); return true; }
        } catch (_) {}
        return false;
    };

    const streamMainApi = async (messages, onDelta, signal) => {
        const helper = window.TavernHelper;
        const hasHelper = !!(helper && typeof helper.generateRaw === 'function');
        const ctx = (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') ? SillyTavern.getContext() : null;
        const eventSource = ctx?.eventSource || window.eventSource || null;
        const event_types = ctx?.event_types || ctx?.eventTypes || window.event_types || window.eventTypes || null;
        const STREAM_EVT = event_types?.STREAM_TOKEN_RECEIVED
                        || event_types?.SMART_CONTEXT_TOKEN_RECEIVED
                        || 'stream_token_received';

        let accumulated = '';
        const handler = (payload) => {
            const text = typeof payload === 'string' ? payload : (payload?.text || payload?.content || payload?.message || '');
            if (!text) return;
            if (text.length >= accumulated.length && text.startsWith(accumulated.slice(0, Math.min(accumulated.length, 32)))) {
                accumulated = text;
            } else {
                accumulated += text;
            }
            if (onDelta) onDelta(accumulated);
        };

        const canListen = eventSource && typeof eventSource.on === 'function';
        if (canListen) { try { eventSource.on(STREAM_EVT, handler); } catch (_) {} }

        // 让 signal.abort() 能够：1) 让后端停掉生成 2) 立即让外层 await 退出
        let abortReject = null;
        const abortPromise = new Promise((_, reject) => { abortReject = reject; });
        const onAbort = () => {
            try { tryStopMainApi(); } catch (_) {}
            if (abortReject) abortReject(new DOMException('Aborted', 'AbortError'));
        };
        if (signal) {
            if (signal.aborted) onAbort();
            else signal.addEventListener('abort', onAbort, { once: true });
        }

        try {
            let result;
            if (hasHelper) {
                // should_stream: true 强制走流式，避免整段请求被代理 504 掐断
                // stream / streaming 两个别名一起传，兼容不同版本 TavernHelper
                const genPromise = helper.generateRaw({
                    user_input: '',
                    ordered_prompts: messages,
                    should_stream: true,
                    stream: true,
                    streaming: true,
                    overrides: {
                        world_info_before: '',
                        world_info_after: '',
                        persona_description: '',
                        char_description: '',
                        char_personality: '',
                        scenario: '',
                        dialogue_examples: '',
                        chat_history: { prompts: [], with_depth_entries: false, author_note: '' }
                    },
                    injects: [],
                    max_chat_history: 0
                });
                result = await Promise.race([genPromise, abortPromise]);
            } else if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.generateRaw === 'function') {
                const combined = messages.map(m => (m.role === 'system' ? '[System]\n' : m.role === 'assistant' ? '[Assistant]\n' : '[User]\n') + m.content).join('\n\n');
                result = await Promise.race([SillyTavern.generateRaw(combined), abortPromise]);
            } else {
                throw new Error('未检测到 TavernHelper.generateRaw，请确认已安装/启用 TavernHelper 插件');
            }
            if (signal && signal.aborted) throw new DOMException('Aborted', 'AbortError');

            // 处理流式返回：可能是字符串，也可能是 AsyncIterator / ReadableStream
            let finalText = '';
            if (typeof result === 'string') {
                finalText = result;
            } else if (result && typeof result[Symbol.asyncIterator] === 'function') {
                for await (const chunk of result) {
                    if (signal && signal.aborted) throw new DOMException('Aborted', 'AbortError');
                    const piece = typeof chunk === 'string' ? chunk : (chunk?.text || chunk?.content || chunk?.delta || '');
                    if (!piece) continue;
                    if (piece.length >= accumulated.length && piece.startsWith(accumulated.slice(0, Math.min(accumulated.length, 32)))) {
                        accumulated = piece;
                    } else {
                        accumulated += piece;
                    }
                    if (onDelta) onDelta(accumulated);
                }
                finalText = accumulated;
            } else if (result && typeof result.getReader === 'function') {
                const reader = result.getReader();
                const decoder = new TextDecoder();
                while (true) {
                    if (signal && signal.aborted) { try { reader.cancel(); } catch (_) {} throw new DOMException('Aborted', 'AbortError'); }
                    const { done, value } = await reader.read();
                    if (done) break;
                    const piece = typeof value === 'string' ? value : decoder.decode(value, { stream: true });
                    if (!piece) continue;
                    accumulated += piece;
                    if (onDelta) onDelta(accumulated);
                }
                finalText = accumulated;
            } else {
                finalText = result?.text || result?.message?.content || String(result ?? '');
            }

            if (onDelta && finalText && finalText.length > accumulated.length) onDelta(finalText);
            return finalText;
        } finally {
            if (canListen) {
                try {
                    if (typeof eventSource.removeListener === 'function') eventSource.removeListener(STREAM_EVT, handler);
                    else if (typeof eventSource.off === 'function') eventSource.off(STREAM_EVT, handler);
                } catch (_) {}
            }
            if (signal) signal.removeEventListener('abort', onAbort);
        }
    };

    const callAI = async (messages, onStatus, onDelta, signal) => {
        const config = getAiConfig();
        const useMain = config.useMainApi !== false;
        if (useMain && hasMainApi()) {
            if (onStatus) onStatus('正在通过主 API 生成...');
            try {
                return await streamMainApi(messages, onDelta, signal);
            } catch (e) {
                if (isAbortError(e)) throw e;
                console.warn('Main API generateRaw failed:', e);
                const msg = (e && e.message) ? e.message : String(e);
                if (/504/.test(msg) || /Gateway\s*Tim/i.test(msg)) {
                    throw new Error('主 API 504 超时：上游 AI 或中间代理在返回前被掐断。请尝试：① 减少 prompt 长度（关闭世界书/减少截取楼层）；② 换更快的模型；③ 在"设置 AI"里切换到自定义 API 直连。');
                }
                throw new Error('主 API 调用失败: ' + msg);
            }
        }
        if (!config.endpoint || !config.key) return null;
        if (onStatus) onStatus('正在调用自定义 API...');
        const endpoint = config.endpoint.replace(/\/+$/, '');
        const isAnthropic = /anthropic/i.test(endpoint);
        return isAnthropic
            ? await streamAnthropic(endpoint, config, messages, onDelta, signal)
            : await streamOpenAI(endpoint, config, messages, onDelta, signal);
    };

    const injectNavScript = (html) => {
        if (html.includes('</body>')) return html.replace('</body>', NAVIGATION_SCRIPT + '\n</body>');
        if (html.includes('</html>')) return html.replace('</html>', NAVIGATION_SCRIPT + '\n</html>');
        return html + '\n' + NAVIGATION_SCRIPT;
    };

    const wrapAsRegexJson = (mergedHtml) => {
        const withScript = injectNavScript(mergedHtml);
        const replaceStr = '```html\n' + withScript + '\n```';
        return { "id": "adv-beauty-" + Date.now(), "scriptName": "开场白跳转(美化)", "findRegex": "<greetings>([\\s\\S]*)</greetings>", "replaceString": replaceStr, "trimStrings": [], "placement": [2], "disabled": false, "markdownOnly": true, "promptOnly": false, "runOnEdit": true, "substituteRegex": 0, "minDepth": 0, "maxDepth": 0 };
    };

    async function showApiConfigDialog() {
        const config = getAiConfig();
        const useMain = config.useMainApi !== false;
        const stAvailable = hasMainApi();
        const $form = $(`<div style="display:flex;flex-direction:column;gap:12px;padding:10px;color:var(--smart-theme-body-color);">
            <div style="font-size:0.9em;opacity:0.7;line-height:1.5;">选择 AI 来源用于美化融合。</div>
            <div class="gj-api-mode-group" style="display:flex;flex-direction:column;gap:6px;">
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:6px 0;">
                    <input type="radio" name="gj-api-mode" value="main" ${useMain ? 'checked' : ''}>
                    <span>使用主 API <span style="font-size:0.85em;opacity:0.6;">(SillyTavern 当前连接的 API${stAvailable ? '' : ' — 未检测到'})</span></span>
                </label>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:6px 0;">
                    <input type="radio" name="gj-api-mode" value="custom" ${!useMain ? 'checked' : ''}>
                    <span>使用自定义 API</span>
                </label>
            </div>
            <div class="gj-custom-api-fields" style="display:flex;flex-direction:column;gap:10px;padding-left:10px;border-left:2px solid var(--smart-theme-border-color-1);${useMain ? 'opacity:0.4;pointer-events:none;' : ''}">
                <label class="gj-adv-label">API 地址</label>
                <input class="gj-adv-input gj-api-endpoint" style="min-height:auto;padding:8px;" placeholder="例: https://api.openai.com 或 https://api.anthropic.com" value="${_.escape(config.endpoint || '')}">
                <label class="gj-adv-label">API Key</label>
                <input class="gj-adv-input gj-api-key" style="min-height:auto;padding:8px;" type="password" placeholder="sk-... 或 anthropic key" value="${_.escape(config.key || '')}">
                <label class="gj-adv-label">模型</label>
                <div style="display:flex;gap:6px;align-items:center;">
                    <select class="gj-adv-input gj-api-model-select" style="min-height:auto;padding:8px;flex-grow:1;cursor:pointer;">
                        ${config.model ? `<option value="${_.escape(config.model)}" selected>${_.escape(config.model)}</option>` : '<option value="">-- 请先加载模型列表 --</option>'}
                    </select>
                    <button type="button" class="gj-custom-btn gj-api-load-models" style="white-space:nowrap;padding:6px 12px;"><i class="fa-solid fa-rotate"></i> 加载</button>
                </div>
                <div class="gj-api-model-status" style="font-size:0.82em;opacity:0.5;"></div>
            </div>
        </div>`);
        const $customFields = $form.find('.gj-custom-api-fields');
        $form.find('input[name="gj-api-mode"]').on('change', function() {
            const isCustom = $(this).val() === 'custom';
            $customFields.css({ opacity: isCustom ? 1 : 0.4, 'pointer-events': isCustom ? 'auto' : 'none' });
        });
        $form.find('.gj-api-load-models').on('click', async function() {
            const endpoint = $form.find('.gj-api-endpoint').val().trim().replace(/\/+$/, '');
            const key = $form.find('.gj-api-key').val().trim();
            const $status = $form.find('.gj-api-model-status');
            const $select = $form.find('.gj-api-model-select');
            if (!endpoint || !key) { toastr.warning("请先填写 API 地址和 Key"); return; }
            $status.text('正在加载模型列表...').css('opacity', '0.8');
            $(this).prop('disabled', true);
            try {
                const isAnthropic = /anthropic/i.test(endpoint);
                const headers = isAnthropic
                    ? { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }
                    : { 'Authorization': 'Bearer ' + key };
                const url = isAnthropic ? endpoint + '/v1/models' : endpoint + '/v1/models';
                const resp = await fetch(url, { headers });
                if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
                const data = await resp.json();
                const models = (data.data || data.models || []).map(m => m.id || m.name || m).filter(Boolean).sort();
                if (models.length === 0) throw new Error('未获取到模型');
                const currentModel = $select.val();
                $select.empty();
                models.forEach(m => {
                    const selected = m === currentModel ? ' selected' : '';
                    $select.append(`<option value="${_.escape(m)}"${selected}>${_.escape(m)}</option>`);
                });
                if (currentModel && models.includes(currentModel)) $select.val(currentModel);
                $status.text(`已加载 ${models.length} 个模型`).css('opacity', '0.6');
                } catch (e) {
                $status.text('加载失败: ' + e.message).css('opacity', '1; color: #d9534f');
                console.error('Load models error:', e);
            } finally {
                $(this).prop('disabled', false);
            }
        });
        const popup = new SillyTavern.Popup($form, SillyTavern.POPUP_TYPE.CONFIRM, "", { okButton: "保存", cancelButton: "取消" });
        const result = await popup.show();
        if (result === SillyTavern.POPUP_RESULT.AFFIRMATIVE) {
            const isMain = $form.find('input[name="gj-api-mode"]:checked').val() === 'main';
            const model = $form.find('.gj-api-model-select').val() || '';
            saveAiConfig({ useMainApi: isMain, endpoint: $form.find('.gj-api-endpoint').val().trim(), key: $form.find('.gj-api-key').val().trim(), model });
            toastr.success("AI 配置已保存");
        }
    }

    async function openAdvancedBeautifyUI() {
        if (!SillyTavern.characters[SillyTavern.characterId]) { toastr.warning("请先打开角色"); return; }
        let conversationHistory = [];
        let currentMergedHtml = '';
        let isGenerating = false;
        let fusionSourceRegexIdx = null;

        const $ui = $(`<div class="gj-adv-beauty-container">
            <div class="gj-adv-phase gj-adv-phase-input">
                <div class="gj-adv-header-row">
                    <label class="gj-adv-label"><i class="fa-solid fa-paste"></i> 美化 HTML 输入</label>
                    <button type="button" class="gj-adv-config-btn" title="AI 配置"><i class="fa-solid fa-gear"></i></button>
                </div>
                <div class="gj-sb-source-tabs">
                    <button type="button" class="gj-sb-source-tab active" data-source="regex"><i class="fa-solid fa-file-code"></i> 从局部正则选取</button>
                    <button type="button" class="gj-sb-source-tab" data-source="paste"><i class="fa-solid fa-paste"></i> 粘贴 HTML</button>
                </div>
                <div class="gj-sb-source-panel gj-adv-panel-regex">
                    <button type="button" class="gj-adv-from-regex-btn gj-upload-zone" style="width:100%;">
                        <i class="fa-solid fa-file-code gj-upload-icon"></i>
                        <div class="gj-upload-main">从角色卡局部正则中提取 HTML</div>
                        <div class="gj-upload-hint">点击打开选择器（推荐）</div>
                    </button>
                    <div class="gj-adv-regex-picked-hint" style="display:none;margin-top:8px;padding:8px 12px;border-radius:6px;background:rgba(122,154,131,0.1);border:1px solid #7a9a83;color:var(--smart-theme-body-color);font-size:0.85em;">
                        <i class="fa-solid fa-circle-check" style="color:#7a9a83;"></i> 已提取：<span class="gj-adv-picked-name" style="font-weight:bold;"></span>
                    </div>
                </div>
                <div class="gj-sb-source-panel gj-adv-panel-paste" style="display:none;">
                    <textarea class="gj-adv-input" placeholder="在此粘贴美化 HTML 代码..."></textarea>
                </div>
                <div class="gj-adv-input-footer">
                    <button type="button" class="gj-custom-btn primary gj-adv-merge-btn"><i class="fa-solid fa-wand-magic-sparkles"></i> AI 融合</button>
                </div>
            </div>
            <div class="gj-adv-phase gj-adv-phase-result" style="display:none;">
                <div class="gj-adv-result-header">
                    <label class="gj-adv-label"><i class="fa-solid fa-code"></i> 融合结果 <span class="gj-adv-status" style="opacity:0.5;font-weight:normal;font-size:0.85em;"></span></label>
                    <button type="button" class="gj-adv-config-btn" title="AI 配置"><i class="fa-solid fa-gear"></i></button>
                </div>
                <textarea class="gj-adv-result-editor" rows="10"></textarea>
                <div class="gj-adv-editor-section">
                    <div class="gj-adv-preview-header">
                        <label class="gj-adv-label"><i class="fa-solid fa-eye"></i> 预览</label>
                        <button type="button" class="gj-adv-fullscreen-btn" title="全屏预览"><i class="fa-solid fa-expand"></i> 全屏</button>
                    </div>
                    <div class="gj-adv-preview"></div>
                </div>
                <div class="gj-adv-refine-bar">
                    <input class="gj-adv-refine-input" type="text" placeholder="输入调整要求，例：把按钮改成圆角、字体改大一点...">
                    <button type="button" class="gj-custom-btn primary gj-adv-refine-btn"><i class="fa-solid fa-paper-plane"></i></button>
                </div>
                <div class="gj-adv-input-footer">
                    <button type="button" class="gj-custom-btn gj-adv-back-btn"><i class="fa-solid fa-arrow-left"></i> 返回</button>
                    <span style="flex:1;"></span>
                    <button type="button" class="gj-custom-btn gj-adv-overwrite-regex-btn" style="background:#f59e0b;color:#fff;border:none;display:none;" title="覆盖角色卡中的原局部正则"><i class="fa-solid fa-upload"></i> 覆盖局部正则</button>
                    <button type="button" class="gj-custom-btn primary gj-adv-download-btn"><i class="fa-solid fa-download"></i> 导出正则</button>
                </div>
            </div>
            <div class="gj-adv-loading" style="display:none;">
                <div class="gj-adv-spinner"></div>
                <div class="gj-adv-loading-text">正在调用 AI 融合...</div>
            </div>
        </div>`);

        const showLoading = (text) => { $ui.find('.gj-adv-loading').show(); $ui.find('.gj-adv-loading-text').text(text || '正在调用 AI 融合...'); };
        const hideLoading = () => { $ui.find('.gj-adv-loading').hide(); };

        const getGreetingListText = () => {
            const charObj = SillyTavern.characters[SillyTavern.characterId];
            if (!charObj) return '1. 开场白示例';
            const lines = [];
            const fmt = (idx, raw) => {
                const p = parseMessageContent(raw || '');
                if (!p.title) return;
                let line = `${idx}. ${p.title}`;
                if (p.desc) line += ` | ${p.desc}`;
                lines.push(line);
            };
            fmt(0, charObj.first_mes);
            (charObj.data?.alternate_greetings || []).forEach((g, i) => fmt(i + 1, g));
            return lines.join('\n');
        };

        const buildPreviewHtml = (html) => {
            const greetingData = getGreetingListText();
            const sOpen = '<' + 'script>', sClose = '</' + 'script>';
            const mockScript = sOpen +
                'window.SillyTavern={characters:{"0":{first_mes:"",data:{alternate_greetings:[]}}},characterId:"0"};' +
                'window.TavernHelper={setChatMessages:function(a){' +
                'var idx=a&&a[0]&&a[0].swipe_id;if(idx===undefined)return Promise.resolve();' +
                'var t=document.createElement("div");' +
                't.style.cssText="position:fixed;top:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;padding:10px 24px;border-radius:8px;font-size:14px;z-index:99999;pointer-events:none;transition:opacity 0.5s;";' +
                't.textContent="\\u279c \\u8df3\\u8f6c\\u5230\\u5f00\\u573a\\u767d #"+idx;' +
                'document.body.appendChild(t);setTimeout(function(){t.style.opacity="0";setTimeout(function(){t.remove()},600)},1800);' +
                'return Promise.resolve();}};' + sClose;
            let result = html.replace(/(<template[^>]*id\s*=\s*["']prologue-data["'][^>]*>)\$1(<\/template>)/i, '$1' + greetingData + '$2')
                             .replace(/\$1/g, greetingData);
            if (result.includes('<head>')) {
                result = result.replace('<head>', '<head>' + mockScript);
            } else {
                result = mockScript + result;
            }
            result = injectNavScript(result);
            return result;
        };

        const updatePreview = (html) => {
            const $prev = $ui.find('.gj-adv-preview');
            $prev.empty();
            const iframe = document.createElement('iframe');
            iframe.sandbox = 'allow-same-origin allow-scripts';
            iframe.style.cssText = 'width:100%;border:none;min-height:120px;border-radius:4px;background:#fff;';
            $prev.append(iframe);
            const previewHtml = buildPreviewHtml(html);
            setTimeout(() => {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                doc.open(); doc.write(previewHtml); doc.close();
                const resizeIframe = () => { iframe.style.height = Math.max(120, doc.body.scrollHeight + 20) + 'px'; };
                setTimeout(resizeIframe, 100);
                setTimeout(resizeIframe, 500);
            }, 50);
        };

        const openFullscreenPreview = () => {
            if (!currentMergedHtml) { toastr.warning("暂无预览内容"); return; }
            const $overlay = $(`<div class="gj-adv-fs-overlay">
                <div class="gj-adv-fs-topbar"><span><i class="fa-solid fa-eye"></i> 全屏预览</span><button type="button" class="gj-adv-fs-close"><i class="fa-solid fa-xmark"></i> 关闭</button></div>
            </div>`);
            const fsIframe = document.createElement('iframe');
            fsIframe.sandbox = 'allow-same-origin allow-scripts';
            fsIframe.className = 'gj-adv-fs-iframe';
            $overlay.append(fsIframe);
            const $popupDialog = $ui.closest('.popup, [class*="popup"], dialog, .dialogue_popup');
            if ($popupDialog.length) { $popupDialog.append($overlay); } else { $(document.body).append($overlay); }
            const previewHtml = buildPreviewHtml(currentMergedHtml);
            setTimeout(() => {
                const doc = fsIframe.contentDocument || fsIframe.contentWindow.document;
                doc.open(); doc.write(previewHtml); doc.close();
            }, 50);
            const removeOverlay = () => { $overlay.remove(); $(document).off('keydown.gjfs'); };
            $overlay.find('.gj-adv-fs-close').on('click', removeOverlay);
            $(document).on('keydown.gjfs', (e) => { if (e.key === 'Escape') removeOverlay(); });
        };

        const cleanAiOutput = (text) => {
            let html = text.trim();
            html = html.replace(/^```html\s*/i, '').replace(/```\s*$/, '');
            html = html.replace(/^```\s*/i, '').replace(/```\s*$/, '');
            return html.trim();
        };

        const stripFence = (str) => {
            if (!str) return '';
            let s = str.trim();
            s = s.replace(/^```(?:html)?\s*\n?/i, '').replace(/\n?```\s*$/, '');
            return s.trim();
        };
        const wrapFence = (html) => '```html\n' + html + '\n```';

        const doAiMerge = async (messages) => {
            isGenerating = true;
            showLoading();
            try {
                const aiCfg = getAiConfig();
                const useMain = aiCfg.useMainApi !== false;
                const hasCustom = aiCfg.endpoint && aiCfg.key;
                const hasStApi = hasMainApi();
                if ((useMain && !hasStApi) || (!useMain && !hasCustom)) {
                    hideLoading();
                    isGenerating = false;
                    toastr.warning(useMain ? "主 API 不可用（未检测到 TavernHelper），请切换到自定义 API" : "请先配置自定义 API");
                    await showApiConfigDialog();
                    return null;
                }
                const statusReporter = (s) => { $ui.find('.gj-adv-loading-text').text(s); };
                const result = await callAI(messages, statusReporter);
                hideLoading();
                isGenerating = false;
                if (!result) { toastr.error("AI 返回为空"); return null; }
                return cleanAiOutput(result);
            } catch (e) {
                hideLoading();
                isGenerating = false;
                if (isAbortError(e)) return null;
                toastr.error("AI 调用失败: " + e.message);
                console.error('AI merge error:', e);
                return null;
            }
        };

        $ui.find('.gj-adv-config-btn').on('click', () => showApiConfigDialog());
        $ui.find('.gj-adv-fullscreen-btn').on('click', () => openFullscreenPreview());

        // 源切换 tabs：默认"从局部正则选取"，可切到"粘贴 HTML"
        let pickedRegexHtml = '';
        $ui.find('.gj-sb-source-tab').on('click', function () {
            const src = $(this).data('source');
            $ui.find('.gj-sb-source-tab').removeClass('active');
            $(this).addClass('active');
            $ui.find('.gj-adv-panel-regex').toggle(src === 'regex');
            $ui.find('.gj-adv-panel-paste').toggle(src === 'paste');
        });

        $ui.find('.gj-adv-from-regex-btn').on('click', async () => {
            try {
                const charId = SillyTavern.characterId;
                const charObj = SillyTavern.characters?.[charId];
                const scripts = charObj?.data?.extensions?.regex_scripts || [];
                if (!scripts.length) { toastr.warning("当前角色卡没有绑定局部正则"); return; }
                const items = scripts.map((s, i) => {
                    const name = _.escape(s.scriptName || '未命名');
                    const regex = _.escape((s.findRegex || '').substring(0, 50));
                    const htmlSnippet = _.escape((s.replaceString || '').replace(/\n/g, ' ').substring(0, 80));
                    return `<div class="gj-adv-regex-pick-item" data-idx="${i}" style="padding:8px 12px;cursor:pointer;border-bottom:1px solid rgba(128,128,128,0.15);transition:background 0.15s;">
                        <div style="display:flex;align-items:center;gap:8px;">
                            <i class="fa-solid fa-file-code" style="opacity:0.4;"></i>
                            <div style="flex:1;min-width:0;">
                                <div style="font-weight:bold;font-size:0.9em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</div>
                                <div style="font-size:0.75em;opacity:0.5;font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">/${regex}/</div>
                                <div style="font-size:0.75em;opacity:0.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${htmlSnippet || '(空替换内容)'}</div>
                            </div>
                        </div>
                    </div>`;
                }).join('');
                const $pick = $(`<div style="max-height:50vh;overflow-y:auto;">${items}</div>`);
                const pickPopup = new SillyTavern.Popup($pick, SillyTavern.POPUP_TYPE.TEXT, "选择局部正则 — 提取 HTML", { okButton: "取消" });
                $pick.find('.gj-adv-regex-pick-item').on('click', function() {
                    const idx = parseInt($(this).data('idx'));
                    const s = scripts[idx];
                    if (s && s.replaceString) {
                        fusionSourceRegexIdx = idx;
                        const extracted = s.replaceString.trim().replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/, '').trim();
                        pickedRegexHtml = extracted;
                        $ui.find('.gj-adv-input').val(extracted);
                        $ui.find('.gj-adv-picked-name').text(s.scriptName || '未命名');
                        $ui.find('.gj-adv-regex-picked-hint').show();
                        toastr.success(`已提取「${s.scriptName || '未命名'}」的 HTML 内容`);
                    } else {
                        toastr.warning("该正则的替换内容为空");
                    }
                    pickPopup.complete(SillyTavern.POPUP_RESULT.AFFIRMATIVE);
                });
                $pick.find('.gj-adv-regex-pick-item').on('mouseenter', function() { $(this).css('background', 'rgba(122,154,131,0.1)'); }).on('mouseleave', function() { $(this).css('background', ''); });
                await pickPopup.show();
            } catch (e) { console.error('Pick scoped regex error:', e); toastr.error("获取局部正则失败"); }
        });

        $ui.find('.gj-adv-merge-btn').on('click', async () => {
            if (isGenerating) return;
            const activeSource = $ui.find('.gj-sb-source-tab.active').data('source') || 'regex';
            let raw = '';
            if (activeSource === 'regex') {
                raw = (pickedRegexHtml || '').trim();
                if (!raw) { toastr.warning("请先从角色卡局部正则中提取 HTML"); return; }
            } else {
                raw = $ui.find('.gj-adv-input').val().trim();
                if (!raw) { toastr.warning("请先粘贴 HTML 内容"); return; }
            }

            conversationHistory = [
                { role: 'system', content: AI_MERGE_SYSTEM_PROMPT },
                { role: 'user', content: '请将以下美化 HTML 页面融合跳转功能。保留所有视觉效果，只添加/修改跳转逻辑：\n\n' + raw }
            ];

            $ui.find('.gj-adv-result-editor').val('');
            $ui.find('.gj-adv-preview').empty();
            $ui.find('.gj-adv-phase-input').slideUp(200);
            $ui.find('.gj-adv-phase-result').slideDown(200);
            $ui.find('.gj-adv-status').text('(AI 生成中...)');

            const merged = await doAiMerge(conversationHistory);
            if (!merged) {
                $ui.find('.gj-adv-status').text('(失败)');
                return;
            }

            currentMergedHtml = merged;
            conversationHistory.push({ role: 'assistant', content: merged });
            $ui.find('.gj-adv-result-editor').val(wrapFence(merged));
            updatePreview(merged);
            $ui.find('.gj-adv-status').text('(AI 生成完毕)');
            if (fusionSourceRegexIdx !== null) $ui.find('.gj-adv-overwrite-regex-btn').show();
        });

        $ui.find('.gj-adv-result-editor').on('input', function() {
            currentMergedHtml = stripFence($(this).val());
            updatePreview(currentMergedHtml);
            $ui.find('.gj-adv-status').text('(已手动编辑)');
        });

        const doRefine = async () => {
            if (isGenerating) return;
            const $ri = $ui.find('.gj-adv-refine-input');
            const feedback = $ri.val().trim();
            if (!feedback) return;
            $ri.val('');
            conversationHistory.push({ role: 'user', content: feedback });
            $ui.find('.gj-adv-status').text('(AI 调整中...)');
            $ui.find('.gj-adv-result-editor').val('');
            const refined = await doAiMerge(conversationHistory);
            if (!refined) { $ui.find('.gj-adv-status').text('(失败)'); return; }
            currentMergedHtml = refined;
            conversationHistory.push({ role: 'assistant', content: refined });
            $ui.find('.gj-adv-result-editor').val(wrapFence(refined));
            updatePreview(refined);
            $ui.find('.gj-adv-status').text('(AI 调整完毕)');
        };

        $ui.find('.gj-adv-refine-btn').on('click', doRefine);
        $ui.find('.gj-adv-refine-input').on('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doRefine(); } });

        $ui.find('.gj-adv-back-btn').on('click', () => {
            conversationHistory = [];
            currentMergedHtml = '';
            $ui.find('.gj-adv-overwrite-regex-btn').hide();
            $ui.find('.gj-adv-phase-result').slideUp(200);
            $ui.find('.gj-adv-phase-input').slideDown(200);
        });

        $ui.find('.gj-adv-overwrite-regex-btn').on('click', async () => {
            if (fusionSourceRegexIdx === null) return;
            const html = stripFence($ui.find('.gj-adv-result-editor').val());
            if (!html) { toastr.warning("内容为空"); return; }
            const charId = SillyTavern.characterId;
            const charObj = SillyTavern.characters?.[charId];
            const scripts = charObj?.data?.extensions?.regex_scripts;
            if (!scripts || fusionSourceRegexIdx >= scripts.length) { toastr.error("找不到原局部正则，可能已被删除"); return; }
            const scriptName = scripts[fusionSourceRegexIdx].scriptName || '未命名';
            const confirmed = confirm(`确定覆盖局部正则「${scriptName}」的替换内容？\n此操作将修改角色卡中的正则脚本。`);
            if (!confirmed) return;
            const withScript = injectNavScript(html);
            const newReplace = '```html\n' + withScript + '\n```';
            const $btn = $ui.find('.gj-adv-overwrite-regex-btn');
            const originalLabel = $btn.html();
            $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> 保存中...');
            const res = await overwriteScopedRegex(fusionSourceRegexIdx, {
                replaceString: newReplace,
                findRegex: "<greetings>([\\s\\S]*)</greetings>"
            });
            $btn.prop('disabled', false).html(originalLabel);
            if (res.ok) toastr.success(`已覆盖局部正则「${scriptName}」并保存`);
            else toastr.error(`覆盖失败：${res.reason}`);
        });

        $ui.find('.gj-adv-download-btn').on('click', () => {
            const html = stripFence($ui.find('.gj-adv-result-editor').val());
            if (!html) { toastr.warning("内容为空"); return; }
            const json = wrapAsRegexJson(html);
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json, null, 2));
            const anchor = document.createElement('a');
            anchor.href = dataStr;
            anchor.download = 'Regex_Greeting_Jumper_Custom.json';
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            toastr.success("融合正则已下载，请在正则扩展中导入");
        });

        const popup = new SillyTavern.Popup($ui, SillyTavern.POPUP_TYPE.TEXT, "", { large: true, okButton: "关闭" });
        await popup.show();
    }

    // --- 状态栏正则合并/升级工具 ---
    async function openStatusBarTool() {
        let originalJson = null;
        let extractedHtml = '';
        let conversationHistory = [];
        let currentHtml = '';
        let isGenerating = false;
        let sampleData = '';
        let worldBookText = '';
        let upgraded = false;
        let sourceRegexIdx = null;
        let sourceWbEntry = null;

        const stripFence = (str) => {
            if (!str) return '';
            let s = str.trim();
            s = s.replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/, '');
            return s.trim();
        };

        const wrapFence = (html) => '```html\n' + html + '\n```';

        const $tool = $(`<div class="gj-adv-beauty-container">
            <div class="gj-adv-phase gj-sb-phase-upload">
                <div class="gj-adv-header-row">
                    <label class="gj-adv-label"><i class="fa-solid fa-arrow-up-right-dots"></i> 状态栏正则升级工具</label>
                    <button type="button" class="gj-adv-config-btn gj-sb-config-btn" title="AI 配置"><i class="fa-solid fa-gear"></i></button>
                </div>
                <div class="gj-sb-source-tabs">
                    <button type="button" class="gj-sb-source-tab active" data-source="regex"><i class="fa-solid fa-list-check"></i> 从局部正则选取</button>
                    <button type="button" class="gj-sb-source-tab" data-source="file"><i class="fa-solid fa-cloud-arrow-up"></i> 上传 .json 文件</button>
                </div>
                <div class="gj-sb-source-panel gj-sb-panel-regex">
                    <button type="button" class="gj-sb-pick-regex gj-upload-zone" style="width:100%;">
                        <i class="fa-solid fa-list-check gj-upload-icon"></i>
                        <div class="gj-upload-main">从角色卡局部正则中选取</div>
                        <div class="gj-upload-hint">点击打开选择器（推荐）</div>
                    </button>
                </div>
                <div class="gj-sb-source-panel gj-sb-panel-file" style="display:none;">
                    <label class="gj-upload-zone gj-sb-drop-zone" style="margin:0;">
                        <input type="file" accept=".json" style="display:none;" class="gj-sb-file-input">
                        <i class="fa-solid fa-cloud-arrow-up gj-upload-icon"></i>
                        <div class="gj-upload-main">点击或拖拽上传</div>
                        <div class="gj-upload-hint">正则 .json 文件</div>
                    </label>
                </div>
                <div class="gj-sb-file-card" style="display:none;">
                    <i class="fa-solid fa-file-code gj-fc-icon"></i>
                    <div class="gj-fc-info">
                        <div class="gj-fc-name"></div>
                        <div class="gj-fc-detail"></div>
                    </div>
                    <button type="button" class="gj-fc-remove" title="移除"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="gj-adv-editor-section" style="margin-top:8px;">
                    <label class="gj-adv-label"><i class="fa-solid fa-book"></i> 世界书内容 <span style="opacity:0.5;font-weight:normal;">(可选)</span></label>
                    <div class="gj-sb-source-tabs gj-sb-wb-tabs">
                        <button type="button" class="gj-sb-wb-tab active" data-source="pick"><i class="fa-solid fa-book-open"></i> 从世界书选取</button>
                        <button type="button" class="gj-sb-wb-tab" data-source="paste"><i class="fa-solid fa-paste"></i> 粘贴</button>
                    </div>
                    <div class="gj-sb-wb-panel gj-sb-wb-panel-pick">
                        <button type="button" class="gj-sb-pick-wb gj-upload-zone" style="width:100%;">
                            <i class="fa-solid fa-book-open gj-upload-icon"></i>
                            <div class="gj-upload-main">从角色卡世界书中选取条目</div>
                            <div class="gj-upload-hint">点击打开选择器（推荐）</div>
                        </button>
                        <div class="gj-sb-wb-picked-hint" style="display:none;margin-top:8px;padding:8px 12px;border-radius:6px;background:rgba(122,154,131,0.1);border:1px solid #7a9a83;color:var(--smart-theme-body-color);font-size:0.85em;">
                            <i class="fa-solid fa-circle-check" style="color:#7a9a83;"></i> 已选取：<span class="gj-sb-wb-picked-name" style="font-weight:bold;"></span>
                        </div>
                    </div>
                    <div class="gj-sb-wb-panel gj-sb-wb-panel-paste" style="display:none;">
                        <textarea class="gj-sb-worldbook gj-sb-wb-input" rows="4" placeholder="粘贴世界书条目的内容\n通常是状态栏的输出格式定义"></textarea>
                    </div>
                </div>
                <button type="button" class="gj-sb-upgrade-cta gj-sb-do-upgrade" style="margin-top:10px;" disabled>
                    <i class="fa-solid fa-arrow-up-right-dots"></i> AI 逻辑升级
                </button>
            </div>
            <div class="gj-adv-phase gj-sb-phase-result" style="display:none;">
                <div class="gj-sb-result-banner success">
                    <i class="fa-solid fa-circle-check"></i>
                    <span>逻辑升级完成</span>
                    <span class="gj-sb-suggested-regex"></span>
                </div>
                <div class="gj-adv-result-header" style="margin-top:8px;">
                    <label class="gj-adv-label"><i class="fa-solid fa-code"></i> 升级后 HTML <span class="gj-sb-status" style="opacity:0.5;font-weight:normal;font-size:0.85em;"></span></label>
                    <button type="button" class="gj-adv-config-btn gj-sb-config-btn2" title="AI 配置"><i class="fa-solid fa-gear"></i></button>
                </div>
                <textarea class="gj-adv-result-editor gj-sb-html-editor" rows="8"></textarea>
                <div class="gj-adv-editor-section">
                    <div class="gj-adv-preview-header">
                        <label class="gj-adv-label"><i class="fa-solid fa-eye"></i> 预览 <span style="opacity:0.5;font-weight:normal;font-size:0.85em;">(填入样本数据可实时预览)</span></label>
                        <button type="button" class="gj-adv-fullscreen-btn gj-sb-fullscreen" title="全屏预览"><i class="fa-solid fa-expand"></i> 全屏</button>
                    </div>
                    <div class="gj-adv-preview gj-sb-preview"></div>
                    <textarea class="gj-sb-worldbook gj-sb-sample" rows="2" style="margin-top:4px;" placeholder="粘贴样本数据以预览（如：HP:100\n心情:开心\n好感度:80）"></textarea>
                </div>
                <div class="gj-adv-editor-section gj-sb-wb-section" style="margin-top:4px;display:none;">
                    <label class="gj-adv-label"><i class="fa-solid fa-book"></i> 升级后的世界书</label>
                    <textarea class="gj-sb-worldbook gj-sb-wb-editor" rows="4"></textarea>
                </div>
                <div class="gj-adv-refine-bar" style="margin-top:6px;">
                    <input class="gj-adv-refine-input gj-sb-refine" type="text" placeholder="输入润色 / 调整要求，例：改成深色风格、加上渐变背景...">
                    <button type="button" class="gj-custom-btn primary gj-adv-refine-btn gj-sb-refine-btn"><i class="fa-solid fa-paper-plane"></i></button>
                </div>
                <div class="gj-sb-btn-row">
                    <button type="button" class="gj-custom-btn gj-sb-back-btn"><i class="fa-solid fa-arrow-left"></i> 返回</button>
                    <span style="flex:1;"></span>
                    <button type="button" class="gj-custom-btn gj-sb-overwrite-wb-btn" style="background:#f59e0b;color:#fff;border:none;display:none;" title="覆盖原世界书条目"><i class="fa-solid fa-upload"></i> 覆盖世界书</button>
                    <button type="button" class="gj-custom-btn gj-sb-overwrite-regex-btn" style="background:#f59e0b;color:#fff;border:none;display:none;" title="覆盖角色卡中的原局部正则"><i class="fa-solid fa-upload"></i> 覆盖局部正则</button>
                    <button type="button" class="gj-custom-btn success gj-sb-export-btn"><i class="fa-solid fa-download"></i> 导出正则</button>
                </div>
            </div>
            <div class="gj-adv-loading" style="display:none;">
                <div class="gj-adv-spinner"></div>
                <div class="gj-adv-loading-text">正在处理...</div>
            </div>
        </div>`);

        const showLoading = (text) => {
            $tool.css('overflow', 'hidden');
            $tool.find('.gj-adv-loading').show();
            $tool.find('.gj-adv-loading-text').text(text || '正在处理...');
        };
        const hideLoading = () => {
            $tool.find('.gj-adv-loading').hide();
            $tool.css('overflow-y', 'auto');
        };

        const cleanAiOutput = (text) => {
            let html = text.trim();
            html = html.replace(/^```html\s*/i, '').replace(/```\s*$/, '');
            html = html.replace(/^```\s*/i, '').replace(/```\s*$/, '');
            return html.trim();
        };

        const doAiCall = async (messages, opts) => {
            opts = opts || {};
            const { maxRetries = 1 } = opts;
            isGenerating = true;
            showLoading('正在调用 AI...');
            const aiCfg = getAiConfig();
            const useMain = aiCfg.useMainApi !== false;
            const hasCustom = aiCfg.endpoint && aiCfg.key;
            const hasStApi = hasMainApi();
            if ((useMain && !hasStApi) || (!useMain && !hasCustom)) {
                hideLoading(); isGenerating = false;
                toastr.warning(useMain ? "主 API 不可用（未检测到 TavernHelper），请切换到自定义 API" : "请先配置自定义 API");
                await showApiConfigDialog();
                return null;
            }
            const statusReporter = (s) => { $tool.find('.gj-adv-loading-text').text(s); };
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    if (attempt > 0) showLoading(`正在重试 (${attempt}/${maxRetries})...`);
                    const result = await callAI(messages, statusReporter);
                    hideLoading(); isGenerating = false;
                    if (!result) { toastr.error("AI 返回为空"); return null; }
                    return cleanAiOutput(result);
                } catch (e) {
                    if (isAbortError(e)) { hideLoading(); isGenerating = false; return null; }
                    const isTimeout = /504|timeout|timed?\s*out|gateway/i.test(e.message);
                    if (isTimeout && attempt < maxRetries) {
                        toastr.warning(`请求超时，3 秒后自动重试...`, '', { timeOut: 3000 });
                        await new Promise(r => setTimeout(r, 3000));
                        continue;
                    }
                    hideLoading(); isGenerating = false;
                    if (isTimeout) {
                        toastr.error("AI 请求超时。建议：1) 再试一次 2) 切换到自定义 API 3) 检查网络", "请求超时", { timeOut: 10000 });
                    } else {
                        toastr.error("AI 调用失败: " + e.message);
                    }
                    return null;
                }
            }
            hideLoading(); isGenerating = false;
            return null;
        };

        const cleanSampleData = (raw) => {
            if (!raw) return raw;
            return raw.replace(/<\/?status>/gi, '').trim();
        };

        const buildStatusPreview = (html) => {
            let result = html;
            if (sampleData) {
                const clean = cleanSampleData(sampleData);
                const escaped = clean.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const scriptParts = [];
                result = result.replace(/<script[\s\S]*?<\/script>/gi, (m) => {
                    scriptParts.push(m);
                    return `<!--SCRIPT_PLACEHOLDER_${scriptParts.length - 1}-->`;
                });
                result = result.replace(/\$1/g, escaped);
                for (let i = 2; i <= 9; i++) {
                    result = result.replace(new RegExp('\\$' + i, 'g'), '(样本$' + i + ')');
                }
                scriptParts.forEach((s, idx) => {
                    result = result.replace(`<!--SCRIPT_PLACEHOLDER_${idx}-->`, s);
                });
            }
            return result;
        };

        const updatePreview = (html) => {
            const $prev = $tool.find('.gj-sb-preview');
            $prev.empty();
            const iframe = document.createElement('iframe');
            iframe.sandbox = 'allow-same-origin allow-scripts';
            iframe.style.cssText = 'width:100%;border:none;min-height:80px;border-radius:4px;background:#fff;';
            $prev.append(iframe);
            const previewHtml = buildStatusPreview(html);
            setTimeout(() => {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                doc.open(); doc.write(previewHtml); doc.close();
                const resize = () => { iframe.style.height = Math.max(80, doc.body.scrollHeight + 20) + 'px'; };
                setTimeout(resize, 100);
                setTimeout(resize, 500);
            }, 50);
        };

        const openFullscreen = () => {
            if (!currentHtml) { toastr.warning("暂无预览内容"); return; }
            const $overlay = $(`<div class="gj-adv-fs-overlay">
                <div class="gj-adv-fs-topbar"><span><i class="fa-solid fa-eye"></i> 全屏预览</span><button type="button" class="gj-adv-fs-close"><i class="fa-solid fa-xmark"></i> 关闭</button></div>
            </div>`);
            const fsIframe = document.createElement('iframe');
            fsIframe.sandbox = 'allow-same-origin allow-scripts';
            fsIframe.className = 'gj-adv-fs-iframe';
            $overlay.append(fsIframe);
            const $host = $tool.closest('.popup, [class*="popup"], dialog, .dialogue_popup');
            if ($host.length) $host.append($overlay); else $(document.body).append($overlay);
            setTimeout(() => {
                const doc = fsIframe.contentDocument || fsIframe.contentWindow.document;
                doc.open(); doc.write(buildStatusPreview(currentHtml)); doc.close();
            }, 50);
            const rm = () => { $overlay.remove(); $(document).off('keydown.gjsbfs'); };
            $overlay.find('.gj-adv-fs-close').on('click', rm);
            $(document).on('keydown.gjsbfs', (e) => { if (e.key === 'Escape') rm(); });
        };

        // 点击 / 聚焦时放大 textarea，失焦且内容为空时收起
        $tool.on('focus click', '.gj-sb-worldbook', function () {
            $(this).addClass('gj-sb-expanded');
        });
        $tool.on('blur', '.gj-sb-worldbook', function () {
            if (!$(this).val().trim()) $(this).removeClass('gj-sb-expanded');
        });

        // === Phase 1: Upload + Start ===
        $tool.find('.gj-sb-source-tab').on('click', function () {
            const src = $(this).data('source');
            $tool.find('.gj-sb-source-tab').removeClass('active');
            $(this).addClass('active');
            $tool.find('.gj-sb-panel-regex').toggle(src === 'regex');
            $tool.find('.gj-sb-panel-file').toggle(src === 'file');
        });

        // 世界书 tab 切换：默认"从世界书选取"，可切到"粘贴"
        $tool.find('.gj-sb-wb-tab').on('click', function () {
            const src = $(this).data('source');
            $tool.find('.gj-sb-wb-tab').removeClass('active');
            $(this).addClass('active');
            $tool.find('.gj-sb-wb-panel-pick').toggle(src === 'pick');
            $tool.find('.gj-sb-wb-panel-paste').toggle(src === 'paste');
        });

        const $dropZone = $tool.find('.gj-sb-drop-zone');
        const $fileInput = $tool.find('.gj-sb-file-input');
        const $fileCard = $tool.find('.gj-sb-file-card');

        $dropZone.on('dragover', (e) => { e.preventDefault(); e.stopPropagation(); $dropZone.addClass('dragover'); });
        $dropZone.on('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); $dropZone.removeClass('dragover'); });
        $dropZone.on('drop', (e) => {
            e.preventDefault(); e.stopPropagation(); $dropZone.removeClass('dragover');
            const file = e.originalEvent.dataTransfer.files[0];
            if (file) processFile(file);
        });
        $fileInput.on('change', function() { if (this.files[0]) processFile(this.files[0]); });

        function showFileCard(json, charCount) {
            $dropZone.hide();
            $fileCard.find('.gj-fc-name').text(json.scriptName || '未命名脚本');
            $fileCard.find('.gj-fc-detail').text(`findRegex: ${json.findRegex.substring(0, 50)}${json.findRegex.length > 50 ? '...' : ''} · ${charCount} 字符`);
            $fileCard.show();
            $tool.find('.gj-sb-do-upgrade').prop('disabled', false);
        }

        function clearFile() {
            originalJson = null; extractedHtml = ''; currentHtml = '';
            sourceRegexIdx = null;
            $fileInput.val('');
            $fileCard.hide();
            $dropZone.show();
            $tool.find('.gj-sb-do-upgrade').prop('disabled', true);
        }

        $fileCard.find('.gj-fc-remove').on('click', clearFile);

        function loadRegexJson(json) {
            if (!json.findRegex || !json.replaceString) {
                toastr.error("JSON 格式不正确：缺少 findRegex 或 replaceString");
                return false;
            }
            originalJson = json;
            extractedHtml = stripFence(json.replaceString);
            currentHtml = extractedHtml;
            showFileCard(json, extractedHtml.length);
            return true;
        }

        function processFile(file) {
            if (!file.name.endsWith('.json')) { toastr.error("请上传 .json 文件"); return; }
            const reader = new FileReader();
            reader.onload = (e) => {
                try { loadRegexJson(JSON.parse(e.target.result)); }
                catch (err) { toastr.error("JSON 解析失败: " + err.message); }
            };
            reader.readAsText(file);
        }

        $tool.find('.gj-sb-pick-regex').on('click', async () => {
            try {
                const charId = SillyTavern.characterId;
                const charObj = SillyTavern.characters?.[charId];
                const scripts = charObj?.data?.extensions?.regex_scripts || [];
                if (!scripts.length) { toastr.warning("当前角色卡没有绑定局部正则"); return; }
                const items = scripts.map((s, i) => `<div class="gj-sb-regex-pick-item" data-idx="${i}" style="padding:8px 12px;cursor:pointer;border-bottom:1px solid rgba(128,128,128,0.15);display:flex;align-items:center;gap:8px;transition:background 0.15s;">
                    <i class="fa-solid fa-file-code" style="opacity:0.4;"></i>
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:bold;font-size:0.9em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_.escape(s.scriptName || '未命名')}</div>
                        <div style="font-size:0.75em;opacity:0.5;font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_.escape(s.findRegex || '').substring(0, 60)}</div>
                    </div>
                </div>`).join('');
                const $pick = $(`<div style="max-height:50vh;overflow-y:auto;">${items}</div>`);
                const pickPopup = new SillyTavern.Popup($pick, SillyTavern.POPUP_TYPE.TEXT, "选择局部正则", { okButton: "取消" });
                $pick.find('.gj-sb-regex-pick-item').on('click', function() {
                    const idx = parseInt($(this).data('idx'));
                    const s = scripts[idx];
                    if (s) { sourceRegexIdx = idx; loadRegexJson(s); pickPopup.complete(SillyTavern.POPUP_RESULT.AFFIRMATIVE); }
                });
                $pick.find('.gj-sb-regex-pick-item').on('mouseenter', function() { $(this).css('background', 'rgba(122,154,131,0.1)'); }).on('mouseleave', function() { $(this).css('background', ''); });
                await pickPopup.show();
            } catch (e) { toastr.error("读取正则脚本失败: " + e.message); }
        });

        $tool.find('.gj-sb-pick-wb').on('click', async () => {
            try {
                const lorebookName = window.TavernHelper?.getCurrentCharPrimaryLorebook?.();
                if (!lorebookName) { toastr.warning("当前角色未绑定主世界书"); return; }
                const entries = await window.TavernHelper.getLorebookEntries(lorebookName);
                if (!entries || !entries.length) { toastr.warning("世界书为空"); return; }
                const items = entries.map((e, i) => {
                    const name = e.comment || (e.key?.length ? e.key[0] : `条目 ${e.uid}`);
                    const preview = (e.content || '').substring(0, 80).replace(/\n/g, ' ');
                    return `<div class="gj-sb-wb-pick-item" data-idx="${i}" style="padding:8px 12px;cursor:pointer;border-bottom:1px solid rgba(128,128,128,0.15);transition:background 0.15s;">
                        <div style="font-weight:bold;font-size:0.9em;">${_.escape(name)} <span style="opacity:0.4;font-weight:normal;">uid:${e.uid}</span></div>
                        <div style="font-size:0.78em;opacity:0.5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_.escape(preview)}</div>
                    </div>`;
                }).join('');
                const $pick = $(`<div style="max-height:50vh;overflow-y:auto;">${items}</div>`);
                const pickPopup = new SillyTavern.Popup($pick, SillyTavern.POPUP_TYPE.TEXT, "选择世界书条目", { okButton: "取消" });
                $pick.find('.gj-sb-wb-pick-item').on('click', function() {
                    const idx = parseInt($(this).data('idx'));
                    const entry = entries[idx];
                    if (entry?.content) {
                        sourceWbEntry = { lorebook: lorebookName, uid: entry.uid, comment: entry.comment || entry.uid };
                        $tool.find('.gj-sb-wb-input').val(entry.content);
                        const pickedName = entry.comment || `uid:${entry.uid}`;
                        $tool.find('.gj-sb-wb-picked-name').text(pickedName);
                        $tool.find('.gj-sb-wb-picked-hint').show();
                        toastr.success(`已选择: ${pickedName}`);
                        pickPopup.complete(SillyTavern.POPUP_RESULT.AFFIRMATIVE);
                    }
                });
                $pick.find('.gj-sb-wb-pick-item').on('mouseenter', function() { $(this).css('background', 'rgba(122,154,131,0.1)'); }).on('mouseleave', function() { $(this).css('background', ''); });
                await pickPopup.show();
            } catch (e) { toastr.error("读取世界书失败: " + e.message); }
        });

        const extractSampleFromWb = (wb) => {
            if (!wb) return '';
            const lines = wb.split(/\r?\n/);
            const samples = [];
            const KV_TPL = /^[\s\u3000]*(.+?)[\s\u3000]*[:：][\s\u3000]*\{\{(.+?)\}\}/;
            const KV_ANY = /^[\s\u3000]*(.+?)[\s\u3000]*[:：][\s\u3000]*(.+?)[\s\u3000]*$/;
            for (const line of lines) {
                if (!line || !line.trim()) continue;
                const m = line.match(KV_TPL);
                if (m) { samples.push(m[1].trim() + ':' + (m[2].includes('数') ? '50' : m[2].includes('状') ? '正常' : '示例')); continue; }
                const m2 = line.match(KV_ANY);
                if (m2 && !m2[2].includes('{') && m2[2].trim().length < 30 && !m2[0].includes('//') && !m2[0].includes('<!--')) {
                    samples.push(m2[1].trim() + ':' + m2[2].trim());
                }
            }
            return samples.join('\n');
        };

        const analyzeRegexGroups = (regexStr, html) => {
            const groups = [];
            let groupIdx = 0;
            for (let i = 0; i < regexStr.length; i++) {
                if (regexStr[i] === '\\') { i++; continue; }
                if (regexStr[i] === '(') {
                    if (regexStr[i+1] !== '?') {
                        groupIdx++;
                        let end = i + 1, d = 1;
                        while (end < regexStr.length && d > 0) {
                            if (regexStr[end] === '\\') { end++; }
                            else if (regexStr[end] === '(') d++;
                            else if (regexStr[end] === ')') d--;
                            end++;
                        }
                        const pattern = regexStr.substring(i, end);
                        const before = regexStr.substring(Math.max(0, i - 30), i);
                        const labelMatch = before.match(/([一-龥\w]+)[：:]\s*$/);
                        const label = labelMatch ? labelMatch[1] : null;
                        const usedInHtml = html.includes('$' + groupIdx);
                        groups.push({ idx: groupIdx, pattern, label, usedInHtml });
                    }
                }
            }
            return groups;
        };

        $tool.find('.gj-sb-do-upgrade').on('click', async () => {
            if (isGenerating || !originalJson) return;
            worldBookText = $tool.find('.gj-sb-wb-input').val().trim();
            const html = currentHtml;
            if (!html) { toastr.warning("HTML 内容为空"); return; }
            const regex = originalJson.findRegex;
            const groups = analyzeRegexGroups(regex, html);
            let groupAnalysis = '';
            if (groups.length > 0) {
                groupAnalysis = '\n\n## 原始正则捕获组分析\n';
                groupAnalysis += `原始 findRegex 共有 ${groups.length} 个捕获组:\n`;
                groups.forEach(g => {
                    const label = g.label ? `字段名 "${g.label}"` : '(未识别字段名)';
                    const used = g.usedInHtml ? '在 HTML 中使用' : '未在 HTML 中使用';
                    groupAnalysis += `- $${g.idx}: 捕获模式 ${g.pattern}, ${label}, ${used}\n`;
                });
                groupAnalysis += `\n你的新 HTML 的 <script> 必须能够解析并渲染以上所有字段。`;
                groupAnalysis += `\n解析时请注意：原始正则中紧接在捕获组前面的文字就是字段的 key（如 "HP:" 后跟的捕获组就是 HP 的值）。`;
                groupAnalysis += `\n新架构下，AI 会输出 key:value 格式的文本，你的 script 需要按行解析并提取对应的 key-value。`;
            }
            let userMsg = `请将以下状态栏正则模板升级为"单 $1 捕获 + JS 运行时解析"架构。\n\n当前 findRegex: ${regex}${groupAnalysis}\n\n当前 HTML 模板（其中 $1~$${groups.length || '?'} 是正则捕获组引用）:\n${html}`;
            if (worldBookText) userMsg += `\n\n当前世界书内容（定义了 AI 输出状态栏的格式）:\n${worldBookText}\n\n请同时输出升级后的世界书内容。用 <!-- WORLDBOOK_START --> 和 <!-- WORLDBOOK_END --> 标签包裹升级后的世界书文本，放在 HTML 输出之后。世界书内容应该匹配新的单标签捕获格式（如 <status>...</status>），告诉 AI 在标签内按 key:value 逐行输出状态数据。`;
            conversationHistory = [
                { role: 'system', content: AI_STATUSBAR_UPGRADE_PROMPT },
                { role: 'user', content: userMsg }
            ];

            $tool.find('.gj-sb-html-editor').val('');
            $tool.find('.gj-sb-preview').empty();
            $tool.find('.gj-sb-phase-upload').slideUp(200);
            $tool.find('.gj-sb-phase-result').slideDown(200);
            $tool.find('.gj-sb-status').text('(AI 生成中...)');
            const result = await doAiCall(conversationHistory);
            if (!result) { $tool.find('.gj-sb-status').text('(失败)'); return; }

            let upgradedHtml = result;
            const regexMatch = upgradedHtml.match(/<!--\s*findRegex:\s*(.+?)\s*-->/);
            let suggestedRegex = '';
            if (regexMatch) {
                suggestedRegex = regexMatch[1].trim();
                if (originalJson) originalJson._suggestedRegex = suggestedRegex;
            }
            const wbMatch = upgradedHtml.match(/<!--\s*WORLDBOOK_START\s*-->([\s\S]*?)<!--\s*WORLDBOOK_END\s*-->/);
            if (wbMatch) {
                $tool.find('.gj-sb-wb-editor').val(wbMatch[1].trim());
                $tool.find('.gj-sb-wb-section').show();
                if (sourceWbEntry) $tool.find('.gj-sb-overwrite-wb-btn').show();
                upgradedHtml = upgradedHtml.replace(/<!--\s*WORLDBOOK_START\s*-->[\s\S]*?<!--\s*WORLDBOOK_END\s*-->/, '').trim();
            }
            const sampleMatch = upgradedHtml.match(/<!--\s*SAMPLE_START\s*-->([\s\S]*?)<!--\s*SAMPLE_END\s*-->/);
            if (sampleMatch) {
                const aiSample = sampleMatch[1].trim();
                upgradedHtml = upgradedHtml.replace(/<!--\s*SAMPLE_START\s*-->[\s\S]*?<!--\s*SAMPLE_END\s*-->/, '').trim();
                if (aiSample) {
                    sampleData = aiSample;
                    $tool.find('.gj-sb-sample').val(aiSample);
                }
            }
            if (!sampleData && worldBookText) {
                const autoSample = extractSampleFromWb(worldBookText);
                if (autoSample) {
                    sampleData = autoSample;
                    $tool.find('.gj-sb-sample').val(autoSample);
                }
            }
            currentHtml = upgradedHtml;
            upgraded = true;
            conversationHistory.push({ role: 'assistant', content: result });
            if (suggestedRegex) {
                $tool.find('.gj-sb-suggested-regex').text('新正则: ' + suggestedRegex);
            }
            $tool.find('.gj-sb-html-editor').val(wrapFence(upgradedHtml));
            if (sourceRegexIdx !== null) $tool.find('.gj-sb-overwrite-regex-btn').show();
            updatePreview(upgradedHtml);
            $tool.find('.gj-sb-status').text('(AI 升级完毕)');
        });

        // === Phase 2: Result ===
        $tool.find('.gj-sb-config-btn, .gj-sb-config-btn2').on('click', () => showApiConfigDialog());
        $tool.find('.gj-sb-fullscreen').on('click', () => openFullscreen());

        $tool.find('.gj-sb-html-editor').on('input', function() {
            currentHtml = stripFence($(this).val());
            updatePreview(currentHtml);
        });

        $tool.find('.gj-sb-sample').on('input', function() {
            sampleData = $(this).val();
            if (currentHtml) updatePreview(currentHtml);
        });

        const doRefine = async () => {
            if (isGenerating) return;
            const $ri = $tool.find('.gj-sb-refine');
            const feedback = $ri.val().trim();
            if (!feedback) return;
            if (conversationHistory.length === 0) {
                conversationHistory = [
                    { role: 'system', content: AI_STATUSBAR_UPGRADE_PROMPT },
                    { role: 'user', content: '以下是当前的状态栏 HTML 模板：\n\n' + currentHtml },
                    { role: 'assistant', content: currentHtml }
                ];
            }
            $ri.val('');
            conversationHistory.push({ role: 'user', content: feedback });
            $tool.find('.gj-sb-html-editor').val('');
            $tool.find('.gj-sb-status').text('(AI 调整中...)');
            const refined = await doAiCall(conversationHistory);
            if (!refined) { $tool.find('.gj-sb-status').text('(失败)'); return; }
            let refinedHtml = refined;
            const wbMatch = refinedHtml.match(/<!--\s*WORLDBOOK_START\s*-->([\s\S]*?)<!--\s*WORLDBOOK_END\s*-->/);
            if (wbMatch) {
                $tool.find('.gj-sb-wb-editor').val(wbMatch[1].trim());
                refinedHtml = refinedHtml.replace(/<!--\s*WORLDBOOK_START\s*-->[\s\S]*?<!--\s*WORLDBOOK_END\s*-->/, '').trim();
            }
            currentHtml = refinedHtml;
            conversationHistory.push({ role: 'assistant', content: refined });
            $tool.find('.gj-sb-html-editor').val(wrapFence(refinedHtml));
            updatePreview(refinedHtml);
            $tool.find('.gj-sb-status').text('(AI 调整完毕)');
        };

        $tool.find('.gj-sb-refine-btn').on('click', doRefine);
        $tool.find('.gj-sb-refine').on('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doRefine(); } });

        $tool.find('.gj-sb-back-btn').on('click', () => {
            conversationHistory = [];
            upgraded = false;
            sampleData = '';
            $tool.find('.gj-sb-sample').val('');
            $tool.find('.gj-sb-overwrite-regex-btn, .gj-sb-overwrite-wb-btn').hide();
            $tool.find('.gj-sb-phase-result').slideUp(200);
            $tool.find('.gj-sb-phase-upload').slideDown(200);
        });

        $tool.find('.gj-sb-overwrite-regex-btn').on('click', async () => {
            if (sourceRegexIdx === null) return;
            const html = stripFence($tool.find('.gj-sb-html-editor').val());
            if (!html) { toastr.warning("HTML 内容为空"); return; }
            const charId = SillyTavern.characterId;
            const charObj = SillyTavern.characters?.[charId];
            const scripts = charObj?.data?.extensions?.regex_scripts;
            if (!scripts || sourceRegexIdx >= scripts.length) { toastr.error("找不到原局部正则，可能已被删除"); return; }
            const scriptName = scripts[sourceRegexIdx].scriptName || '未命名';
            const confirmed = confirm(`确定覆盖局部正则「${scriptName}」？\n此操作将修改角色卡中的正则脚本。`);
            if (!confirmed) return;

            const patch = { replaceString: wrapFence(html) };
            if (originalJson?._suggestedRegex) {
                const sr = originalJson._suggestedRegex;
                const m = sr.match(/^\/(.+)\/([gimsuy]*)$/);
                if (m) patch.findRegex = m[1];
            }

            const $btn = $tool.find('.gj-sb-overwrite-regex-btn');
            const originalLabel = $btn.html();
            $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> 保存中...');
            const res = await overwriteScopedRegex(sourceRegexIdx, patch);
            $btn.prop('disabled', false).html(originalLabel);
            if (res.ok) toastr.success(`已覆盖局部正则「${scriptName}」并保存`);
            else toastr.error(`覆盖失败：${res.reason}`);
        });

        $tool.find('.gj-sb-overwrite-wb-btn').on('click', async () => {
            if (!sourceWbEntry) return;
            const wb = $tool.find('.gj-sb-wb-editor').val().trim();
            if (!wb) { toastr.warning("世界书内容为空"); return; }
            const confirmed = confirm(`确定覆盖世界书条目「${sourceWbEntry.comment}」？\n此操作将修改世界书内容。`);
            if (!confirmed) return;
            try {
                await window.TavernHelper.setLorebookEntries(sourceWbEntry.lorebook, [{ uid: sourceWbEntry.uid, content: wb }]);
                toastr.success("已覆盖世界书条目");
            } catch (e) { toastr.error("覆盖世界书失败: " + e.message); }
        });

        $tool.find('.gj-sb-export-btn').on('click', () => {
            const html = stripFence($tool.find('.gj-sb-html-editor').val());
            if (!html) { toastr.warning("HTML 内容为空"); return; }
            if (!originalJson) { toastr.error("原始 JSON 丢失"); return; }
            const exported = Object.assign({}, originalJson);
            exported.replaceString = wrapFence(html);
            if (originalJson?._suggestedRegex) {
                const sr = originalJson._suggestedRegex;
                const m = sr.match(/^\/(.+)\/([gimsuy]*)$/);
                if (m) {
                    exported.findRegex = m[1];
                    if (exported.flags !== undefined) {
                        exported.flags = m[2] || '';
                    }
                }
            }
            delete exported._suggestedRegex;
            exported.id = originalJson.id || ('sb-upgraded-' + Date.now());
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exported, null, 2));
            const anchor = document.createElement('a');
            anchor.href = dataStr;
            const baseName = (originalJson.scriptName || 'StatusBar').replace(/[^\w\u4e00-\u9fff]/g, '_');
            anchor.download = `Regex_${baseName}_Upgraded.json`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            toastr.success("升级版正则已导出，请在正则扩展中导入");
        });

        const toolPopup = new SillyTavern.Popup($tool, SillyTavern.POPUP_TYPE.TEXT, "", { large: true, okButton: "关闭" });
        await toolPopup.show();
    }

    // 目录处理 (分批)
    async function processBatchAndSave(charId, totalItems, processFunction, refreshCallback, myPopup) {
        if (myPopup) myPopup.complete(SillyTavern.POPUP_RESULT.AFFIRMATIVE);
        const $progressContent = $(`<div class="gj-progress-popup"><div class="gj-spinner"></div><div class="gj-progress-text">正在处理...</div><div class="gj-progress-sub">请勿关闭 (0/${totalItems})</div></div>`);
        let progressPopup = null;
        if (window.SillyTavern && SillyTavern.Popup) { progressPopup = new SillyTavern.Popup($progressContent, SillyTavern.POPUP_TYPE.TEXT, "", { transparent: true, okButton: false, cancelButton: false }); progressPopup.show(); }
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));
        
        try {
            const BATCH_SIZE = 20; 
            for (let i = 0; i < totalItems; i += BATCH_SIZE) {
                const end = Math.min(i + BATCH_SIZE, totalItems);
                processFunction(i, end); 
                $progressContent.find('.gj-progress-sub').text(`请勿关闭 (${end}/${totalItems})`);
                await sleep(100); 
            }

            $progressContent.find('.gj-progress-text').text("正在写入磁盘..."); await sleep(50); 
            await forceSave(charId);
            $progressContent.find('.gj-progress-text').text("刷新界面..."); await sleep(200); 
            toastr.success(`操作完成`); if (progressPopup) progressPopup.complete(SillyTavern.POPUP_RESULT.AFFIRMATIVE); if (refreshCallback) setTimeout(refreshCallback, 100);
        } catch (err) { console.error(err); toastr.error("写入出错"); if (progressPopup) progressPopup.complete(SillyTavern.POPUP_RESULT.CANCELLED); }
    }

    // --- Lore 逻辑 (保留用于 Lore 配置和 插入功能) ---
    function getAllManagedLoreUIDs(charId) {
        if (_loreCache.charId === charId && _loreCache.uids) return _loreCache.uids;
        const charObj = SillyTavern.characters[charId];
        const allUIDs = new Set();
        const scan = (content) => { const p = parseMessageContent(content); p.lore.forEach(uid => allUIDs.add(uid)); };
        scan(charObj.first_mes);
        if (charObj.data.alternate_greetings) { charObj.data.alternate_greetings.forEach(g => scan(g)); }
        _loreCache.charId = charId; _loreCache.uids = allUIDs;
        return allUIDs;
    }

    // 这一段方法在 UI 内部点击“插入聊天”时也会用到
    async function syncLorebookState(targetLoreArray, targetExcludeArray) {
        if (_isSyncing) return;
        _isSyncing = true;
        try {
            const charId = SillyTavern.characterId;
            const lorebookName = window.TavernHelper.getCurrentCharPrimaryLorebook();
            if (!lorebookName) return; 
            const managedUIDs = getAllManagedLoreUIDs(charId);
            const targetSet = new Set(targetLoreArray);
            const excludeSet = new Set(targetExcludeArray || []);
            let currentEntries = []; try { currentEntries = await window.TavernHelper.getLorebookEntries(lorebookName); } catch (e) { return; }
            const updates = []; const actionLogs = []; const processedUids = new Set();
            managedUIDs.forEach(uid => {
                const shouldEnable = targetSet.has(uid) && !excludeSet.has(uid);
                processedUids.add(uid);
                const entry = currentEntries.find(e => e.uid === uid);
                if (entry && entry.enabled !== shouldEnable) {
                    updates.push({ uid: uid, enabled: shouldEnable });
                    const entryName = entry.comment || (entry.key && entry.key.length ? entry.key[0] : `条目 ${uid}`);
                    actionLogs.push(`${shouldEnable ? '✅' : '🚫'} ${entryName}`);
                }
            });
            excludeSet.forEach(uid => {
                if (processedUids.has(uid)) return;
                const entry = currentEntries.find(e => e.uid === uid);
                if (entry && entry.enabled) {
                    updates.push({ uid: uid, enabled: false });
                    const entryName = entry.comment || (entry.key && entry.key.length ? entry.key[0] : `条目 ${uid}`);
                    actionLogs.push(`🚫 ${entryName}`);
                }
            });
            if (updates.length > 0) {
                await window.TavernHelper.setLorebookEntries(lorebookName, updates);
                if (actionLogs.length > 3) toastr.success(`更新了 ${actionLogs.length} 个世界书条目`);
                else toastr.info(actionLogs.join('<br>'), '世界书同步', { timeOut: 3000, escapeHtml: false });
            }
        } finally { _isSyncing = false; }
    }

    async function openLoreSelector(currentUIDs, currentExcludes, currentGreetingIndex) {
        currentExcludes = currentExcludes || [];
        const popupFunc = SillyTavern.callGenericPopup || window.callGenericPopup;
        const lorebookName = window.TavernHelper.getCurrentCharPrimaryLorebook();
        if (!lorebookName) { toastr.warning("当前角色未绑定主世界书"); return null; }
        let entries = []; try { entries = await window.TavernHelper.getLorebookEntries(lorebookName); } catch(e) { toastr.error("读取世界书失败"); return null; }

        const charId = SillyTavern.characterId;
        const charObj = SillyTavern.characters[charId];
        const currentLabel = currentGreetingIndex === -1 ? '#0' : `#${currentGreetingIndex + 1}`;

        const greetingStates = [];
        const buildGState = (content, idx) => {
            const p = parseMessageContent(content);
            return { index: idx, label: idx === -1 ? '#0' : `#${idx + 1}`, lore: p.lore, exclude: p.exclude };
        };
        greetingStates.push(buildGState(charObj.first_mes, -1));
        (charObj.data.alternate_greetings || []).forEach((g, i) => greetingStates.push(buildGState(g, i)));

        const workingLore = new Set(currentUIDs);
        const workingExclude = new Set(currentExcludes);

        const getManagedUIDs = () => {
            const s = new Set(workingLore);
            greetingStates.forEach(st => { if (st.index !== currentGreetingIndex) st.lore.forEach(u => s.add(u)); });
            return s;
        };

        const origInclude = new Set(currentUIDs);
        const origExclude = new Set(currentExcludes);
        entries.sort((a, b) => {
            const ai = origInclude.has(a.uid), bi = origInclude.has(b.uid);
            const ae = origExclude.has(a.uid), be = origExclude.has(b.uid);
            if ((ai||ae) && !(bi||be)) return -1; if (!(ai||ae) && (bi||be)) return 1;
            if (ai && !bi) return -1; if (!ai && bi) return 1;
            return a.uid - b.uid;
        });

        const entryNameMap = {};
        entries.forEach(e => { entryNameMap[e.uid] = e.comment || (e.key && e.key.length ? e.key[0] : `条目${e.uid}`); });

        const buildCrossRef = (uid) => {
            const parts = [];
            const managed = getManagedUIDs();
            const otherHasExclude = greetingStates.some(st => st.index !== currentGreetingIndex && st.exclude.includes(uid));
            if (workingLore.has(uid)) parts.push(`<span class="gj-lore-dot enabled current">启用</span>`);
            else if (workingExclude.has(uid)) parts.push(`<span class="gj-lore-dot excluded current">关闭</span>`);
            else if (managed.has(uid)) parts.push(`<span class="gj-lore-dot excluded current" style="opacity:0.6;">自动关闭</span>`);
            else if (otherHasExclude) parts.push(`<span class="gj-lore-dot enabled current" style="opacity:0.6;">自动开启</span>`);
            else parts.push(`<span class="gj-lore-dot default current">默认</span>`);
            greetingStates.forEach(st => {
                if (st.index === currentGreetingIndex) return;
                const inLore = st.lore.includes(uid);
                const inExclude = st.exclude.includes(uid);
                if (inLore) parts.push(`<span class="gj-lore-dot enabled" title="已绑定 ${_.escape(st.label)}，切换到该开场白时开启，切换到其他开场白时自动关闭">${_.escape(st.label)} 开启</span>`);
                else if (inExclude) parts.push(`<span class="gj-lore-dot excluded" title="已绑定 ${_.escape(st.label)}，切换到该开场白时关闭，切换到其他开场白时自动开启">${_.escape(st.label)} 关闭</span>`);
            });
            return parts.join('');
        };

        const $content = $(`
            <div class="gj-lore-popup-content">
                <div style="font-weight:bold; margin-bottom:5px;">配置世界书绑定 — ${_.escape(currentLabel)}</div>
                <div style="font-size:0.85em; opacity:0.7; margin-bottom:8px; line-height:1.4;">
                    <b style="color:#9c27b0;">启用</b> — 切换时开启 &nbsp;
                    <b style="color:#f44336;">排除</b> — 切换时强制关闭 &nbsp;
                    <span style="opacity:0.6;">| 跨开场白逻辑自动整理</span>
                </div>
                <div class="gj-lore-list"></div>
            </div>`);
        const $list = $content.find('.gj-lore-list');

        entries.forEach(entry => {
            const uid = entry.uid;
            const isIncluded = workingLore.has(uid);
            const isExcluded = workingExclude.has(uid);
            const displayName = entry.comment || (entry.key && entry.key.length ? `(关键词: ${entry.key[0]})` : "无标题");

            const $item = $(`<div class="gj-lore-item ${isIncluded ? 'checked' : ''} ${isExcluded ? 'excluded' : ''}" data-uid="${uid}">
                <span class="gj-lore-uid">[${uid}]</span>
                <div class="gj-lore-entry-info">
                    <span class="gj-lore-name">${_.escape(displayName)}</span>
                    <div class="gj-lore-status-row">${buildCrossRef(uid)}</div>
                </div>
                <div class="gj-lore-actions">
                    <span class="gj-lore-toggle include ${isIncluded ? 'on' : ''}" title="启用">启用</span>
                    <span class="gj-lore-toggle exclude ${isExcluded ? 'on' : ''}" title="排除">排除</span>
                </div>
            </div>`);

            const $inc = $item.find('.include');
            const $exc = $item.find('.exclude');

            const refreshAllStatus = () => {
                $list.find('.gj-lore-item').each(function() {
                    $(this).find('.gj-lore-status-row').html(buildCrossRef(parseInt($(this).data('uid'))));
                });
            };

            $inc.on('click', (e) => {
                e.stopPropagation();
                const on = !$inc.hasClass('on');
                if (on) { workingLore.add(uid); workingExclude.delete(uid); $exc.removeClass('on'); $item.removeClass('excluded'); }
                else { workingLore.delete(uid); }
                $inc.toggleClass('on', on);
                $item.toggleClass('checked', on);
                refreshAllStatus();
            });

            $exc.on('click', (e) => {
                e.stopPropagation();
                const on = !$exc.hasClass('on');
                if (on) { workingExclude.add(uid); workingLore.delete(uid); $inc.removeClass('on'); $item.removeClass('checked'); }
                else { workingExclude.delete(uid); }
                $exc.toggleClass('on', on);
                $item.toggleClass('excluded', on);
                refreshAllStatus();
            });

            $list.append($item);
        });

        const result = await popupFunc($content, SillyTavern.POPUP_TYPE.CONFIRM, "", { large: true, okButton: "保存设定", cancelButton: "取消" });
        if (result) {
            const newLore = [...workingLore];
            const newExclude = [...workingExclude];
            const managed = getManagedUIDs();
            const otherChanges = [];

            greetingStates.forEach(st => {
                if (st.index === currentGreetingIndex) return;
                const cleanedExclude = st.exclude.filter(uid => !(managed.has(uid) && !st.lore.includes(uid)));
                if (cleanedExclude.length !== st.exclude.length) {
                    otherChanges.push({ index: st.index, lore: st.lore, exclude: cleanedExclude });
                }
            });

            return { lore: newLore, exclude: newExclude, otherChanges };
        }
        return null;
    }

    async function openDirectoryTool(charId, refreshCallback, showGuide, tourResumeType) {
        const charObj = SillyTavern.characters[charId];
        let importText = charObj.first_mes || ""; let parsedMatches = []; let startIndex = -1; let exportText = ""; const currentFormat = "{{i}}. {{text}}"; let currentStep = 'tabs'; let isSwitchingView = false; 
        let $activeContainer = null;
        const updateExportPreview = () => {
            let lines = [];
            const fmtLine = (idx, parsed) => {
                if (!parsed.title) return;
                let line = currentFormat.replace('{{i}}', idx).replace('{{text}}', parsed.title);
                if (parsed.desc) line += ` | ${parsed.desc}`;
                lines.push(line);
            };
            fmtLine('0', parseMessageContent(charObj.first_mes || ""));
            (charObj.data.alternate_greetings || []).forEach((g, i) => fmtLine(i + 1, parseMessageContent(g)));
            exportText = `<greetings>\n${lines.join('\n')}\n</greetings>`; const $target = $activeContainer ? $activeContainer.find('.export-area') : $('.export-area'); $target.val(exportText);
        };
        const generateOptionsHtml = (selectedVal) => {
            let html = `<option value="-1" ${selectedVal === -1 ? 'selected' : ''}>开场白 #0</option>`; const len = (charObj.data.alternate_greetings || []).length; for (let i = 0; i < len; i++) html += `<option value="${i}" ${selectedVal === i ? 'selected' : ''}>开场白 #${i + 1}</option>`; return html;
        };
        const BEAUTIFY_PROMPT = `请基于以下 HTML 代码进行视觉美化。要求：
1. 保持所有 id 属性不变，特别是 prologue-data、prologue-list、prologue-item-tpl 三个关键 id
2. 保持所有 <template> 标签及其结构不变
3. 保持 {INDEX}、{TITLE}、{DESC} 占位符不变
4. 只修改 CSS 样式和 HTML 外观元素（如布局、颜色、字体、动画等）
5. 可添加背景、装饰元素、卡片样式等视觉增强
6. 确保在移动端也有良好的显示效果
7. 输出时**必须**用三重反引号代码块包裹，以 \`\`\`html 开头、\`\`\` 结尾，前后不要添加任何解释文字或其他字符

以下是需要美化的 HTML 代码：

`;
        const openRegexChooser = async () => {
            const $chooser = $(`<div class="gj-regex-chooser">
<div class="gj-regex-card">
  <div class="gj-regex-card-title"><i class="fa-solid fa-file-code"></i> 基础样式</div>
  <div class="gj-regex-card-desc">生成简洁的目录跳转页面，适合快速使用或作为美化基础。<br>可直接导入正则扩展使用，也可以将生成的代码交给 AI 进一步美化。</div>
  <div class="gj-regex-card-actions">
    <button type="button" class="gj-custom-btn primary chooser-dl-btn"><i class="fa-solid fa-download"></i> 下载正则</button>
    <button type="button" class="gj-custom-btn chooser-copy-prompt-btn"><i class="fa-solid fa-copy"></i> 复制美化 Prompt</button>
  </div>
</div>
<div class="gj-regex-card">
  <div class="gj-regex-card-title"><i class="fa-solid fa-palette"></i> 融合美化 (AI)</div>
  <div class="gj-regex-card-desc">已有美化好的 HTML 首页？粘贴进来，AI 会保留你的视觉设计并融合跳转逻辑。<br>之后增删开场白不需要改正则代码。</div>
  <div class="gj-regex-card-actions">
    <button type="button" class="gj-custom-btn primary chooser-fusion-btn"><i class="fa-solid fa-paintbrush"></i> 开始融合</button>
  </div>
</div>
</div>`);
            $chooser.find('.chooser-dl-btn').on('click', (e) => { e.preventDefault(); downloadRegex(currentFormat); });
            $chooser.find('.chooser-copy-prompt-btn').on('click', (e) => {
                e.preventDefault();
                const regexObj = generateRegexJson(currentFormat);
                const rawReplace = regexObj ? regexObj.replaceString : '';
                const htmlBody = rawReplace.replace(/^```html\n?/, '').replace(/\n?```$/, '');
                const fullPrompt = BEAUTIFY_PROMPT + htmlBody;
                chooserPopup.complete(SillyTavern.POPUP_RESULT.CANCELLED);
                setTimeout(() => {
                    const $promptBox = $(`<div class="gj-prompt-container" style="display:flex;flex-direction:column;gap:10px;color:var(--smart-theme-body-color);width:100%;height:100%;">
                        <div style="font-size:0.9em;opacity:0.7;">已生成美化 Prompt，请全选复制后粘贴给 AI：</div>
                        <textarea class="gj-prompt-textarea" readonly style="width:100%;flex:1 1 auto;min-height:300px;resize:vertical;background:var(--smart-theme-input-bg);color:var(--smart-theme-body-color);border:1px solid var(--smart-theme-border-color-1);border-radius:4px;padding:10px;font-size:0.85em;font-family:monospace;box-sizing:border-box;">${_.escape(fullPrompt)}</textarea>
                        <button type="button" class="gj-custom-btn primary gj-prompt-copy-btn" style="align-self:flex-start;"><i class="fa-solid fa-copy"></i> 复制到剪贴板</button>
                    </div>`);
                    const $ta = $promptBox.find('.gj-prompt-textarea');
                    $promptBox.find('.gj-prompt-copy-btn').on('click', () => {
                        const el = $ta[0]; el.focus(); el.select(); el.setSelectionRange(0, el.value.length);
                        let ok = false; try { ok = document.execCommand('copy'); } catch (_) {}
                        if (ok) toastr.success('已复制'); else toastr.info('请按 Ctrl+A 全选后 Ctrl+C 复制');
                    });
                    const promptPopup = new SillyTavern.Popup($promptBox, SillyTavern.POPUP_TYPE.TEXT, '美化 Prompt', { large: true, okButton: '关闭' });
                    promptPopup.show().then(() => { $ta[0].focus(); $ta[0].select(); });
                }, 100);
            });
            $chooser.find('.chooser-fusion-btn').on('click', (e) => { e.preventDefault(); chooserPopup.complete(SillyTavern.POPUP_RESULT.CANCELLED); setTimeout(() => openAdvancedBeautifyUI(), 50); });
            const chooserPopup = new SillyTavern.Popup($chooser, SillyTavern.POPUP_TYPE.TEXT, '选择正则样式', { large: false, okButton: '关闭' });
            await chooserPopup.show();
        };
        let myPopup = null;
        const renderTabUI = () => {
            const isAuthorExport = tourResumeType === 'author_after_dir';
            const guideHtml = showGuide && !isAuthorExport ? (() => { const p = /^\d+[.、]\s*.+/m.test(importText); return p ? '<div class="gj-dir-guide"><i class="fa-solid fa-lightbulb"></i><span>检测到文字格式的目录内容，可直接点击下方<b>「解析目录」</b>按钮。<br>解析后可预览标题分配，确认后写入各开场白。</span></div>' : '<div class="gj-dir-guide"><i class="fa-solid fa-lightbulb"></i><span>如需导入目录，请从DC原帖或作者说明中复制文字版目录列表，<br>粘贴到下方输入框后点击<b>「解析目录」</b>即可自动解析。</span></div>'; })() : '';
            const exportGuideHtml = showGuide && isAuthorExport ? '<div class="gj-dir-guide"><i class="fa-solid fa-lightbulb"></i><span>这是<b>导出/生成</b>面板，已根据现有标题自动生成目录。<br>· <b>生成跳转正则</b> — 基础样式可直接使用或交给 AI 美化；融合美化可保留已有设计<br>· <b>插入/覆盖首页</b> — 将目录写入开场白 #0</span></div>' : '';
            const importTabActive = isAuthorExport ? '' : 'active';
            const exportTabActive = isAuthorExport ? 'active' : '';
            const $container = $(`<div class="gj-parse-container"><div class="gj-tabs-header"><div class="gj-tab ${!isAuthorExport && currentStep === 'tabs' ? 'active' : ''}" data-tab="import">导入/解析</div><div class="gj-tab ${exportTabActive}" data-tab="export">导出/生成</div></div><div class="gj-tab-content ${importTabActive}" id="tab-import">${guideHtml}<div class="gj-parse-header-row"><span class="gj-parse-hint">修改首页或粘贴开场白列表:</span></div><div class="gj-parse-textarea-wrapper"><textarea class="gj-parse-textarea import-area" placeholder="粘贴内容...">${_.escape(importText)}</textarea></div><div class="gj-parse-custom-footer" style="margin-top:10px;"><button type="button" class="gj-custom-btn clear-btn"><i class="fa-solid fa-trash"></i> 清空</button><button type="button" class="gj-custom-btn primary parse-btn"><i class="fa-solid fa-wand-magic-sparkles"></i> 解析目录</button></div></div><div class="gj-tab-content ${exportTabActive}" id="tab-export">${exportGuideHtml}<div class="gj-parse-header-row"><span class="gj-parse-hint">开场白目录预览（据标题生成）:</span><button type="button" class="gj-gen-regex-btn" title="生成跳转正则"><i class="fa-solid fa-wand-magic-sparkles"></i> 生成跳转正则</button></div><div style="font-size:0.82em;opacity:0.6;padding:0 2px 4px;line-height:1.4;">目录文本根据现有标题自动生成。点击「生成跳转正则」选择基础样式或融合已有美化 HTML。</div><div class="gj-parse-textarea-wrapper"><textarea class="gj-parse-textarea export-area"></textarea></div><div class="gj-parse-custom-footer" style="margin-top:10px;"><button type="button" class="gj-custom-btn copy-btn" title="复制内容"><i class="fa-solid fa-copy"></i></button><button type="button" class="gj-custom-btn success insert-as-new-btn" style="font-weight:bold;">插入为新首页</button><button type="button" class="gj-custom-btn danger overwrite-btn" style="font-weight:bold;">覆盖原首页</button></div></div></div>`);
            $activeContainer = $container;
            $container.find('.gj-tab').on('click', function() { const tabId = $(this).data('tab'); $container.find('.gj-tab').removeClass('active'); $(this).addClass('active'); $container.find('.gj-tab-content').removeClass('active'); $container.find(`#tab-${tabId}`).addClass('active'); if(tabId === 'export') updateExportPreview(); });
            $container.find('.clear-btn').on('click', (e) => { e.preventDefault(); $container.find('.import-area').val('').focus(); });
            $container.find('.copy-btn').on('click', (e) => { e.preventDefault(); const text = $container.find('.export-area').val(); if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text).then(() => toastr.success("已复制")); } else { const textArea = document.createElement("textarea"); textArea.value = text; textArea.style.position = "fixed"; textArea.style.left = "-9999px"; document.body.appendChild(textArea); textArea.select(); try { document.execCommand('copy'); toastr.success("已复制"); } catch (err) { toastr.error("复制失败"); } document.body.removeChild(textArea); } });
            $container.find('.import-area').on('input', function() { importText = $(this).val(); });
            $container.find('.gj-gen-regex-btn').on('click', (e) => { e.preventDefault(); openRegexChooser(); });
            $container.find('.parse-btn').on('click', (e) => { e.preventDefault(); importText = $container.find('.import-area').val(); if (!importText.trim()) { toastr.warning("内容为空"); return; } const regex = /(?:^|\n)\s*(?:[#＃] |[\[【(（]?(?:开场白|场景|Part|No\.?|Scene|Scenario)\s*)?([0-9]+|[一二三四五六七八九十]+)[\]】)）]?\s*[:：.、\-\—\s]+\s*(.*?)(?=\n|$)/igm; parsedMatches = []; let match; const cnMap = '零一二三四五六七八九十'; while ((match = regex.exec(importText)) !== null) { const ns = match[1]; const num = /^\d+$/.test(ns) ? parseInt(ns) : (cnMap.indexOf(ns) >= 0 ? cnMap.indexOf(ns) : 0); const parts = match[2].split(/[|｜]/); parsedMatches.push({ num, title: parts[0].trim(), desc: parts[1] ? parts[1].trim() : '', selectedIndex: null }); } if (parsedMatches.length === 0) { toastr.warning("未识别到目录格式"); return; } startIndex = parsedMatches[0].num - 1; isSwitchingView = true; myPopup.complete(SillyTavern.POPUP_RESULT.CANCELLED); setTimeout(() => openPreviewUI(), 50); });
            $container.find('.insert-as-new-btn').on('click', async (e) => { e.preventDefault(); if(!confirm("确定插入新页面？原内容将顺移。")) return; isSwitchingView = true; await processBatchAndSave(charId, 1, (start, end) => { const oldFirstMes = charObj.first_mes || ""; if (!charObj.data.alternate_greetings) charObj.data.alternate_greetings = []; charObj.data.alternate_greetings.unshift(oldFirstMes); charObj.first_mes = composeMessageContent("目录页", [], $container.find('.export-area').val()); if (charObj.data) charObj.data.first_mes = charObj.first_mes; updateNativeCharacterUI(charObj.first_mes); const msgZero = SillyTavern.chat[0]; if (msgZero && window.TavernHelper) { const swipes = msgZero.swipes || [msgZero.mes]; swipes.unshift(charObj.first_mes); const newSwipeId = (msgZero.swipe_id || 0) + 1; window.TavernHelper.setChatMessages([{ message_id: 0, swipes: swipes, swipe_id: newSwipeId }], { refresh: 'affected' }); } }, () => { if(refreshCallback) refreshCallback(); }, myPopup); });
            $container.find('.overwrite-btn').on('click', async (e) => { e.preventDefault(); if(!confirm("确定覆盖【开场白 #0】？\n注意：此操作将修改角色卡文件本身。")) return; isSwitchingView = true; await processBatchAndSave(charId, 1, (start, end) => { const rawText = $container.find('.export-area').val(); const newFirstMes = composeMessageContent("目录页", [], rawText); charObj.first_mes = newFirstMes; if (charObj.data) charObj.data.first_mes = newFirstMes; updateNativeCharacterUI(newFirstMes); const msgZero = SillyTavern.chat[0]; if (window.TavernHelper && msgZero) { const swipes = msgZero.swipes || [msgZero.mes]; swipes[0] = newFirstMes; const payload = { message_id: 0, swipes: swipes }; if (msgZero.swipe_id === 0 || msgZero.swipe_id === undefined) { payload.message = newFirstMes; } window.TavernHelper.setChatMessages([payload], { refresh: 'affected' }); } }, () => { if(refreshCallback) refreshCallback(); }, myPopup); });
            updateExportPreview(); return $container;
        };
        const openTabsUI = async () => { const $content = renderTabUI(); myPopup = new SillyTavern.Popup($content, SillyTavern.POPUP_TYPE.TEXT, "", { large: true, okButton: "关闭" }); const result = await myPopup.show(); if (!isSwitchingView) { if (showGuide && tourResumeType) localStorage.setItem('gj_tour_resume', tourResumeType); setTimeout(showGreetingManager, 50); } };
        const openPreviewUI = async () => {
            const previewGuide = showGuide ? '<div class="gj-dir-guide"><i class="fa-solid fa-lightbulb"></i><span>已解析出标题并自动匹配到对应开场白。<br>检查下方映射是否正确，然后点击<b>「确认写入」</b>将标题写入。</span></div>' : '';
            const $previewContainer = $(`<div class="gj-parse-container"><div class="gj-parse-preview-header"><div class="gj-parse-info">识别到 <b>${parsedMatches.length}</b> 个标题</div><div class="gj-parse-start-select-group"><label>起点:</label><select class="gj-parse-select main-starter">${generateOptionsHtml(startIndex)}</select></div></div>${previewGuide}<div class="gj-parse-preview-list"></div><div class="gj-parse-custom-footer" style="margin-top:auto;"><button type="button" class="gj-custom-btn back-btn"><i class="fa-solid fa-arrow-left"></i> 返回</button><button type="button" class="gj-custom-btn primary confirm-btn"><i class="fa-solid fa-check"></i> 确认写入</button></div></div>`);
            const $list = $previewContainer.find('.gj-parse-preview-list'); const $globalSelect = $previewContainer.find('.main-starter');
            const renderRows = () => { $list.empty(); const globalVal = parseInt($globalSelect.val()); const baseVal = parsedMatches.length > 0 ? parsedMatches[0].num - 1 : -1; const offset = globalVal - baseVal; parsedMatches.forEach((m, i) => { m.selectedIndex = (m.num - 1) + offset; const $item = $(`<div class="gj-parse-item"><select class="gj-parse-row-select">${generateOptionsHtml(m.selectedIndex)}</select><textarea class="gj-parse-row-textarea" rows="2">${_.escape(m.title)}</textarea></div>`); $item.find('.gj-parse-row-select').on('change', function() { m.selectedIndex = parseInt($(this).val()); }); $item.find('textarea').on('input', function() { m.title = $(this).val(); }); $list.append($item); }); };
            $globalSelect.on('change', () => { startIndex = parseInt($globalSelect.val()); renderRows(); }); renderRows();
            $previewContainer.find('.back-btn').on('click', (e) => { e.preventDefault(); isSwitchingView = true; myPopup.complete(SillyTavern.POPUP_RESULT.CANCELLED); setTimeout(openTabsUI, 50); });
            $previewContainer.find('.confirm-btn').on('click', async (e) => {
                e.preventDefault(); isSwitchingView = true;
                if (showGuide && tourResumeType) localStorage.setItem('gj_tour_resume', tourResumeType);
                const processBatchLogic = (startIdx, endIdx) => {
                    for (let i = startIdx; i < endIdx; i++) {
                        const m = parsedMatches[i]; if (!m || m.title.trim() === "" || isNaN(m.selectedIndex)) continue;
                        let targetContent = ""; let currentIndex = m.selectedIndex;
                        if (currentIndex === -1) targetContent = charObj.first_mes; else if (currentIndex < (charObj.data.alternate_greetings || []).length) targetContent = charObj.data.alternate_greetings[currentIndex]; else continue;
                        const parsed = parseMessageContent(targetContent); 
                        const newContent = composeMessageContent(m.title, parsed.lore, parsed.body, m.desc || parsed.desc, parsed.exclude); 
                        if (currentIndex === -1) { charObj.first_mes = newContent; if (charObj.data) charObj.data.first_mes = newContent; updateNativeCharacterUI(newContent); } else { charObj.data.alternate_greetings[currentIndex] = newContent; }
                    }
                };
                await processBatchAndSave(charId, parsedMatches.length, processBatchLogic, () => { if(refreshCallback) refreshCallback(); }, myPopup);
            });
            myPopup = new SillyTavern.Popup($previewContainer, SillyTavern.POPUP_TYPE.TEXT, "", { large: true, okButton: "关闭" }); myPopup.show();
        };
        openTabsUI();
    }

    async function openFullscreenEditor(index, label, initialFindStr = "", initialReplaceStr = "", specificOccurrenceIndex = -1) {
        const charId = SillyTavern.characterId; const charObj = SillyTavern.characters[charId];
        const rawContent = (index === -1) ? charObj.first_mes : charObj.data.alternate_greetings[index];
        const parsed = parseMessageContent(rawContent); const originalBody = parsed.body; const titleValue = parsed.title; const descValue = parsed.desc;
        const popupFunc = SillyTavern.callGenericPopup || window.callGenericPopup;
        
        const isCollapsed = !initialFindStr;
        const $container = $(`<div class="gj-fullscreen-editor"><div class="gj-fs-header ${isCollapsed ? 'collapsed' : ''}"><div class="gj-fs-title-row"><label style="font-weight:bold; opacity:0.7; margin-right:5px;">标题:</label><input class="gj-fs-title-input" value="${_.escape(titleValue)}" placeholder="输入标题..."><button class="gj-fs-toggle-btn">${isCollapsed ? '<i class="fa-solid fa-chevron-down"></i>' : '<i class="fa-solid fa-chevron-up"></i>'}</button></div><div class="gj-fs-title-row" style="margin-top:2px;"><label style="font-weight:bold; opacity:0.5; margin-right:5px; font-size:0.9em;">描述:</label><input class="gj-fs-desc-input" value="${_.escape(descValue)}" placeholder="简短描述 (可选)..." style="flex-grow:1; font-style:italic; opacity:0.8; background:var(--smart-theme-input-bg); border:1px solid var(--smart-theme-border-color-1); color:var(--smart-theme-body-color); padding:4px 6px; border-radius:4px; font-size:0.9em;"></div><div class="gj-fs-tools-container"><div class="gj-fs-row"><i class="fa-solid fa-magnifying-glass gj-fs-icon"></i><input class="gj-fs-input find" type="text" placeholder="查找..." value="${_.escape(initialFindStr)}"><button class="gj-fs-btn btn-prev"><i class="fa-solid fa-chevron-up"></i></button><button class="gj-fs-btn btn-next"><i class="fa-solid fa-chevron-down"></i></button></div><div class="gj-fs-row"><i class="fa-solid fa-pen-to-square gj-fs-icon"></i><input class="gj-fs-input replace" type="text" placeholder="替换..." value="${_.escape(initialReplaceStr)}"><button class="gj-fs-btn replace btn-replace"><i class="fa-solid fa-check"></i></button><button class="gj-fs-btn replace btn-replace-all"><i class="fa-solid fa-list-check"></i></button></div></div></div><div class="gj-fs-textarea-wrapper"><textarea class="gj-fullscreen-textarea">${_.escape(originalBody)}</textarea></div></div>`);
        const $textarea = $container.find('textarea'); const $inputFind = $container.find('.gj-fs-input.find'); const $inputReplace = $container.find('.gj-fs-input.replace'); const $toggleBtn = $container.find('.gj-fs-toggle-btn'); const $header = $container.find('.gj-fs-header'); const $titleInput = $container.find('.gj-fs-title-input'); const $descInput = $container.find('.gj-fs-desc-input');
        
        $toggleBtn.on('click', () => { $header.toggleClass('collapsed'); $toggleBtn.html($header.hasClass('collapsed') ? '<i class="fa-solid fa-chevron-down"></i>' : '<i class="fa-solid fa-chevron-up"></i>'); });
        const doFind = (direction) => {
            const val = $textarea.val(); const term = $inputFind.val(); if (!term) return;
            let startPos = $textarea[0].selectionEnd; if (direction === 'prev') startPos = $textarea[0].selectionStart;
            let nextPos = (direction === 'next') ? val.indexOf(term, startPos) : val.lastIndexOf(term, startPos - 1);
            if (nextPos === -1) nextPos = (direction === 'next') ? val.indexOf(term, 0) : val.lastIndexOf(term);
            if (nextPos !== -1) { $textarea.focus(); $textarea[0].setSelectionRange(nextPos, nextPos + term.length); performScroll($textarea, nextPos); } else toastr.warning("未找到");
        };
        const doReplace = () => { const start = $textarea[0].selectionStart; const end = $textarea[0].selectionEnd; const term = $inputFind.val(); const rep = $inputReplace.val(); const val = $textarea.val(); if (val.substring(start, end) === term) { $textarea.val(val.substring(0, start) + rep + val.substring(end)); $textarea[0].setSelectionRange(start, start + rep.length); doFind('next'); } else doFind('next'); };
        const doReplaceAll = () => { const term = $inputFind.val(); const rep = $inputReplace.val(); if (!term) return; const val = $textarea.val(); const newVal = val.split(term).join(rep); if (val !== newVal) { $textarea.val(newVal); toastr.success("已替换"); } };
        $container.find('.btn-next').on('click', () => doFind('next')); $container.find('.btn-prev').on('click', () => doFind('prev')); $container.find('.btn-replace').on('click', doReplace); $container.find('.btn-replace-all').on('click', doReplaceAll);
        
        if (specificOccurrenceIndex !== -1 && initialFindStr) { setTimeout(() => { const val = $textarea.val(); let count = 0; let pos = val.indexOf(initialFindStr); let found = false; while (pos !== -1) { if (count === specificOccurrenceIndex) { $textarea.focus(); $textarea[0].setSelectionRange(pos, pos + initialFindStr.length); performScroll($textarea, pos); found = true; break; } count++; pos = val.indexOf(initialFindStr, pos + 1); } if(!found) doFind('next'); }, 300); } else if (initialFindStr) { setTimeout(() => doFind('next'), 300); }

        const result = await popupFunc($container, SillyTavern.POPUP_TYPE.CONFIRM, "", { large: true, wide: true, okButton: "保存", cancelButton: "取消" });
        if (result) {
            const finalContent = composeMessageContent($titleInput.val(), parsed.lore, $textarea.val(), $descInput.val(), parsed.exclude); 
            if (index === -1) { charObj.first_mes = finalContent; if (charObj.data) charObj.data.first_mes = finalContent; updateNativeCharacterUI(finalContent); } else { charObj.data.alternate_greetings[index] = finalContent; }
            await forceSave(charId); toastr.success("已保存"); setTimeout(injectBackHomeButton, 300); setTimeout(() => showGreetingManager(), 100);
        }
    }

    async function openSearchAndReplaceLogic(charId) {
        const popupFunc = SillyTavern.callGenericPopup || window.callGenericPopup;
        const $container = $('<div style="display:flex; flex-direction:column; gap:10px; text-align:left;"></div>').append($('<div>').append('<label style="font-weight:bold;">查找:</label>').append('<input class="text_pole gj-find" style="width:100%; margin-top:5px;" type="text">'), $('<div>').append('<label style="font-weight:bold;">替换:</label>').append('<input class="text_pole gj-replace" style="width:100%; margin-top:5px;" type="text" placeholder="可选...">'));
        if (!await popupFunc($container, SillyTavern.POPUP_TYPE.CONFIRM, "", { okButton: "搜索", cancelButton: "取消" })) return;
        const findStr = $container.find('.gj-find').val(); if (!findStr) return; const replaceStr = $container.find('.gj-replace').val(); const hasReplace = true;
        const charObj = SillyTavern.characters[charId]; let results = [];
        const checkContent = (rawContent, index, label) => { if (!rawContent) return; const parsed = parseMessageContent(rawContent); const contentBody = parsed.body; let indices = []; let occurrenceIndices = []; let pos = contentBody.indexOf(findStr); let count = 0; while (pos !== -1) { indices.push(pos); occurrenceIndices.push(count); pos = contentBody.indexOf(findStr, pos + 1); count++; } if (indices.length > 0) results.push({ index, label, title: parsed.title, content: contentBody, indices, occurrenceIndices }); };
        checkContent(charObj.first_mes, -1, "开场白 #0"); (charObj.data.alternate_greetings || []).forEach((g, i) => checkContent(g, i, `开场白 #${i + 1}`));
        if (results.length === 0) { toastr.info("未找到"); return; }
        const $resultContainer = $('<div class="gj-search-results-container" style="text-align:left;"></div>');
        $resultContainer.append(`<div class="gj-search-top-bar"><span>找到 <b>${results.length}</b> 处</span>${hasReplace ? `<button class="gj-search-btn replace-all-global">全局替换</button>` : ''}</div>`);
        if(hasReplace) $resultContainer.find('.replace-all-global').on('click', async () => { if(!confirm(`确定全部替换？`)) return; if (typeof Swal !== 'undefined') Swal.close(); await processBatchAndSave(charId, 1, (start, end) => { const doReplace = (raw) => { const p = parseMessageContent(raw); const newBody = p.body.split(findStr).join(replaceStr); return composeMessageContent(p.title, p.lore, newBody, p.desc, p.exclude); }; if (charObj.first_mes) { charObj.first_mes = doReplace(charObj.first_mes); if (charObj.data) charObj.data.first_mes = charObj.first_mes; updateNativeCharacterUI(charObj.first_mes); } if (charObj.data.alternate_greetings) { charObj.data.alternate_greetings = charObj.data.alternate_greetings.map(g => g ? doReplace(g) : g); } }, showGreetingManager, null); });
        results.forEach(res => {
            const label = res.title ? `${res.label} (${res.title})` : res.label; const $group = $(`<div class="gj-search-group"><div class="gj-search-header"><span>${label}</span></div></div>`);
            if (hasReplace) { const $btnRepAll = $(`<button class="gj-search-btn replace" style="margin-left:auto;">替换本条</button>`); $btnRepAll.on('click', async (e) => { e.stopPropagation(); const currentRaw = (res.index === -1) ? charObj.first_mes : charObj.data.alternate_greetings[res.index]; const p = parseMessageContent(currentRaw); const newBody = p.body.split(findStr).join(replaceStr); const newContent = composeMessageContent(p.title, p.lore, newBody, p.desc, p.exclude); if (res.index === -1) { charObj.first_mes = newContent; if (charObj.data) charObj.data.first_mes = newContent; updateNativeCharacterUI(newContent); } else { charObj.data.alternate_greetings[res.index] = newContent; } await forceSave(charId); toastr.success("已替换"); $group.slideUp(); }); $group.find('.gj-search-header').append($btnRepAll); }
            res.indices.forEach((idx, i) => { const occurIdx = res.occurrenceIndices[i]; const s = Math.max(0, idx - 20); const e = Math.min(res.content.length, idx + findStr.length + 20); const txt = _.escape(res.content.substring(s, e)).replace(new RegExp(_.escape(findStr), 'g'), `<span class="gj-highlight">${_.escape(findStr)}</span>`); const $row = $(`<div class="gj-search-row"><div class="gj-search-context">...${txt}...</div><div class="gj-search-actions"></div></div>`); if(hasReplace) { const $btnRep = $(`<button class="gj-search-btn replace">替换</button>`); $btnRep.on('click', async () => { const currentRaw = (res.index === -1) ? charObj.first_mes : charObj.data.alternate_greetings[res.index]; const p = parseMessageContent(currentRaw); let count = 0; let pos = p.body.indexOf(findStr); while (pos !== -1) { if (count === occurIdx) { const pre = p.body.substring(0, pos); const post = p.body.substring(pos + findStr.length); const newBody = pre + replaceStr + post; const newContent = composeMessageContent(p.title, p.lore, newBody, p.desc, p.exclude); if (res.index === -1) { charObj.first_mes = newContent; if (charObj.data) charObj.data.first_mes = newContent; updateNativeCharacterUI(newContent); } else { charObj.data.alternate_greetings[res.index] = newContent; } await forceSave(charId); toastr.success("已替换"); $row.slideUp(); return; } count++; pos = p.body.indexOf(findStr, pos + 1); } }); $row.find('.gj-search-actions').append($btnRep); } const $btnJump = $(`<button class="gj-search-btn edit">跳转</button>`); $btnJump.on('click', () => { if (typeof Swal !== 'undefined') Swal.close(); setTimeout(() => openFullscreenEditor(res.index, res.label, findStr, replaceStr, occurIdx), 200); }); $row.find('.gj-search-actions').append($btnJump); $group.append($row); }); $resultContainer.append($group);
        });
        popupFunc($resultContainer, SillyTavern.POPUP_TYPE.TEXT, "", { wide: true, okButton: "关闭" });
    }

    async function safeSwipeTo(targetIndex) {
        const msgZero = SillyTavern.chat[0];
        if (!msgZero) return;
        await window.TavernHelper.setChatMessages([{ message_id: 0, swipe_id: targetIndex }], { refresh: 'none' });
        await window.TavernHelper.setChatMessages([{ message_id: 0 }], { refresh: 'affected' });
    }

    async function jumpToGreeting(targetIndex, contentToUse) {
        if (!SillyTavern.chat || SillyTavern.chat.length === 0) return false;

        if (SillyTavern.chat.length > 1) { if (!await (SillyTavern.callGenericPopup || window.callGenericPopup)("确认切换开场白？当前已有聊天记录。", SillyTavern.POPUP_TYPE.CONFIRM, "", { okButton: "确定", cancelButton: "取消" })) return false; }
        
        const msgZero = SillyTavern.chat[0]; 
        const swipes = msgZero.swipes || [msgZero.mes];
        while (swipes.length <= targetIndex) swipes.push(contentToUse);
        swipes[targetIndex] = contentToUse;
        msgZero.swipe_id = targetIndex;
        msgZero.mes = contentToUse;
        await window.TavernHelper.setChatMessages([{ message_id: 0, swipes: swipes, swipe_id: targetIndex, message: contentToUse }], { refresh: 'affected' });
        return true; 
    }
    
    async function backToStart() { 
        if (!SillyTavern.chat || SillyTavern.chat.length === 0) return; 
        const charData = window.TavernHelper ? window.TavernHelper.getCharData('current') : null;
        const firstMes = charData?.first_mes || charData?.data?.first_mes || '';
        if (firstMes) {
            const msgZero = SillyTavern.chat[0];
            const swipes = msgZero?.swipes || [msgZero?.mes || ''];
            swipes[0] = firstMes;
            msgZero.swipe_id = 0;
            msgZero.mes = firstMes;
            await window.TavernHelper.setChatMessages([{ message_id: 0, swipes: swipes, swipe_id: 0, message: firstMes }], { refresh: 'affected' });
        } else {
            await safeSwipeTo(0);
        }
        toastr.success("已切换至首页"); 
    }

    // === 回到首页按钮：默认 CSS（用于正则嵌入的 <style>） ===
    const HOME_BTN_DEFAULT_CSS = `.gj-back-home-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 15px auto 5px;
  padding: 8px 20px;
  border: 1px solid #7a9a83;
  border-radius: 6px;
  background: rgba(122,154,131,0.08);
  color: #7a9a83;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.95em;
  transition: all 0.2s;
  max-width: 200px;
}
.gj-back-home-btn:hover {
  background: rgba(122,154,131,0.2);
  transform: translateY(-1px);
}`;

    function injectBackHomeButton() {
        $('.gj-back-home-btn:not(.gj-home-btn-from-card)').remove();
        if (!SillyTavern.chat || SillyTavern.chat.length === 0) return;
        const msgZero = SillyTavern.chat[0];
        const swipeId = (msgZero && msgZero.swipe_id !== undefined) ? msgZero.swipe_id : 0;
        if (swipeId > 0) {
            const $mes = $('.mes[mesid="0"]');
            const $mesBlock = $mes.find('.mes_block');
            // 卡内已有自定义按钮（通过"下载美化正则"安装）时，不再注入脚本按钮
            if ($mesBlock.find('.gj-home-btn-from-card, [data-home-btn="card"]').length) return;
            if ($mesBlock.length) {
                const $btn = $('<div class="gj-back-home-btn" data-home-btn="script"><i class="fa-solid fa-house"></i> 回到首页</div>');
                $btn.on('click', (e) => { e.stopPropagation(); backToStart(); });
                $mesBlock.append($btn);
            }
        }
    }

    // === 回到首页按钮：生成/下载美化正则 ===
    function buildHomeBtnRegexEntry() {
        // 注意：本源文件若被作为内联脚本加载，任何字面量闭合 script 标签都会提前终止，
        // 因此动态拼接的 HTML 里的 script 标签必须拆分成 '<' + 'script'... 形式。
        const sOpen = '<' + 'script>';
        const sClose = '<' + '/script>';
        const styleOpen = '<' + 'style>';
        const styleClose = '<' + '/style>';
        const onclickJs =
            `(function(){try{` +
            `if(window.TavernHelper&&window.TavernHelper.setChatMessages){` +
                `window.TavernHelper.setChatMessages([{message_id:0,swipe_id:0}],{refresh:'affected'});` +
            `}` +
            `}catch(e){console.error(e);}})()`;
        // 自隐逻辑：若当前消息不是 mesid="0"，或当前首页 swipe 就是 0（已在首页），则隐藏按钮，避免"首页显示回首页"的尴尬。
        const hideJs =
            `(function(){try{` +
            `var cs=document.currentScript;if(!cs)return;` +
            `var btn=cs.previousElementSibling;while(btn&&btn.tagName==='STYLE')btn=btn.previousElementSibling;` +
            `if(!btn||!btn.classList||!btn.classList.contains('gj-back-home-btn'))return;` +
            `var mes=cs.closest&&cs.closest('.mes');` +
            `if(mes){var mid=mes.getAttribute('mesid');if(mid!=='0'){btn.style.display='none';return;}}` +
            `if(window.SillyTavern&&SillyTavern.chat&&SillyTavern.chat[0]&&SillyTavern.chat[0].swipe_id===0){btn.style.display='none';}` +
            `}catch(e){}})();`;
        const buttonHtml =
            `<div class="gj-back-home-btn gj-home-btn-from-card" data-home-btn="card" onclick="${onclickJs}">` +
            `<i class="fa-solid fa-house"></i> 回到首页</div>\n` +
            styleOpen + HOME_BTN_DEFAULT_CSS + styleClose + '\n' +
            sOpen + hideJs + sClose;
        return {
            id: 'gj-home-btn-' + Date.now(),
            scriptName: '回到首页按钮（美化）',
            findRegex: '([\\s\\S]+)$',
            replaceString: '$1\n' + buttonHtml,
            trimStrings: [],
            placement: [2],
            disabled: false,
            markdownOnly: true,
            promptOnly: false,
            runOnEdit: true,
            substituteRegex: 0,
            minDepth: 0,
            maxDepth: 0
        };
    }

    function downloadHomeBtnRegex() {
        const json = buildHomeBtnRegexEntry();
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(json, null, 2));
        const a = document.createElement('a');
        a.href = dataStr;
        a.download = 'Home_Button_Regex.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        toastr.success('正则已下载，请在角色卡 → 局部正则 → 从文件导入');
    }

    async function openHomeBtnDownloader() {
        const $ui = $(`<div class="gj-homebtn-dl">
            <div class="gj-adv-header-row">
                <label class="gj-adv-label"><i class="fa-solid fa-house"></i> 回到首页按钮 - 美化正则</label>
            </div>
            <div style="font-size:0.9em;line-height:1.75;">
                <p style="margin:0 0 6px;"><i class="fa-solid fa-circle-info" style="color:#7a9a83;"></i> 本扩展默认用<b>脚本</b>在非首页开场白底部注入「回到首页」按钮。如果想要<b>自定义按钮样式</b>或<b>让样式跟卡走</b>（别人不装扩展也能看到），请下载下面这份美化正则：</p>
                <ol style="padding-left:20px;margin:4px 0;">
                    <li>点击「<b>下载美化正则</b>」，得到 <code>Home_Button_Regex.json</code>。</li>
                    <li>（<b>可选</b>）用任意美化工具，修改里面 <code>&lt;style&gt;</code> 标签内的 CSS 来自定义按钮外观。</li>
                    <li>在 ST 里打开角色 → <b>拓展</b> → <b>导入局部正则</b> → 选中该 JSON。</li>
                </ol>
            </div>
            <div style="margin-top:6px;">
                <label class="gj-adv-label" style="font-size:0.85em;opacity:0.8;"><i class="fa-solid fa-eye"></i> 当前默认样式预览</label>
                <div class="gj-homebtn-preview-inline" style="margin-top:6px;padding:16px 18px;background:rgba(255,255,255,0.03);border:1px dashed var(--smart-theme-border-color-1,#444);border-radius:6px;">
                    <div class="gj-back-home-btn" style="pointer-events:none;"><i class="fa-solid fa-house"></i> 回到首页</div>
                </div>
            </div>
            <div style="display:flex;gap:8px;margin-top:14px;justify-content:flex-end;">
                <button type="button" class="gj-custom-btn primary gj-homebtn-download"><i class="fa-solid fa-download"></i> 下载美化正则</button>
            </div>
        </div>`);

        $ui.find('.gj-homebtn-download').on('click', () => { downloadHomeBtnRegex(); });

        const popup = new SillyTavern.Popup($ui, SillyTavern.POPUP_TYPE.TEXT, '', { okButton: '关闭' });
        await popup.show();
    }
    function startTour($wrapper, tourOptions) {
        const { charId: tourCharId, safeClose: tourClose } = tourOptions || {};
        const ensureEdit = () => { const $c = $wrapper.find(demoSel); if (!$c.hasClass('editing')) { $c.addClass('editing'); $c.find('.gj-textarea').prop('readonly', false); } };
        const exitEdit = () => { const $c = $wrapper.find(demoSel); if ($c.hasClass('editing')) { $c.removeClass('editing'); $c.find('.gj-textarea').prop('readonly', true); } };
        const resetUI = () => { exitEdit(); $wrapper.find('.gj-textarea.expanded').removeClass('expanded'); };

        const demoSel = $wrapper.find('.gj-card').length > 1 ? '.gj-card:nth-child(2)' : '.gj-card:first-child';
        const $demo = () => $wrapper.find(demoSel);
        const ensureExpandDemo = () => { const $ta = $demo().find('.gj-textarea'); if (!$ta.hasClass('expanded')) $ta.addClass('expanded'); };
        const exitExpandDemo = () => { const $ta = $demo().find('.gj-textarea'); if ($ta.hasClass('expanded')) $ta.removeClass('expanded'); };
        let onChoiceAction = null;

        const backHomeMock = '<div style="margin:12px auto 6px;padding:8px 16px;max-width:180px;background:rgba(122,154,131,0.08);border:1px dashed rgba(122,154,131,0.4);border-radius:6px;text-align:center;font-size:0.9em;color:#7a9a83;"><i class="fa-solid fa-house" style="margin-right:6px;"></i>回到首页</div>';
        const card1Note = $wrapper.find('.gj-card').length > 1 ? '<br><span style="opacity:0.6;font-size:0.85em;">一般 #0 是目录页，所以这里演示 #1。</span>' : '';

        const readerBase = [
            { selector: '.gj-scroll-area', title: '1. 开场白列表',
              desc: '这里列出了角色的所有开场白。<br>每张卡片代表一个可切换的场景/剧情线。<br><br>接下来看看如何识别不同的开场白。' },
            { selector: demoSel + ' .gj-title-area', title: '2. 识别标题',
              desc: '如果作者为开场白设置了<b>标题</b>，<br>会显示在编号旁边，例如：<br><code>开场白 #1 (游艇初遇)</code><br><br>如果还有<b>描述</b>，会显示在标题下方。<br><br>看看你的开场白卡片上有没有标题？',
              choices: [
                { label: '✓ 有标题', cls: 'primary', action: 'hasTitle' },
                { label: '✗ 没有标题', action: 'noTitle' }
              ] }
        ];
        const readerEnding = (n) => [
            { selector: demoSel + ' .gj-textarea', title: n + '. 预览正文',
              desc: '已为你<b>自动展开</b>正文预览。<br><br>滚动阅读完整内容来判断是否是想要的场景。<br>实际使用时点击展开栏 <b>(∨)</b> 即可展开/收起。' + card1Note,
              setup: ensureExpandDemo },
            { selector: demoSel + ' .gj-footer', title: (n + 1) + '. 切换开场白',
              desc: '找到目标场景后：<br><br>· <b>「设为开场」</b> — 切换为当前开场白<br>· <b>「插入聊天」</b> — 作为新消息追加到聊天底部<br><br>绿色高亮的按钮表示<b>当前正在显示</b>的开场白。',
              setup: exitExpandDemo },
            { selector: null, title: (n + 2) + '. 回到首页',
              desc: '切换到非首页开场白后，<br>聊天消息底部会自动出现「回到首页」按钮：' + backHomeMock + '点击即可快速切回首页(开场白 #0)。<br><span style="opacity:0.6;font-size:0.85em;">关闭管理器后可在聊天底部看到此按钮。<br>卡片作者想自定义样式可用顶栏 🏠 图标下载美化正则。</span>' },
            { selector: '.gj-icon-btn.help', title: '引导完成！',
              desc: '现在你已了解基本操作。<br><br>如果之后需要帮助，<br>点击 <b>帮助(?)</b> 按钮即可查看说明或重新引导。' }
        ];
        let currentTourType = null;
        const handleChoice = (action) => {
            if (action === 'hasTitle') {
                steps = [...readerBase, ...readerEnding(3)];
                showStep(currentStep + 1);
            } else if (action === 'noTitle') {
                const card0Text = $wrapper.find('.gj-card:first-child .gj-textarea').val() || '';
                const hasParseable = /^\d+[.、]\s*.+/m.test(card0Text);
                const dirDesc = hasParseable
                    ? '你的开场白暂时没有标题，<br>但首页(#0)看起来包含<b>文字格式的目录</b>。<br><br>点击<b>「打开目录工具」</b>进入导入面板，<br>系统会自动引导你完成解析和写入。'
                    : '你的开场白暂时没有标题。<br><br>点击<b>「打开目录工具」</b>进入导入面板，<br>从DC原帖或作者说明中复制文字版目录，<br>粘贴后即可自动解析为标题。<br><br><span style="opacity:0.6;font-size:0.85em;">如果首页是HTML渲染的目录，建议复制纯文字版本。</span>';
                steps = [...readerBase,
                    { selector: '.gj-center-tool-container', title: '3. 目录工具', desc: dirDesc,
                      choices: [
                        { label: '打开目录工具', cls: 'primary', action: 'openDir' },
                        { label: '跳过 →', action: 'skipDir' }
                      ] },
                    ...readerEnding(4)
                ];
                showStep(currentStep + 1);
            } else if (action === 'openDir') {
                const resumeType = currentTourType === 'author' ? 'author_after_dir' : 'reader_after_dir';
                finish();
                if (tourClose) tourClose();
                if (tourCharId) setTimeout(() => openDirectoryTool(tourCharId, () => setTimeout(showGreetingManager, 300), true, resumeType), 300);
            } else if (action === 'skipDir') {
                showStep(currentStep + 1);
            }
        };
        const authorBase = [
            { selector: demoSel + ' .gj-title-area', title: '1. 卡片结构',
              desc: '每张卡片显示：<br>· <b>编号</b> — 开场白序号<br>· <b>标题</b> — 编号旁的场景名(可选)<br>· <b>描述</b> — 标题下方的简短说明(可选)<br>· <b>剧情线标记</b> — 绑定的世界书数量(紫色徽章)' + card1Note },
            { selector: demoSel + ' .gj-header-right', title: '2. 进入编辑',
              desc: '点击 <b>编辑(✏)</b> 按钮进入编辑模式。<br><br>接下来我们将<b>自动打开编辑模式</b>，<br>查看内部的编辑工具。' },
            { selector: demoSel + ' .gj-card-header-tools', title: '3. 标题与描述',
              desc: '已为你打开编辑模式。<br><br>· <b>标题</b> — 场景名称，帮助快速识别<br>· <b>描述</b> — 简短说明场景内容(可选)<br><br>标题和描述以注释格式嵌入正文首部，<br>不会影响实际显示。',
              setup: ensureEdit },
            { selector: demoSel + ' .gj-tools-row', title: '4. 编辑工具栏',
              desc: '编辑模式下的工具栏：<br><br>· <b>📖 世界书</b> — 绑定专属世界书条目，<br>&emsp;切换开场白时自动启用/关闭<br>· <b>↑↓ 移动</b> — 调整单个开场白位置<br>· <b>🗑 删除</b> — 删除此开场白<br>· <b>+ 在下方插入</b> — 插入新空白开场白',
              setup: ensureEdit },
            { selector: demoSel + ' .gj-textarea', title: '5. 正文编辑',
              desc: '编辑模式下正文区域<b>变为可编辑</b>。<br>直接在这里修改开场白内容。<br><br>修改完成后：<br>· 点击顶部 <b>保存(✓)</b> 保存更改<br>· 点击 <b>取消(✗)</b> 撤销所有修改',
              setup: ensureEdit },
            { selector: demoSel + ' .gj-btn-max', title: '6. 全屏编辑器',
              desc: '退出了编辑模式。<br><br>点击此按钮可打开<b>全屏编辑器</b>（独立窗口），提供：<br>· 更大的编辑区域<br>· 独立的标题/描述编辑栏<br>· <b>查找/替换</b> 功能<br><br><span style="opacity:0.6;font-size:0.85em;">全屏编辑器会在单独窗口打开。</span>',
              setup: exitEdit },
            { selector: demoSel + ' .gj-footer', title: '7. 切换与插入',
              desc: '<b>设为开场</b> — 切换为当前开场白，替换聊天中的首条消息<br><b>插入聊天</b> — 作为新消息追加到聊天底部<br><br>两者区别：「设为开场」改变首条消息，「插入聊天」在底部追加。' },
            { selector: '.gj-sort-controls', title: '8. 排序功能',
              desc: '点击 <b>「快速排序」</b> 进入拖拽排序模式。<br><br>拖动卡片调整开场白顺序，<br>完成后点击「保存」应用新排序，<br>或点击「取消」放弃更改。' }
        ];
        const authorDirStep = {
            selector: '.gj-center-tool-container', title: '9. 目录工具',
            desc: '点击打开目录管理面板：<br><br>· <b>导入</b> — 粘贴目录文本，批量解析为标题<br>· <b>导出</b> — 根据现有标题自动生成目录<br>· <b>生成跳转正则</b> — 基础样式可直接使用或交给 AI 美化；<b>融合美化</b>可保留已有设计（默认<b>从角色卡局部正则导入</b>，也可切到粘贴 HTML，融合后可一键覆盖回角色卡）<br><br>想现在体验一下吗？',
            choices: [
                { label: '打开目录工具', cls: 'primary', action: 'openDir' },
                { label: '跳过 →', action: 'skipDir' }
            ]
        };
        const authorEnding = (n) => [
            { selector: '.gj-icon-group', title: n + '. 工具栏',
              desc: '<b>新建(+)</b> — 在末尾添加空白开场白<br><b>搜索(🔍)</b> — 打开全局查找替换面板<br><b>首页按钮(🏠)</b> — 下载「回到首页」美化正则，自定义样式后装入角色卡<br><b>帮助(?)</b> — 查看功能说明或重启引导<br><br><span style="opacity:0.6;font-size:0.85em;">搜索面板会在独立窗口打开。</span>' },
            { selector: null, title: (n + 1) + '. 回到首页',
              desc: '切换到非首页开场白后，<br>内容消息底部会自动出现「回到首页」按钮：' + backHomeMock + '点击即可快速切回首页(开场白 #0)。<br><br>想要<b>自定义样式</b>或让按钮<b>跟随卡片分享</b>？点顶栏 <b>🏠 图标</b> 下载美化正则，改 CSS 美化后导入到角色卡的「局部正则」即可。' },
            { selector: null, title: (n + 2) + '. 状态栏正则工具',
              desc: '<b>高容错状态栏/b>。<br>酒馆顶部 QR 按钮「<b>状态栏工具</b>」打开。<br><br>常规状态栏正则用很多捕获组一一对应字段（HP、心情、好感度…），<b>只要 AI 的输出里有一项格式对不上，整条正则就会匹配失败，整个状态栏都消失</b>。<br><br>本工具会把你的正则升级成<b>一整块文本 + JS 按行解析</b>的形式：<br>· 单条字段写错，<b>只</b>影响那一项，其他正常显示<br>· 以后加字段 / 改字段名，<b>不用改正则</b>，世界书里加一行就行<br>· 一键覆盖回角色卡，或下载成 JSON 备份<br><br><span style="opacity:0.6;font-size:0.85em;">来源支持：从角色卡局部正则选取 / 上传 JSON；从世界书选取 / 直接粘贴。</span>' },
            { selector: '.gj-icon-btn.help', title: '引导完成！',
              desc: '现在你已了解所有核心功能！<br>如需帮助，随时点击右上角 <b>帮助(?)</b>。' }
        ];

        let steps = [];
        let currentStep = -1;
        let $panels = {};
        let $tooltip = null;
        let $glow = null;

        const createPanels = () => {
            ['top', 'bottom', 'left', 'right'].forEach(pos => {
                $panels[pos] = $(`<div class="gj-tour-panel"></div>`);
                $wrapper.append($panels[pos]);
            });
        };

        const updatePanels = ($target) => {
            const wEl = $wrapper[0];
            const ww = wEl.offsetWidth, wh = wEl.offsetHeight;
            if (!$target) {
                $panels.top.css({ top: 0, left: 0, width: ww, height: wh });
                $panels.bottom.css({ display: 'none' });
                $panels.left.css({ display: 'none' });
                $panels.right.css({ display: 'none' });
                return;
            }
            $panels.bottom.css({ display: '' }); $panels.left.css({ display: '' }); $panels.right.css({ display: '' });
            const wRect = wEl.getBoundingClientRect();
            const tRect = $target[0].getBoundingClientRect();
            const pad = 6;
            const hole = {
                top: Math.max(0, tRect.top - wRect.top - pad),
                left: Math.max(0, tRect.left - wRect.left - pad),
                bottom: Math.min(wh, tRect.bottom - wRect.top + pad),
                right: Math.min(ww, tRect.right - wRect.left + pad),
            };
            hole.width = hole.right - hole.left;
            hole.height = hole.bottom - hole.top;
            $panels.top.css({ top: 0, left: 0, width: ww, height: Math.max(0, hole.top) });
            $panels.bottom.css({ top: hole.bottom, left: 0, width: ww, height: Math.max(0, wh - hole.bottom) });
            $panels.left.css({ top: hole.top, left: 0, width: Math.max(0, hole.left), height: hole.height });
            $panels.right.css({ top: hole.top, left: hole.right, width: Math.max(0, ww - hole.right), height: hole.height });
        };

        const addGlow = ($target) => {
            if (!$target) return;
            const wRect = $wrapper[0].getBoundingClientRect();
            const tRect = $target[0].getBoundingClientRect();
            const pad = 6;
            $glow = $('<div class="gj-tour-glow"></div>').css({
                top: tRect.top - wRect.top - pad, left: tRect.left - wRect.left - pad,
                width: tRect.width + pad * 2, height: tRect.height + pad * 2,
            });
            $wrapper.append($glow);
        };

        const positionTooltip = ($target) => {
            requestAnimationFrame(() => {
                if (!$tooltip || !$tooltip[0]) return;
                const el = $tooltip[0];
                const wRect = $wrapper[0].getBoundingClientRect();
                const tw = el.offsetWidth, th = el.offsetHeight;
                const ww = wRect.width, wh = wRect.height;
                if (!$target) {
                    el.style.left = Math.max(10, (ww - tw) / 2) + 'px';
                    el.style.top = Math.max(10, (wh - th) / 2) + 'px';
                } else {
                    const tRect = $target[0].getBoundingClientRect();
                    const relBottom = tRect.bottom - wRect.top;
                    const relTop = tRect.top - wRect.top;
                    const relCx = (tRect.left + tRect.right) / 2 - wRect.left;
                    let left = relCx - tw / 2;
                    let top = (relBottom + th + 16 < wh) ? relBottom + 16 : (relTop - th - 16 > 0) ? relTop - th - 16 : Math.max(10, (wh - th) / 2);
                    el.style.left = Math.max(10, Math.min(left, ww - tw - 10)) + 'px';
                    el.style.top = Math.max(10, Math.min(top, wh - th - 10)) + 'px';
                }
            });
        };

        const cleanupVisuals = () => {
            if ($tooltip) { $tooltip.remove(); $tooltip = null; }
            if ($glow) { $glow.remove(); $glow = null; }
        };
        const finish = () => {
            resetUI();
            cleanupVisuals();
            Object.values($panels).forEach($p => $p.remove());
            $panels = {};
            localStorage.setItem(STORAGE_KEY_TOUR, 'true');
        };

        const showStep = (index) => {
            cleanupVisuals();
            if (index < 0 || index >= steps.length) { finish(); return; }
            const step = steps[index];
            currentStep = index;

            if (step.setup) step.setup();

            const renderDelay = step.setup ? 180 : 60;
            setTimeout(() => {
                let $target = null;
                if (step.selector) {
                    $target = $wrapper.find(step.selector).first();
                    if (!$target.length) $target = null;
                }
                if ($target) {
                    const $scrollArea = $wrapper.find('.gj-scroll-area');
                    if ($scrollArea.length && $target.closest('.gj-scroll-area').length) {
                        const scrollTop = $scrollArea.scrollTop();
                        const areaTop = $scrollArea.offset().top;
                        const targetTop = $target.offset().top;
                        const diff = targetTop - areaTop;
                        if (diff < 0 || diff > $scrollArea.height() - 80) {
                            $scrollArea.scrollTop(scrollTop + diff - 80);
                        }
                    }
                }

                setTimeout(() => {
                    if (step.selector) {
                        $target = $wrapper.find(step.selector).first();
                        if (!$target.length) $target = null;
                    }
                    updatePanels($target);
                    addGlow($target);
                    const isLast = index === steps.length - 1;
                    const isFirst = index === 0;
                    const hasChoices = !!step.choices;
                    const stepInfo = hasChoices ? `${index + 1} / ...` : `${index + 1} / ${steps.length}`;
                    let actionBtns;
                    if (hasChoices) {
                        actionBtns = step.choices.map(c => `<button class="gj-tour-btn ${c.cls || ''} tour-choice" data-action="${c.action}">${c.label}</button>`).join('');
                    } else {
                        actionBtns = `<button class="gj-tour-btn primary tour-next">${isLast ? '完成' : '下一步'}</button>`;
                    }
                    $tooltip = $(`<div class="gj-tour-tooltip"><div class="gj-tour-title">${step.title}</div><div class="gj-tour-desc">${step.desc}</div><div class="gj-tour-footer"><span class="gj-tour-step-info">${stepInfo}</span><div class="gj-tour-btns"><button class="gj-tour-btn tour-skip">跳过</button>${!isFirst ? '<button class="gj-tour-btn tour-prev">上一步</button>' : ''}${actionBtns}</div></div></div>`);
                    $tooltip.find('.tour-skip').on('click', finish);
                    $tooltip.find('.tour-prev').on('click', () => showStep(index - 1));
                    if (hasChoices) {
                        $tooltip.find('.tour-choice').on('click', function() { if (onChoiceAction) onChoiceAction($(this).data('action')); });
                    } else {
                        $tooltip.find('.tour-next').on('click', () => { if (isLast) finish(); else showStep(index + 1); });
                    }
                    $wrapper.append($tooltip);
                    positionTooltip($target);
                }, 50);
            }, renderDelay);
        };

        const showRoleSelection = () => {
            createPanels();
            updatePanels(null);
            $tooltip = $(`<div class="gj-tour-tooltip"><div class="gj-tour-title">欢迎使用开场白管理器</div><div class="gj-tour-desc">请选择你的使用场景，获取针对性引导：<br><span style="opacity:0.5; font-size:0.85em;">之后可通过帮助按钮(?)随时重新引导。</span></div><div class="gj-tour-role-btns"><button class="gj-tour-role-btn reader"><i class="fa-solid fa-book-open"></i><span class="gj-tour-role-title">我是读者</span><span class="gj-tour-role-sub">浏览和切换开场白</span></button><button class="gj-tour-role-btn author"><i class="fa-solid fa-pen-fancy"></i><span class="gj-tour-role-title">我是作者</span><span class="gj-tour-role-sub">编辑和管理开场白</span></button></div><div style="text-align:center; margin-top:12px;"><button class="gj-tour-btn tour-skip-init" style="opacity:0.5; font-size:0.85em;">跳过引导</button></div></div>`);
            $tooltip.find('.reader').on('click', () => { currentTourType = 'reader'; steps = [...readerBase]; onChoiceAction = handleChoice; cleanupVisuals(); showStep(0); });
            $tooltip.find('.author').on('click', () => { currentTourType = 'author'; steps = [...authorBase, authorDirStep, ...authorEnding(10)]; onChoiceAction = handleChoice; cleanupVisuals(); showStep(0); });
            $tooltip.find('.tour-skip-init').on('click', finish);
            $wrapper.append($tooltip);
            positionTooltip(null);
        };

        const resumeKey = 'gj_tour_resume';
        const resumeState = localStorage.getItem(resumeKey);
        if (resumeState === 'reader_after_dir') {
            localStorage.removeItem(resumeKey);
            currentTourType = 'reader';
            steps = [
                { selector: '.gj-scroll-area', title: '标题已就绪',
                  desc: '目录已成功解析并写入各开场白。<br>现在每张卡片都有了标题，方便快速识别场景。<br><br>继续了解如何浏览和切换 ⬇' },
                ...readerEnding(3)
            ];
            onChoiceAction = handleChoice;
            createPanels();
            showStep(0);
        } else if (resumeState === 'author_after_dir') {
            localStorage.removeItem(resumeKey);
            currentTourType = 'author';
            steps = [
                { selector: '.gj-scroll-area', title: '目录工具体验完成',
                  desc: '你已体验了目录管理面板的功能。<br><br>接下来了解剩余的工具栏功能 ⬇' },
                ...authorEnding(10)
            ];
            onChoiceAction = handleChoice;
            createPanels();
            showStep(0);
        } else {
            showRoleSelection();
        }
    }

    function showHelpPopup(startTourCallback) {
        let helpPopup = null;
        const $content = $(`<div class="gj-help-content">
            <div class="gj-help-section"><h3><i class="fa-solid fa-layer-group"></i> 卡片结构</h3><p>每张卡片显示一个开场白，包含：<b>编号</b>（序号）、<b>标题</b>（场景名，可选）、<b>描述</b>（简短说明，可选）、<b>剧情线标记</b>（紫色徽章，表示绑定的世界书数量）。</p><p>标题和描述以注释格式嵌入正文首部，不会影响实际显示。</p></div>
            <hr class="gj-help-divider">
            <div class="gj-help-section"><h3><i class="fa-solid fa-pen-to-square"></i> 编辑模式</h3><p>点击编辑按钮(✏)进入编辑模式，可修改标题、描述和正文。编辑模式下工具栏提供：</p><p>· <b>📖 世界书</b> — 绑定专属世界书条目，切换开场白时自动启用/关闭<br>· <b>↑↓ 移动</b> — 调整单个开场白位置<br>· <b>🗑 删除</b> — 删除此开场白<br>· <b>+ 在下方插入</b> — 插入新空白开场白</p><p>修改后点击 <b>保存(✓)</b> 保存，或 <b>取消(✗)</b> 撤销。</p></div>
            <hr class="gj-help-divider">
            <div class="gj-help-section"><h3><i class="fa-solid fa-expand"></i> 全屏编辑器</h3><p>点击最大化按钮(⛶)打开全屏编辑器（独立窗口），提供更大的编辑区域、独立的标题/描述编辑栏以及<b>查找/替换</b>功能。</p></div>
            <hr class="gj-help-divider">
            <div class="gj-help-section"><h3><i class="fa-solid fa-rotate"></i> 切换与插入</h3><p>「设为开场」—— 切换为当前开场白，替换聊天中的首条消息。</p><p>「插入聊天」—— 将开场白内容作为新的助手消息追加到聊天底部，不影响首条消息。</p><p>绿色高亮的按钮表示当前正在显示的开场白。</p></div>
            <hr class="gj-help-divider">
            <div class="gj-help-section"><h3><i class="fa-solid fa-sort"></i> 排序模式</h3><p>点击「快速排序」进入拖拽排序模式，拖动卡片调整顺序后点击保存即可应用新排序。</p></div>
            <hr class="gj-help-divider">
            <div class="gj-help-section"><h3><i class="fa-solid fa-list-ol"></i> 目录工具</h3><p>目录工具包含两个面板：</p><p><b>导入/解析</b> — 从DC原帖或作者说明中复制文字版目录列表，粘贴后点击「解析目录」自动识别并批量写入标题。</p><p><b>导出/生成</b> — 根据现有开场白标题自动生成目录文本：<br>· <b>生成跳转正则</b> — 二选一：<br>&nbsp;&nbsp;- 「基础样式」— 生成简洁跳转页，可直接使用或复制 Prompt 交给 AI 美化<br>&nbsp;&nbsp;- 「融合美化」— 已有美化 HTML？AI 保留设计并融合跳转逻辑，之后增删开场白无需改正则<br>· <b>插入为新首页</b> — 将目录作为新开场白 #0 插入<br>· <b>覆盖原首页</b> — 用目录覆盖现有开场白 #0</p></div>
            <hr class="gj-help-divider">
            <div class="gj-help-section"><h3><i class="fa-solid fa-wand-magic-sparkles"></i> 融合美化（AI）</h3><p>在「生成跳转正则」中选择<b>融合美化</b>后会打开独立面板，把已有的美化 HTML + 我们的跳转逻辑交给 AI 融合，之后无需手动维护正则中的条目列表。</p><p>HTML 来源支持二选一（默认<b>从角色卡局部正则导入</b>，也可切到<b>粘贴 HTML</b>）。融合完成后可一键<b>覆盖原局部正则</b>，改动保留在角色卡内，跟卡片一起分享。</p></div>
            <hr class="gj-help-divider">
            <div class="gj-help-section"><h3><i class="fa-solid fa-chart-column"></i> 高容错的状态栏正则工具</h3><p>酒馆顶部 QR 按钮「<b>状态栏工具</b>」打开。核心作用：<b>让状态栏对 AI 的格式错误有容错能力</b>。</p><p><b>为什么旧状态栏容易"掉"？</b> 常规状态栏用很多捕获组一一对应字段（HP、心情、好感度…），只要 AI 输出里有<b>任意一项</b>格式对不上（缺少冒号、用了中文符号、字段顺序变了），整条正则就匹配失败，<b>整个状态栏当场消失</b>。</p><p><b>本工具怎么解决：</b> 把正则升级成「<b>整块文本捕获 + JS 按行解析</b>」架构：<br>· 某条字段格式错了，<b>只</b>影响那一项，其他字段照常显示<br>· 之后加/改字段名，<b>不用改正则</b>，世界书里加一行就行<br>· 解析器内置对<b>中英文冒号、半/全角空格、CRLF/LF</b> 的容错</p><p>正则来源二选一（默认<b>从角色卡局部正则选取</b>，也可切到<b>上传 .json 文件</b>）；世界书来源二选一（默认<b>从世界书选取</b>，也可切到<b>粘贴</b>）。生成结果自带示例样本和实时预览，「覆盖原局部正则 / 世界书」可一键写回角色卡。</p></div>
            <hr class="gj-help-divider">
            <div class="gj-help-section"><h3><i class="fa-solid fa-magnifying-glass"></i> 搜索替换</h3><p>全局搜索所有开场白中的文本，支持单条替换、批量替换，以及跳转到全屏编辑器中精确定位。</p></div>
            <hr class="gj-help-divider">
            <div class="gj-help-section"><h3><i class="fa-solid fa-house"></i> 回到首页按钮</h3><p>切换到非首页开场白后，聊天消息底部会自动出现「回到首页」按钮，点击即可快速切回首页(开场白 #0)。</p><p><b>自定义样式</b>：顶栏 🏠 图标可下载一份<b>美化正则</b>，修改里面的 CSS 后导入到角色卡的「局部正则」即可。样式会<b>跟卡走</b>不装扩展也能看到。</p></div>
            <hr class="gj-help-divider">
            <div style="text-align:center; margin-top:16px;"><button class="gj-custom-btn primary gj-retour-btn" style="margin:0 auto;"><i class="fa-solid fa-route"></i> 重新引导</button></div>
            <div style="text-align:center; margin-top:12px; font-size:0.78em; opacity:0.4;">by yelluws</div>
        </div>`);
        $content.find('.gj-retour-btn').on('click', () => {
            localStorage.removeItem(STORAGE_KEY_TOUR);
            if (helpPopup) helpPopup.complete(SillyTavern.POPUP_RESULT.AFFIRMATIVE);
            else if (typeof Swal !== 'undefined') Swal.close();
            if (startTourCallback) setTimeout(startTourCallback, 300);
        });
        if (window.SillyTavern && SillyTavern.Popup) {
            helpPopup = new SillyTavern.Popup($content, SillyTavern.POPUP_TYPE.TEXT, "", { okButton: "关闭" });
            helpPopup.show();
        } else {
            (SillyTavern.callGenericPopup || window.callGenericPopup)($content, SillyTavern.POPUP_TYPE.TEXT, "", { okButton: "关闭" });
        }
    }

    async function showGreetingManager() {
        isSortingMode = false;
        const charId = SillyTavern.characterId; const charData = window.TavernHelper.getCharData('current'); if (!charData) { toastr.warning("请先打开一个角色聊天"); return ""; }
        let mainPopupInstance = null; const isAutoClose = localStorage.getItem(STORAGE_KEY_AUTO_CLOSE) === 'true';
        const $wrapper = $('<div class="gj-wrapper"></div>');
        const $headerWrapper = $(`<div class="gj-header-wrapper"><div class="gj-header-row-1"><div class="gj-app-title">开场白管理 <span style="font-size:0.6em; opacity:0.5; font-weight:normal;">v8.0</span></div><div class="gj-header-right"><button type="button" class="gj-icon-btn help" title="帮助"><i class="fa-solid fa-circle-question"></i></button><div class="gj-auto-close-wrapper"><label class="gj-checkbox-label"><input type="checkbox" id="gj-auto-close-checkbox" ${isAutoClose ? 'checked' : ''}>自动关闭</label></div></div></div><div class="gj-header-row-2"><div class="gj-sort-controls"><button type="button" class="gj-sort-toggle-btn" title="进入排序模式"><i class="fa-solid fa-sort"></i> 快速排序</button><button type="button" class="gj-sort-save-btn" title="保存排序"><i class="fa-solid fa-floppy-disk"></i> 保存</button><button type="button" class="gj-sort-cancel-btn" title="取消排序"><i class="fa-solid fa-xmark"></i> 取消</button></div><div class="gj-center-tool-container"><button type="button" class="gj-top-btn directory"><i class="fa-solid fa-list-ol"></i> 目录工具</button></div><div class="gj-icon-group"><button type="button" class="gj-icon-btn add" title="新建"><i class="fa-solid fa-plus"></i></button><button type="button" class="gj-icon-btn search" title="搜索"><i class="fa-solid fa-magnifying-glass"></i></button><button type="button" class="gj-icon-btn home-btn-style" title="回到首页按钮 - 下载美化正则"><i class="fa-solid fa-house"></i></button></div></div></div>`);
        const $scrollArea = $('<div class="gj-scroll-area"></div>');
        const $mainFooter = $(`<div class="gj-main-footer"><button type="button" class="gj-main-close-btn"><i class="fa-solid fa-xmark"></i> 关闭窗口</button></div>`);
        $wrapper.append($headerWrapper).append($scrollArea).append($mainFooter);
        $headerWrapper.find('#gj-auto-close-checkbox').on('change', function() { localStorage.setItem(STORAGE_KEY_AUTO_CLOSE, $(this).is(':checked')); });
        const safeClose = async () => { $scrollArea.empty(); await new Promise(r => setTimeout(r, 50)); if (mainPopupInstance) mainPopupInstance.complete(SillyTavern.POPUP_RESULT.AFFIRMATIVE); else if (typeof Swal !== 'undefined') Swal.close(); };
        $mainFooter.find('.gj-main-close-btn').on('click', safeClose);

        const createCardHTML = (item, loopIndex, isCurrent, canMoveUp, canMoveDown) => {
            const hasLore = (item.parsedLore && item.parsedLore.length > 0) || (item.parsedExclude && item.parsedExclude.length > 0);
            const loreBadge = (() => { const inc = (item.parsedLore || []).length; const exc = (item.parsedExclude || []).length; if (inc && exc) return `${inc}↑${exc}↓`; if (inc) return `${inc}`; if (exc) return `${exc}↓`; return ''; })();
            return `
            <div class="gj-card ${isCurrent ? 'active' : ''} ${isSortingMode ? 'sorting-enabled' : ''}" data-index="${loopIndex}">
                <div class="gj-card-header-main" title="${isSortingMode ? '按住拖拽' : ''}">
                    <button type="button" class="gj-btn-max" title="全屏编辑"><i class="fa-solid fa-maximize"></i></button>
                    <div class="gj-title-area">
                        <span class="gj-title-main">${item.label}</span>
                        ${item.parsedTitle ? `<span class="gj-title-sub">(${_.escape(item.parsedTitle)})</span>` : ''}
                        ${hasLore ? `<span style="font-size:0.75em; color:#9c27b0; margin-left:5px; border:1px solid #9c27b0; border-radius:3px; padding:0 3px;">剧情线: ${item.parsedLore.length}</span>` : ''}
                        ${item.parsedDesc ? `<div class="gj-desc-line">${_.escape(item.parsedDesc)}</div>` : ''}
                    </div>
                    <div class="gj-header-right">
                        <button type="button" class="gj-btn-edit-toggle" title="编辑"><i class="fa-solid fa-pen"></i></button>
                        <button type="button" class="gj-btn-icon-only gj-btn-save" title="保存"><i class="fa-solid fa-check"></i></button>
                        <button type="button" class="gj-btn-icon-only gj-btn-cancel" title="取消"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
                <div class="gj-card-header-tools">
                    <input type="text" class="gj-subtitle-input" placeholder="输入标题 (将嵌入正文)..." value="${_.escape(item.parsedTitle)}">
                    <input type="text" class="gj-desc-input" placeholder="输入描述 (可选，简短说明场景)..." value="${_.escape(item.parsedDesc || '')}">
                    <div class="gj-tools-row" style="margin-top:8px;">
                        <button type="button" class="gj-btn-new-item add"><i class="fa-solid fa-plus"></i> 在下方插入新开场</button>
                        <div class="gj-tools-right">
                             <button type="button" class="gj-action-btn lore ${hasLore ? 'has-data' : ''}" title="配置绑定的世界书条目"><i class="fa-solid fa-book"></i> ${loreBadge}</button>
                            ${!item.protected && canMoveUp ? `<button type="button" class="gj-action-btn up"><i class="fa-solid fa-arrow-up"></i></button>` : ''}
                            ${!item.protected && canMoveDown ? `<button type="button" class="gj-action-btn down"><i class="fa-solid fa-arrow-down"></i></button>` : ''}
                            ${!item.protected ? `<button type="button" class="gj-action-btn del"><i class="fa-solid fa-trash"></i></button>` : ''}
                        </div>
                    </div>
                </div>
                <div class="gj-card-body">
                    <textarea class="gj-textarea" readonly placeholder="内容预览...">${_.escape(item.parsedBody)}</textarea>
                    <div class="gj-expand-bar" title="展开/收起"><i class="fa-solid fa-chevron-down"></i></div>
                    <div class="gj-footer">
                        <button type="button" class="gj-footer-btn insert"><i class="fa-solid fa-paper-plane"></i> 插入聊天</button>
                        <button type="button" class="gj-footer-btn switch ${isCurrent ? 'active' : ''}">${isCurrent ? '<i class="fa-solid fa-arrows-rotate"></i> 同步当前' : '<i class="fa-solid fa-rotate"></i> 设为开场'}</button>
                    </div>
                </div>
            </div>`;
        };

        const bindCardEvents = ($card, item, loopIndex, charObj, alts, renderList) => {
            const $textarea = $card.find('.gj-textarea'); const $subInput = $card.find('.gj-subtitle-input'); const $descInput = $card.find('.gj-desc-input');
            const $toggle = $card.find('.gj-btn-edit-toggle'); const $saveBtn = $card.find('.gj-btn-save'); const $cancelBtn = $card.find('.gj-btn-cancel');
            const $expandBar = $card.find('.gj-expand-bar');

            const enterEditMode = () => { $card.addClass('editing'); $textarea.prop('readonly', false).focus(); };
            const exitEditMode = () => { $card.removeClass('editing'); $textarea.prop('readonly', true); };
            
            $toggle.on('click', enterEditMode);
            $cancelBtn.on('click', () => { $subInput.val(item.parsedTitle); $descInput.val(item.parsedDesc || ''); $textarea.val(item.parsedBody); exitEditMode(); toastr.info("操作已取消"); });

            $saveBtn.on('click', async () => {
                exitEditMode();
                const finalContent = composeMessageContent($subInput.val(), item.parsedLore, $textarea.val(), $descInput.val(), item.parsedExclude);
                if (item.index === -1) { charObj.first_mes = finalContent; if (charObj.data) charObj.data.first_mes = finalContent; updateNativeCharacterUI(finalContent); } 
                else { charObj.data.alternate_greetings[item.index] = finalContent; }
                await forceSave(charId); 
                toastr.success("已保存"); renderList(loopIndex); 
                setTimeout(injectBackHomeButton, 300);
            });

            $expandBar.on('click', () => { $textarea.toggleClass('expanded'); });
            $card.find('.gj-btn-max').on('click', (e) => { e.stopPropagation(); if (typeof Swal !== 'undefined') Swal.close(); setTimeout(() => openFullscreenEditor(item.index, item.label), 200); });
            
            $card.find('.lore').on('click', async () => {
                const loreResult = await openLoreSelector(item.parsedLore, item.parsedExclude, item.index);
                if (loreResult !== null) {
                    const currentTitle = $subInput.val(); const currentDesc = $descInput.val(); const currentBody = $textarea.val();
                    const finalContent = composeMessageContent(currentTitle, loreResult.lore, currentBody, currentDesc, loreResult.exclude);
                    if (item.index === -1) { charObj.first_mes = finalContent; if (charObj.data) charObj.data.first_mes = finalContent; updateNativeCharacterUI(finalContent); } else { charObj.data.alternate_greetings[item.index] = finalContent; }
                    if (loreResult.otherChanges && loreResult.otherChanges.length > 0) {
                        loreResult.otherChanges.forEach(change => {
                            const raw = change.index === -1 ? charObj.first_mes : charObj.data.alternate_greetings[change.index];
                            const p = parseMessageContent(raw);
                            const nc = composeMessageContent(p.title, change.lore, p.body, p.desc, change.exclude);
                            if (change.index === -1) { charObj.first_mes = nc; if (charObj.data) charObj.data.first_mes = nc; updateNativeCharacterUI(nc); }
                            else { charObj.data.alternate_greetings[change.index] = nc; }
                        });
                    }
                    await forceSave(charId);
                    const cleanCount = (loreResult.otherChanges || []).length;
                    toastr.success(cleanCount > 0 ? `世界书绑定已更新，自动整理了 ${cleanCount} 条开场白` : '世界书绑定已更新');
                    renderList(loopIndex);
                    setTimeout(injectBackHomeButton, 300);
                }
            });

            $card.find('.add').on('click', async () => { if (!charObj.data.alternate_greetings) charObj.data.alternate_greetings = []; charObj.data.alternate_greetings.splice(item.index + 1, 0, ""); await forceSave(charId); renderList(loopIndex + 1); toastr.success("已插入"); });
            if (!item.protected) {
                $card.find('.up').on('click', async () => { const arr = charObj.data.alternate_greetings; if (item.index === 0) { const temp = charObj.first_mes; charObj.first_mes = arr[0]; arr[0] = temp; if(charObj.data) charObj.data.first_mes = charObj.first_mes; updateNativeCharacterUI(charObj.first_mes); } else if (item.index > 0) { [arr[item.index - 1], arr[item.index]] = [arr[item.index], arr[item.index - 1]]; } await forceSave(charId); renderList(loopIndex - 1); });
                $card.find('.down').on('click', async () => { const arr = charObj.data.alternate_greetings; if (item.index === -1) { if (arr.length > 0) { const temp = charObj.first_mes; charObj.first_mes = arr[0]; arr[0] = temp; if(charObj.data) charObj.data.first_mes = charObj.first_mes; updateNativeCharacterUI(charObj.first_mes); } } else if (item.index < arr.length - 1) { [arr[item.index], arr[item.index + 1]] = [arr[item.index + 1], arr[item.index]]; } await forceSave(charId); renderList(loopIndex + 1); });
                $card.find('.del').on('click', async () => { if(await (SillyTavern.callGenericPopup || window.callGenericPopup)(`删除 ${item.label}？`, SillyTavern.POPUP_TYPE.CONFIRM)) { if (item.index === -1) { const arr = charObj.data.alternate_greetings; if (arr.length > 0) charObj.first_mes = arr.shift(); else charObj.first_mes = ""; if(charObj.data) charObj.data.first_mes = charObj.first_mes; updateNativeCharacterUI(charObj.first_mes); } else { charObj.data.alternate_greetings.splice(item.index, 1); } await forceSave(charId); toastr.success("已删除"); renderList(-1, true); } });
            }
            
            $card.find('.insert').on('click', async () => { 
                const contentToSend = window.TavernHelper.substitudeMacros(item.parsedBody);
                syncLorebookState(item.parsedLore, item.parsedExclude); 
                await window.TavernHelper.createChatMessages([{ role: 'assistant', message: contentToSend }], { refresh: 'affected' }); 
                toastr.success("已同步剧情并插入"); 
                if(isAutoClose) safeClose(); 
            });
            
            $card.find('.switch').on('click', async () => { 
                const isCurrent = $card.hasClass('active');
                if (await jumpToGreeting(loopIndex, item.raw)) { 
                    toastr.success(isCurrent ? `已同步刷新当前开场白` : `已切换`); 
                    renderList(loopIndex); 
                    setTimeout(injectBackHomeButton, 300); 
                    if(isAutoClose) safeClose(); 
                } 
            });
        };

        const renderList = async (scrollToIndex = -1, maintainScroll = false) => {
            const currentScrollPos = $scrollArea.scrollTop(); if (typeof $scrollArea.sortable === 'function' && $scrollArea.data('ui-sortable')) $scrollArea.sortable('destroy'); $scrollArea.empty();
            const charObj = SillyTavern.characters[charId]; if (!charObj.data) charObj.data = {}; const alts = Array.isArray(charObj.data.alternate_greetings) ? charObj.data.alternate_greetings : [];
            const msgZero = SillyTavern.chat[0]; let currentSwipeIndex = msgZero && msgZero.swipe_id !== undefined ? msgZero.swipe_id : 0;
            const processItem = (content, index) => { const parsed = parseMessageContent(content); return { raw: content, parsedTitle: parsed.title, parsedDesc: parsed.desc, parsedLore: parsed.lore, parsedExclude: parsed.exclude, parsedBody: parsed.body, index: index }; };
            const mainItem = processItem(charObj.first_mes, -1); const altItems = alts.map((c, i) => processItem(c, i));
            let allGreets = [ { ...mainItem, label: "开场白 #0", protected: false }, ...altItems.map((item, i) => ({ ...item, label: `开场白 #${i + 1}`, protected: false })) ];
            const total = allGreets.length;

            if (isSortingMode) {
                const fragment = document.createDocumentFragment(); const bindTasks = [];
                for (let i = 0; i < total; i++) {
                    const item = allGreets[i]; const html = createCardHTML(item, i, (i === currentSwipeIndex), true, true);
                    const template = document.createElement('template'); template.innerHTML = html.trim(); const cardEl = template.content.firstChild; fragment.appendChild(cardEl);
                    bindTasks.push(() => bindCardEvents($(cardEl), item, i, charObj, alts, renderList));
                }
                $scrollArea.append(fragment); bindTasks.forEach(task => task());
                const isMob = isMobile();
                $scrollArea.sortable({
                    handle: '.gj-card-header-main', axis: 'y', opacity: 0.95, helper: 'clone', appendTo: document.body, placeholder: 'gj-sortable-placeholder',
                    forcePlaceholderSize: true, zIndex: 10000, 
                    delay: isMob ? 250 : 100, scroll: true, scrollSpeed: isMob ? 40 : 20, scrollSensitivity: isMob ? 60 : 80,
                    tolerance: "pointer", distance: 5,
                    start: function(event, ui) { ui.placeholder.height(Math.max(60, ui.item.height())); ui.helper.width(ui.item.width()); }
                });
            } else {
                const RENDER_BATCH = 8;
                const renderBatch = async (start) => {
                    const fragment = document.createDocumentFragment(); const bindTasks = []; const end = Math.min(start + RENDER_BATCH, total);
                    for (let i = start; i < end; i++) {
                        const item = allGreets[i]; const html = createCardHTML(item, i, (i === currentSwipeIndex), item.index >= 0, item.index < alts.length - 1 || (item.index === -1 && alts.length > 0));
                        const template = document.createElement('template'); template.innerHTML = html.trim(); const cardEl = template.content.firstChild; fragment.appendChild(cardEl);
                        bindTasks.push(() => bindCardEvents($(cardEl), item, i, charObj, alts, renderList));
                        if (i === scrollToIndex && !maintainScroll) {
                            setTimeout(() => { const $target = $(cardEl); if($target.length && $target[0].scrollIntoView) { $target[0].scrollIntoView({ behavior: 'smooth', block: 'center' }); $target.css('border-color', '#7a9a83').css('border-width', '2px'); setTimeout(() => $target.css('border-color', '').css('border-width', ''), 800); } }, 100);
                        }
                    }
                    $scrollArea.append(fragment); bindTasks.forEach(task => task());
                    if (maintainScroll && start === 0) $scrollArea.scrollTop(currentScrollPos); if (end < total) setTimeout(() => renderBatch(end), 20); 
                }; renderBatch(0);
            }
        };

        const toggleSortUI = (enabled) => {
            isSortingMode = enabled;
            if (enabled) { $headerWrapper.addClass('gj-sorting-active'); $headerWrapper.find('.add, .directory, .search, .help, .home-btn-style').prop('disabled', true).css('opacity', '0.3'); toastr.info(isMobile() ? "拖拽模式: 列表无法滑动，请拖动卡片到边缘翻页" : "已进入排序模式，拖拽完成后请点击保存"); } 
            else { $headerWrapper.removeClass('gj-sorting-active'); $headerWrapper.find('.add, .directory, .search, .help, .home-btn-style').prop('disabled', false).css('opacity', '1'); }
            renderList(-1, true);
        };

        $headerWrapper.find('.gj-sort-toggle-btn').on('click', (e) => { e.preventDefault(); toggleSortUI(true); });
        $headerWrapper.find('.gj-sort-cancel-btn').on('click', (e) => { e.preventDefault(); toggleSortUI(false); });
        $headerWrapper.find('.gj-sort-save-btn').on('click', async function(e) {
            e.preventDefault(); e.stopPropagation();
            try {
                const charObj = SillyTavern.characters[charId]; const newOrderIndices = []; 
                $scrollArea.find('.gj-card').each(function() { newOrderIndices.push(parseInt($(this).attr('data-index'))); });
                const currentAlts = charObj.data.alternate_greetings || []; const sourceData = [charObj.first_mes, ...currentAlts];
                if (newOrderIndices.length !== sourceData.length) { toastr.error("数据长度不一致，保存取消"); toggleSortUI(false); return; }
                const newRawContents = newOrderIndices.map(idx => { const val = sourceData[idx]; return (val === null || val === undefined) ? "" : String(val); });
                const cleanData = JSON.parse(JSON.stringify(newRawContents));
                charObj.first_mes = cleanData[0] || ""; if(charObj.data) charObj.data.first_mes = charObj.first_mes; charObj.data.alternate_greetings = cleanData.slice(1);
                await forceSave(charId); updateNativeCharacterUI(charObj.first_mes); toastr.success("排序已保存"); toggleSortUI(false);
            } catch (err) { console.error("Sort Save Error:", err); toastr.error("排序保存失败"); toggleSortUI(false); }
        });
        
        $headerWrapper.find('.add').on('click', async () => { 
            const charObj = SillyTavern.characters[charId]; 
            if (!charObj.data.alternate_greetings) charObj.data.alternate_greetings = []; 
            charObj.data.alternate_greetings.push(""); 
            await forceSave(charId); 
            renderList(charObj.data.alternate_greetings.length); 
            toastr.success("已新建开场白");
        });

        $headerWrapper.find('.directory').on('click', () => { safeClose(); setTimeout(() => openDirectoryTool(charId, () => setTimeout(showGreetingManager, 300)), 200); });
        $headerWrapper.find('.search').on('click', () => { safeClose(); setTimeout(() => openSearchAndReplaceLogic(charId), 200); });
        $headerWrapper.find('.home-btn-style').on('click', () => { openHomeBtnDownloader(); });
        const tourOpts = { charId, safeClose };
        $headerWrapper.find('.help').on('click', () => { showHelpPopup(() => startTour($wrapper, tourOpts)); });
        renderList();
        if (window.SillyTavern && SillyTavern.Popup) { mainPopupInstance = new SillyTavern.Popup($wrapper, SillyTavern.POPUP_TYPE.TEXT, "", { large: true, okButton: false, cancelButton: false }); mainPopupInstance.show(); } else { (SillyTavern.callGenericPopup || window.callGenericPopup)($wrapper, 1, "", { large: true, okButton: false }); }
        if (localStorage.getItem('gj_tour_resume') || localStorage.getItem(STORAGE_KEY_TOUR) !== 'true') { setTimeout(() => startTour($wrapper, tourOpts), 600); }
    }

    if (window.SillyTavern && SillyTavern.SlashCommandParser) { SillyTavern.SlashCommandParser.addCommandObject(SillyTavern.SlashCommand.fromProps({ name: 'greetings', callback: showGreetingManager, helpString: '开场白管理器' })); SillyTavern.SlashCommandParser.addCommandObject(SillyTavern.SlashCommand.fromProps({ name: 'go-start', callback: backToStart, helpString: '回到首页' })); SillyTavern.SlashCommandParser.addCommandObject(SillyTavern.SlashCommand.fromProps({ name: 'statusbar', callback: openStatusBarTool, helpString: '状态栏正则工具' })); SillyTavern.SlashCommandParser.addCommandObject(SillyTavern.SlashCommand.fromProps({ name: 'home-btn-regex', callback: openHomeBtnDownloader, helpString: '回到首页按钮 - 下载美化正则' })); }
    if (typeof replaceScriptButtons === 'function' && typeof getButtonEvent === 'function' && typeof eventOn === 'function') {
        const BUTTON_GREETINGS = '开场白管理';
        const BUTTON_STATUSBAR = '状态栏工具';
        // replaceScriptButtons 会用新列表覆盖掉旧注册，自动清除历史版本的"开场白切换"、"回到首页"按钮
        replaceScriptButtons([
            { name: BUTTON_GREETINGS, visible: true },
            { name: BUTTON_STATUSBAR, visible: true }
        ]);
        eventOn(getButtonEvent(BUTTON_GREETINGS), showGreetingManager);
        eventOn(getButtonEvent(BUTTON_STATUSBAR), openStatusBarTool);
    }

    // =======================================================================
    // --- 动态开场白世界书控制器逻辑 (重构合并自 V3.4) ---
    // =======================================================================
    let bgDebounceTimer = null;
    let bgLastStateFingerprint = ""; 
    let bgLastSyncedSwipeId = null; 

    function bgExtractUids(text) {
        if (!text) return [];
        const match = text.match(LORE_REGEX);
        if (match && match[1]) {
            return match[1].split(',').map(s => Number(s.trim())).filter(n => !isNaN(n)); 
        }
        return [];
    }

    function bgExtractExcludeUids(text) {
        if (!text) return [];
        const match = text.match(EXCLUDE_REGEX);
        if (match && match[1]) {
            return match[1].split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
        }
        return [];
    }

    async function bgSyncLorebook() {
        if (typeof window.TavernHelper === 'undefined') return;
        const lorebookName = window.TavernHelper.getCurrentCharPrimaryLorebook();
        if (!lorebookName) return;

        try {
            const messages = await window.TavernHelper.getChatMessages(0, { include_swipes: true });
            if (!messages || messages.length === 0) return;

            const msg0 = messages[0];
            let currentSwipeId = msg0.swipe_id || 0;
            let currentContent = msg0.mes; 

            bgLastSyncedSwipeId = currentSwipeId;
            if (msg0.swipes && msg0.swipes.length > currentSwipeId) {
                currentContent = msg0.swipes[currentSwipeId];
            }

            const allSwipesContent = msg0.swipes || [msg0.mes];
            const managedUidSet = new Set();
            allSwipesContent.forEach(txt => {
                bgExtractUids(txt).forEach(uid => managedUidSet.add(uid));
            });

            const activeUids = bgExtractUids(currentContent);
            const activeUidSet = new Set(activeUids);
            const excludeUids = bgExtractExcludeUids(currentContent);
            const excludeUidSet = new Set(excludeUids);

            if (managedUidSet.size === 0 && excludeUidSet.size === 0) return;

            const currentStateFingerprint = `${currentSwipeId}:inc=${activeUids.sort().join(',')};exc=${excludeUids.sort().join(',')}`;
            if (currentStateFingerprint === bgLastStateFingerprint) return;
            bgLastStateFingerprint = currentStateFingerprint;

            const entries = await window.TavernHelper.getLorebookEntries(lorebookName);
            if (!entries) return;

            const entriesToUpdate = [];
            const actionLogs = [];
            const processedUids = new Set();
            
            managedUidSet.forEach(uid => {
                const entry = entries.find(e => Number(e.uid) === uid);
                if (entry) {
                    const shouldEnable = activeUidSet.has(uid) && !excludeUidSet.has(uid);
                    processedUids.add(uid);
                    if (entry.enabled !== shouldEnable) {
                        entriesToUpdate.push({ uid: uid, enabled: shouldEnable });
                        const entryName = entry.comment || (entry.key && entry.key.length ? entry.key[0] : `UID:${uid}`);
                        actionLogs.push(`${shouldEnable ? '✅' : '🚫'} ${entryName}`);
                    }
                }
            });

            excludeUidSet.forEach(uid => {
                if (processedUids.has(uid)) return;
                const entry = entries.find(e => Number(e.uid) === uid);
                if (entry && entry.enabled) {
                    entriesToUpdate.push({ uid: uid, enabled: false });
                    const entryName = entry.comment || (entry.key && entry.key.length ? entry.key[0] : `UID:${uid}`);
                    actionLogs.push(`🚫 ${entryName}`);
                }
            });

            if (entriesToUpdate.length > 0) {
                await window.TavernHelper.setLorebookEntries(lorebookName, entriesToUpdate);
                if (actionLogs.length > 0) {
                    const msg = actionLogs.length > 3 
                        ? `已同步 ${actionLogs.length} 个世界书状态` 
                        : actionLogs.join('  ');
                    toastr.info(msg, '后台世界书同步', { timeOut: 2000, preventDuplicates: true });
                }
            }
        } catch (err) {
            console.error("[GreetingJumper-LoreCtrl] Error:", err);
        }
    }

    function bgTriggerSync(immediate = false) {
        if (bgDebounceTimer) clearTimeout(bgDebounceTimer);
        const delay = immediate ? 10 : 300; 
        bgDebounceTimer = setTimeout(bgSyncLorebook, delay);
    }

    // --- 统一初始化入口 ---
    (async () => {
        while (typeof window.TavernHelper === 'undefined' || typeof window.eventOn === 'undefined' || typeof window.tavern_events === 'undefined') {
            await new Promise(r => setTimeout(r, 500));
        }
        
        // 绑定合并后的事件
        eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, (msgId) => {
            if (Number(msgId) === 0) {
                setTimeout(injectBackHomeButton, 150);
                bgTriggerSync(true); // 世界书同步
            }
        });
        
        eventOn(tavern_events.MESSAGE_SWIPED, (msgId) => {
            if (Number(msgId) === 0) {
                setTimeout(injectBackHomeButton, 150);
                bgTriggerSync(true); // 世界书同步
            }
        });
        
        eventOn(tavern_events.CHAT_CHANGED, () => {
            setTimeout(injectBackHomeButton, 300);
            bgLastStateFingerprint = ""; 
            bgLastSyncedSwipeId = null;
            bgTriggerSync(false); // 世界书同步
        });
        
        console.log('[Greeting Jumper V8.0] UI 与后台动态世界书控制器已加载完成');
    })();
})();
