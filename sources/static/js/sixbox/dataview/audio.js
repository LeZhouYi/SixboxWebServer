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

    async deleteSet(setID){
        /*删除合集*/
        return fetchJsonWithAuth("DELETE", `/audioSet/${setID}`);
    }

    async editSet(setID, coverFile, setName, setRemark, coverID){
        /*
            编辑合集
            coverID为null表示清空原来，coverFile表示新文件
        */
        let formData = new FormData();
        if(coverFile){
            formData.append("files", coverFile);
        }
        formData.append("setName", setName);
        formData.append("setRemark", setRemark);
        if(coverID){
            formData.append("coverID", coverID);
        }
        return fetchFormWithAuth("PUT", `/audioSet/${setID}`, formData);
    }

    async addAudio(audioFile, audioName, audioSinger, audioAlbum, audioRemark, lyricsFile){
        /*新增音频*/
        let formData = new FormData();
        if(audioFile){
            formData.append("audio", audioFile);
        }
        formData.append("filename", audioName);
        formData.append("singer", audioSinger);
        formData.append("album", audioAlbum);
        formData.append("remark", audioRemark);
        if(lyricsFile){
            formData.append("lyrics", lyricsFile);
        }
        return fetchFormWithAuth("POST", `/audios`, formData);
    }

    async deleteAudio(audioID){
        /*删除音频*/
        return fetchJsonWithAuth("DELETE", `/audios/${audioID}`);
    }

}