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
        this.updateAudioSet();
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
        }catch(error){
            this.popupMessage.displayErrorMessage(error);
        }finally{
            spinner?.remove();
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