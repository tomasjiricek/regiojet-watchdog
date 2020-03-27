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
            searchResults: null,
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
        this.props.onToggleWatchdog(route);
    }

    handleSearchSubmit = () => {
        const { arrivalStation, date, departureStation, deviceId } = this.props;
        const { minDeparture, maxDeparture } = this.state;

        const body = JSON.stringify({
            arrivalStation,
            date: date.split('T')[0],
            departureStation,
            deviceId,
            minDeparture,
            maxDeparture,
        });

        this.setState({ loadingRoutes: true });
        const postRequest = request(API_URL.ROUTE_SEARCH).usePost();
        this.routeSearchAbort = postRequest.abort;
        postRequest
            .send({ body })
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
        this.setState({ searchResults: res.data, loadingRoutes: false });
    }

    render() {
        const {
            loadingStations,
            loadingRoutes,
            searchResults,
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
                {searchResults && <Results
                    loading={loadingRoutes}
                    data={searchResults}
                    onToggleWatchdog={this.handleToggleWatchdog}
                    watchedRoutes={this.props.watchedRoutes}
                />}
            </Fragment>
        );
    }
}

export default Search;
