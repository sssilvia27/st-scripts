// index.js - 模块加载器

const repoBase = 'https://cdn.jsdelivr.net/gh/sssilvia27/st-scripts@main';

// 定义要加载的模块列表
const scripts = [
    { name: '开场白管理器', file: 'greeting.js' },
    { name: '世界书自动开关', file: 'lore_auto_switch.js' }
];

// 并行加载所有脚本
Promise.all(scripts.map(script => {
    return import(`${repoBase}/${script.file}?t=${Date.now()}`)
        .then(() => {
            console.log(`[ST-Scripts] ${script.name} 加载成功`);
        })
        .catch(err => {
            console.error(`[ST-Scripts] ${script.name} 加载失败:`, err);
            if (typeof toastr !== 'undefined') {
                toastr.error(`${script.name} 加载失败，请检查网络`);
            }
        });
})).then(() => {
    console.log('[ST-Scripts] 所有模块处理完毕');
});
