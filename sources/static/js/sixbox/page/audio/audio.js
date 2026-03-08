window.addEventListener("DOMContentLoaded", function(){
    new Background().init(); //初始化background元素

    let sidebar = new Sidebar("/audio.html");
    sidebar.bindSidebarSwitch("navigation_sidebar");

    new SessionsView().checkAccessToken();

    let navigation = new Navigation();
    let audioController = new AudioController();
});

const ORDER_MAPPING = {
    "normal": "/static/icons/normal_order.png",
    "random": "/static/icons/random_order.png",
    "repeat": "/static/icons/repeat_order.png"
}

class AudioController{

    constructor(){
        // 数据
        this.audioView = new AudioView();
        this.soundController = null; //维持一份howler实例
        this.progressBarInterval = null; //进度条定时器
        this.lyricsData = null; //歌词数据实例
        this.lyricsLineIndex = null; //歌词当前播放下标
        this.initElement();
        // 初始化弹窗
        this.popupMessage = new PopupMessage();

        // 初始化
        this.checkParams();
        this.init();
        this.popupAddSet = new PopupContainer("popupAddSet");
        this.popupDeleteSet = new PopupContainer("popupDeleteSet");
        this.popupEditSet = new PopupContainer("popupEditSet");
        this.popupAddAudio = new PopupContainer("popupAddAudio");
        this.popupAudioControl = new PopupContainerFloat("popupAudioControl");
        this.popupDeleteAudio = new PopupContainer("popupDeleteAudio");
        this.popupRemoveAudio = new PopupContainer("popupRemoveAudio");
        this.popupEditAudio = new PopupContainer("popupEditAudio");
        this.popupAddToSet = new PopupContainer("popupAddToSet");
        this.popupSetList = new PopupContainerFloat("popupSetList");

        // 初始化文件上传的控件
        this.addCoverUpload = new FormFileUploader("addCoverLoader");
        this.addCoverUpload.initBind();
        this.editCoverLoader = new FormFileUploader("editCoverLoader");
        this.editCoverLoader.initBind();
        this.addAudioLoader = new FormFileUploader("addAudioLoader");
        this.addAudioLoader.initBind();
        this.addAudioLyrics = new FormFileUploader("addAudioLyrics");
        this.addAudioLyrics.initBind();
        this.editAudioLoader = new FormFileUploader("editAudioLoader");
        this.editAudioLoader.initBind();
        this.editAudioLyrics = new FormFileUploader("editAudioLyrics");
        this.editAudioLyrics.initBind();

        // 初始化进度条
        this.audioPlayProgress = new ProgressBar("audioPlayProgress", this.onClickPlayProgress.bind(this));
        this.audioPlayVolume = new ProgressBar("audioPlayVolume", this.onClickVolume.bind(this), localStorage.getItem("nowPlayVolume")||50);

        // 初始化弹窗
        this.bindAddSet();
        this.bindDeleteSet();
        this.bindEditSet();
        this.bindAddAudio();
        this.bindControl();
        this.bindDeleteAudio();
        this.bindRemoveAudio();
        this.bindEditAudio();
        this.bindAddToSet();
        this.bindPlayEvent();
        this.bindSearchEvent();
        this.bindLyricsEvent();
        this.bindSetList();
    }

    bindSetList(){
        callElement("setListButton", element=>{
            element.addEventListener("click", async (event)=>{
                let spinner = createSpinner("setListButton");
                try{
                    let responseData = await this.audioView.getSetList();
                    callElement("setSelect", selectElement=>{
                        selectElement.innerHTML = "";
                        let audioSetID = sessionStorage.getItem("audioSetID");
                        let willSetValue = null;
                        for(let setData of responseData.contents){
                            let option = document.createElement("option");
                            option.text = setData.setName;
                            option.value = setData.setID;
                            selectElement.appendChild(option);
                            if(setData.setID === audioSetID){
                                willSetValue = audioSetID;
                            }
                        }
                        if(responseData.contents.length > 0){
                            selectElement.value = willSetValue || responseData.contents[0].setID;
                        }
                    });
                    this.popupSetList.showContainer(event.pageX, event.pageY, "end", "end", 15);
                }catch(error){
                    this.popupMessage.displayErrorMessage(error);
                }finally{
                    spinner?.remove();
                }
            });
        });
        callElement("setSelect", element=>{
            element.addEventListener("change", (event)=>{
                storeSession("audioSetID", element.value);
                callElement("audioSearch", element=>{
                    element.value = "";
                });
                storeSession("search", null);
                this.popupSetList.hideContainer();
                this.updateAudioList();
            });
        });
    }

    getActualLyricsIndex(){
        /*获取当前播放的下标*/
        if(!this.soundController || !this.lyricsData){
            return -1;
        }
        let currentTime = this.soundController.seek();
        let index = this.lyricsData.findIndex(item=>item.time > currentTime);
        return index === -1 ? this.lyricsData.length -1 : index -1;
    }

