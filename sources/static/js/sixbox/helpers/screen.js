function resizeFullScreen() {
    /*计算并调整页页使用适应全屏*/
    let bodyContainer = document.body;
    let height = Math.max(window.innerHeight,document.documentElement.clientHeight);
    bodyContainer.style.height = String(height) + "px";
}