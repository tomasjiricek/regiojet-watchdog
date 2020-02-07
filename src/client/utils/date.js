export const getUTCISODate = (dateObj) => {
    const day = `${dateObj.getDate()}`.padStart(2, '0');
    const month = `${dateObj.getMonth() + 1}`.padStart(2, '0');
    return `${dateObj.getFullYear()}-${month}-${day}`;
};
