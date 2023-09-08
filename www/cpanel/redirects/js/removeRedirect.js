function removeRedirect(url) {
    const split = url.split(" -> ")
    fetch("/api/remove-redirect", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            url: split[0]
        }),
        cache: "no-cache"
    }).then(res => {
        if (res.status !== 200) return;
        const list = this.window.document.getElementById("info-panel")
        if (list) {
          const items = list.getElementsByClassName("list-item-content")
          for (let i = 0; i < items.length; i++) {
            const item = items[i]
            const _url = item.getElementsByTagName("p")[0].innerHTML.replace(/-&gt;/g, "->")
            if (url === _url) {
                if (item.parentElement) {
                  item.parentElement.remove()
                  return
                }
              }
          }
        }
    })
}