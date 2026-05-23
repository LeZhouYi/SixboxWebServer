class PopupVideo extends PopupContainer{

    constructor(containerID, videoID="videoPlayer"){
        super(containerID);
        this.videoID = videoID;
        this.init();
    }

    init(){
        let closeVideoButton = document.getElementById("closeVideoButton");
        closeVideoButton?.addEventListener("click", this.hideContainer.bind(this));
        let fastReverseButton = document.getElementById("fastReverseButton");
        fastReverseButton?.addEventListener("click", this.adjustProgress.bind(this, -600));
        let fastForwardButton = document.getElementById("fastForwardButton");
        fastForwardButton?.addEventListener("click", this.adjustProgress.bind(this, 600));
        let reverseButton = document.getElementById("reverseButton");
        reverseButton?.addEventListener("click", this.adjustProgress.bind(this, -60));
        let forwardButton = document.getElementById("forwardButton");
        forwardButton?.addEventListener("click", this.adjustProgress.bind(this, 60));
        let playPauseButton = document.getElementById("playPauseButton");
        playPauseButton?.addEventListener("click", this.playOrPause.bind(this));
    }

    playOrPause(){
        /*播放暂停*/
        let player = videojs(this.videoID);
        if(player){
            let isPaused = player.paused();
            player.paused() ? player.play() : player.pause();
            let playPauseButton = document.getElementById("playPauseButton");
            if(playPauseButton){
                playPauseButton.src = isPaused ? "/static/images/caret_forward.png" : "/static/images/pause.png";
            }
        }
    }

    adjustProgress(seconds = 60){
        // 调整播放进度
        let player = videojs(this.videoID);
        if(player){
            player.currentTime(player.currentTime() + seconds);
        }
    }

    hideContainer(){
        /*关闭视频*/
        super.hideContainer();
        let player = videojs(this.videoID);
        player?.dispose();
        callElement(this.videoID, element => {
            element.remove();
        });
        let container = document.getElementById(this.containerID);
        if(container){
            let videoPanel = document.createElement("video");
            videoPanel.id = this.videoID;
            videoPanel.controls = true;
            videoPanel.classList.add("video-js", "popup-video-container");
            container.insertBefore(videoPanel, container.firstChild);
        }
    }

    showVideo(src,fileType){
        /*显示视频*/
//        let func = this.showContainer.bind(this);
//        videojs(this.videoID, {
//            controls: true,
//            autoplay: false,
//            fluid: false,
//            preload: false,
//            muted: false
//        }).ready(function () {
//            this.volume(nowPlayVolume);
//            this.src({
//                src: src,
//                type: fileType
//            });
//            func?.();
//        });
        this.showContainer();
    }

}