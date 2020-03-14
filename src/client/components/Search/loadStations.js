import request from "../../utils/request";
import { API_URL } from "../../constants";

const loadStations = (deviceId) => {
    const req = request(API_URL.DESTINATIONS, { deviceId });
    return req.send()
        .then((res) => {
            if (res.status !== 200) {
                return;
            }
            return res.json().then(processDestinationsResponse);
        });
}

const processDestinationsResponse = (res) => {
    const stations = [];
    res.data.destinations.forEach((destination) => {
        destination.cities.forEach((city) => {
            city.city = city.name;
            city.country = destination.country;
            city.fullname = city.name;
            city.isCity = true;
            stations.push({ ...city, stations: null })
            city.stations.forEach((station) => {
                station.country = destination.country;
                station.cityId = city.id;
                station.city = city.name;
                station.isCity = false;
                stations.push(station);
            });
        });
    });
    return stations;
}

export default loadStations;