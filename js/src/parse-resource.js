'use strict';

var Resource = require('./wrappers.js')
var nl = require('./node-list-extractor.js')

function parseResource( [buffer, file, [fileInfo]] ){
    let name = file.name,
        resFile = new Resource.File( buffer, fileInfo, name )
        
        console.log(resFile);
        
    resFile.nodes = nl.extract( resFile.dv, resFile.getNodeOffset() )
    
    return resFile
}

module.exports = parseResource

//return just the Resource object...?