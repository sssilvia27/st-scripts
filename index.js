const repoBase = 'https://raw.githack.com/sssilvia27/st-scripts/main';

const scripts =[
    { name: '开场白管理器(含世界书联动)', file: 'greeting_lore.js' }
];

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
