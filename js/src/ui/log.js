function rawWrite( err, msg ) {
  let display = document.getElementById('message')

    display.textContent = msg
    display.classList.toggle("error",err)
}

function error( str ) {
  rawWrite.call(this, true, str)
}

function message( str ) {
  rawWrite.call(this, false, str)
}

module.exports = {
  error,
  message
}
