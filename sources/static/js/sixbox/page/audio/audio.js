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
        let audioSetContainer = document.querySelector("audio-set-list");
        if(audioSetContainer){
            audioSetContainer.innerHTML = "";
        }
        let spinner = createSpinnerByElement(audioSetContainer);
        try{
            let setData = await this.audioView.getSetList();
            if(setData.total > 0){
                let audioSetDiv = document.querySelector(".audio-set-list");
                audioSetDiv.innerHTML = "";
                for(let setItem of setData.contents){

                }
            }
        }catch(error){
            this.popupMessage.displayErrorMessage(error);
        }finally{
            spinner?.remove();
        }
    }

        ``

}