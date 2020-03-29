import React, { Component, Fragment } from 'react';

import loadStations from './loadStations';
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
            loadingStations: true,
            loadingRoutes: false,
            stations: null,
            routes: null,
        };
    }

    componentDidMount() {
        this.loadStationsTimer = setTimeout(this.loadAndProcessStations, 200);
    }

    componentWillUnmount() {
        clearTimeout(this.loadStationsTimer);

        if (this.routeSearchAbort instanceof Function) {
            console.log('abort')
            this.routeSearchAbort();
            this.routeSearchAbort = null;
        }
    }

    handleDateChange = (date) => {
        this.props.onDateChange(date);
    }

    handleToggleWatchdog = (route) => {
        const routeData = {
            routeId: route.id,
            arrivalStationId: route.arrivalStation.id,
            arrivalStationName: route.arrivalStation.fullname,
            arrivalTime: route.arrivalTime,
            departureStationId: route.departureStation.id,
            departureStationName: route.departureStation.fullname,
            departureTime: route.departureTime,
            freeSeatsCount: route.freeSeatsCount,
            transfersCount: route.transfersCount,
            travelTime: route.travelTime,
            vehicleTypes: route.vehicleTypes
        };
        this.props.onToggleWatchdog(routeData);
    }

    handleSearchSubmit = () => {
        const { arrivalStation, date, departureStation, deviceId } = this.props;
        const { minDeparture, maxDeparture } = this.state;
        const requestQuery = {
            arrivalStationId: arrivalStation.id,
            arrivalStationType: arrivalStation.isCity ? 'CITY' : 'STATION',
            date: date.split('T')[0],
            departureStationId: departureStation.id,
            departureStationType: departureStation.isCity ? 'CITY' : 'STATION',
            deviceId,
            minDeparture,
            maxDeparture,
        };

        this.setState({ loadingRoutes: true });
        const fetchRequest = request(API_URL.ROUTE_SEARCH, requestQuery);
        this.routeSearchAbort = fetchRequest.abort;
        fetchRequest.send()
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

    loadAndProcessStations = () => {
        loadStations(this.props.deviceId)
            .then((stations) => {
                this.setState({ stations, loadingStations: false });
            })
            .catch((error) => {
                console.error('Failed to load destinations', error);
            });
    }

    processSearchResponse = (res) => {
        this.setState({ routes: res.data, loadingRoutes: false });
    }

    render() {
        const {
            loadingStations,
            loadingRoutes,
            routes,
            stations,
        } = this.state;

        const { date, departureStation, arrivalStation } = this.props;

        if (loadingStations) {
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