    bindLyricsEvent(){
        callElement("audioPlayCover", element=>{
            /*点击弹出歌词*/
            element.addEventListener("click", (event)=>{
                let lyricsPart = document.querySelector(".audio-lyrics-part");
                let setPart = document.querySelector(".audio-set-part");
                if(!lyricsPart || !setPart){
                    return;
                }
                let nowPlayAudioData = getSessionAsJson("nowPlayAudioData");
                if(!nowPlayAudioData){
                    return;
                }
                if(lyricsPart.classList.contains("hidden")){
                    setPart.classList.add("hidden");
                    lyricsPart.classList.remove("hidden");
                    this.createLyricsContent(); //加载歌词
                }else{
                    setPart.classList.remove("hidden");
                    lyricsPart.classList.add("hidden");
                }
            });
        });
        callElement("audioPlayInfo", element=>{
             /*点击弹出歌词*/
            element.addEventListener("click", (event)=>{
                document.getElementById("audioPlayCover")?.click(event);
            });
        });
    }

    isShowLyrics(){
        let lyricsPart = document.querySelector(".audio-lyrics-part");
        // 隐藏中，不处理
        if(!lyricsPart || lyricsPart.classList.contains("hidden")){
            return false;
        }
        return true;
    }

    async createLyricsContent(){
        /*创建歌词内容*/
        if(!this.isShowLyrics()){
            return;
        }
        try{
            let audioLyricsContainer = document.getElementById("audioLyricsContainer");
            if(!audioLyricsContainer){
                return;
            }
            audioLyricsContainer.innerHTML = "";

            let nowPlayAudioData = getSessionAsJson("nowPlayAudioData");
            //没有在播放的音频，不处理
            if(!nowPlayAudioData){
                return;
            }
            let lyricsID = nowPlayAudioData.lyricsID;
            //正在播放的音频没有歌词文件，不处理
            if(!lyricsID){
                return;
            }
            let accessToken = localStorage.getItem("accessToken");
            let lyricsFile = await fetch(`${API_PREFIX}/storages/files/${nowPlayAudioData.lyricsID}/download?accessToken=${accessToken}`);
            let lyricsText = await lyricsFile.text();
            this.lyricsData = this.parseLrc(lyricsText);

            for(let lyricsLineText of this.lyricsData){
                audioLyricsContainer.appendChild(this.createLyricsItem(lyricsLineText));
            }
            //默认设置第一行在播放
            if(this.lyricsData.length>0){
                audioLyricsContainer.firstElementChild.classList.add("on-play");
                this.lyricsLineIndex = 0;
                this.highlightLrc(this.lyricsLineIndex);
            }
        }catch(error){
            this.popupMessage.displayErrorMessage(error);
        }
    }

    createLyricsItem(lyricsLineText){
        /*新建一行歌词元素*/
        let lineItem = document.createElement("div");
        lineItem.classList.add("audio-lyrics-item");
        lineItem.textContent = lyricsLineText.text;

        return lineItem;
    }

    parseLrc(lrcText){
        /*解析歌词*/
        let lyrics = [];
        let regex = /\[(\d+):(\d+(?:\.\d+)?)]\s*(.*)/;
        let lines = lrcText.split("\n");
        for(let line of lines){
            let match = line.match(regex);
            if (match) {
                // 将 [分:秒] 转换为纯秒数 (数字)
                let minutes = parseInt(match[1]);
                let seconds = parseFloat(match[2]);
                let time = parseFloat((minutes * 60 + seconds).toFixed(2));
                let text = match[3].trim();
                // 过滤掉没有歌词内容的空行
                if (text) {
                    lyrics.push({ time, text });
                }
            }
        }
        // 按时间排序（防止有的LRC文件时间轴乱序）
        return lyrics.sort((a, b) => a.time - b.time);
    }

    bindSearchEvent(){
        callElement("audioSearch", element=>{
            /*搜索事件*/
            element.addEventListener("keydown", (event)=>{
                if (event.key === "Enter" || event.keyCode === 13){
                    event.preventDefault();
                    storeSession("search", element.value);
                    this.updateAudioList();
                }
            });
            let icon = element.previousElementSibling;
            icon?.addEventListener("click", (event)=>{
                event.preventDefault();
                storeSession("search", element.value);
                this.updateAudioList();
            });
        });
    }

    onClickPlayProgress(event, percentage){
        /*点击音频进度条*/
        if (this.soundController) {
            let progressPercent = percentage / 100.0;
            let duration = this.soundController.duration();
            let currentTime = duration * progressPercent;
            this.soundController.seek(currentTime);
            callElement("audioStartTime", element => {
                element.textContent = formatSeconds(currentTime);
            });
        }
    }

    async onEndAudio(){
        /*音频播放结束*/
        callElement("audioPlayCover", element=>{
            element.parentElement.classList.remove("on-play");
        });
        callElement("audioPlayPause", element=>{
            element.src = "/static/icons/play.png";
        });
        this.stopPlayProgressInterval();
        let nowPlayOrder = sessionStorage.getItem("nowPlayOrder") || "normal";
        if(nowPlayOrder==="repeat"){
            this.onClickAudio();
            return;
        }
        let nowPlayList = getSessionAsJson("nowPlayList") || [];
        if(nowPlayList.length<1){
            this.soundController?.unload();
            return;
        }
        let nowPlayAudioData = getSessionAsJson("nowPlayAudioData");
        let index = nowPlayList.indexOf(nowPlayAudioData.audioID);
        if(index<0){
            index = getRandomInt(0, nowPlayList.length-1);
        }
        let audioID = nowPlayList[(index+1)%nowPlayList.length]
        try{
            let responseData = await this.audioView.getAudioInfo(audioID);
            storeSession("nowPlayAudioData", responseData);
            this.onClickAudio();
        }catch(error){
            this.popupMessage.displayErrorMessage(error);
        }
    }

