window.addEventListener("DOMContentLoaded", function(){
    checkLocalDefault("deviceID",generateUUID());  //设备ID
    resizeFullScreen(); //初始化全屏
    initLanguage();
});

window.addEventListener("resize", throttle(function(){
    //监听尺寸变化，全屏
    resizeFullScreen();
}, 200));