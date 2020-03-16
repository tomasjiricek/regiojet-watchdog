self.addEventListener('push', (event) => {
    console.log(`[Service Worker] Push received. Data: "${event.data.text()}"`);

    const options = {
        body: event.data.text(),
        icon: '/static/images/icons/icon-256.png',
    };

    event.waitUntil(
        self.registration.showNotification('RegioJet hlídač', options)
    );
});
