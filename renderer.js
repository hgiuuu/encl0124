
// ServiceWorker(sw.js)を使用してしまった場合に登録削除するコード
/*
navigator.serviceWorker.getRegistrations().then(function(registrations) {
    // 登録されているworkerを全て削除する
    for(let registration of registrations) {
        registration.unregister();
    }
});
caches.keys().then(function(keys) {
    var promises = [];
    // キャッシュストレージを全て削除する
    keys.forEach(function(cacheName) {
        if (cacheName) {
            promises.push(caches.delete(cacheName));
        }
    });
});
*/
window.onload = () => {

    window.electronAPI.onGetAction((_event, arg) => {

        console.log(arg);
        //window.location.href = value[0];
        
    });
}