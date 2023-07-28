(function() {
    const users = document.getElementById('info-panel');
    if (users) {
        fetch('/api/users', {
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
                        users.innerHTML = '<div class="list-item-content"><p>No users found</p></div>';
                    } else {
                        for (let i = 0; i < data.length; i++) {
                            const user = data[i];
                            users.innerHTML += `<div class="list-item"><div class="list-item-title"><p></p></div><div class="list-item-content"><p>${user.email}</p></div></div>`;
                        }
                    }
                });
            }
        });
    }
})();