    startPlayProgressInterval(){
        this.progressBarInterval = setInterval(this.updatePlayProgress.bind(this), 1000);
    }

    updatePlayProgress(){
        /*更新音频播放条*/
        let currentTime = this.soundController?.seek() || 0;
        let duration = this.soundController?.duration() || 1;
        let progressPercent = (currentTime / duration) * 100;
        callElement("audioStartTime", element => {
            element.textContent = formatSeconds(currentTime);
        });
        callElement("audioEndTime", element=>{
            element.textContent = formatSeconds(duration);
        });
        this.audioPlayProgress?.update(progressPercent);

        //更新歌词
        if(!this.isShowLyrics()){
            return;
        }
        let willIndex = this.getActualLyricsIndex();
        console.log(this.lyricsData[willIndex]);
        if(this.lyricsLineIndex===willIndex){
            return;
        }
        this.lyricsLineIndex = willIndex;
        this.highlightLrc(this.lyricsLineIndex);
    }

    highlightLrc(index) {
        // 1. 样式高亮切换
        let lrcList = document.getElementById("audioLyricsContainer");
        let lrcContainer = lrcList.parentElement;

        let oldActive = lrcList.querySelector(".on-play");
        console.log(oldActive);
        if (oldActive){
            oldActive.classList.remove("on-play");
        }

        const currentLine = lrcList.children[index];
        if (!currentLine){
            return;
        }

        console.log(currentLine);
        currentLine.classList.add("on-play");

        // 2. 计算滚动距离
        // offsetTop 是当前行相对于父容器顶部的距离
        let offset = currentLine.offsetTop - lrcContainer.offsetHeight / 2 + currentLine.offsetHeight / 2;

        console.log(offset);
        // 边界处理：如果还没滚到一半，不需要向上滚
        if (offset < 0){
            offset = 0;
        }

        // 3. 执行平滑滚动
        lrcList.style.transform = `translateY(-${offset}px)`;
    }

    stopPlayProgressInterval() {
        /*终止定时器*/
        clearInterval(this.progressBarInterval);
    }

    bindPlayEvent(){
        callElement("audioPlayOrder", element=>{
            element.addEventListener("click", (event)=>{
                let nowPlayOrder = sessionStorage.getItem("nowPlayOrder") || "normal";
                let img = element.querySelector("img");
                if(nowPlayOrder === "normal"){
                    nowPlayOrder = "random";
                    let nowPlayList = getSessionAsJson("nowPlayList") || [];
                    nowPlayList = shuffle(nowPlayList);
                    storeSession("nowPlayList", nowPlayList);
                }else if(nowPlayOrder === "random"){
                    nowPlayOrder = "repeat";
                }else{
                    nowPlayOrder = "normal";
                    let nowPlaySetData = getSessionAsJson("nowPlaySetData") || [];
                    let orderList = [];
                    for(let audioItem of nowPlaySetData){
                        orderList.push(audioItem.audioID);
                    }
                    storeSession("nowPlayList", orderList);
                }
                storeSession("nowPlayOrder", nowPlayOrder);
                img.src = ORDER_MAPPING[nowPlayOrder]
            });
        });
        callElement("audioPlayPause", element=>{
            element.addEventListener("click", async (event)=>{
                try{
                    let img = element.querySelector("img");
                    if(img.src.endsWith("/static/icons/play.png")){
                        if(this.soundController){
                            this.soundController.play();
                            this.startPlayProgressInterval();
                            callElement("audioPlayCover", element=>{
                                element.parentElement.classList.add("on-play");
                            });
                            img.src="/static/icons/pause.png";
                        }else{
                            await this.storePlaySetData();
                            let audioData = getSessionAsJson("nowPlayAudioData");
                            if(!audioData){
                                let nowPlayList = getSessionAsJson("nowPlayList") || [];
                                if(nowPlayList.length < 1){
                                    return;
                                }
                                let index = getRandomInt(0, nowPlayList.length -1);
                                let responseData = await this.audioView.getAudioInfo(nowPlayList[index]);
                                storeSession("nowPlayAudioData", responseData);
                            }
                            this.onClickAudio();
                        }
                    }else{
                        img.src="/static/icons/play.png";
                        this.soundController?.pause();
                        this.stopPlayProgressInterval();
                        callElement("audioPlayCover", element=>{
                            element.parentElement.classList.remove("on-play");
                        });
                    }
                }catch(error){
                    this.popupMessage.displayErrorMessage(error);
                }
            });
        });
        callElement("audioFastRewind", element=>{
            /*点击上一首*/
            element.addEventListener("click", async (event)=>{
                if(!this.soundController){
                    return;
                }
                try{
                    let nowPlayAudioData = getSessionAsJson("nowPlayAudioData");
                    let nowPlayList = getSessionAsJson("nowPlayList") || [];
                    if(!nowPlayAudioData || nowPlayList.length<1){
                        return;
                    }
                    let index = nowPlayList.indexOf(nowPlayAudioData.audioID);
                    if(index < 0){
                        index = getRandomInt(0, nowPlayList.length-1);
                    }
                    let audioID = nowPlayList[(index+nowPlayList.length-1)%nowPlayList.length];
                    let responseData = await this.audioView.getAudioInfo(audioID);
                    storeSession("nowPlayAudioData", responseData);
                    this.onClickAudio();
                }catch(error){
                    this.popupMessage.displayErrorMessage(error);
                }
            });
        });
        callElement("audioFastForward", element=>{
            /*点击下一首*/
            element.addEventListener("click", async (event)=>{
                if(!this.soundController){
                    return;
                }
                try{
                    let nowPlayAudioData = getSessionAsJson("nowPlayAudioData");
                    let nowPlayList = getSessionAsJson("nowPlayList") || [];
                    if(!nowPlayAudioData || nowPlayList.length<1){
                        return;
                    }
                    let index = nowPlayList.indexOf(nowPlayAudioData.audioID);
                    if(index < 0){
                        index = getRandomInt(0, nowPlayList.length-1);
                    }
                    let audioID = nowPlayList[(index+1)%nowPlayList.length];
                    let responseData = await this.audioView.getAudioInfo(audioID);
                    storeSession("nowPlayAudioData", responseData);
                    this.onClickAudio();
                }catch(error){
                    this.popupMessage.displayErrorMessage(error);
                }
            });
        });
    }

