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
        this.destinationsRequestController = new AbortController();
    }

    componentDidMount() {
        fetch(API_URL.DESTINATIONS, { signal: this.destinationsRequestController.signal })
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

    componentWillUnmount() {
        this.destinationsRequestController.abort();
    }

    handleDateChange = (date) => {
        this.props.onDateChange(date);
    }

    handleToggleWatchdog = (route) => {
        this.props.onToggleWatchdog(route);
    }

    handleSearchSubmit = () => {
        const { date, departureStation, arrivalStation } = this.props;
        const { minDeparture, maxDeparture } = this.state;
        const requestQuery = {
            date,
            minDeparture,
            maxDeparture,
            departureStationId: departureStation.id,
            arrivalStationId: arrivalStation.id,
        };

        this.setState({ loadingRoutes: true });

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
    }

    handleStationChange = (isDeparture, station) => {
        this.props.onStationChange(isDeparture, station);
    }

    handleStationsSwap = () => {
        this.props.onStationsSwap();
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

        const { date, departureStation, arrivalStation } = this.props;

        if (loadingDestinations) {
            return <h3>Načítání...</h3>;
        }

        return (
            <Fragment>
                <Selection
                    arrivalStation={arrivalStation}
                    date={date}
                    departureStation={departureStation}
                    loading={loadingRoutes}
                    stations={stations}
                    onDateChange={this.handleDateChange}
                    onStationChange={this.handleStationChange}
                    onStationsSwap={this.handleStationsSwap}
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
