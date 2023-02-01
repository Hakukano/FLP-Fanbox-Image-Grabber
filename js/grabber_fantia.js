const urlRegex = /https:\/\/fantia\.jp\/posts\/(\d+)/
const thumbnailsRegex = /https:\/\/cc\.fantia\.jp\/uploads\/post_content_photo\/file\/(\d+)\//

function grab() {
  const userAgent = window.navigator.userAgent

  const postId = window.location.href.match(urlRegex)[1]
  const postTitle = $('h1.post-title').first().text()

  const queryContentTitle = $('h2.post-content-title')

  const contentsLen = queryContentTitle.length

  const zip = new JSZip()
  const promises = []

  for (let i = 0; i < contentsLen; ++i) {
    const title = queryContentTitle.eq(i).text()
    const thumbnailIds = $('.image-thumbnails').eq(i).find('img').map(function() { return this.src.match(thumbnailsRegex)[1]}).get()
    if (thumbnailIds.length === 0) {
      continue
    }
    const digits = Math.floor(Math.log10(thumbnailIds.length - 1)) + 1
    const promisesContent = []
    for (const [i, id] of thumbnailIds.entries()) {
      // FIXME file extension
      const filename = `${i.toString().padStart(digits, '0')}.png`
      promisesContent.push(new Promise((resolve, reject) => {
        fetch(`https://fantia.jp/posts/${postId}/post_content_photo/${id}`, {
          'credentials': 'include',
          'headers': {
            'User-Agent': `${userAgent}`,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
            'Alt-Used': 'fantia.jp',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'If-None-Match': 'W/"a2054b7dbd47c550c5ebb74be05c4bfe"'
          },
          'method': 'GET',
          'mode': 'cors'
        })
          .then(res => res.text())
          .catch(err => reject(err))
          .then(res => {
            const tmp = $('<div></div>')
            tmp.html(res)
            const url = tmp.find('img').attr('src')
            return fetch(url)
          })
          .catch(err => reject(err))
          .then(res => res.arrayBuffer())
          .catch(err => reject(err))
          .then(ab => resolve([filename, ab]))
          .catch(err => reject(err))
      }))
    }
    promises.push(Promise.all(promisesContent)
      .then(results => {
        for (const result of results) {
          const filename = result[0]
          const ab = result[1]
          zip.folder(title).file(filename, ab, {binary: true})
        }
      })
      .catch(err => alert(err.toString()))
    )
  }

  Promise.all(promises)
    .then(_ => {
      zip.generateAsync({type: 'blob'})
        .then(content => saveAs(content, `${postTitle}.zip`))
        .catch(err => alert(err.toString()))
    })
    .catch(err => alert(err.toString()))
}

let btn = document.createElement('button')
btn.innerHTML = 'Grab!'
btn.style.position = 'fixed'
btn.style.zIndex = '999'
btn.addEventListener('click', grab)
document.body.prepend(btn)
