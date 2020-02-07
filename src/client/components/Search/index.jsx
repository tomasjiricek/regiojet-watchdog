import React, { Component, Fragment } from 'react';

import Selection from './Selection';
import Results from './Results';
import request from '../../utils/request';

import { API_URL } from '../../constants';

class Search extends Component {
    constructor(props) {
        super(props);
        this.state = {
            minDeparture: '00:00',
            maxDeparture: '23:59',
            loadingDestinations: true,
            loadingRoutes: false,
            stations: null,
            routes: null,
        };
    }

    componentDidMount() {
        fetch(API_URL.DESTINATIONS)
            .then((res) => {
                if (res.status !== 200) {
                    return;
                }
                res.json().then(this.processDestinationsResponse);
            })
            .catch((error) => {
                console.log(error);
            });
    }

    handleToggleWatchdog = (route) => {
        this.props.onToggleWatchdog(route);
    }

    handleSearchSubmit = (date) => {
        const { departureStation, arrivalStation } = this.props;
        const { minDeparture, maxDeparture } = this.state;
        const requestQuery = {
            date,
            minDeparture,
            maxDeparture,
            departureStationId: departureStation.id,
            arrivalStationId: arrivalStation.id,
        };

        request(API_URL.ROUTE_SEARCH, requestQuery)
            .then((res) => {
                if (res.status !== 200) {
                    return;
                }
                res.json().then(this.processSearchResponse);
            })
            .catch((error) => {
                console.log('Search request error:', error);
            });

        this.setState({ loadingRoutes: true });
    }

    handleStationChange = (isDeparture, station) => {
        console.log(isDeparture, station);
        this.props.onStationChange(isDeparture, station);
    }

    processDestinationsResponse = (res) => {
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
        this.setState({ stations, loadingDestinations: false });
    }

    processSearchResponse = (res) => {
        this.setState({ routes: res.data, loadingRoutes: false });
    }

    render() {
        const {
            loadingDestinations,
            loadingRoutes,
            routes,
            stations,
        } = this.state;

        const { departureStation, arrivalStation } = this.props;

        if (loadingDestinations) {
            return <h3>Načítání...</h3>;
        }

        return (
            <Fragment>
                <Selection
                    departureStation={departureStation}
                    arrivalStation={arrivalStation}
                    loading={loadingRoutes}
                    stations={stations}
                    onStationChange={this.handleStationChange}
                    onSubmit={this.handleSearchSubmit}
                />
                <Results
                    loading={loadingRoutes}
                    departureStation={departureStation}
                    arrivalStation={arrivalStation}
                    routes={routes}
                    onToggleWatchdog={this.handleToggleWatchdog}
                    watchedRoutes={this.props.watchedRoutes}
                />
            </Fragment>
        );
    }
}

export default Search;
