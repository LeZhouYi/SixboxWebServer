/*文本格式化或预处理*/

function formatTimestamp(timestamp) {
    /*转成YYYY-MM-DD HH:mm:SS的字符串*/
    const date = new Date(timestamp * 1000);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}\u00A0${hours}:${minutes}:${seconds}`;
}

function formatString(template, ...args) {
    let index = 0;
    return template.replace(/%s/g, () => {
        return index < args.length ? args[index++] : '';
    });
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