    onClickVolume(event, percentage){
        /*点击音量*/
        let volume = parseInt(percentage);
        storeLocal("nowPlayVolume", volume);
        if(this.soundController){
            this.soundController.volume(this.getActualVolume(volume));
        }
    }

    initElement(){
        /*初始化元素*/
        storeSession("nowPlayList",[]);
        storeSession("nowPlaySetData", []);
        checkLocalDefault("nowPlayVolume", "50"); //howler实际音量=value/100/3,不除3音量过大
        checkLocalDefault("nowPlayOrder", "normal"); //normal、random、repeat
        callElement("audioPlayOrder", element=>{
            let img = element.querySelector("img");
            if(img){
                img.src = ORDER_MAPPING[sessionStorage.getItem("nowPlayOrder")||"normal"];
            }
        });
    }

    bindAddToSet(){
        callElement("audioAppendButton", element=>{
            element.addEventListener("click", async (event)=>{
                let spinner = createSpinner("audioAppendButton");
                try{
                    let nowAudioSetID = sessionStorage.getItem("audioSetID");
                    if (!nowAudioSetID){
                        return;
                    }
                    let responseData = await this.audioView.getSetList();
                    callElement("addToSetSelect", selectElement=>{
                        selectElement.innerHTML = "";
                        for(let setData of responseData.contents){
                            let option = document.createElement("option");
                            option.text = setData.setName;
                            option.value = setData.setID;
                            selectElement.appendChild(option);
                        }
                        if(responseData.contents.length > 0){
                            selectElement.value = responseData.contents[0].setID;
                        }
                    });
                    this.popupAudioControl.hideContainer();
                    this.popupAddToSet.showContainer();
                }catch(error){
                    this.popupMessage.displayErrorMessage(error);
                }finally{
                    spinner?.remove();
                }
            });
        });
        callElement("addToSetCancel", element=>{
            /*点击取消*/
            element.addEventListener("click", (event)=>{
                this.popupAddToSet.hideContainer();
            });
        });
        callElement("addToSetConfirm", element=>{
            /*点击确认添加*/
            element.addEventListener("click", async (event)=>{
                let spinner = createSpinner("addToSetConfirm");
                try{
                    event?.preventDefault();
                    let setID = document.getElementById("addToSetSelect").value;
                    let controlAudioID = sessionStorage.getItem("controlAudioID");
                    if(!setID || !controlAudioID){
                        return;
                    }
                    let responseData = await this.audioView.addAudioToSet(setID, controlAudioID);
                    this.popupAddToSet.hideContainer();
                    this.popupMessage.displaySuccessMessage(responseData.message);
                }catch(error){
                    this.popupMessage.displayErrorMessage(error);
                }finally{
                    spinner?.remove();
                }
            });
        });
    }

