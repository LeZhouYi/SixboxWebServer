window.addEventListener("DOMContentLoaded", function(){
    new Background().init(); //初始化background元素
    let sidebar = new Sidebar("/audio.html");
    sidebar.bindSidebarSwitch("navigation_sidebar");
    new SessionsView().checkAccessToken();
    let audioController = new AudioController();
});

class AudioController{

    constructor(){
        // 数据
        this.audioView = new AudioView();
        // 初始化弹窗
        this.popupMessage = new PopupMessage();

        // 初始化
        this.init();
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
        try{
            let audioSetData = await this.audioView.getSetInfo(nowAudioSetID);
            callElement("audioSetInfo", element=>{
                element.textContent = audioSetData.setName;
            })
        }catch(error){
            this.popupMessage.displayErrorMessage(error);
        }finally{
        }
    }

    createAudioSetItem(itemData){
        /*创建单个合集元素*/
        let setItemDiv = document.createElement("div");
        setItemDiv.classList.add("audio-set-item");

        let img = document.createElement("img");
        img.src = itemData.coverID || "/static/audios/default.png";
        setItemDiv.appendChild(img);

        let setName = document.createElement("a");
        setName.textContent = itemData.setName;
        setItemDiv.appendChild(setName);

        return setItemDiv;
    }

}