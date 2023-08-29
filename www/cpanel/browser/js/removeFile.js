function removeFile(file) {
    fetch("/api/remove-file", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      cache: "no-cache",
      body: JSON.stringify({
        file: file
      })
    }).then(res => {
      if (res.status === 200) {
        const list = this.window.document.getElementById("info-panel")
        if (list) {
          const items = list.getElementsByClassName("list-item-content")
          for (let i = 0; i < items.length; i++) {
            const item = items[i]
            const _file = item.getElementsByTagName("p")[0].innerHTML
            if (file === _file) {
              if (item.parentElement) {
                item.parentElement.remove()
                return
              }
            }
          }
        }
      }
  
      if (res.status === 201) {
        // Files directory is empty, reload page to show no files
        this.window.location.reload()
      } else if (res.status === 404) {
        this.window.location.reload()
      }
    })
  }
  