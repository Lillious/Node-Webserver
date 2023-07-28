(function() {
    const register = document.getElementById('register');
    if (register) {
        fetch('/register', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'force-cache',
        })
        .then((res: any) => {
            if (res.status === 200) {
                register.style.display = 'block';
            }
        })
        .catch((err: any) => {
            console.error(err);
        });
    }

    const maintenance = document.getElementById('banner');
    const maintenanceButton = document.getElementById('toggle-maintenance-button');
    const maintenanceMode = document.getElementById('maintenance-mode');
    const maintenanceModeText = document.getElementById('toggle-maintenance');
    if (maintenance || maintenanceModeText) {
        fetch('/maintenance', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-cache',
        })
        .then((res: any) => {
            if (res.status === 200) {
                res.json().then((data: any) => {
                    if (data === true) {
                        if (maintenance) maintenance.style.display = 'flex';
                        if (maintenance) maintenance.innerHTML = 'Website is currently under maintenance. Performace may be affected.';
                        if (maintenanceButton) {
                            maintenanceButton.textContent = 'DISABLE';
                            maintenanceButton.style.color = 'tomato';
                            maintenanceButton.style.border = '1px solid tomato';
                            maintenanceButton.addEventListener('mouseover', () => {
                                maintenanceButton.style.backgroundColor = 'tomato';
                                maintenanceButton.style.color = '#fff';
                            });
                            maintenanceButton.addEventListener('mouseout', () => {
                                maintenanceButton.style.backgroundColor = 'transparent';
                                maintenanceButton.style.color = 'tomato';
                            });
                        }
                        if (maintenanceMode) (<HTMLInputElement>maintenanceMode as HTMLInputElement).value = 'false';
                    } else {
                        if (maintenance) maintenance.style.display = 'none';
                        if (maintenanceButton) maintenanceButton.textContent = 'ENABLE';
                        if (maintenanceMode) (<HTMLInputElement>maintenanceMode as HTMLInputElement).value = 'true';
                    }
                });
            }
        })
        .catch((err: any) => {
            if (err) {
                console.error(err);
            }
        });
    }
})();