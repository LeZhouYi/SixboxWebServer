function addParams(params, key, value){
    /*如果value为空，则不添加到url params*/
    if(value !== null && value !== undefined){
        params.set(key, value);
    }
}