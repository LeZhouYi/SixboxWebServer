function addParams(params, key, value){
    /*如果value为空，则不添加到url params*/
    if(value){
        params.set(key, value);
    }
}