    bindEditAudio(){
        callElement("audioEditButton", element=>{
            /*点击编辑音频*/
            element.addEventListener("click", async (event)=>{
                let spinner = createSpinner("audioEditButton");
                try{
                    let controlAudioID = sessionStorage.getItem("controlAudioID");
                    if(!controlAudioID){
                        return;
                    }
                    let responseData = await this.audioView.getAudioInfo(controlAudioID);
                    callElement("editAudioName", formElement=>{
                        formElement.value = responseData.filename;
                    });
                    callElement("editAudioSinger", formElement=>{
                        formElement.value = responseData.singer;
                    });
                    callElement("editAudioAlbum", formElement=>{
                        formElement.value = responseData.album;
                    });
                    callElement("editAudioRemark", formElement=>{
                        formElement.value = responseData.remark;
                    });
                    this.editAudioLoader.reset();
                    this.editAudioLoader.setData(responseData.fileID);
                    this.editAudioLyrics.reset();
                    if(responseData.lyricsID){
                        this.editAudioLyrics.setData(responseData.lyricsID);
                    }
                    this.popupEditAudio.showContainer();
                    this.popupAudioControl.hideContainer();
                }catch(error){
                    this.popupMessage.displayErrorMessage(error);
                }finally{
                    spinner?.remove();
                }
            });
        });
        callElement("editAudioCancel", element=>{
            /*点击取消编辑*/
            element.addEventListener("click", (event)=>{
                this.popupEditAudio.hideContainer();
            });
        });
        callElement("editAudioForm", element=>{
            /*点击确认编辑*/
            element.addEventListener("submit", async (event)=>{
                let spinner = createSpinner("editAudioConfirm");
                try{
                    event?.preventDefault();
                    let fileID = null;
                    let audioFile = null;
                    if(this.editAudioLoader.tempFile.length > 0){
                        let fileData = this.editAudioLoader.tempFile[0];
                        if(typeof fileData !== "string"){
                            audioFile = fileData;
                        }else{
                            fileID = fileData;
                        }
                    }
                    let lyricsFile = null;
                    let lyricsID = null;
                    if(this.editAudioLyrics.tempFile.length > 0){
                        let fileData = this.editAudioLyrics.tempFile[0];
                        if(typeof fileData !== "string"){
                            lyricsFile = fileData;
                        }else{
                            lyricsID = fileData;
                        }
                    }
                    let controlAudioID = sessionStorage.getItem("controlAudioID");
                    let responseData = await this.audioView.editAudio(
                        controlAudioID,
                        audioFile,
                        fileID,
                        document.getElementById("editAudioName")?.value,
                        document.getElementById("editAudioSinger")?.value,
                        document.getElementById("editAudioAlbum")?.value,
                        document.getElementById("editAudioRemark")?.value,
                        lyricsFile,
                        lyricsID
                    );
                    this.updateAudioList();
                    this.popupEditAudio.hideContainer();
                    this.popupMessage.displaySuccessMessage(responseData.message);
                }catch(error){
                    this.popupMessage.displayErrorMessage(error);
                }finally{
                    spinner?.remove();
                }
            });
        });
    }

    bindRemoveAudio(){
        callElement("removeAudioCancel", element=>{
            /*取消移出*/
            element.addEventListener("click", (event)=>{
                this.popupRemoveAudio.hideContainer();
            });
        });
        callElement("removeAudioConfirm", element=>{
            /*确认移出*/
            element.addEventListener("click", async (event)=>{
                let spinner = createSpinner("removeAudioConfirm");
                try{
                    let nowAudioSetID = sessionStorage.getItem("audioSetID");
                    let controlAudioID = sessionStorage.getItem("controlAudioID");
                    if(!nowAudioSetID || !controlAudioID){
                        return;
                    }
                    let responseData = await this.audioView.removeAudio(nowAudioSetID, controlAudioID);
                    this.updateAudioList();
                    this.popupRemoveAudio.hideContainer();
                    this.popupMessage.displaySuccessMessage(responseData.message);
                }catch(error){
                    this.popupMessage.displayErrorMessage(error);
                }finally{
                    spinner?.remove();
                }
            });
        });
    }

    bindDeleteAudio(){
        callElement("deleteAudioCancel", element=>{
            /*取消删除音频*/
            element.addEventListener("click", (event)=>{
                this.popupDeleteAudio.hideContainer();
            });
        });
        callElement("deleteAudioConfirm", element=>{
            /*确认删除音频*/
            element.addEventListener("click", async (event)=>{
                let spinner = createSpinner("deleteAudioConfirm");
                try{
                    let controlAudioID = sessionStorage.getItem("controlAudioID");
                    if(!controlAudioID){
                        return;
                    }
                    let responseData = await this.audioView.deleteAudio(controlAudioID);
                    this.updateAudioList();
                    this.popupDeleteAudio.hideContainer();
                    this.popupMessage.displaySuccessMessage(responseData.message);
                }catch(error){
                    this.popupMessage.displayErrorMessage(error);
                }finally{
                    spinner?.remove();
                }
            });
        });
    }

    bindControl(){
        callElement("audioDeleteButton", element=>{
            /*点击删除音频*/
            element.addEventListener("click", (event)=>{
                this.popupAudioControl.hideContainer();
                this.popupDeleteAudio.showContainer();
            });
        });
        callElement("audioRemoveButton", element=>{
            /*点击移除音频*/
            element.addEventListener("click", (event)=>{
                this.popupAudioControl.hideContainer();
                this.popupRemoveAudio.showContainer();
            });
        });
        callElement("audioDownloadButton", element=>{
            /*点击下载音频*/
            element.addEventListener("click", (event)=>{
                let spinner = createSpinner("audioDownloadButton");
                try{
                    let audioData = getSessionAsJson("controlAudioData");
                    if(!audioData){
                        return;
                    }
                    let accessToken = localStorage.getItem("accessToken");
                    downloadFile(`${API_PREFIX}/storages/files/${audioData.fileID}/download?accessToken=${accessToken}`, `${audioData.singer}-${audioData.filename}`);
                    this.popupAudioControl.hideContainer();
                }catch(error){
                    this.popupMessage.displayErrorMessage(error);
                }finally{
                    spinner?.remove();
                }
            });
        });

        callElement("lyricsDownloadButton", element=>{
            /*点击下载歌词*/
            element.addEventListener("click", (event)=>{
                let spinner = createSpinner("lyricsDownloadButton");
                try{
                    let audioData = getSessionAsJson("controlAudioData");
                    if(!audioData || !audioData.lyricsID){
                        return;
                    }
                    let accessToken = localStorage.getItem("accessToken");
                    downloadFile(`${API_PREFIX}/storages/files/${audioData.lyricsID}/download?accessToken=${accessToken}`, `${audioData.singer}-${audioData.filename}.lrc`);
                    this.popupAudioControl.hideContainer();
                }catch(error){
                    this.popupMessage.displayErrorMessage(error);
                }finally{
                    spinner?.remove();
                }
            });
        });
    }

