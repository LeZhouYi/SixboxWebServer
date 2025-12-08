class Background{
    constructor(){
        this.backgroundContainer = document.querySelector(".background-container");
    }

    async init(){
        /*初始化*/
        if(!this.backgroundContainer){
            return;
        }
        let userDetail = await new UsersView().getUserDetail(localStorage.getItem("userID"));
        let backgroundUrl = userDetail.background;
        if(!backgroundUrl){
            backgroundUrl = "/static/covers/cover.png"; //没有自定义时默认使用封面
        }
        let imgElement = this.backgroundContainer.querySelector("img");
        if(!imgElement){
            imgElement = document.createElement("img");
            this.backgroundContainer.appendChild(imgElement);
        }
        imgElement.src = backgroundUrl;
    }
}