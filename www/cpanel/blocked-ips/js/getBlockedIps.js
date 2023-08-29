(function() {
  const panel = this.window.document.getElementById("info-panel")
  if (panel) {
    fetch("/api/blocked-ips", {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
      cache: "no-cache"
    }).then(res => {
      if (res.status === 200) {
        res.json().then(data => {
          if (data.length === 0) {
            panel.innerHTML += `<div class="list-item"><div class="list-item-title"></div><div class="list-item-content"><p>No blocked ips found</p></div></div>`
          } else {
            for (let i = 0; i < data.length; i++) {
              if (data[i] !== "") {
                panel.innerHTML += `<div class="list-item"><div class="list-item-title"></div><div class="list-item-content"><p>${data[i]}</p><div class="list-item-remove" onclick="removeIp('${data[i]}');">✕</div></div></div>`
              }
            }
          }
        })
      } else {
        panel.innerHTML += `<div class="list-item"><div class="list-item-title"></div><div class="list-item-content"><p>Failed to get blocked ips</p></div></div>`
      }
    })
  }
})()