    bindAddAudio(){
        callElement("uploadAudioButton", element=>{
            /*点击弹出上传音频弹窗*/
            element.addEventListener("click", (event)=>{
                this.popupAddAudio.showContainer();
            });
        });
        callElement("addAudioCancel", element=>{
            /*点击取消新增*/
            element.addEventListener("click", (event)=>{
                this.popupAddAudio.hideContainer();
            });
        });
        callElement("addAudioForm", element=>{
            /*点击确认新增*/
            element.addEventListener("submit", async (event)=>{
                let spinner = createSpinner("addAudioConfirm");
                try{
                    event?.preventDefault();
                    let audioFile = null;
                    if(this.addAudioLoader.tempFile.length > 0){
                        audioFile = this.addAudioLoader.tempFile[0];
                    }
                    let lyricsFile = null;
                    if(this.addAudioLyrics.tempFile.length > 0){
                        lyricsFile = this.addAudioLyrics.tempFile[0];
                    }
                    let nowAudioSetID = sessionStorage.getItem("audioSetID");
                    let responseData = await this.audioView.addAudio(
                        audioFile,
                        document.getElementById("addAudioName")?.value,
                        document.getElementById("addAudioSinger")?.value,
                        document.getElementById("addAudioAlbum")?.value,
                        document.getElementById("addAudioRemark")?.value,
                        lyricsFile,
                        nowAudioSetID
                    );
                    this.updateAudioList();
                    this.popupAddAudio.hideContainer();
                    document.getElementById("addAudioForm")?.reset();
                    this.addAudioLoader.reset();
                    this.addAudioLyrics.reset();
                    this.popupMessage.displaySuccessMessage(responseData.message);
                }catch(error){
                    this.popupMessage.displayErrorMessage(error);
                }finally{
                    spinner?.remove();
                }
            });
        })
    }

    bindEditSet(){
        callElement("editSetButton", element=>{
            /*点击弹出编辑合集窗口*/
            element.addEventListener("click", async (event)=>{
                let spinner = createSpinnerByElement(element, "spinner-container", 0.75);
                try{
                    let nowAudioSetID = sessionStorage.getItem("audioSetID");
                    if(!nowAudioSetID){
                        return;
                    }
                    let audioSetData = await this.audioView.getSetInfo(nowAudioSetID);
                    callElement("editSetName", formElement=>{
                        formElement.value = audioSetData.setName;
                    });
                    callElement("editSetRemark", formElement=>{
                        formElement.value = audioSetData.remark;
                    });
                    this.editCoverLoader.reset();
                    this.editCoverLoader.setData(audioSetData.coverID);
                    this.popupEditSet.showContainer();
                }catch(error){
                    this.popupMessage.displayErrorMessage(error);
                }finally{
                    spinner?.remove();
                }
            });
        });
        callElement("editSetCancel", element=>{
            /*点击关闭编辑合集窗口*/
            element.addEventListener("click", (event)=>{
                this.popupEditSet.hideContainer();
            });
        });
        callElement("editSetForm", element=>{
            /*点击提交编辑合集*/
            element.addEventListener("submit", async (event)=>{
                let spinner = createSpinner("editSetConfirm");
                try{
                    event?.preventDefault();
                    let coverFile = null;
                    let coverID = null;
                    if(this.editCoverLoader.tempFile.length > 0){
                        let fileData = this.editCoverLoader.tempFile[0]
                        if(typeof fileData !== "string"){
                            coverFile = fileData;
                        }else{
                            coverID = fileData;
                        }
                    }
                    let nowAudioSetID = sessionStorage.getItem("audioSetID");
                    let responseData = await this.audioView.editSet(
                        nowAudioSetID,
                        coverFile,
                        document.getElementById("editSetName")?.value,
                        document.getElementById("editSetRemark")?.value,
                        coverID
                    );
                    this.updateAudioSet();
                    this.popupEditSet.hideContainer();
                    document.getElementById("editSetForm")?.reset();
                    this.popupMessage.displaySuccessMessage(responseData.message);
                }catch(error){
                    this.popupMessage.displayErrorMessage(error);
                }finally{
                    spinner?.remove();
                }
            });
        });
    }

    checkParams(){
        /*检查当前URL的参数*/
        let url = new URL(window.location.href);
        let params = new URLSearchParams(url.search);
        storeSession("audioSetID",params.get("setID"));
        storeSession("search", params.get("search"));
    }

