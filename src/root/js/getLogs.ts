(function() {
    const panel = document.getElementById('info-panel');
    if (panel) {
        fetch('/api/logs', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-cache',
        })
        .then((res: any) => {
            if (res.status === 200) {
                res.json().then((data: any) => {
                    if (data.length === 0) {
                        panel.innerHTML += `<div class="list-item"><div class="list-item-title"></div><div class="list-item-content"><p>No logs found</p></div></div>`;
                    } else {
                        for (let i = 0; i < data.length; i++) {
                            const log = data[i];
                            // Check if log is an empty \n
                            if (log !== '') {
                                panel.innerHTML += `<div class="list-item"><div class="list-item-title"></div><div class="list-item-content"><p>${log}</p></div></div>`;
                            }
                        }
                    }
                });
            }
        });
    }
})();