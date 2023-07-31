(function() {
    const panel = document.getElementById('info-panel');
    if (panel) {
        fetch('/api/security-definitions', {
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
                        panel.innerHTML += `<div class="list-item"><div class="list-item-title"></div><div class="list-item-content"><p>No security definitions found</p></div></div>`;
                    } else {
                        for (let i = 0; i < data.length; i++) {
                            if (data[i] !== '') {
                                panel.innerHTML += `<div class="list-item"><div class="list-item-title"></div><div class="list-item-content"><p>${data[i]}</p></div></div>`;
                            }
                        }
                    }
                });
            } else {
                panel.innerHTML += `<div class="list-item"><div class="list-item-title"></div><div class="list-item-content"><p>Failed to get security definitions</p></div></div>`;
            }
        });
    }
})();
