'use strict';

const File_Table = require('./filetable.json');


function checkFileTable( filename ){
	var file = File_Table[filename]
	
	return file ? file : false
}


module.exports = checkFileTable