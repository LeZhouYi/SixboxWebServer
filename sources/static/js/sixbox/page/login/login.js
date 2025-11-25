window.addEventListener("DOMContentLoaded", function(){
    new LoginController(
        "account","password","login-button", "login-form"
    );
});

class LoginController{
    /*控制登录页面的行为*/

    constructor(accountId, passwordId, buttonId, formId){
        this.accountId = accountId;
        this.passwordId = passwordId;
        this.buttonId = buttonId;
        this.formId = formId;
        this.eventCache = {};

        this.bindEvent = this.bindEvent.bind(this);
        this.init = this.init.bind(this);
        this.login = this.login.bind(this);
        this.onEnter = this.onEnter.bind(this);

        this.init();
    }

    init(){
        this.bindEvent(this.buttonId, "submit", this.login);
        this.bindEvent(this.formId, "submit", this.login);
        this.bindEvent(this.accountId, "keydown", this.onEnter);
        this.bindEvent(this.passwordId, "keydown", this.onEnter);
    }

    onEnter(event){
        /*在输入框按Enter键时，触发提交*/
        if (event.key === 'Enter' || event.keyCode === 13) {
            this.login();
            event.preventDefault(); // 阻止默认行为
        }
    }

    async login(event){
        /*登录*/
        let spinner = createSpinner(this.buttonId);
        try{
            event?.preventDefault();
            let responseData = await new SessionsView().login(
                document.getElementById(this.accountId)?.value,
                document.getElementById(this.passwordId)?.value,
                localStorage.getItem("deviceID")
            );
            localStorage.setItem("accessToken", responseData.accessToken);
            localStorage.setItem("refreshToken", responseData.refreshToken);
            localStorage.setItem("userID", responseData.userID);
            history.replaceState(null, document.title, "/home.html");
            window.location.href = "/home.html";
        }catch(error){
            new PopupMessage().displayErrorMessage(error);
        }finally{
            spinner?.remove();
        }
    }

    bindEvent(elementId, event, func){
        /*解绑原有事件，并绑定新的事件。绑定成功时记录。*/
        if(!(elementId in this.eventCache)){
            this.eventCache[elementId] = {};
        }
        if(!(event in this.eventCache[elementId])){
            this.eventCache[elementId][event] = null;
        }
        let beforeFunc = this.eventCache[elementId][event];
        callElement(elementId, element=>{
            if (beforeFunc){
                element.removeEventListener(event, beforeFunc);
            }
            element.addEventListener(event, func);
            this.eventCache[elementId][event]=func;
        });
    }
}