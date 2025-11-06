function checkLocalDefault(itemKey, defaultValue) {
    /*检查LocalStorage,若不存在数据则设置默认值*/
    let itemValue = localStorage.getItem(itemKey);
    if (localStorage.getItem(itemKey) === null) {
        localStorage.setItem(itemKey, defaultValue);
        return defaultValue;
    }
    return itemValue;
}