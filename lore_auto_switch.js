// ==UserScript==
// @name        ST - 动态开场白世界书控制器 (修复版)
// @description 自动识别 <!--lore:uid--> 标签并开关世界书，修复UID0问题并减少延迟
// @match       */*
// @grant       none
// @version     3.4
// @author      Claude & User
// ==/UserScript==

(function () {
    'use strict';

    // 宽松匹配标签，支持 <!--lore:19--> 或 <!--- lore: 0, 19 --->
    const TAG_REGEX = /<!--\-?\s*lore\s*:\s*([\d,\s]+)\s*\-?-->/i;

    let debounceTimer = null;
    let lastStateFingerprint = ""; 
    let lastSyncedSwipeId = null; 

    // 从文本提取UID
    function extractUids(text) {
        if (!text) return [];
        const match = text.match(TAG_REGEX);
        if (match && match[1]) {
            return match[1].split(',')
                .map(s => Number(s.trim()))
                // ★修复点1：删除了 && n !== 0，允许 uid 0 通过
                .filter(n => !isNaN(n)); 
        }
        return [];
    }

    async function syncLorebook() {
        if (typeof TavernHelper === 'undefined') return;

        const lorebookName = TavernHelper.getCurrentCharPrimaryLorebook();
        if (!lorebookName) return;

        try {
            // 获取开场白层级（id=0）的所有信息
            const messages = await TavernHelper.getChatMessages(0, { include_swipes: true });
            if (!messages || messages.length === 0) return;

            const msg0 = messages[0];
            let currentSwipeId = msg0.swipe_id || 0;
            let currentContent = msg0.mes; 

            // --- 原始内容同步逻辑 (保持不变，仅做微调) ---
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
            
            // 确保读取到正确的 swipe 内容
            if (msg0.swipes && msg0.swipes.length > currentSwipeId) {
                currentContent = msg0.swipes[currentSwipeId];
            }

            // --- 世界书控制逻辑 ---
            
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

            // 获取世界书条目
            // 注意：API调用是耗时操作，指纹检查放在前面是很好的做法
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
                
                // 简化 Toastr 提示，避免刷屏增加视觉上的“卡顿感”
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

    // ★修复点2：改进防抖逻辑
    // immediate=true 时几乎立即执行(用于点击)，否则等待(用于加载)
    function triggerSync(immediate = false) {
        if (debounceTimer) clearTimeout(debounceTimer);
        const delay = immediate ? 10 : 300; // 这里的 10ms 只是为了让当前的 JS 调用栈清空
        debounceTimer = setTimeout(syncLorebook, delay);
    }

    function init() {
        // 监听手动切书 - 立即触发
        eventOn(tavern_events.MESSAGE_SWIPED, (msgId) => {
            if (Number(msgId) === 0) triggerSync(true); // true = 立即执行
        });

        // 监听换卡/换聊天 - 此时需要稍作等待，确保数据载入
        eventOn(tavern_events.CHAT_CHANGED, () => {
            lastStateFingerprint = ""; 
            lastSyncedSwipeId = null;
            triggerSync(false); // false = 等待 300ms
        });

        // 监听渲染 - 通常不需要太长的延迟，但比 swipe 稍微保守一点
        eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, (msgId) => {
            if (Number(msgId) === 0) triggerSync(true);
        });
        
        console.log('ST-动态世界书控制器(修复版 v3.4) 已加载');
    }

    (async () => {
        while (typeof window.TavernHelper === 'undefined' || typeof window.eventOn === 'undefined') {
            await new Promise(r => setTimeout(r, 500));
        }
        init();
    })();

})();
