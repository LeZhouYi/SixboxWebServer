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

    initBind(){
        this.bindOnDrop(null);
        this.bindOnClick(null);
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

    setData(filedata){
        /*设置数据*/
        callElement(this.containerID, element=>{
            let input = element.querySelector("input");
            if(input&&filedata){
                element.classList.add("form-file-drop");
                let inputDisplay = element.querySelector(".form-file-input");
                inputDisplay?.classList.add("hidden");
                let fileDisplay = element.querySelector(".form-file-display");
                if(!fileDisplay){
                    return;
                }
                fileDisplay.classList.remove("hidden");
                let nameDiv = fileDisplay.querySelector(".form-filename");
                nameDiv.textContent = filedata;
                this.tempFile = [];
                this.tempFile.push(filedata);
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

class FormUtils{
    static initFormSelect(){
        for(let element of document.querySelectorAll(".form-select")){
            element.addEventListener("click", () => {
                if(element.classList.contains("is-open")){
                    element.classList.remove("is-open");
                }else{
                    element.classList.add("is-open");
                }
            });
            element.addEventListener("blur", () => element.classList.remove("is-open"));
        }
    }

    static adjustTextAreaHeight(padding=10){
        for(let element of document.querySelectorAll(".form-textarea")){
            function adjustHeight() {
                element.style.height = "auto";
                let height = element.scrollHeight + padding;
                element.style.height = height + "px";
            }
            element.addEventListener("input", debounce(adjustHeight,200));
            window.addEventListener("resize", debounce(adjustHeight,800));
        }
    }

    static initEditTinyMce(elementID, language="zh_CN"){
        tinymce.init({
            selector: `#${elementID}`,
            language: language,
            resize: false,
            visualblocks_default_state: true,
            plugins: "preview searchreplace autolink directionality visualblocks visualchars fullscreen image link " +
                "media code codesample table charmap pagebreak nonbreaking anchor insertdatetime advlist lists " +
                "wordcount help emoticons autoresize",
            toolbar: "code undo redo restoredraft | cut copy paste pastetext | forecolor backcolor bold italic " +
                "underline strikethrough link anchor | alignleft aligncenter alignright alignjustify outdent indent " +
                " | styleselect formatselect fontselect fontsizeselect | bullist numlist | blockquote subscript "+
                "superscript removeformat | table image media charmap emoticons pagebreak insertdatetime preview | "+
                "fullscreen | bdmap lineheight",
            min_height: 400,
            fontsize_formats: "12px 14px 16px 18px 24px 36px 48px 56px 72px",
            font_formats: "微软雅黑=Microsoft YaHei,Helvetica Neue,PingFang SC,sans-serif;"+
                "苹果苹方=PingFang SC,Microsoft YaHei,sans-serif;宋体=simsun,serif;仿宋体=FangSong,serif;"+
                "黑体=SimHei,sans-serif;Arial=arial,helvetica,sans-serif;Arial Black=arial black,avant garde;"+
                "Book Antiqua=book antiqua,palatino;",
            importcss_append: true,
            toolbar_sticky: false,
            autosave_ask_before_unload: false,
            elementpath: true,
            branding: false,
            promotion: false,
            license_key: "gpl",
            fullscreen_native: true
        });
    }

    static initDisplayTinyMce(elementID, language="zh_CN"){
        tinymce.init({
            selector: `#${elementID}`,
            language: language,
            readonly: true,
            resize: false,
            visualblocks_default_state: true,
            menubar: false,
            toolbar: false,
            min_height: 400,
            plugins: "autoresize",
            fontsize_formats: "12px 14px 16px 18px 24px 36px 48px 56px 72px",
            font_formats: "微软雅黑=Microsoft YaHei,Helvetica Neue,PingFang SC,sans-serif;"+
                "苹果苹方=PingFang SC,Microsoft YaHei,sans-serif;宋体=simsun,serif;仿宋体=FangSong,serif;"+
                "黑体=SimHei,sans-serif;Arial=arial,helvetica,sans-serif;Arial Black=arial black,avant garde;"+
                "Book Antiqua=book antiqua,palatino;",
            importcss_append: true,
            toolbar_sticky: false,
            autosave_ask_before_unload: false,
            elementpath: true,
            branding: false,
            promotion: false,
            license_key: "gpl",
            fullscreen_native: true,
            setup: function(editor) {
                editor.on('init', function() {
                    // 初始化后手动调整高度
                    editor.execCommand('mceAutoResize');
                });
            }
        });
    }
}