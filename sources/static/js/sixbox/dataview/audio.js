class AudioView{

    async getSetList(){
        /*获取合集列表*/
        return fetchJsonWithAuth("GET", `/audioSet?_page=0&_limit=999`);
    }

    async getSetInfo(audioSetID){
        /*获取合集详情*/
        return fetchJsonWithAuth("GET", `/audioSet/${audioSetID}`);
    }

    async addSet(coverFile, setName, setRemark){
        /*新增合集*/
        let formData = new FormData();
        formData.append("files", coverFile);
        formData.append("setName", setName);
        formData.append("setRemark", setRemark);
        return fetchFormWithAuth("POST", `/audioSet`, formData);
    }

}