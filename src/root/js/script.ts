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

    const settings = document.getElementById('settings');
    if (settings) {
        settings.addEventListener('click', () => {
            window.location.href = '/cpanel/settings.html';
        });
    }

    const cpanel = document.getElementById('cpanel');
    if (cpanel) {
        cpanel.addEventListener('click', () => {
            window.location.href = '/cpanel';
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
})();