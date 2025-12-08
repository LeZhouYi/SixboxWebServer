class PopupMessage{

    constructor(){
        this.addContainer();
    }

    addContainer(){
        /*添加弹窗容器*/
        let overlay = document.querySelector(".message-overlay");
        if(!overlay){
            overlay = document.createElement("div");
            overlay.classList.add("message-overlay");
            document.body.appendChild(overlay);
        }
        let container = document.querySelector(".message-container");
        if(!container){
            container = document.createElement("div");
            container.classList.add("message-container");
            overlay.appendChild(container);
        }
    }

    displayMessage(message, styleClass,iconUrl,removeTime){
        /*显示信息*/
        let container = document.querySelector(".message-container");
        if(!container){
            return;
        }
        let messageIcon = document.createElement("div");
        messageIcon.classList.add("message-icon");
        let icon = document.createElement("img");
        icon.src = iconUrl;
        messageIcon.appendChild(icon);

        let messageText = document.createElement("div");
        messageText.classList.add("message-text");
        messageText.textContent = message;

        let messageItem = document.createElement("div");
        messageItem.classList.add(styleClass);
        messageItem.appendChild(messageIcon);
        messageItem.appendChild(messageText);

        container.appendChild(messageItem);
        setTimeout(() => {
            messageItem.remove();
        }, removeTime);
    }

    displayErrorMessage(error, styleClass= "error-message", iconUrl="/static/icons/alert.png", removeTime=3500){
        /*显示错误信息*/
        console.log(error.message);
        console.log(error.stack);
        this.displayMessage(error.message,styleClass,iconUrl,removeTime);
    }

    displaySuccessMessage(message, styleClass="success-message", iconUrl="/static/icons/correct.png", removeTime=3500){
        /*显示成功信息*/
        this.displayMessage(message,styleClass,iconUrl,removeTime);
    }
}