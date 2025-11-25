class StoragesView{

    constructor(){
        this.getStorageList = this.getStorageList.bind(this);
        this.getFolderDetail = this.getFolderDetail.bind(this);
    }

    async getStorageList(){
        /*获取/搜索文件列表*/
        let params = this.getUrlParams();
        return fetchJsonWithAuth("GET", `/storages?${params.toString()}`)
    }

    async getFolderDetail(folderID){
        /*获取文件夹详情*/
        if(folderID){
            return fetchJsonWithAuth("GET", `/storages/folders/${folderID}`);
        }else{
            return fetchJsonWithAuth("GET", "/storages/folders");
        }
    }

    async addFolder(folderID, filename, remark){
        /*新增文件夹*/
        return fetchJsonWithAuth("POST", "/storages/folders", {
            "folderID": folderID,
            "filename": filename,
            "remark": remark
        });
    }

    getUrlParams(){
        /*获取URL的query参数*/
        let params = new URLSearchParams();
        addParams(params, "folderID", sessionStorage.getItem("folderID"));
        addParams(params, "_page", sessionStorage.getItem("_page"));
        addParams(params, "_limit", sessionStorage.getItem("_limit"));
        addParams(params, "search", sessionStorage.getItem("search"));
        return params;
    }

}