    bindDeleteSet(){
        callElement("deleteSetButton", element=>{
            /*点击弹出删除合集弹窗*/
            element.addEventListener("click", (event)=>{
                let nowAudioSetID = sessionStorage.getItem("audioSetID");
                if(nowAudioSetID){
                    this.popupDeleteSet.showContainer();
                }
            });
        });
        callElement("deleteSetCancel", element=>{
            /*点击取消删除*/
            element.addEventListener("click", (event)=>{
                this.popupDeleteSet.hideContainer();
            });
        });
        callElement("deleteSetConfirm", element=>{
            /*点击确认删除*/
            element.addEventListener("click", async (event)=>{
                let spinner = createSpinner("deleteSetConfirm");
                try{
                    let nowAudioSetID = sessionStorage.getItem("audioSetID");
                    let responseData = await this.audioView.deleteSet(nowAudioSetID);
                    sessionStorage.removeItem("audioSetID");
                    this.popupMessage.displaySuccessMessage(responseData.message);
                    this.popupDeleteSet.hideContainer();
                    this.init();
                }catch(error){
                    this.popupMessage.displayErrorMessage(error);
                }finally{
                    spinner?.remove();
                }
            });
        });
    }

    bindAddSet(){
        callElement("createSetButton", element=>{
            /*点击新增合集*/
            element.addEventListener("click", (event)=>{
                this.popupAddSet.showContainer();
            });
        });
        callElement("addSetCancel", element=>{
            /*点击取消新增*/
            element.addEventListener("click", (event)=>{
                this.popupAddSet.hideContainer();
            });
        });
        callElement("addSetForm", element=>{
            element.addEventListener("submit", async(event)=>{
                let spinner = createSpinner("addSetConfirm");
                try{
                    event?.preventDefault();
                    let coverFile = null;
                    if(this.addCoverUpload.tempFile.length > 0){
                        coverFile = this.addCoverUpload.tempFile[0];
                    }
                    let responseData = await this.audioView.addSet(
                        coverFile,
                        document.getElementById("addSetName")?.value,
                        document.getElementById("addSetRemark")?.value
                    );
                    this.updateAudioSet();
                    this.popupAddSet.hideContainer();
                    document.getElementById("addSetForm")?.reset();
                    this.popupMessage.displaySuccessMessage(responseData.message);
                }catch(error){
                    this.popupMessage.displayErrorMessage(error);
                }finally{
                    spinner?.remove();
                }
            });
        });
    }

    async init(){
        await this.updateAudioSet();
        this.updateAudioList();
    }

    async updateAudioSet(){
        /*更新合集列表*/
        let audioSetContainer = document.querySelector(".audio-set-list");
        if(audioSetContainer){
            audioSetContainer.innerHTML = "";
        }
        let spinner = createSpinnerByElement(audioSetContainer);
        try{
            let setData = await this.audioView.getSetList();
            if(setData.total > 0){
                for(let setItem of setData.contents){
                    audioSetContainer.appendChild(this.createAudioSetItem(setItem));
                }
            }
            let nowAudioSetID = sessionStorage.getItem("audioSetID");
            if(!nowAudioSetID && setData.total > 0){
                storeSession("audioSetID", setData.contents[0].setID);
            }
        }catch(error){
            this.popupMessage.displayErrorMessage(error);
        }finally{
            spinner?.remove();
        }
    }

    async updateAudioList(){
        /*更新音频合集*/
        let nowAudioSetID = sessionStorage.getItem("audioSetID");
        if(!nowAudioSetID){
            return;
        }
        let audioListContainer = document.querySelector(".audio-list-container");
        if(!audioListContainer){
            return;
        }
        let spinner = createSpinnerByElement(audioListContainer);
        try{
            let url = new URL(window.location.href);
            let newParams = new URLSearchParams();
            let search = sessionStorage.getItem("search");
            addParams(newParams, "setID", nowAudioSetID);
            addParams(newParams, "search", search);
            url.search = newParams.toString();
            window.history.pushState({path:url.href},'',url.href);

            let audioSetData = await this.audioView.getSetInfo(nowAudioSetID, search);
            callElement("audioSetInfo", element=>{
                element.textContent = audioSetData.setName;
            })

            //更新音频列表
            audioListContainer.innerHTML = "";
            for(let audioData of audioSetData.audios){
                audioListContainer.appendChild(this.createAudioItem(audioData));
            }
        }catch(error){
            this.popupMessage.displayErrorMessage(error);
            setTimeout(()=>{
                window.location.href = "/audio.html";
            }, 1000);
        }finally{
            spinner?.remove();
        }
    }

