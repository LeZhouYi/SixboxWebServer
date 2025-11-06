const API_PREFIX = "/api/v1";
const ERROR_CODE = [400,401];

async function postJson(url, postData) {
    /*post传输json数据*/
    const response = await fetch(API_PREFIX + url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(postData)
    });
    var statusCode = response.status;
    if (!response.ok) {
        if (ERROR_CODE.includes(statusCode)) {
            let data = await response.json();
            throw new Error(data.message);
        }
        throw new Error(`HTTP ERROR: ${statusCode}`);
    } else {
        const data = await response.json();
        return data;
    }
}