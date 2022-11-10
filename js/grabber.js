const image_regex = /https:\/\/downloads\.fanbox\.cc\/images\/post\/\d+\/.+\.(png|jpg|jpeg)/g

function grab() {
  const title = $('article h1').first().text()

  const image_urls = []

  $('a')
    .filter(function() {
      return !!this.href.match(image_regex)
    })
    .each(function() {
      image_urls.push(this.href)
    })

  if (image_urls.length === 0) {
    alert('Nothing to grab!')
    return
  }

  const digits = Math.floor(Math.log10(image_urls.length - 1)) + 1

  const promises = []
  for (const [i, url] of image_urls.entries()) {
    const filename = `${i.toString().padStart(digits, '0')}.png`
    promises.push(new Promise((resolve, reject) => {
      fetch(url)
        .then(response => response.arrayBuffer())
        .catch(err => reject(err))
        .then(arrayBuffer => resolve([filename, arrayBuffer]))
        .catch(err => reject(err))
    }))
  }
  Promise.all(promises)
    .then(results => {
      const zip = new JSZip()
      for (result of results) {
        const filename = result[0]
        const arrayBuffer = result[1]
        zip.file(filename, arrayBuffer, {binary: true})
      }
      zip.generateAsync({type: 'blob'})
        .then(content => saveAs(content, `${title}.zip`))
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
