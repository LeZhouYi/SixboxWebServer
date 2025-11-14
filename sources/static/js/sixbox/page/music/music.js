window.addEventListener("DOMContentLoaded", function(){
    new Background().init(); //初始化background元素
    let sidebar = new Sidebar("/music.html");
    sidebar.bindSidebarSwitch("navigation_sidebar");
    new SessionsView().checkAccessToken();
});