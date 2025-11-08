window.addEventListener("DOMContentLoaded", function(){
    checkLocalDefault("deviceID",crypto.randomUUID());  //设备ID
    resizeFullScreen(); //初始化全屏
});

window.addEventListener("resize", throttle(function(){
    //监听尺寸变化，全屏
    resizeFullScreen();
}, 200));