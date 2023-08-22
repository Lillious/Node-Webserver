function removeFile (file: string) {
    fetch('/api/remove-file', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        cache: 'no-cache',
        body: JSON.stringify({
            file: file
        })
    }).then((res: any) => {
        if (res.status === 200) {
            const list = document.getElementById('info-panel');
            if (list) {
                const items = list.getElementsByClassName('list-item-content');
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    const _file = item.getElementsByTagName('p')[0].innerHTML;
                    if (file === _file) {
                        if (item.parentElement) {
                            item.parentElement.remove();
                            return;
                        }
                    }
                }
            }
        }

        if (res.status === 201) {
            // Files directory is empty, reload page to show no files
            window.location.reload();
        } else if (res.status === 404) {
            window.location.reload();
        }
    });
}