'use strict';

var Promise = require('promise');

var app = (function(app){

	app.activeFile = null;
	app.activeImg = null; 		//will we need this...

	app.checkTable = require('./src/check-filetable.js')
	app.uploadFile = require('./src/upload-res-file.js')
	app.parseRes = require('./src/parse-resource.js')
	//switch to an img-util.js that has everthing... add/convert/find
	app.img = require('./src/img/img-utils.js')
	app.log = require('./src/ui/log.js')
	app.imgList = require('./src/ui/image-list.js')
	app.hex = require('./src/utils/hex-utils.js')

	//app.writeToResouce
	//app.download(ModifiedResource|Image Atlas)

	return app

})(app || {})


window.onload = function(){
	let fileUpload = document.getElementById('file_uploader'),
		ul = document.getElementById("image_list")

	fileUpload.addEventListener("change",function(e){
		let file = e.target.files[0],
			fileInfo = app.checkTable(file.name);

		if ( !fileInfo ){
			app.log.error("File Not Found! Upload a zoinkity-named resource file!");
			return false
		}

		app.log.message(`File Found! Uploading ${file.name}:
						0x${file.size.toString(16).toUpperCase()} Bytes |
						Last Modified: ${new Date(file.lastModified).toDateString()}`)

		app.uploadFile(file, "readAsArrayBuffer", fileInfo)
			.then(app.parseRes)
			.then(app.img.find)
			.then(app.imgList.render)
			.then( (ResourceFile) => {
				app.activeFile = ResourceFile;
				console.log(ResourceFile)
			})
			.catch(function(err){console.log(err)})

		})

		ul.addEventListener("click", function(e){
			let target = e.target,
				dv = app.activeFile.dv

			if(target.tagName !== "LI" || !dv) return false

			let activeLI = document.getElementsByClassName("selected")

			for ( let i = 0, len = activeLI.length; i < len; i++ ){
				activeLI[i].classList.remove('selected')
			}

			target.classList.add('selected');


			let nodeOffset = Number.parseInt(target.getAttribute("node")),
				img = app.img.extract(app.activeFile, nodeOffset)

			console.log(img)

			app.activeImg = img

			//"draw image"
			const newCanvas = document.createElement('canvas'),
						newCtx = newCanvas.getContext('2d'),
						container = document.getElementById('canvas_container');

			//set h/w of new canvas
			newCanvas.height = img.height
			newCanvas.width	 = img.width;

			//draw image to canvas
			newCtx.putImageData( img.getImageData(),0,0 )

			//get and format footer data
			const footerHex = document.createElement('div'),
						footP = document.createElement('p');

			footerHex.classList.add('hex')
			footerHex.style.display = 'table'

			footerHex.innerHTML = 	app.hex.format(img.footer.dv, 4)

			footP.textContent = "Footer:"

			//clear
			container.innerHTML = '';

			//put canvas on screen
			container.appendChild(newCanvas)
			//put footer on screen
			container.appendChild(footP)
			container.appendChild(footerHex)

			let bufferDiv = document.createElement('div');
				bufferDiv.classList.add('hex')
				bufferDiv.style.display = 'table'

			bufferDiv.innerHTML = app.hex.format(img.getProcessedBuffer().dv, 4)
			container.appendChild(bufferDiv)

			console.log('Processed N64 Buffer', new Uint8Array(img.getProcessedBuffer().buffer))
			console.log('Converted Buffer',img.getRGBABuffer())

			/*
				Temp writing code; repurpose for later...

			const frag = document.createDocumentFragment();
			img.chunks.reduce( function(frag, chunk, i){
				let chunkData = document.createElement('div'),
					container = document.createElement('p')

				container.textContent = `Chunk ${i}
					|  Size: 0x${(chunk.height*chunk.rowWidth*img.bpp/8).toString(16).toUpperCase()} Bytes
					|  32bit RGBA Size: 0x${(chunk.height*chunk.rowWidth*4).toString(16).toUpperCase()}`

				chunkData.innerHTML = formatHexData(chunk.dv, 4)
				chunkData.classList.add('hex')
				chunkData.style.display = "table"

				container.appendChild(chunkData)
				frag.appendChild(container)

				return frag
			}, frag)


			let viewDiv = document.getElementById('viewer'),
				hexDiv = document.createElement('div'),
				footP = document.createElement('p')

			hexDiv.classList.add('hex')
			hexDiv.style.display = 'table'

			hexDiv.innerHTML = 	formatHexData(img.footer.dv, 4)

			footP.textContent = "Footer:"

			viewDiv.innerHTML = '';
			viewDiv.appendChild(frag)
			viewDiv.appendChild(footP)
			viewDiv.appendChild(hexDiv)

			let bufferDiv = document.createElement('div')
				bufferDiv.classList.add('hex')
				bufferDiv.style.display = 'table'

			//bufferDiv.innerHTML = formatHexData(img.getRGBABuffer().dv, 4)

			//viewDiv.appendChild(bufferDiv)

			//console.log(app.activeFile)
			//console.log(img.getRGBABuffer())
			*/
		});

}
