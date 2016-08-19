// part of a promise chain
function render( Resource ){
  let imgs = Resource.images,
    ul = document.getElementById("image_list"),
    frag = document.createDocumentFragment(),
    imgCount = 0;

  ul.innerHTML = "";
  imgs.forEach(function( val, key ){
    let li = document.createElement('li');

    li.textContent = `Image ${++imgCount}`
    li.setAttribute('node',key)

    frag.appendChild(li)
  })

  ul.appendChild(frag)

  return Resource
}

module.exports = {
  render
}
