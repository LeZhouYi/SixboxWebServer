/*storage相关*/

function checkSessionDefault(itemKey, defaultValue) {
    /*检查SessionStorage,若不存在数据则设置默认值*/
    let itemValue = localStorage.getItem(itemKey);
    if (sessionStorage.getItem(itemKey) === null) {
        sessionStorage.setItem(itemKey, defaultValue);
        return defaultValue;
    }
    return itemValue;
}

function storeSession(key, nowValue, defaultValue=null){
    /*记录当前的参数，如果参数是空，则设置为默认值*/
    if(nowValue!==null&&nowValue!==undefined){
        sessionStorage.setItem(key, nowValue);
        return nowValue;
    }else if(defaultValue!==null){
        sessionStorage.setItem(key, defaultValue);
        return defaultValue;
    }else{
        sessionStorage.removeItem(key);
        return defaultValue;
    }
}

function checkLocalDefault(itemKey, defaultValue) {
    /*检查LocalStorage,若不存在数据则设置默认值*/
    let itemValue = localStorage.getItem(itemKey);
    if (localStorage.getItem(itemKey) === null) {
        localStorage.setItem(itemKey, defaultValue);
        return defaultValue;
    }
    return itemValue;
}