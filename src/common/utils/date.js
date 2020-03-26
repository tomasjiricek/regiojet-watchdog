function getShortCzechDateAndTime(dateObj) {
    let hours = dateObj.getHours();
    let minutes = dateObj.getMinutes();

    if (hours < 10) {
        hours = `0${hours}`;
    }

    if (minutes < 10) {
        minutes = `0${minutes}`;
    }

    return `${dateObj.getDate()}. ${dateObj.getMonth() + 1}. - ${hours}:${minutes}`;
}

function getUTCISODate(dateObj) {
    const day = `${dateObj.getDate()}`.padStart(2, '0');
    const month = `${dateObj.getMonth() + 1}`.padStart(2, '0');
    return `${dateObj.getFullYear()}-${month}-${day}`;
}

module.exports = {
    getShortCzechDateAndTime,
    getUTCISODate
};
