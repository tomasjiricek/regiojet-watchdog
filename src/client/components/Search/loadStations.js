import request from "../../utils/request";
import { API_URL } from "../../constants";

const loadStations = () => {
    const req = request(API_URL.DESTINATIONS);
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
            city.stations.forEach((station) => {
                station.country = destination.country;
                station.city = city.name;
                stations.push(station);
            });
        });
    });
    return stations;
}

export default loadStations;