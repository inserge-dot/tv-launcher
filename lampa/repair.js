// Починка настроек bylampa/Lampa с GitHub: применяет lampa/settings.json, когда в нём выросла revision.
// Подключается как обычный плагин по адресу этого файла. Ничего, кроме Lampa.Storage, не трогает.
(function () {
    'use strict';
    if (window.__tv_repair) return;
    window.__tv_repair = true;

    var self = document.currentScript && document.currentScript.src;
    var base = self ? self.replace(/[^\/]*$/, '') : 'https://inserge-dot.github.io/tv-launcher/lampa/';

    // plugins: {add: [{url, name, author}], remove: [url]} — правит список плагинов; true, если список изменился.
    function plugins(cfg) {
        var list = Lampa.Storage.get('plugins', '[]');
        if (!Array.isArray(list)) list = [];
        var before = JSON.stringify(list);
        (cfg.remove || []).forEach(function (url) {
            list = list.filter(function (p) { return p.url !== url; });
        });
        (cfg.add || []).forEach(function (add) {
            var have = list.filter(function (p) { return p.url === add.url; })[0];
            if (have) have.status = 1;
            else list.push({ author: add.author || '', url: add.url, name: add.name || add.url, status: 1 });
        });
        if (JSON.stringify(list) === before) return false;
        Lampa.Storage.set('plugins', list);
        return true;
    }

    function apply(cfg) {
        var done = parseInt(Lampa.Storage.get('repair_revision', '0'), 10) || 0;
        if (!cfg || !(cfg.revision > done) || !cfg.storage) return;
        Object.keys(cfg.storage).forEach(function (key) {
            Lampa.Storage.set(key, cfg.storage[key]);
        });
        var reload = plugins(cfg.plugins || {});
        Lampa.Storage.set('repair_revision', String(cfg.revision));
        console.log('Repair', 'applied revision', cfg.revision);
        if (cfg.notice && Lampa.Noty) Lampa.Noty.show(cfg.notice);
        // Новый плагин заработает только после перезагрузки страницы; revision уже записана — повторов не будет.
        if (reload) setTimeout(function () { location.reload(); }, 1500);
    }

    // tmdb: {api, image} — адреса каталога TMDB (обход блокировки): действуют при каждом запуске,
    // последний ответ хранится в настройках, чтобы каталог открывался и когда GitHub недоступен.
    function tmdb(cfg) {
        if (!cfg || !Lampa.TMDB) return;
        if (cfg.api) Lampa.TMDB.api = function (url) { return cfg.api + url; };
        if (cfg.image) Lampa.TMDB.image = function (url) { return cfg.image + url; };
    }

    try { tmdb(JSON.parse(localStorage.getItem('repair_tmdb') || 'null')); } catch (e) {}

    function run() {
        fetch(base + 'settings.json?t=' + Date.now())
            .then(function (r) { return r.json(); })
            .then(function (cfg) {
                var was = localStorage.getItem('repair_tmdb') || 'null';
                var now = JSON.stringify(cfg.tmdb || null);
                if (now !== was) {
                    localStorage.setItem('repair_tmdb', now);
                    if (cfg.tmdb) tmdb(cfg.tmdb); else setTimeout(function () { location.reload(); }, 1500);
                }
                return cfg;
            })
            .then(apply)
            .catch(function (e) { console.log('Repair', 'failed', e && e.message); });
    }

    if (window.appready) run();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') run(); });
})();
