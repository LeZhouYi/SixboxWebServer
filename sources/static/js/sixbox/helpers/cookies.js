/*cookies相关*/

function initLanguage(){
    /*初始化用户的语言*/
    let hasLangCookie = document.cookie.split("; ").some(row => row.startsWith("user_lang="));
    if (!hasLangCookie) {
        const htmlLang = document.documentElement.lang || "zh";
        document.cookie = `user_lang=${htmlLang}; path=/; max-age=${30 * 24 * 60 * 60}`;
    }
}

function setLanguage(lang) {
    // 设置 Cookie，有效期 30 天
    const maxAge = 30 * 24 * 60 * 60;
    document.cookie = `user_lang=${lang}; path=/; max-age=${maxAge}; SameSite=Lax`;

    // 重新加载页面以触发后端读取新 Cookie
    window.location.reload();
}