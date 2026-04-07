//name: 开场白管理器
//description: V8.0 
//author: Yellows

(function() {
    const STORAGE_KEY_AUTO_CLOSE = 'gj_auto_close_setting_v1';
    const STORAGE_KEY_TOUR = 'gj_tour_completed_v1';
    const STORAGE_KEY_SYNC_EDIT = 'gj_sync_edit_choice_v1';
    let saveTimeout = null;
    let isSortingMode = false;
    const _loreCache = { charId: null, uids: null };
    let _isSyncing = false;

    // --- 正则定义 ---
    const TITLE_REGEX = /<!---?\s*title:\s*(.*?)\s*-?-->[\r\n]*/;
    const DESC_REGEX = /<!---?\s*desc:\s*(.*?)\s*-?-->[\r\n]*/;
    const LORE_REGEX = /<!---?\s*lore:\s*([\d,\s]+)\s*-?-->[\r\n]*/;
    const STYLE_ID = 'greeting-jumper-css-v7-7'; 

    $('[id^=greeting-jumper-css]').remove();
    $('head').append(`
        <style id="${STYLE_ID}">
            .swal2-popup { width: 98% !important; max-width: 1600px !important; height: 95vh !important; padding: 0 !important; border-radius: 8px !important; display: flex !important; flex-direction: column; }
            .swal2-html-container { flex-grow: 1; overflow: hidden; padding: 0 !important; margin: 0 !important; text-align: left !important; }
            *:focus { outline: none !important; box-shadow: none !important; }
            .gj-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; background: var(--smart-theme-bg); position: relative; }
            .gj-header-wrapper { flex-shrink: 0; background: var(--smart-theme-content-bg); border-bottom: 1px solid var(--smart-theme-border-color-1); display: flex; flex-direction: column; z-index: 100; }
            .gj-header-row-1 { display: flex; align-items: center; justify-content: flex-end; padding: 12px 15px; border-bottom: 1px solid rgba(0,0,0,0.05); position: relative; min-height: 24px; }
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
            .gj-app-title { font-weight: bold; font-size: 1.2em; color: var(--smart-theme-body-color); position: absolute; left: 50%; transform: translateX(-50%); pointer-events: none; }
            .gj-auto-close-wrapper { display: flex; align-items: center; gap: 4px; font-size: 0.75em; opacity: 0.7; z-index: 10; margin-left: auto; }
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
            .gj-footer-btn.active { background: #7a9a83; color: white; border: none; cursor: default; opacity: 1; pointer-events: none; }
            .gj-lore-popup-content { display: flex; flex-direction: column; height: 60vh; text-align: left; }
            .gj-lore-list { flex-grow: 1; overflow-y: auto; border: 1px solid var(--smart-theme-border-color-1); border-radius: 4px; padding: 5px; background: rgba(0,0,0,0.02); margin-top: 10px; }
            .gj-lore-item { display: flex; align-items: center; padding: 12px 10px; border-bottom: 1px solid var(--smart-theme-border-color-1); cursor: pointer; transition: all 0.1s; background: var(--smart-theme-content-bg); margin-bottom: 2px; }
            .gj-lore-item:hover { background: rgba(0,0,0,0.05); }
            .gj-lore-item.checked { background: rgba(156, 39, 176, 0.1); border-left: 4px solid #9c27b0; }
            .gj-lore-cb { margin-right: 15px; transform: scale(1.5); cursor: pointer; }
            .gj-lore-uid { font-family: monospace; font-size: 0.9em; opacity: 0.6; width: 50px; text-align: center; margin-right: 15px; border-right: 1px solid var(--smart-theme-border-color-2); }
            .gj-lore-name { font-size: 1.05em; font-weight: bold; color: var(--smart-theme-body-color); flex-grow: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
             /* Fullscreen Editor */
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
            
            /* Parser */
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
            
            /* Search Results */
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

            /* Back Home Button (chat injection) */
            .gj-back-home-btn { display: flex; align-items: center; justify-content: center; gap: 6px; margin: 15px auto 5px; padding: 8px 20px; border: 1px solid #7a9a83; border-radius: 6px; background: rgba(122,154,131,0.08); color: #7a9a83; cursor: pointer; font-weight: bold; font-size: 0.95em; transition: all 0.2s; max-width: 200px; }
            .gj-back-home-btn:hover { background: rgba(122,154,131,0.2); transform: translateY(-1px); }

            /* Tour: 4-panel overlay (lives inside $wrapper) */
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

            /* Help Popup */
            .gj-help-content { padding: 15px; text-align: left; color: var(--smart-theme-body-color); max-height: 65vh; overflow-y: auto; }
            .gj-help-section { margin-bottom: 14px; }
            .gj-help-section h3 { font-size: 1.05em; color: #7a9a83; margin: 0 0 6px 0; display: flex; align-items: center; gap: 6px; }
            .gj-help-section p { font-size: 0.9em; line-height: 1.5; opacity: 0.85; margin: 0 0 4px 0; }
            .gj-help-divider { border: none; border-top: 1px solid var(--smart-theme-border-color-1); margin: 12px 0; }
            .gj-dir-guide { background: rgba(122,154,131,0.1); border: 1px solid rgba(122,154,131,0.3); border-radius: 6px; padding: 10px 14px; margin-bottom: 10px; font-size: 0.9em; line-height: 1.6; display: flex; align-items: flex-start; gap: 8px; color: var(--smart-theme-body-color); }
            .gj-dir-guide i { color: #7a9a83; margin-top: 3px; flex-shrink: 0; }

            /* Regex Chooser */
            .gj-regex-chooser { display: flex; flex-direction: column; gap: 14px; padding: 6px; color: var(--smart-theme-body-color); }
            .gj-regex-card { border: 1px solid var(--smart-theme-border-color-1); border-radius: 8px; padding: 16px; cursor: default; transition: border-color 0.2s; }
            .gj-regex-card:hover { border-color: #7a9a83; }
            .gj-regex-card-title { font-weight: bold; font-size: 1em; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
            .gj-regex-card-title i { color: #7a9a83; }
            .gj-regex-card-desc { font-size: 0.88em; opacity: 0.75; line-height: 1.5; margin-bottom: 12px; }
            .gj-regex-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
            .gj-gen-regex-btn { font-size: 0.85em !important; padding: 6px 12px !important; border: 1px solid var(--smart-theme-border-color-2); border-radius: 4px; cursor: pointer; background: linear-gradient(135deg, #7a9a83, #5a8a6a); color: white; display: flex; align-items: center; gap: 6px; font-weight: bold; transition: all 0.2s; white-space: nowrap; }
            .gj-gen-regex-btn:hover { filter: brightness(1.15); }
            /* Advanced Beautify (AI) */
            .gj-adv-beauty-container { display: flex; flex-direction: column; gap: 12px; padding: 10px; color: var(--smart-theme-body-color); position: relative; max-height: 75vh; overflow-y: auto; -webkit-overflow-scrolling: touch; }
            .gj-adv-header-row { display: flex; align-items: center; justify-content: space-between; }
            .gj-adv-config-btn { background: transparent; border: 1px solid var(--smart-theme-border-color-1, #444); color: var(--smart-theme-body-color); padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.85em; opacity: 0.6; transition: all 0.2s; }
            .gj-adv-config-btn:hover { opacity: 1; border-color: #7a9a83; }
            .gj-adv-input { width: 100%; min-height: 250px; resize: vertical; background: var(--smart-theme-input-bg); color: var(--smart-theme-body-color); border: 1px solid var(--smart-theme-border-color-1); border-radius: 4px; padding: 10px; font-size: 0.95em; box-sizing: border-box; outline: none; }
            .gj-adv-input:focus { border-color: #7a9a83; }
            .gj-adv-input-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
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
            .gj-adv-refine-bar { display: flex; gap: 6px; align-items: center; }
            .gj-adv-refine-input { flex-grow: 1; background: var(--smart-theme-input-bg); color: var(--smart-theme-body-color); border: 1px solid var(--smart-theme-border-color-1); border-radius: 4px; padding: 8px 12px; font-size: 0.9em; box-sizing: border-box; outline: none; }
            .gj-adv-refine-input:focus { border-color: #7a9a83; }
            .gj-adv-refine-input::placeholder { opacity: 0.4; }
            .gj-adv-refine-btn { padding: 8px 12px !important; }
            .gj-adv-loading { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; border-radius: 8px; z-index: 10; }
            .gj-adv-spinner { width: 36px; height: 36px; border: 3px solid rgba(122,154,131,0.3); border-top-color: #7a9a83; border-radius: 50%; animation: gj-spin 0.8s linear infinite; }
            @keyframes gj-spin { to { transform: rotate(360deg); } }
            .gj-adv-loading-text { color: #ccc; font-size: 0.9em; }
            @media (max-width: 768px) {
                .gj-adv-beauty-container { max-height: 70vh; }
                .gj-adv-input { min-height: 150px; }
                .gj-adv-result-editor { min-height: 120px; max-height: 30vh; }
            }
        </style>
    `);

    // --- 辅助功能 ---
    function isMobile() { return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent); }

    function parseMessageContent(raw) {
        if (!raw) return { title: "", desc: "", lore: [], body: "" };
        let body = raw;
        let title = "", desc = "";
        let lore = [];
        const titleMatch = body.match(TITLE_REGEX);
        if (titleMatch) { title = titleMatch[1].trim(); body = body.replace(titleMatch[0], ''); }
        const descMatch = body.match(DESC_REGEX);
        if (descMatch) { desc = descMatch[1].trim(); body = body.replace(descMatch[0], ''); }
        const loreMatch = body.match(LORE_REGEX);
        if (loreMatch) { lore = loreMatch[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)); body = body.replace(loreMatch[0], ''); }
        return { title, desc, lore, body };
    }

    function composeMessageContent(title, loreArray, body, desc) {
        if (typeof loreArray === 'string' && body === undefined) { body = loreArray; loreArray = []; desc = ""; }
        let prefix = "";
        if (title && title.trim()) prefix += `<!-- title: ${title.trim()} -->\n`;
        if (desc && desc.trim()) prefix += `<!-- desc: ${desc.trim()} -->\n`;
        if (loreArray && Array.isArray(loreArray) && loreArray.length > 0) prefix += `<!-- lore: ${loreArray.join(',')} -->\n`;
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
                // 修复崩溃的关键：过滤掉 null 和 undefined，防止产生幽灵空行
                charObj.data.alternate_greetings = charObj.data.alternate_greetings.map(x => (x === null || x === undefined) ? "" : String(x));
            }
            if (typeof SillyTavern.saveCharacter === 'function') { await SillyTavern.saveCharacter(Number(charId)); await new Promise(r => setTimeout(r, 200)); } 
            else if (typeof window.saveCharacterDebounced === 'function') { await window.saveCharacterDebounced(); await new Promise(r => setTimeout(r, 2000)); }
        } catch (e) { console.error("Save failed:", e); toastr.error("保存失败，请检查控制台"); }
    }

    // 修复崩溃的关键：防抖动与差异检查，避免不必要的原生UI重绘
    function updateNativeCharacterUI(newText) {
        if (typeof newText !== 'string') return;
        const $nativeInput = $('textarea[name="first_mes"], #first_mes');
        if ($nativeInput.length) {
            // 如果内容没变，就不触发原生更新，防止死循环或重绘崩溃
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

    // --- 修复 Issue 1: 还原旧版正则格式 ---
    const generateRegexJson = (format) => {
        const baseHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
    .prologue-container { font-family: sans-serif; padding: 15px; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid #e0e0e0; color: #333333; }
    .prologue-title { font-weight: bold; margin-bottom: 12px; font-size: 1.1em; color: #333333; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px; }
    .prologue-grid { display: flex; flex-direction: column; gap: 8px; }
    .prologue-btn { background: #f8f9fa; border: 1px solid #e9ecef; padding: 10px 12px; border-radius: 6px; cursor: pointer; text-align: left; transition: all 0.2s; color: #495057; }
    .prologue-btn:hover { background: #e2e6ea; border-color: #ced4da; color: #212529; transform: translateX(2px); }
    .btn-index { font-weight: bold; margin-right: 8px; color: #7a9a83; }
    .btn-desc { display: block; font-size: 0.82em; opacity: 0.55; margin-top: 3px; padding-left: 2px; color: #6c757d; }
</style>
</head>
<body>
<template id="prologue-data">$1</template>
<template id="prologue-item-tpl"><div class="prologue-btn"><span class="btn-index">#{INDEX}</span> {TITLE}<span class="btn-desc">{DESC}</span></div></template>
<div class="prologue-container">
    <div class="prologue-title">开场白目录</div>
    <div id="prologue-list" class="prologue-grid"></div>
</div>
</body>
</html>`;
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
            var tr = /<!---?\\s*title:\\s*(.*?)\\s*-?-->/;
            var map = {};
            var ext = function(raw) { if (!raw) return ''; var m = raw.match(tr); return m ? m[1].trim() : ''; };
            var t0 = ext(charObj.first_mes); if (t0) map[t0] = 0;
            (charObj.data && charObj.data.alternate_greetings || []).forEach(function(g, i) { var t = ext(g); if (t) map[t] = i + 1; });
            return map;
        } catch(e) { return {}; }
    }
    try {
        var helper = await waitForHelper();
        var tpl = document.getElementById('prologue-data');
        if (!tpl) return;
        var rawText = tpl.innerHTML.trim();
        var regex = /^(\\d+)[.、]\\s*(.+?)(?:\\s*\\|\\s*(.+?))?\\s*$/gm;
        var titleMap = buildTitleMap();
        var listEl = document.getElementById('prologue-list');
        var itemTpl = document.getElementById('prologue-item-tpl');
        if (!listEl || !itemTpl) return;
        var itemHtml = itemTpl.innerHTML;
        var match;
        while ((match = regex.exec(rawText)) !== null) {
            var idx = match[1], title = match[2].trim(), desc = match[3] ? match[3].trim() : '';
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
                        await helper.setChatMessages([{ message_id: 0, swipe_id: sid }], { refresh: 'affected' });
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
11. Do NOT add any explanation, commentary, or markdown. Output ONLY the raw HTML.`;

    const getAiConfig = () => {
        try { return JSON.parse(localStorage.getItem(AI_CONFIG_KEY)) || {}; } catch { return {}; }
    };
    const saveAiConfig = (cfg) => localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(cfg));

    const callAI = async (messages, onStatus) => {
        const config = getAiConfig();
        const useMain = config.useMainApi !== false;
        if (useMain && typeof SillyTavern.generateRaw === 'function') {
            if (onStatus) onStatus('正在通过主 API 生成...');
            try {
                const combined = messages.map(m => (m.role === 'system' ? '[System]\n' : m.role === 'assistant' ? '[Assistant]\n' : '[User]\n') + m.content).join('\n\n');
                const result = await SillyTavern.generateRaw(combined);
                return typeof result === 'string' ? result : (result?.text || result?.message?.content || String(result));
            } catch (e) { console.warn('ST generateRaw failed:', e); throw new Error('主 API 调用失败: ' + e.message); }
        }
        if (!config.endpoint || !config.key) return null;
        if (onStatus) onStatus('正在调用自定义 API...');
        const endpoint = config.endpoint.replace(/\/+$/, '');
        const isAnthropic = /anthropic/i.test(endpoint);
        if (isAnthropic) {
            const systemMsg = messages.find(m => m.role === 'system');
            const nonSystem = messages.filter(m => m.role !== 'system');
            const body = { model: config.model || 'claude-sonnet-4-20250514', max_tokens: 16000, system: systemMsg ? systemMsg.content : '', messages: nonSystem };
            const resp = await fetch(endpoint + '/v1/messages', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': config.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
                body: JSON.stringify(body)
            });
            if (!resp.ok) throw new Error(`API ${resp.status}: ${await resp.text()}`);
            const data = await resp.json();
            return data.content?.[0]?.text || '';
        }
        const body = { model: config.model || 'gpt-4o-mini', messages, temperature: 0.2, max_tokens: 16000 };
        const resp = await fetch(endpoint + '/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + config.key },
            body: JSON.stringify(body)
        });
        if (!resp.ok) throw new Error(`API ${resp.status}: ${await resp.text()}`);
        const data = await resp.json();
        return data.choices?.[0]?.message?.content || '';
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
        const stAvailable = typeof SillyTavern.generateRaw === 'function';
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

        const $ui = $(`<div class="gj-adv-beauty-container">
            <div class="gj-adv-phase gj-adv-phase-input">
                <div class="gj-adv-header-row">
                    <label class="gj-adv-label"><i class="fa-solid fa-paste"></i> 粘贴美化 HTML</label>
                    <button type="button" class="gj-adv-config-btn" title="AI 配置"><i class="fa-solid fa-gear"></i></button>
                </div>
                <textarea class="gj-adv-input" placeholder="在此粘贴美化 HTML 代码..."></textarea>
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
                    <button type="button" class="gj-custom-btn gj-adv-back-btn"><i class="fa-solid fa-arrow-left"></i> 重新导入</button>
                    <button type="button" class="gj-custom-btn primary gj-adv-download-btn"><i class="fa-solid fa-download"></i> 下载融合正则</button>
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

        const doAiMerge = async (messages) => {
            isGenerating = true;
            showLoading();
            try {
                const aiCfg = getAiConfig();
                const useMain = aiCfg.useMainApi !== false;
                const hasCustom = aiCfg.endpoint && aiCfg.key;
                const hasStApi = typeof SillyTavern.generateRaw === 'function';
                if ((useMain && !hasStApi) || (!useMain && !hasCustom)) {
                    hideLoading();
                    isGenerating = false;
                    toastr.warning(useMain ? "主 API 不可用，请检查 SillyTavern 连接或切换到自定义 API" : "请先配置自定义 API");
                    await showApiConfigDialog();
                    return null;
                }
                const result = await callAI(messages, (s) => $ui.find('.gj-adv-loading-text').text(s));
                hideLoading();
                isGenerating = false;
                if (!result) { toastr.error("AI 返回为空"); return null; }
                return cleanAiOutput(result);
            } catch (e) {
                hideLoading();
                isGenerating = false;
                toastr.error("AI 调用失败: " + e.message);
                console.error('AI merge error:', e);
                return null;
            }
        };

        $ui.find('.gj-adv-config-btn').on('click', () => showApiConfigDialog());
        $ui.find('.gj-adv-fullscreen-btn').on('click', () => openFullscreenPreview());

        $ui.find('.gj-adv-merge-btn').on('click', async () => {
            if (isGenerating) return;
            const raw = $ui.find('.gj-adv-input').val().trim();
            if (!raw) { toastr.warning("内容为空"); return; }

            conversationHistory = [
                { role: 'system', content: AI_MERGE_SYSTEM_PROMPT },
                { role: 'user', content: '请将以下美化 HTML 页面融合跳转功能。保留所有视觉效果，只添加/修改跳转逻辑：\n\n' + raw }
            ];
            const merged = await doAiMerge(conversationHistory);
            if (!merged) return;

            currentMergedHtml = merged;
            conversationHistory.push({ role: 'assistant', content: merged });
            $ui.find('.gj-adv-result-editor').val(merged);
            updatePreview(merged);
            $ui.find('.gj-adv-phase-input').slideUp(200);
            $ui.find('.gj-adv-phase-result').slideDown(200);
            $ui.find('.gj-adv-status').text('(AI 生成完毕)');
        });

        $ui.find('.gj-adv-result-editor').on('input', function() {
            currentMergedHtml = $(this).val();
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
            const refined = await doAiMerge(conversationHistory);
            if (!refined) { $ui.find('.gj-adv-status').text('(调整失败)'); return; }
            currentMergedHtml = refined;
            conversationHistory.push({ role: 'assistant', content: refined });
            $ui.find('.gj-adv-result-editor').val(refined);
            updatePreview(refined);
            $ui.find('.gj-adv-status').text('(AI 调整完毕)');
        };

        $ui.find('.gj-adv-refine-btn').on('click', doRefine);
        $ui.find('.gj-adv-refine-input').on('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doRefine(); } });

        $ui.find('.gj-adv-back-btn').on('click', () => {
            conversationHistory = [];
            currentMergedHtml = '';
            $ui.find('.gj-adv-phase-result').slideUp(200);
            $ui.find('.gj-adv-phase-input').slideDown(200);
        });

        $ui.find('.gj-adv-download-btn').on('click', () => {
            const html = $ui.find('.gj-adv-result-editor').val().trim();
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
                // 修复崩溃：增加批处理间隔，给浏览器GC留时间
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

    async function syncLorebookState(targetLoreArray) {
        if (_isSyncing) return;
        _isSyncing = true;
        try {
            const charId = SillyTavern.characterId;
            const lorebookName = window.TavernHelper.getCurrentCharPrimaryLorebook();
            if (!lorebookName) return; 
            const managedUIDs = getAllManagedLoreUIDs(charId);
            const targetSet = new Set(targetLoreArray);
            let currentEntries = []; try { currentEntries = await window.TavernHelper.getLorebookEntries(lorebookName); } catch (e) { return; }
            const updates = []; const actionLogs = [];
            managedUIDs.forEach(uid => {
                const shouldEnable = targetSet.has(uid);
                const entry = currentEntries.find(e => e.uid === uid);
                if (entry && entry.enabled !== shouldEnable) {
                    updates.push({ uid: uid, enabled: shouldEnable });
                    const entryName = entry.comment || (entry.key && entry.key.length ? entry.key[0] : `条目 ${uid}`);
                    actionLogs.push(`${shouldEnable ? '✅' : '🚫'} ${entryName}`);
                }
            });
            if (updates.length > 0) {
                await window.TavernHelper.setLorebookEntries(lorebookName, updates);
                if (actionLogs.length > 3) toastr.success(`更新了 ${actionLogs.length} 个世界书条目`);
                else toastr.info(actionLogs.join('<br>'), '世界书同步', { timeOut: 3000, escapeHtml: false });
            }
        } finally { _isSyncing = false; }
    }

    async function openLoreSelector(currentUIDs) {
        const popupFunc = SillyTavern.callGenericPopup || window.callGenericPopup;
        const lorebookName = window.TavernHelper.getCurrentCharPrimaryLorebook();
        if (!lorebookName) { toastr.warning("当前角色未绑定主世界书"); return null; }
        let entries = []; try { entries = await window.TavernHelper.getLorebookEntries(lorebookName); } catch(e) { toastr.error("读取世界书失败"); return null; }
        const selectedSet = new Set(currentUIDs);
        entries.sort((a, b) => { const aSel = selectedSet.has(a.uid); const bSel = selectedSet.has(b.uid); if (aSel && !bSel) return -1; if (!aSel && bSel) return 1; return a.uid - b.uid; });
      const $content = $(`
            <div class="gj-lore-popup-content">
                <div style="font-weight:bold; margin-bottom:5px;">配置专属世界书:</div>
                <div style="font-size:0.85em; opacity:0.7; margin-bottom:10px; line-height:1.4;">
                    请勾选本开场白对应的专属世界书条目。切换时将自动启用选中项，并关闭其他开场白的专属条目。
                </div>
                <div class="gj-lore-list"></div>
            </div>`);
        const $list = $content.find('.gj-lore-list');
        entries.forEach(entry => {
            const isChecked = selectedSet.has(entry.uid);
            const displayName = entry.comment || (entry.key && entry.key.length ? `(关键词: ${entry.key[0]})` : "无标题");
            const $item = $(`<div class="gj-lore-item ${isChecked ? 'checked' : ''}" data-uid="${entry.uid}"><input type="checkbox" class="gj-lore-cb" ${isChecked ? 'checked' : ''}><span class="gj-lore-uid">[${entry.uid}]</span><span class="gj-lore-name">${_.escape(displayName)}</span></div>`);
            $item.on('click', function(e) { if (e.target.type !== 'checkbox') { const $cb = $(this).find('.gj-lore-cb'); $cb.prop('checked', !$cb.prop('checked')); } $(this).toggleClass('checked', $(this).find('.gj-lore-cb').prop('checked')); });
            $list.append($item);
        });
        const result = await popupFunc($content, SillyTavern.POPUP_TYPE.CONFIRM, "", { large: true, okButton: "保存设定", cancelButton: "取消" });
        if (result) { const newUIDs = []; $list.find('.gj-lore-cb:checked').each(function() { newUIDs.push(parseInt($(this).closest('.gj-lore-item').data('uid'))); }); return newUIDs; }
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
                    const $promptBox = $(`<div style="display:flex;flex-direction:column;gap:10px;color:var(--smart-theme-body-color);">
                        <div style="font-size:0.9em;opacity:0.7;">已生成美化 Prompt，请全选复制后粘贴给 AI：</div>
                        <textarea class="gj-prompt-textarea" readonly style="width:100%;min-height:300px;resize:vertical;background:var(--smart-theme-input-bg);color:var(--smart-theme-body-color);border:1px solid var(--smart-theme-border-color-1);border-radius:4px;padding:10px;font-size:0.85em;font-family:monospace;box-sizing:border-box;">${_.escape(fullPrompt)}</textarea>
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
            $container.find('.parse-btn').on('click', (e) => { e.preventDefault(); importText = $container.find('.import-area').val(); if (!importText.trim()) { toastr.warning("内容为空"); return; } const regex = /(?:^|\n)\s*(?:[#＃] |[\[【(（]?(?:开场白|场景|Part|No\.?|Scene|Scenario)\s*)?([0-9]+|[一二三四五六七八九十]+)[\]】)）]?\s*[:：.、\-\—\s]+\s*(.*?)(?=\n|$)/igm; parsedMatches = []; let match; const cnMap = '零一二三四五六七八九十'; while ((match = regex.exec(importText)) !== null) { const ns = match[1]; const num = /^\d+$/.test(ns) ? parseInt(ns) : (cnMap.indexOf(ns) >= 0 ? cnMap.indexOf(ns) : 0); const parts = match[2].split('|'); parsedMatches.push({ num, title: parts[0].trim(), desc: parts[1] ? parts[1].trim() : '', selectedIndex: null }); } if (parsedMatches.length === 0) { toastr.warning("未识别到目录格式"); return; } startIndex = parsedMatches[0].num - 1; isSwitchingView = true; myPopup.complete(SillyTavern.POPUP_RESULT.CANCELLED); setTimeout(() => openPreviewUI(), 50); });
            $container.find('.insert-as-new-btn').on('click', async (e) => { e.preventDefault(); if(!confirm("确定插入新页面？原内容将顺移。")) return; isSwitchingView = true; await processBatchAndSave(charId, 1, (start, end) => { const oldFirstMes = charObj.first_mes || ""; if (!charObj.data.alternate_greetings) charObj.data.alternate_greetings = []; charObj.data.alternate_greetings.unshift(oldFirstMes); charObj.first_mes = composeMessageContent("目录页", [], $container.find('.export-area').val()); if (charObj.data) charObj.data.first_mes = charObj.first_mes; updateNativeCharacterUI(charObj.first_mes); const msgZero = SillyTavern.chat[0]; if (msgZero && (msgZero.swipe_id === 0 || msgZero.swipe_id === undefined)) { msgZero.swipe_id = 1; if (window.TavernHelper) window.TavernHelper.setChatMessages([{ message_id: 0, swipe_id: 1 }], { refresh: 'none' }); } else if (msgZero && msgZero.swipe_id > 0) { msgZero.swipe_id += 1; if (window.TavernHelper) window.TavernHelper.setChatMessages([{ message_id: 0, swipe_id: msgZero.swipe_id }], { refresh: 'none' }); } }, () => { if(refreshCallback) refreshCallback(); }, myPopup); });
            $container.find('.overwrite-btn').on('click', async (e) => { e.preventDefault(); if(!confirm("确定覆盖【开场白 #0】？\n注意：此操作将修改角色卡文件本身。")) return; isSwitchingView = true; await processBatchAndSave(charId, 1, (start, end) => { const rawText = $container.find('.export-area').val(); const newFirstMes = composeMessageContent("目录页", [], rawText); charObj.first_mes = newFirstMes; if (charObj.data) charObj.data.first_mes = newFirstMes; updateNativeCharacterUI(newFirstMes); const msgZero = SillyTavern.chat[0]; if (window.TavernHelper && msgZero && (msgZero.swipe_id === 0 || msgZero.swipe_id === undefined)) { window.TavernHelper.setChatMessages([{ message_id: 0, message: newFirstMes }], { refresh: 'affected' }); } }, () => { if(refreshCallback) refreshCallback(); }, myPopup); });
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
                        const newContent = composeMessageContent(m.title, parsed.lore, parsed.body, m.desc || parsed.desc); 
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
            const finalContent = composeMessageContent($titleInput.val(), parsed.lore, $textarea.val(), $descInput.val()); 
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
        if(hasReplace) $resultContainer.find('.replace-all-global').on('click', async () => { if(!confirm(`确定全部替换？`)) return; if (typeof Swal !== 'undefined') Swal.close(); await processBatchAndSave(charId, 1, (start, end) => { const doReplace = (raw) => { const p = parseMessageContent(raw); const newBody = p.body.split(findStr).join(replaceStr); return composeMessageContent(p.title, p.lore, newBody, p.desc); }; if (charObj.first_mes) { charObj.first_mes = doReplace(charObj.first_mes); if (charObj.data) charObj.data.first_mes = charObj.first_mes; updateNativeCharacterUI(charObj.first_mes); } if (charObj.data.alternate_greetings) { charObj.data.alternate_greetings = charObj.data.alternate_greetings.map(g => g ? doReplace(g) : g); } }, showGreetingManager, null); });
        results.forEach(res => {
            const label = res.title ? `${res.label} (${res.title})` : res.label; const $group = $(`<div class="gj-search-group"><div class="gj-search-header"><span>${label}</span></div></div>`);
            if (hasReplace) { const $btnRepAll = $(`<button class="gj-search-btn replace" style="margin-left:auto;">替换本条</button>`); $btnRepAll.on('click', async (e) => { e.stopPropagation(); const currentRaw = (res.index === -1) ? charObj.first_mes : charObj.data.alternate_greetings[res.index]; const p = parseMessageContent(currentRaw); const newBody = p.body.split(findStr).join(replaceStr); const newContent = composeMessageContent(p.title, p.lore, newBody, p.desc); if (res.index === -1) { charObj.first_mes = newContent; if (charObj.data) charObj.data.first_mes = newContent; updateNativeCharacterUI(newContent); } else { charObj.data.alternate_greetings[res.index] = newContent; } await forceSave(charId); toastr.success("已替换"); $group.slideUp(); }); $group.find('.gj-search-header').append($btnRepAll); }
            res.indices.forEach((idx, i) => { const occurIdx = res.occurrenceIndices[i]; const s = Math.max(0, idx - 20); const e = Math.min(res.content.length, idx + findStr.length + 20); const txt = _.escape(res.content.substring(s, e)).replace(new RegExp(_.escape(findStr), 'g'), `<span class="gj-highlight">${_.escape(findStr)}</span>`); const $row = $(`<div class="gj-search-row"><div class="gj-search-context">...${txt}...</div><div class="gj-search-actions"></div></div>`); if(hasReplace) { const $btnRep = $(`<button class="gj-search-btn replace">替换</button>`); $btnRep.on('click', async () => { const currentRaw = (res.index === -1) ? charObj.first_mes : charObj.data.alternate_greetings[res.index]; const p = parseMessageContent(currentRaw); let count = 0; let pos = p.body.indexOf(findStr); while (pos !== -1) { if (count === occurIdx) { const pre = p.body.substring(0, pos); const post = p.body.substring(pos + findStr.length); const newBody = pre + replaceStr + post; const newContent = composeMessageContent(p.title, p.lore, newBody, p.desc); if (res.index === -1) { charObj.first_mes = newContent; if (charObj.data) charObj.data.first_mes = newContent; updateNativeCharacterUI(newContent); } else { charObj.data.alternate_greetings[res.index] = newContent; } await forceSave(charId); toastr.success("已替换"); $row.slideUp(); return; } count++; pos = p.body.indexOf(findStr, pos + 1); } }); $row.find('.gj-search-actions').append($btnRep); } const $btnJump = $(`<button class="gj-search-btn edit">跳转</button>`); $btnJump.on('click', () => { if (typeof Swal !== 'undefined') Swal.close(); setTimeout(() => openFullscreenEditor(res.index, res.label, findStr, replaceStr, occurIdx), 200); }); $row.find('.gj-search-actions').append($btnJump); $group.append($row); }); $resultContainer.append($group);
        });
        popupFunc($resultContainer, SillyTavern.POPUP_TYPE.TEXT, "", { wide: true, okButton: "关闭" });
    }

    // --- 核心跳转逻辑 (移除Lore同步) ---
    async function jumpToGreeting(targetIndex, contentToUse) {
        if (!SillyTavern.chat || SillyTavern.chat.length === 0) return false;
        
        // V7.5 修改: 此处不再调用 syncLorebookState，交由独立脚本负责监听变动
        const rawContentToSend = contentToUse; 

        if (SillyTavern.chat.length > 1) { if (!await (SillyTavern.callGenericPopup || window.callGenericPopup)("确认切换开场白？当前已有聊天记录。", SillyTavern.POPUP_TYPE.CONFIRM, "", { okButton: "确定", cancelButton: "取消" })) return false; }
        
        const msgZero = SillyTavern.chat[0]; 
        let currentSwipes = msgZero.swipes ? [...msgZero.swipes] : [msgZero.mes];
        while (currentSwipes.length <= targetIndex) currentSwipes.push("..."); 
        currentSwipes[targetIndex] = rawContentToSend;
        
        await window.TavernHelper.setChatMessages([{ message_id: 0, swipes: currentSwipes }], { refresh: 'none' });
        await window.TavernHelper.setChatMessages([{ message_id: 0, swipe_id: targetIndex }], { refresh: 'affected' });
        return true; 
    }
    
    async function backToStart() { 
        if (!SillyTavern.chat || SillyTavern.chat.length === 0) return; 
        await window.TavernHelper.setChatMessages([{ message_id: 0, swipe_id: 0 }], { refresh: 'affected' }); 
        toastr.success("已切换至首页"); 
    }

    function injectBackHomeButton() {
        $('.gj-back-home-btn').remove();
        if (!SillyTavern.chat || SillyTavern.chat.length === 0) return;
        const msgZero = SillyTavern.chat[0];
        const swipeId = (msgZero && msgZero.swipe_id !== undefined) ? msgZero.swipe_id : 0;
        if (swipeId > 0) {
            const $mesText = $('.mes[mesid="0"] .mes_text');
            if ($mesText.length) {
                const $btn = $('<div class="gj-back-home-btn"><i class="fa-solid fa-house"></i> 回到首页</div>');
                $btn.on('click', (e) => { e.stopPropagation(); backToStart(); });
                $mesText.append($btn);
            }
        }
    }

    async function onGreetingEdited(msgIndex) {
        if (msgIndex !== 0) return;
        const msgZero = SillyTavern.chat && SillyTavern.chat[0];
        if (!msgZero) return;
        const swipeId = msgZero.swipe_id !== undefined ? msgZero.swipe_id : 0;
        const editedContent = msgZero.mes;
        if (!editedContent && editedContent !== '') return;
        const charId = SillyTavern.characterId;
        const charObj = SillyTavern.characters[charId];
        if (!charObj) return;

        const originalContent = swipeId === 0
            ? (charObj.first_mes || '')
            : ((charObj.data && charObj.data.alternate_greetings && charObj.data.alternate_greetings[swipeId - 1]) || '');
        if (editedContent === originalContent) return;

        const saved = localStorage.getItem(STORAGE_KEY_SYNC_EDIT);
        let shouldSync = false;
        if (saved === 'always') { shouldSync = true; }
        else if (saved === 'never') { return; }
        else {
            const $confirm = $(`<div style="color:var(--smart-theme-body-color);line-height:1.6;">
                <p>检测到<b>开场白 #${swipeId}</b> 被编辑，是否同步修改到角色卡？</p>
                <p style="font-size:0.85em;opacity:0.6;">不同步的话，翻页后修改会丢失。</p>
                <label style="display:flex;align-items:center;gap:6px;margin-top:12px;cursor:pointer;font-size:0.9em;">
                    <input type="checkbox" class="gj-remember-sync"> 记住此选择
                </label>
            </div>`);
            const confirmPopup = new SillyTavern.Popup($confirm, SillyTavern.POPUP_TYPE.CONFIRM, '', { okButton: '同步到角色卡', cancelButton: '不同步' });
            const result = await confirmPopup.show();
            shouldSync = result === SillyTavern.POPUP_RESULT.AFFIRMATIVE;
            const remember = $confirm.find('.gj-remember-sync').is(':checked');
            if (remember) localStorage.setItem(STORAGE_KEY_SYNC_EDIT, shouldSync ? 'always' : 'never');
        }
        if (!shouldSync) return;

        if (swipeId === 0) {
            charObj.first_mes = editedContent;
            if (charObj.data) charObj.data.first_mes = editedContent;
            updateNativeCharacterUI(editedContent);
        } else {
            if (!charObj.data) charObj.data = {};
            if (!Array.isArray(charObj.data.alternate_greetings)) charObj.data.alternate_greetings = [];
            charObj.data.alternate_greetings[swipeId - 1] = editedContent;
        }
        await forceSave(charId);
        toastr.success(`开场白 #${swipeId} 已同步到角色卡`);
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
              desc: '切换到非首页开场白后，<br>聊天消息底部会自动出现「回到首页」按钮：' + backHomeMock + '点击即可快速切回首页(开场白 #0)。<br><span style="opacity:0.6;font-size:0.85em;">关闭管理器后可在聊天底部看到此按钮。</span>' },
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
            desc: '点击打开目录管理面板：<br><br>· <b>导入</b> — 粘贴目录文本，批量解析为标题<br>· <b>导出</b> — 根据现有标题自动生成目录<br>· <b>生成跳转正则</b> — 基础样式可直接使用或交给 AI 美化；融合美化可保留已有设计<br><br>想现在体验一下吗？',
            choices: [
                { label: '打开目录工具', cls: 'primary', action: 'openDir' },
                { label: '跳过 →', action: 'skipDir' }
            ]
        };
        const authorEnding = (n) => [
            { selector: '.gj-icon-group', title: n + '. 工具栏',
              desc: '<b>新建(+)</b> — 在末尾添加空白开场白<br><b>搜索(🔍)</b> — 打开全局查找替换面板<br><b>帮助(?)</b> — 查看功能说明或重启引导<br><br><span style="opacity:0.6;font-size:0.85em;">搜索面板会在独立窗口打开。</span>' },
            { selector: null, title: (n + 1) + '. 回到首页',
              desc: '切换到非首页开场白后，<br>聊天消息底部会自动出现「回到首页」按钮：' + backHomeMock + '点击即可快速切回首页(开场白 #0)。<br><span style="opacity:0.6;font-size:0.85em;">关闭管理器后可在聊天底部看到此按钮。</span>' },
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
            <div class="gj-help-section"><h3><i class="fa-solid fa-magnifying-glass"></i> 搜索替换</h3><p>全局搜索所有开场白中的文本，支持单条替换、批量替换，以及跳转到全屏编辑器中精确定位。</p></div>
            <hr class="gj-help-divider">
            <div class="gj-help-section"><h3><i class="fa-solid fa-house"></i> 回到首页按钮</h3><p>切换到非首页开场白后，聊天消息底部会自动出现「回到首页」按钮，点击即可快速切回首页(开场白 #0)。</p></div>
            <hr class="gj-help-divider">
            <div class="gj-help-section"><h3><i class="fa-solid fa-pen-nib"></i> 聊天编辑同步</h3><p>在聊天界面用铅笔图标编辑开场白后，会提示是否同步修改到角色卡。勾选「记住」后不再弹窗。</p><p>当前状态：<b class="gj-sync-status"></b> <a href="#" class="gj-reset-sync" style="margin-left:8px;font-size:0.9em;">重置</a></p></div>
            <hr class="gj-help-divider">
            <div style="text-align:center; margin-top:16px;"><button class="gj-custom-btn primary gj-retour-btn" style="margin:0 auto;"><i class="fa-solid fa-route"></i> 重新引导</button></div>
        </div>`);
        const syncVal = localStorage.getItem(STORAGE_KEY_SYNC_EDIT);
        $content.find('.gj-sync-status').text(syncVal === 'always' ? '始终同步' : syncVal === 'never' ? '始终不同步' : '每次询问');
        $content.find('.gj-reset-sync').on('click', (e) => {
            e.preventDefault();
            localStorage.removeItem(STORAGE_KEY_SYNC_EDIT);
            $content.find('.gj-sync-status').text('每次询问');
            toastr.success('已重置，下次编辑开场白时将重新询问');
        });
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
        const $headerWrapper = $(`<div class="gj-header-wrapper"><div class="gj-header-row-1"><div class="gj-app-title">开场白管理 <span style="font-size:0.6em; opacity:0.5; font-weight:normal;">v8.0</span></div><div class="gj-auto-close-wrapper"><label class="gj-checkbox-label"><input type="checkbox" id="gj-auto-close-checkbox" ${isAutoClose ? 'checked' : ''}>自动关闭</label></div></div><div class="gj-header-row-2"><div class="gj-sort-controls"><button type="button" class="gj-sort-toggle-btn" title="进入排序模式"><i class="fa-solid fa-sort"></i> 快速排序</button><button type="button" class="gj-sort-save-btn" title="保存排序"><i class="fa-solid fa-floppy-disk"></i> 保存</button><button type="button" class="gj-sort-cancel-btn" title="取消排序"><i class="fa-solid fa-xmark"></i> 取消</button></div><div class="gj-center-tool-container"><button type="button" class="gj-top-btn directory"><i class="fa-solid fa-list-ol"></i> 目录工具</button></div><div class="gj-icon-group"><button type="button" class="gj-icon-btn add" title="新建"><i class="fa-solid fa-plus"></i></button><button type="button" class="gj-icon-btn search" title="搜索"><i class="fa-solid fa-magnifying-glass"></i></button><button type="button" class="gj-icon-btn help" title="帮助"><i class="fa-solid fa-circle-question"></i></button></div></div></div>`);
        const $scrollArea = $('<div class="gj-scroll-area"></div>');
        const $mainFooter = $(`<div class="gj-main-footer"><button type="button" class="gj-main-close-btn"><i class="fa-solid fa-xmark"></i> 关闭窗口</button></div>`);
        $wrapper.append($headerWrapper).append($scrollArea).append($mainFooter);
        $headerWrapper.find('#gj-auto-close-checkbox').on('change', function() { localStorage.setItem(STORAGE_KEY_AUTO_CLOSE, $(this).is(':checked')); });
        const safeClose = async () => { $scrollArea.empty(); await new Promise(r => setTimeout(r, 50)); if (mainPopupInstance) mainPopupInstance.complete(SillyTavern.POPUP_RESULT.AFFIRMATIVE); else if (typeof Swal !== 'undefined') Swal.close(); };
        $mainFooter.find('.gj-main-close-btn').on('click', safeClose);

        const createCardHTML = (item, loopIndex, isCurrent, canMoveUp, canMoveDown) => {
            const hasLore = item.parsedLore && item.parsedLore.length > 0;
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
                             <button type="button" class="gj-action-btn lore ${hasLore ? 'has-data' : ''}" title="配置绑定的世界书条目"><i class="fa-solid fa-book"></i> ${hasLore ? item.parsedLore.length : ''}</button>
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
                        <button type="button" class="gj-footer-btn switch ${isCurrent ? 'active' : ''}">${isCurrent ? '<i class="fa-solid fa-check-circle"></i> 当前开场' : '<i class="fa-solid fa-rotate"></i> 设为开场'}</button>
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
                const finalContent = composeMessageContent($subInput.val(), item.parsedLore, $textarea.val(), $descInput.val());
                if (item.index === -1) { charObj.first_mes = finalContent; if (charObj.data) charObj.data.first_mes = finalContent; updateNativeCharacterUI(finalContent); } 
                else { charObj.data.alternate_greetings[item.index] = finalContent; }
                await forceSave(charId); 
                const msgZero = SillyTavern.chat[0];
                if (msgZero && msgZero.swipe_id === loopIndex) {
                    await window.TavernHelper.setChatMessages([{ message_id: 0, message: finalContent }], { refresh: 'affected' });
                }
                toastr.success("已保存"); renderList(loopIndex);
                setTimeout(injectBackHomeButton, 300);
            });

            $expandBar.on('click', () => { $textarea.toggleClass('expanded'); });
            $card.find('.gj-btn-max').on('click', (e) => { e.stopPropagation(); if (typeof Swal !== 'undefined') Swal.close(); setTimeout(() => openFullscreenEditor(item.index, item.label), 200); });
            
            $card.find('.lore').on('click', async () => {
                const newLore = await openLoreSelector(item.parsedLore);
                if (newLore !== null) {
                    const currentTitle = $subInput.val(); const currentDesc = $descInput.val(); const currentBody = $textarea.val();
                    const finalContent = composeMessageContent(currentTitle, newLore, currentBody, currentDesc);
                    if (item.index === -1) { charObj.first_mes = finalContent; if (charObj.data) charObj.data.first_mes = finalContent; updateNativeCharacterUI(finalContent); } else { charObj.data.alternate_greetings[item.index] = finalContent; }
                    await forceSave(charId); 
                    const msgZero = SillyTavern.chat[0];
                    if (msgZero && msgZero.swipe_id === loopIndex) {
                        await window.TavernHelper.setChatMessages([{ message_id: 0, message: finalContent }], { refresh: 'affected' });
                    }
                    toastr.success("世界书绑定已更新"); renderList(loopIndex);
                    setTimeout(injectBackHomeButton, 300);
                }
            });

            $card.find('.add').on('click', async () => { if (!charObj.data.alternate_greetings) charObj.data.alternate_greetings = []; charObj.data.alternate_greetings.splice(item.index + 1, 0, ""); await forceSave(charId); renderList(loopIndex + 1); toastr.success("已插入"); });
            if (!item.protected) {
                $card.find('.up').on('click', async () => { const arr = charObj.data.alternate_greetings; if (item.index === 0) { const temp = charObj.first_mes; charObj.first_mes = arr[0]; arr[0] = temp; if(charObj.data) charObj.data.first_mes = charObj.first_mes; updateNativeCharacterUI(charObj.first_mes); } else if (item.index > 0) { [arr[item.index - 1], arr[item.index]] = [arr[item.index], arr[item.index - 1]]; } await forceSave(charId); renderList(loopIndex - 1); });
                $card.find('.down').on('click', async () => { const arr = charObj.data.alternate_greetings; if (item.index === -1) { if (arr.length > 0) { const temp = charObj.first_mes; charObj.first_mes = arr[0]; arr[0] = temp; if(charObj.data) charObj.data.first_mes = charObj.first_mes; updateNativeCharacterUI(charObj.first_mes); } } else if (item.index < arr.length - 1) { [arr[item.index], arr[item.index + 1]] = [arr[item.index + 1], arr[item.index]]; } await forceSave(charId); renderList(loopIndex + 1); });
                $card.find('.del').on('click', async () => { if(await (SillyTavern.callGenericPopup || window.callGenericPopup)(`删除 ${item.label}？`, SillyTavern.POPUP_TYPE.CONFIRM)) { if (item.index === -1) { const arr = charObj.data.alternate_greetings; if (arr.length > 0) charObj.first_mes = arr.shift(); else charObj.first_mes = ""; if(charObj.data) charObj.data.first_mes = charObj.first_mes; updateNativeCharacterUI(charObj.first_mes); } else { charObj.data.alternate_greetings.splice(item.index, 1); } await forceSave(charId); toastr.success("已删除"); renderList(-1, true); } });
            }
            
            // --- 插入逻辑 (保留手动触发Lore同步) ---
            $card.find('.insert').on('click', async () => { 
                const contentToSend = window.TavernHelper.substitudeMacros(item.parsedBody);
                syncLorebookState(item.parsedLore); // 插入新消息时主动同步Lore
                await window.TavernHelper.createChatMessages([{ role: 'assistant', message: contentToSend }], { refresh: 'affected' }); 
                toastr.success("已同步剧情并插入"); 
                if(isAutoClose) safeClose(); 
            });
            
            $card.find('.switch').on('click', async () => { if ($card.hasClass('active')) return; if (await jumpToGreeting(loopIndex, item.raw)) { toastr.success(`已切换`); renderList(loopIndex); setTimeout(injectBackHomeButton, 300); if(isAutoClose) safeClose(); } });
        };

        const renderList = async (scrollToIndex = -1, maintainScroll = false) => {
            const currentScrollPos = $scrollArea.scrollTop(); if (typeof $scrollArea.sortable === 'function' && $scrollArea.data('ui-sortable')) $scrollArea.sortable('destroy'); $scrollArea.empty();
            const charObj = SillyTavern.characters[charId]; if (!charObj.data) charObj.data = {}; const alts = Array.isArray(charObj.data.alternate_greetings) ? charObj.data.alternate_greetings : [];
            const msgZero = SillyTavern.chat[0]; let currentSwipeIndex = msgZero && msgZero.swipe_id !== undefined ? msgZero.swipe_id : 0;
            const processItem = (content, index) => { const parsed = parseMessageContent(content); return { raw: content, parsedTitle: parsed.title, parsedDesc: parsed.desc, parsedLore: parsed.lore, parsedBody: parsed.body, index: index }; };
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
            if (enabled) { $headerWrapper.addClass('gj-sorting-active'); $headerWrapper.find('.add, .directory, .search, .help').prop('disabled', true).css('opacity', '0.3'); toastr.info(isMobile() ? "拖拽模式: 列表无法滑动，请拖动卡片到边缘翻页" : "已进入排序模式，拖拽完成后请点击保存"); } 
            else { $headerWrapper.removeClass('gj-sorting-active'); $headerWrapper.find('.add, .directory, .search, .help').prop('disabled', false).css('opacity', '1'); }
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
        
        // --- 修复点：移除了对 undefined 变量 item 的引用，改为直接 push ---
        $headerWrapper.find('.add').on('click', async () => { 
            const charObj = SillyTavern.characters[charId]; 
            if (!charObj.data.alternate_greetings) charObj.data.alternate_greetings = []; 
            // 修复逻辑：在末尾追加
            charObj.data.alternate_greetings.push(""); 
            await forceSave(charId); 
            // 刷新列表并滚动到底部
            renderList(charObj.data.alternate_greetings.length); 
            toastr.success("已新建开场白");
        });

        $headerWrapper.find('.directory').on('click', () => { safeClose(); setTimeout(() => openDirectoryTool(charId, () => setTimeout(showGreetingManager, 300)), 200); });
        $headerWrapper.find('.search').on('click', () => { safeClose(); setTimeout(() => openSearchAndReplaceLogic(charId), 200); });
        const tourOpts = { charId, safeClose };
        $headerWrapper.find('.help').on('click', () => { showHelpPopup(() => startTour($wrapper, tourOpts)); });
        renderList();
        if (window.SillyTavern && SillyTavern.Popup) { mainPopupInstance = new SillyTavern.Popup($wrapper, SillyTavern.POPUP_TYPE.TEXT, "", { large: true, okButton: false, cancelButton: false }); mainPopupInstance.show(); } else { (SillyTavern.callGenericPopup || window.callGenericPopup)($wrapper, 1, "", { large: true, okButton: false }); }
        if (localStorage.getItem('gj_tour_resume') || localStorage.getItem(STORAGE_KEY_TOUR) !== 'true') { setTimeout(() => startTour($wrapper, tourOpts), 600); }
    }

    if (window.SillyTavern && SillyTavern.SlashCommandParser) { SillyTavern.SlashCommandParser.addCommandObject(SillyTavern.SlashCommand.fromProps({ name: 'greetings', callback: showGreetingManager, helpString: '开场白管理器' })); SillyTavern.SlashCommandParser.addCommandObject(SillyTavern.SlashCommand.fromProps({ name: 'go-start', callback: backToStart, helpString: '回到首页' })); }
    if (typeof replaceScriptButtons === 'function' && typeof getButtonEvent === 'function' && typeof eventOn === 'function') { const BUTTON_GREETINGS = '开场白切换'; const BUTTON_BACK_START = '回到首页'; replaceScriptButtons([ { name: BUTTON_GREETINGS, visible: true }, { name: BUTTON_BACK_START, visible: true } ]); eventOn(getButtonEvent(BUTTON_GREETINGS), showGreetingManager); eventOn(getButtonEvent(BUTTON_BACK_START), backToStart); }

    (async () => {
        while (typeof window.TavernHelper === 'undefined' || typeof window.eventOn === 'undefined' || typeof window.tavern_events === 'undefined') {
            await new Promise(r => setTimeout(r, 500));
        }
        eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, (msgId) => {
            if (Number(msgId) === 0) setTimeout(injectBackHomeButton, 150);
        });
        eventOn(tavern_events.MESSAGE_SWIPED, (msgId) => {
            if (Number(msgId) === 0) setTimeout(injectBackHomeButton, 150);
        });
        eventOn(tavern_events.CHAT_CHANGED, () => {
            setTimeout(injectBackHomeButton, 300);
        });
        if (tavern_events.MESSAGE_EDITED) {
            eventOn(tavern_events.MESSAGE_EDITED, (msgIndex) => {
                if (Number(msgIndex) === 0) setTimeout(() => onGreetingEdited(0), 200);
            });
        }
    })();
})();
