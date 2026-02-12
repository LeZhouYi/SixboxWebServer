/*处理HTML元素*/

function callElement(elementId, callback) {
    /*获取元素并校验是否存在，存在则执行callback*/
    let element = document.getElementById(elementId);
    if (element && callback) {
        callback(element);
    }
}

function adjustBorderRadius(element, offset=2){
    // 获取当前border-radius值
    const computedStyle = window.getComputedStyle(element);
    let borderRadius = computedStyle.borderRadius;

    // 如果当前值为0，则保持不变
    if (borderRadius === "0px" || borderRadius === "0") {
        return borderRadius;
    }

    // 解析并计算新值
    if (borderRadius.includes(" ")) {
        // 处理多个值的情况（如：10px 20px 30px 40px）
        const values = borderRadius.split(" ");
        const adjustedValues = values.map(value => {
            const numValue = parseFloat(value);
            const unit = value.replace(numValue.toString(), "");
            return (numValue - offset) + unit;
        });
        return adjustedValues.join(" ");
    } else if (borderRadius.includes("/")) {
        // 处理椭圆角的情况（如：10px / 20px）
        const [horizontal, vertical] = borderRadius.split("/");
        const adjustedHorizontal = parseFloat(horizontal) - offset + "px";
        const adjustedVertical = parseFloat(vertical) - offset + "px";
        return `${adjustedHorizontal} / ${adjustedVertical}`;
    } else {
        // 处理单个值的情况
        const numValue = parseFloat(borderRadius);
        const unit = borderRadius.replace(numValue.toString(), "");
        return (numValue - offset) + unit;
    }
}

function resizeFullScreen() {
    /*计算并调整页页使用适应全屏*/
    let bodyContainer = document.body;
    let height = Math.max(window.innerHeight,document.documentElement.clientHeight);
    bodyContainer.style.height = String(height) + "px";
}