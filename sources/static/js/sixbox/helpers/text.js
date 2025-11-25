function formatString(template, ...args) {
    let index = 0;
    return template.replace(/%s/g, () => {
        return index < args.length ? args[index++] : '';
    });
}