window.addEventListener("DOMContentLoaded", function(){
    new Background().init(); //初始化background元素
    let sidebar = new Sidebar("/home.html");
    sidebar.bindSidebarSwitch("navigation_sidebar");
    new SessionsView().checkAccessToken();
    let storageController = new StorageController();
});

class StorageController{

    constructor(){
        this.checkParams = this.checkParams.bind(this);
        this.updateFileList = this.updateFileList.bind(this);

        this.checkParams();
    }

    checkParams(){
        /*检查当前URL的参数*/
        let url = new URL(window.location.href);
        let params = new URLSearchParams(url.search);
        let newParams = new URLSearchParams();
        addParams(newParams, "folderID", storeSession("folderID",params.get("folderID"), null));
        addParams(newParams, "_page", storeSession("_page",params.get("_page"), 0));
        addParams(newParams, "_limit", storeSession("_limit",params.get("_limit"), 20));
        addParams(newParams, "search", storeSession("search",params.get("search"), null));
        url.search = newParams.toString();
        window.history.pushState({path:url.href},'',url.href);
    }

    updateFileList(){
        /*更新文件列表*/

    }

}