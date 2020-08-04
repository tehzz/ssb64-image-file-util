'use strict';

function Resource( buffer, info, name ){	
        this.buffer = buffer
        this.dv = new DataView(buffer)
        this.name = name
        this.info = info
        this.nodes = null
        this.reqs = null
}

Resource.prototype.getNodeOffset = function(){
    return this.info.nodeOffset;
}

Resource.prototype.getReqOffset = function(){
    return this.info.resourceOffset;
}


module.exports = {
    File: Resource
}
