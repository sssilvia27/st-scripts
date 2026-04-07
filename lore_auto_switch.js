// ==UserScript==
// @name        ST - 动态开场白世界书控制器
// @description 自动识别 <!--lore:uid--> 标签并开关世界书，修复UID0问题并减少延迟
// @match       */*
// @grant       none
// @version     3.4
// @author      Claude & User
// ==/UserScript==

(function () {
    'use strict';

    const TAG_REGEX = /<!--\-?\s*lore\s*:\s*([\d,\s]+)\s*\-?-->/i;

    let debounceTimer = null;
    let lastStateFingerprint = ""; 
    let lastSyncedSwipeId = null; 

    function extractUids(text) {
        if (!text) return [];
        const match = text.match(TAG_REGEX);
        if (match && match[1]) {
            return match[1].split(',')
                .map(s => Number(s.trim()))
                .filter(n => !isNaN(n)); 
        }
        return [];
    }

    async function syncLorebook() {
        if (typeof TavernHelper === 'undefined') return;

        const lorebookName = TavernHelper.getCurrentCharPrimaryLorebook();
        if (!lorebookName) return;

        try {
            const messages = await TavernHelper.getChatMessages(0, { include_swipes: true });
            if (!messages || messages.length === 0) return;

            const msg0 = messages[0];
            let currentSwipeId = msg0.swipe_id || 0;
            let currentContent = msg0.mes; 

            if (lastSyncedSwipeId !== currentSwipeId) {
                lastSyncedSwipeId = currentSwipeId;
                const charData = TavernHelper.getCharData('current');
                if (charData) {
                    let rawSource = "";
                    if (currentSwipeId === 0) {
                        rawSource = charData.first_mes;
                    } else if (charData.data && Array.isArray(charData.data.alternate_greetings)) {
                        rawSource = charData.data.alternate_greetings[currentSwipeId - 1];
                    }

                    if (rawSource) {
                        const cleanMsg = (msg0.mes || "").trim();
                        const cleanSource = rawSource.trim();

                        if (cleanMsg !== cleanSource) {
                            console.log(`[LoreCtrl] 检测到开场白内容变更 (Swipe ${currentSwipeId})，同步中...`);
                            await TavernHelper.setChatMessages([{
                                message_id: 0,
                                message: rawSource
                            }], { refresh: 'affected' });
                            return; 
                        }
                    }
                }
            }
            
            if (msg0.swipes && msg0.swipes.length > currentSwipeId) {
                currentContent = msg0.swipes[currentSwipeId];
            }

            
            const allSwipesContent = msg0.swipes || [msg0.mes];
            const managedUidSet = new Set();
            allSwipesContent.forEach(txt => {
                extractUids(txt).forEach(uid => managedUidSet.add(uid));
            });

            if (managedUidSet.size === 0) return; 

            const activeUids = extractUids(currentContent);
            const activeUidSet = new Set(activeUids);

            const currentStateFingerprint = `${currentSwipeId}:${activeUids.sort().join(',')}`;
            if (currentStateFingerprint === lastStateFingerprint) return;
            lastStateFingerprint = currentStateFingerprint;

            const entries = await TavernHelper.getLorebookEntries(lorebookName);
            if (!entries) return;

            const entriesToUpdate = [];
            const actionLogs = [];
            
            managedUidSet.forEach(uid => {
                const entry = entries.find(e => Number(e.uid) === uid);
                if (entry) {
                    const shouldEnable = activeUidSet.has(uid);
                    if (entry.enabled !== shouldEnable) {
                        entriesToUpdate.push({ uid: uid, enabled: shouldEnable });
                        const entryName = entry.comment || (entry.key && entry.key.length ? entry.key[0] : `UID:${uid}`);
                        actionLogs.push(`${shouldEnable ? '✅' : '🚫'} ${entryName}`);
                    }
                }
            });

            if (entriesToUpdate.length > 0) {
                await TavernHelper.setLorebookEntries(lorebookName, entriesToUpdate);
                
                if (actionLogs.length > 0) {
                    const msg = actionLogs.length > 3 
                        ? `已同步 ${actionLogs.length} 个世界书状态` 
                        : actionLogs.join('  ');
                    toastr.info(msg, '世界书同步', { timeOut: 2000, preventDuplicates: true });
                }
                console.log(`[LoreCtrl] 更新: ${actionLogs.join(', ')}`);
            }

        } catch (err) {
            console.error("[LoreCtrl] Error:", err);
        }
    }

    function triggerSync(immediate = false) {
        if (debounceTimer) clearTimeout(debounceTimer);
        const delay = immediate ? 10 : 300; 
        debounceTimer = setTimeout(syncLorebook, delay);
    }

    function init() {
        eventOn(tavern_events.MESSAGE_SWIPED, (msgId) => {
            if (Number(msgId) === 0) triggerSync(true); 
        });


        eventOn(tavern_events.CHAT_CHANGED, () => {
            lastStateFingerprint = ""; 
            lastSyncedSwipeId = null;
            triggerSync(false);
        });

        eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, (msgId) => {
            if (Number(msgId) === 0) triggerSync(true);
        });
        
        console.log('ST-动态世界书控制器已加载');
    }

    (async () => {
        while (typeof window.TavernHelper === 'undefined' || typeof window.eventOn === 'undefined') {
            await new Promise(r => setTimeout(r, 500));
        }
        init();
    })();

})();
