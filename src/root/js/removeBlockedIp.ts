function removeIp (ip: string) {
    fetch('/api/remove-blocked-ip', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        cache: 'no-cache',
        body: JSON.stringify({
            ip: ip,
        })
    }).then((res: any) => {
        if (res.status === 200) {
            const list = document.getElementById('info-panel');
            if (list) {
                const items = list.getElementsByClassName('list-item-content');
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    const _ip = item.getElementsByTagName('p')[0].innerHTML;
                    if (ip === _ip) {
                        if (item.parentElement) {
                            item.parentElement.remove();
                            return;
                        }
                    }
                }
            }
        }
    });
}