class FormFileUploader{

    constructor(containerID){
        this.containerID = containerID;
        this.tempFile = [];

        this.init();
    }

    init(){
        callElement(this.containerID, element=>{
            /*当文件拖进区域*/
            element.addEventListener("dragenter", (event)=>{
                event.stopPropagation();
                event.preventDefault();
                element.classList.add("form-file-enter");
                let input = element.querySelector(".form-file-input");
                input?.classList.add("form-file-enter");
            });
            /*当文件离开区域*/
            element.addEventListener("dragleave", (event)=>{
                event.stopPropagation();
                event.preventDefault();
                if(!element.contains(event.relatedTarget)){
                    element.classList.remove("form-file-enter");
                    let input = element.querySelector(".form-file-input");
                    input?.classList.remove("form-file-enter");
                }
            });
            element.addEventListener("dragover",(event)=>{
                event.stopPropagation();
                event.preventDefault();
            });

            /*点击选择文件*/
            element.addEventListener("click", (event)=>{
                if(this.tempFile.length > 0){
                    return;
                }
                let input = element.querySelector("input");
                input?.click();
            });

            let displayIcon = element.querySelector(".form-remove-icon");
            displayIcon?.addEventListener("click", (event)=>{
                event.stopPropagation();
                this.reset();
            });
        });
    }

    bindOnDrop(callback){
        /*绑定释放事件*/
        callElement(this.containerID, element=>{
            element.addEventListener("drop", (event)=>{
                event.stopPropagation();
                event.preventDefault();
                // 恢复原样
                element.classList.remove("form-file-enter");
                let input = element.querySelector(".form-file-input");
                input?.classList.remove("form-file-enter");
                // 切换为显示已上传的文件
                let files = event.dataTransfer.files;
                if (files.length > 0) {
                    element.classList.add("form-file-drop");
                    input?.classList.add("hidden");
                    let display = element.querySelector(".form-file-display");
                    if(!display){
                        return;
                    }
                    display.classList.remove("hidden");
                    let nameDiv = display.querySelector(".form-filename");
                    nameDiv.textContent = files[0].name;
                    this.tempFile = [];
                    this.tempFile.push(files[0]);
                    callback?.();
                }
            });
        });
    }

    bindOnClick(callback){
        /*点击选择文件*/
        callElement(this.containerID, element=>{
            let input = element.querySelector("input");
            if(input){
                input.addEventListener("change", (event)=>{
                    let files = event.target.files;
                    if (files.length > 0) {
                        element.classList.add("form-file-drop");
                        let inputDisplay = element.querySelector(".form-file-input");
                        inputDisplay?.classList.add("hidden");
                        let fileDisplay = element.querySelector(".form-file-display");
                        if(!fileDisplay){
                            return;
                        }
                        fileDisplay.classList.remove("hidden");
                        let nameDiv = fileDisplay.querySelector(".form-filename");
                        nameDiv.textContent = files[0].name;
                        this.tempFile = [];
                        this.tempFile.push(files[0]);
                        callback?.();
                    }
                });
            }
        });
    }

    reset(){
        /*恢复默认状态*/
        let element = document.getElementById(this.containerID);
        if(!element){
            return;
        }
        this.tempFile = [];
        let display = element.querySelector(".form-file-display");
        display?.classList.add("hidden");
        let input = element.querySelector(".form-file-input");
        input?.classList.remove("hidden");
    }

}