    createAudioItem(audioData){
        /*创建单个音频元素*/
        let itemDiv = document.createElement("div");
        itemDiv.classList.add("audio-list-item");

        let iconDiv = document.createElement("div");
        iconDiv.classList.add("audio-item-icon");
        let icon = document.createElement("img");
        icon.src = "/static/icons/music.png";
        iconDiv.appendChild(icon);
        itemDiv.appendChild(iconDiv);

        let nameDiv = document.createElement("div");
        nameDiv.classList.add("audio-item-column", "ellipsis");
        nameDiv.textContent = audioData.filename;
        itemDiv.appendChild(nameDiv);

        let singerDiv = document.createElement("div");
        singerDiv.classList.add("audio-item-column", "ellipsis");
        singerDiv.textContent = audioData.singer;
        itemDiv.appendChild(singerDiv);

        let albumDiv = document.createElement("div");
        albumDiv.classList.add("audio-item-column", "ellipsis");
        albumDiv.textContent = audioData.album;
        itemDiv.appendChild(albumDiv);

        let remarkDiv = document.createElement("div");
        remarkDiv.classList.add("audio-item-column", "ellipsis");
        remarkDiv.textContent = audioData.remark;
        itemDiv.appendChild(remarkDiv);

        let controlDiv = document.createElement("div");
        controlDiv.classList.add("audio-item-control");
        let controlIcon = document.createElement("img");
        controlIcon.src = "/static/icons/dots.png";
        controlDiv.appendChild(controlIcon);
        itemDiv.appendChild(controlDiv);
        this.bindControlEvent(controlDiv, audioData);

        itemDiv.addEventListener("click", (event)=>{
            storeSession("nowPlayAudioData", audioData);
            this.onClickAudio(event);
            this.storePlaySetData();
        });

        return itemDiv;
    }

    async storePlaySetData(){
        /*缓存播放合集队列*/
        try{
            let nowPlaySetID = sessionStorage.getItem("nowPlaySetID");
            let nowAudioSetID = sessionStorage.getItem("audioSetID");
            if(!nowPlaySetID || nowPlaySetID != nowAudioSetID){
                nowPlaySetID = nowAudioSetID;
            }
            storeSession("nowPlaySetID", nowPlaySetID);
            let search = sessionStorage.getItem("search");
            let responseData = await this.audioView.getSetInfo(nowPlaySetID,search);
            storeSession("nowPlaySetData", responseData.audios);
            //设置封面
            callElement("audioPlayCover", element=>{
                if(responseData.coverID){
                    element.src = `/api/v1/storages/files/${responseData.coverID}/download?accessToken=${localStorage.getItem("accessToken")}`;
                }else{
                    element.src = "/static/audios/default.png"
                }
            });
            //计算并缓存播放序列
            let nowPlayOrder = sessionStorage.getItem("nowPlayOrder")||"normal";
            let orderList = [];
            for(let audioItem of responseData.audios||[]){
                orderList.push(audioItem.audioID);
            }   
            if(nowPlayOrder=="random"){
                orderList = shuffle(orderList);
            }
            storeSession("nowPlayList", orderList);
        }catch(error){
            this.popupMessage.displayErrorMessage(error);
        }
    }

    onClickAudio(event){
        /*点击播放音频*/
        try{
            let audioData = getSessionAsJson("nowPlayAudioData");
            if(!audioData){
                return;
            }
            this.initSoundController(`api/v1/storages/files/${audioData.fileID}/download?accessToken=${localStorage.getItem("accessToken")}`);
            this.soundController?.play();
            callElement("audioPlayName", element=>{
                element.textContent = audioData.filename;
            });
            callElement("audioPlaySinger", element=>{
                element.textContent = audioData.singer;
            });
            callElement("audioPlayPause", element=>{
                let img = element.querySelector("img");
                img.src = "/static/icons/pause.png";
            });
            callElement("audioPlayCover", element=>{
                element.parentElement.classList.add("on-play");
            });
            if(this.isShowLyrics()){
                this.createLyricsContent();
            }
            this.stopPlayProgressInterval();
            this.startPlayProgressInterval();
        }catch(error){
            this.popupMessage.displayErrorMessage(error);
        }
    }

    initSoundController(url){
        /*重新初始化SoundController*/
        this.soundController?.unload();
        this.soundController = new Howl({
            src: [url],
            volume: this.getActualVolume(localStorage.getItem("nowPlayVolume")),
            format: ["mp3"],
            onend: this.onEndAudio.bind(this)
        });
    }

    getActualVolume(value){
        /*获取实际音量*/
        return Number(value||"50")/100*(0.5);
    }

    createAudioSetItem(itemData){
        /*创建单个合集元素*/
        let setItemDiv = document.createElement("div");
        setItemDiv.classList.add("audio-set-item");

        let img = document.createElement("img");
        if (itemData.coverID){
            img.src = `/api/v1/storages/files/${itemData.coverID}/download?accessToken=${localStorage.getItem("accessToken")}`;
        }else{
            img.src = "/static/audios/default.png";
        }
        setItemDiv.appendChild(img);

        let setName = document.createElement("a");
        setName.textContent = itemData.setName;
        setItemDiv.appendChild(setName);

        setItemDiv.addEventListener("click", (event)=>{
            let audioSetID = sessionStorage.getItem("audioSetID");
            storeSession("audioSetID", itemData.setID);
            callElement("audioSearch", element=>{
                element.value = "";
            });
            storeSession("search", null);
            this.updateAudioList();
        });

        return setItemDiv;
    }

    bindControlEvent(controlDiv, audioData){
        /*为音频控制图标绑定事件*/
        controlDiv?.addEventListener("click", (event)=>{
            event.stopPropagation();
            storeSession("controlAudioID", audioData.audioID);
            storeSession("controlAudioData", audioData);
            this.popupAudioControl.showContainer(event.pageX, event.pageY, "start", "end", 15);
        });
    }

}