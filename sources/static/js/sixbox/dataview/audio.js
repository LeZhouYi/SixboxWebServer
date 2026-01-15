class AudioView{

    async getSetList(){
        /*获取合集列表*/
        return fetchJsonWithAuth("GET", `/audioSet?_page=0&_limit=999`);
    }

}