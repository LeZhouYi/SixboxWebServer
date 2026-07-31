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
        let player = videojs.getPlayer(this.videoID);
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
        let player = videojs.getPlayer(this.videoID);
        if(player){
            player.currentTime(player.currentTime() + seconds);
        }
    }

    hideContainer(){
        /*关闭视频*/
        super.hideContainer();

        let player = videojs.getPlayer(this.videoID);
        player?.dispose();
        player = null;

        let videoElement = document.getElementById(this.videoID);
        if(videoElement){
            videoElement.remove();
        }

        let container = document.getElementById(this.containerID);
        if(container){
            let videoContainer = container.querySelector('.popup-video');
            if(videoContainer){
                let videoPanel = document.createElement("video");
                videoPanel.id = this.videoID;
                videoPanel.controls = true;
                videoPanel.classList.add("video-js", "popup-video-container");
                videoContainer.insertBefore(videoPanel, videoContainer.firstChild);
            }
        }
    }

    showVideo(src,fileType){
        /*显示视频*/
        let func = this.showContainer.bind(this);
        this.showContainer();

        let player = videojs.getPlayer(this.videoID);
        if (player){
            player.dispose();
            player = null;
        }

        videojs(this.videoID, {
            controls: false,
            autoplay: true,
            fluid: false,    //自适应容器宽度
            preload: "auto",
            muted: false
        }).ready(function () {
            let nowPlayVolume = localStorage.getItem("nowPlayVolume");
            this.volume(nowPlayVolume);
            this.src({
                src: src,
                type: fileType
            });

            this.play().catch(error=>{
                console.log("自动播放被阻止",error);
            });
            func?.();
        });
    }

}