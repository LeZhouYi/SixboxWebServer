window.addEventListener("DOMContentLoaded", function(){
    checkLocalDefault("deviceID",generateUUID());  //设备ID
    resizeFullScreen(); //初始化全屏
    initLanguage();
    //初始化控件
    FormUtils.initFormSelect();
});

window.addEventListener("resize", throttle(function(){
    //监听尺寸变化，全屏
    resizeFullScreen();
}, 200));