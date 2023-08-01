function removeUser (email: string) {
    fetch('/api/remove-user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        cache: 'no-cache',
        body: JSON.stringify({
            email: email,
        })
    }).then((res: any) => {
        if (res.status === 200) {
            const list = document.getElementById('info-panel');
            if (list) {
                const items = list.getElementsByClassName('list-item-content');
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    const _email = item.getElementsByTagName('p')[0].innerHTML;
                    if (email === _email) {
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