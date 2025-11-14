class StoragesView{

    getStorageList(){
        let params = new URLSearchParams();
        addParams(params, sessionStorage.getItem("folderID"));
        addParams(params, sessionStorage.getItem("_page"));
        addParams(params, sessionStorage.getItem("_limit"));
        addParams(params, sessionStorage.getItem("search"));
        return fetchJsonWithAuth("")
    }

}