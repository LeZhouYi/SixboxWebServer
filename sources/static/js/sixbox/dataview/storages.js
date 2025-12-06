class StoragesView{

    constructor(){
        this.getStorageList = this.getStorageList.bind(this);
        this.getFolderDetail = this.getFolderDetail.bind(this);
    }

    async deleteFolder(folderID){
        /*删除文件夹*/
        return fetchJsonWithAuth("DELETE", `/storages/folders/${folderID}`);
    }

    async deleteFile(fileID){
        /*删除文件*/
        return fetchJsonWithAuth("DELETE", `/storages/files/${fileID}`);
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

    async editFolder(folderID, filename, remark, fileID){
        /*编辑文件夹*/
        return fetchJsonWithAuth("PUT", `/storages/folders/${fileID}`, {
            "folderID": folderID,
            "filename": filename,
            "remark": remark,
            "fileID": fileID
        });
    }

    async addFile(file,filename,folderID,remark){
        /*新增文件*/
        let formData = new FormData();
        formData.append("files", file);
        formData.append("filename", filename);
        formData.append("folderID", folderID);
        formData.append("remark", remark);
        return fetchFormWithAuth("POST", `/storages/files`, formData);
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