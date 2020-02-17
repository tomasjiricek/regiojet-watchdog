import React, { Component, Fragment } from 'react';
import { PageHeader, Tab, Tabs } from 'react-bootstrap';

import About from './About';
import Search from './Search';
import StateStorage from '../utils/StateStorage';
import Watchdog from './Watchdog';
import { getUTCISODate } from '../utils/date';

import './app.css';

export default class App extends Component {
    constructor(props) {
        super(props);
        const defaultState = {
            activeContentTab: 1,
            date: getUTCISODate(new Date()),
            watchedRoutes: [],
            arrivalStation: null,
            departureStation: null,
            deviceId: null,
        };
        this.state = this.loadStateFromStorage(defaultState);
    }

    componentDidMount() {
        window.addEventListener('beforeunload', this.handleWindowUnload);
        this.stateSaveInterval = setInterval(this.saveCurrentState, 10000);
        if (this.state.deviceId === null) {
            this.fetchAndSaveDeviceId();
        }
    }

    componentWillUnmount() {
        window.removeEventListener('beforeunload', this.handleWindowUnload);
        clearInterval(this.stateSaveInterval);
    }

    fetchAndSaveDeviceId = async() => {
        try {
            const deviceIdResponse = await fetch('/api/device-id');
            const deviceId = await deviceIdResponse.json();
            this.setState({ deviceId });
        } catch (e) {
            console.error(e);
            setTimeout(this.fetchAndSaveDeviceId, 5000);
        }
    }

    handleDateChange = (date) => {
        this.setState({ date });
    }

    handleContentTabSelected = (selectedKey) => {
        this.setState({ activeContentTab: selectedKey });
    }

    handleStationChange = (isDeparture, station) => {
        if (isDeparture) {
            this.setState({ departureStation: station });
        } else {
            this.setState({ arrivalStation: station });
        }
    }

    handleStationsSwap = () => {
        const { arrivalStation, departureStation } = this.state;
        this.setState({ arrivalStation: departureStation, departureStation: arrivalStation });
    }

    handleToggleWatchdog = (route) => {
        const { watchedRoutes } = this.state;
        let newWatchedRoutes = watchedRoutes.filter((item) => (item.id !== route.id));

        if (watchedRoutes.length === newWatchedRoutes.length) {
            newWatchedRoutes.push(route);
        }

        this.setState({ watchedRoutes: newWatchedRoutes });
    }

    handleWindowUnload = () => {
        this.saveCurrentState();
    }

    loadStateFromStorage(defaultState) {
        const currentTimestamp = new Date().getTime();
        const loadedState = StateStorage.load();
        let state = { ...defaultState };

        if (loadedState) {
            for (const key in state) {
                if (state.hasOwnProperty(key) && loadedState.hasOwnProperty(key)) {
                    state[key] = loadedState[key] || state[key];
                }
            }
        }

        state.watchedRoutes = state.watchedRoutes.filter(({ departureTime }) => (
            new Date(departureTime).getTime() > currentTimestamp
        ));

        return state;
    }

    render() {
        return (
            <Fragment>
                <PageHeader style={{ marginLeft: '20px' }}>RegioJet vyhledávač</PageHeader>
                {this.renderContentTabs()}
            </Fragment>
        );
    }

    renderContentTabs() {
        return (
            <Tabs
                id="content-tabs"
                activeKey={this.state.activeContentTab}
                onSelect={this.handleContentTabSelected}
            >
                {this.renderSearchTab()}
                {this.renderWatchdogTab()}
                {this.renderAboutTab()}
            </Tabs>
        );
    }

    renderAboutTab() {
        return <Tab eventKey={3} title="O aplikaci"><About/></Tab>;
    }

    renderSearchTab() {
        const { arrivalStation, date, departureStation, watchedRoutes } = this.state;
        return (
            <Tab eventKey={1} title="Vyhledávání">
                <Search
                    arrivalStation={arrivalStation}
                    date={date}
                    departureStation={departureStation}
                    watchedRoutes={watchedRoutes}
                    onDateChange={this.handleDateChange}
                    onStationChange={this.handleStationChange}
                    onStationsSwap={this.handleStationsSwap}
                    onToggleWatchdog={this.handleToggleWatchdog}/>
            </Tab>
        );
    }

    renderWatchdogTab() {
        return (
            <Tab eventKey={2} title="Sledované spoje">
                <Watchdog routes={this.state.watchedRoutes} onUnwatch={this.handleToggleWatchdog}/>
            </Tab>
        );
    }

    saveCurrentState = () => {
        StateStorage.save(this.state);
    }
}
