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

function needsSerialization(data) {
  /*判断数据是否需要序列化*/
  return data !== null && typeof data === 'object';
}

function storeSession(key, nowValue, defaultValue=null){
    /*记录当前的参数，如果参数是空，则设置为默认值*/
    let valueToProcess = (nowValue !== null && nowValue !== undefined) ? nowValue : defaultValue;
    // 如果最终值为 null 或 undefined，则清理并退出
    if (valueToProcess === null || valueToProcess === undefined) {
        sessionStorage.removeItem(key);
        return defaultValue;
    }
    // 统一序列化处理
    const finalValue = needsSerialization(valueToProcess)
        ? JSON.stringify(valueToProcess)
        : valueToProcess;
    // 执行存储并返回原始对象/值（保持函数返回类型的一致性）
    sessionStorage.setItem(key, finalValue);
    return valueToProcess;
}

function getSessionAsJson(key){
    /*获取数据并转成dict/array*/
    let value = sessionStorage.getItem(key);
    if(value !== null && value !== ""){
        return JSON.parse(value);
    }else{
        return null;
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