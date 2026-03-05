function shuffle(array) {
    /*打乱数组*/
    for (let i = array.length - 1; i > 0; i--) {
        // 生成 0 到 i 之间的随机整数
        const j = Math.floor(Math.random() * (i + 1));
        // 交换元素
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function formatSeconds(seconds) {
    /*格式化秒数*/
    seconds = Math.floor(seconds);
    var minutes = Math.floor(seconds / 60);
    var secs = seconds % 60;
    var formattedMinutes = minutes.toString().padStart(2, "0");
    var formattedSecs = secs.toString().padStart(2, "0");
    return formattedMinutes + ":" + formattedSecs;
}

function getRandomInt(min, max) {
  // +1 是为了确保能够取到 max 这个值
  return Math.floor(Math.random() * (max - min + 1)) + min;
}