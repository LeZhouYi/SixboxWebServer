window.addEventListener("DOMContentLoaded", function(){
    new Background().init(); //初始化background元素
    let sidebar = new Sidebar("/audio.html");
    sidebar.bindSidebarSwitch("navigation_sidebar");
    new SessionsView().checkAccessToken();
    let navigation = new Navigation();
    let audioController = new AudioController();
});

class AudioController{

    constructor(){
        // 数据
        this.audioView = new AudioView();
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

        // 初始化文件上传的控件
        this.addCoverUpload = new FormFileUploader("addCoverLoader");
        this.addCoverUpload.initBind();
        this.editCoverLoader = new FormFileUploader("editCoverLoader");
        this.editCoverLoader.initBind();
        this.addAudioLoader = new FormFileUploader("addAudioLoader");
        this.addAudioLoader.initBind();
        this.addAudioLyrics = new FormFileUploader("addAudioLyrics");
        this.addAudioLyrics.initBind();

        // 初始化弹窗
        this.bindAddSet();
        this.bindDeleteSet();
        this.bindEditSet();
        this.bindAddAudio();
        this.bindControl();
        this.bindDeleteAudio();
        this.bindRemoveAudio();
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
            element.addEventListener("click", (event)=>{
                let spinner = createSpinner("removeAudioConfirm");
                try{
                    let nowAudioSetID = sessionStorage.getItem("audioSetID");
                    let controlAudioID = sessionStorage.getItem("controlAudioID");
                    if(!nowAudioSetID || !controlAudioID){
                        return;
                    }
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
                    let responseData = await this.audioView.addAudio(
                        audioFile,
                        document.getElementById("addAudioName")?.value,
                        document.getElementById("addAudioSinger")?.value,
                        document.getElementById("addAudioAlbum")?.value,
                        document.getElementById("addAudioRemark")?.value,
                        lyricsFile
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
            addParams(newParams, "setID", nowAudioSetID);
            url.search = newParams.toString();
            window.history.pushState({path:url.href},'',url.href);

            let audioSetData = await this.audioView.getSetInfo(nowAudioSetID);
            callElement("audioSetInfo", element=>{
                element.textContent = audioSetData.setName;
            })

            //更新音频列表
            audioListContainer.innerHTML = "";
            for(let audioData of audioSetData.audios){
                console.log(audioData);
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
        nameDiv.classList.add("audio-item-column");
        nameDiv.textContent = audioData.filename;
        itemDiv.appendChild(nameDiv);

        let singerDiv = document.createElement("div");
        singerDiv.classList.add("audio-item-column");
        singerDiv.textContent = audioData.singer;
        itemDiv.appendChild(singerDiv);

        let controlDiv = document.createElement("div");
        controlDiv.classList.add("audio-item-control");
        let controlIcon = document.createElement("img");
        controlIcon.src = "/static/icons/dots.png";
        controlDiv.appendChild(controlIcon);
        itemDiv.appendChild(controlDiv);
        this.bindControlEvent(controlDiv, audioData);

        return itemDiv;
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
            if(audioSetID === itemData.setID){
                return;
            }
            storeSession("audioSetID", itemData.setID);
            this.updateAudioList();
        });

        return setItemDiv;
    }

    bindControlEvent(controlDiv, audioData){
        /*为音频控制图标绑定事件*/
        controlDiv?.addEventListener("click", (event)=>{
            event.stopPropagation();
            storeSession("controlAudioID", audioData.fileID);
            this.popupAudioControl.showContainer(event.pageX, event.pageY, "start", "end", 15);
        });
    }

}