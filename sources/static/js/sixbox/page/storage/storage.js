window.addEventListener("DOMContentLoaded", function(){
    new Background().init(); //初始化background元素
    new Sidebar().initWithHref("/home.html");
});