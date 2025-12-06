function formatFileSize(fileSize) {
    /*返回对应的格式的存储大小文本*/
    fileSize = parseInt(fileSize);
    if (fileSize < 1) {
        return `${fileSize}B`;
    }
    let fileSizeTexts = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    for (let i = 0; i < fileSizeTexts.length; i++) {
        if (fileSize < 1024) {
            return fileSize.toFixed(2).toString() + " " + fileSizeTexts[i];
        } else {
            fileSize = fileSize / 1024;
        }
    }
}

function downloadFile(url){
    /*下载文件*/
    let downloadA = document.createElement("a");
    downloadA.href = url;
    downloadA.click();
    downloadA.remove();
}