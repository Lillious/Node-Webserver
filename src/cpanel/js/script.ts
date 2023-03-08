(function() {
    const logout = document.getElementById('logout');
    if (logout) {
        logout.addEventListener('click', () => {
            fetch('/logout', {
                method: 'POST',
            })
            .then((res: any) => {
                if (res.status === 200) {
                    window.location.href = '/login';
                }
            })
            .catch((err: any) => {
                console.error(err);
            });
        });
    }

    const profile = document.getElementById('profile');
    const card = document.getElementById('card');
    const arrow = document.getElementById('arrow');
    if (profile) {
        profile.addEventListener('click', () => {
            if (card && card.style.display === 'none' || card && card.style.display === '') {
                if (arrow) arrow.innerHTML = '&#x25B2;';
                if (card) card.style.display = 'block';
            } else {
                if (card) card.style.display = 'none';
                if (arrow) arrow.innerHTML = '&#x25BC;';
            }
        });
    }

    // Check if body was clicked
    document.addEventListener('click', (event) => {
        const EventID = (event.target as Element).id;
        // Check if card is open
        if (card && card.style.display === 'block') {
            // Check if the body was clicked
            if (event && EventID !== 'profile' && EventID !== 'arrow' && EventID !== 'card' && EventID !== 'display_name' && EventID !== 'picture') {
                // Close the card
                card.style.display = 'none';
                if (arrow) arrow.innerHTML = '&#x25BC;';
            }
        }
    });

    const display_name = document.getElementById('display_name');
    if (display_name) {
        fetch('/api/@me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then((res: any) => {
            console.log(res);
            if (res.status === 200) {
                res.json().then((data: any) => {
                    display_name.innerHTML = data.email;
                });
            }
        })
        .catch((err: any) => {
            console.error(err);
        });
    }
    
    const serverinfo = document.getElementById('server-info');
    const ip = document.getElementById('server-ip-text');
    const directory = document.getElementById('home-directory-text');
    const domain = document.getElementById('primary-domain-text');
    if (serverinfo) {
        fetch('/api/serverinfo', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then((res: any) => {
            console.log(res);
            if (res.status === 200) {
                res.json().then((data: any) => {
                    if (ip) ip.innerHTML = data.ip;
                    if (directory) directory.innerHTML = `${data.directory}/`;
                    if (domain) domain.innerHTML = `${data.protocol}://${data.domain}/`;
                });
            }
        })
        .catch((err: any) => {
            if (ip) ip.innerHTML = 'Error';
            if (directory) directory.innerHTML = 'Error';
            if (domain) domain.innerHTML = 'Error';
            console.error(err);
        });
    }

    const fileSize = document.getElementById('file-size');
    if (fileSize) {
        fetch('/api/fileusage', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then((res: any) => {
            if (res.status === 200) {
                res.json().then((data: any) => {
                    const total = data.total;
                    const free = data.free;
                    const used = total - free;
                    const percentage = Math.round((used / total) * 100);
                    const bar = document.getElementById('file-size-bar');
                    const _used = Math.round((used/1e+9) * 10) / 10
                    const _total = Math.round((total/1e+9) * 10) / 10
                    fileSize.innerHTML = `${_used} GB / ${_total} GB (${percentage}%)`;
                    if (bar) bar.style.width = `${percentage}%`;
                });
            }
        })
        .catch((err: any) => {
            if (fileSize) fileSize.innerHTML = 'Error';
            console.error(err);
        });
    }
})();