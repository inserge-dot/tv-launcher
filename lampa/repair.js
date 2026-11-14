// Починка настроек bylampa/Lampa с GitHub: применяет lampa/settings.json, когда в нём выросла revision.
// Подключается как обычный плагин по адресу этого файла. Ничего, кроме Lampa.Storage, не трогает.
(function () {
    'use strict';
    if (window.__tv_repair) return;
    window.__tv_repair = true;

    var self = document.currentScript && document.currentScript.src;
    var base = self ? self.replace(/[^\/]*$/, '') : 'https://inserge-dot.github.io/tv-launcher/lampa/';

    function apply(cfg) {
        var done = parseInt(Lampa.Storage.get('repair_revision', '0'), 10) || 0;
        if (!cfg || !(cfg.revision > done) || !cfg.storage) return;
        Object.keys(cfg.storage).forEach(function (key) {
            Lampa.Storage.set(key, cfg.storage[key]);
        });
        Lampa.Storage.set('repair_revision', String(cfg.revision));
        console.log('Repair', 'applied revision', cfg.revision);
        if (cfg.notice && Lampa.Noty) Lampa.Noty.show(cfg.notice);
    }

    function run() {
        fetch(base + 'settings.json?t=' + Date.now())
            .then(function (r) { return r.json(); })
            .then(apply)
            .catch(function (e) { console.log('Repair', 'failed', e && e.message); });
    }

    if (window.appready) run();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') run(); });
})();
