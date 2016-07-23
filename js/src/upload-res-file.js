'use strict';
var Promise = require('promise');

/*input a File, additional info to pass to the next promise, and how to read the file
	returns a promise to read the file as indicated
		resolves with the file data, the File object, and whatever info was passed in
		
*/

function promiseFileUpload( file,  fileReadType, ...infoToPass ){
	
	let readPromise = new Promise( function( resolve, reject ){
		let reader = new FileReader
			
		reader.addEventListener('load', function(e){
			if(reader.error) {
				reject(reader.error)
			} else {
				resolve([reader.result, file, infoToPass])
			}
		});
		
		reader.addEventListener('error', reject)
		
		//implement more stringent check? switch/LUT for the four readAs funcs?
		if ( typeof reader[fileReadType] !== 'function' ) reject(`${fileReadType} is not proper FileReader method!`)
		
		reader[fileReadType](file);
	})
	
	return readPromise
}


module.exports = promiseFileUpload