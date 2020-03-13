import React, { Component, Fragment } from 'react';
import { PageHeader, Tab, Tabs } from 'react-bootstrap';

import About from './About';
import MasterLogin from './Login/MasterLogin';
import Search from './Search';
import StateStorage from '../utils/StateStorage';
import Watchdog from './Watchdog';
import { getUTCISODate } from '../utils/date';
import request from '../utils/request';

import './app.css';
import UserLogin from './Login/UserLogin';

const PERSISTENT_STATE_ITEMS = [
    'activeContentTab',
    'arrivalStation',
    'departureStation',
    'deviceId',
    'watchedRoutes',
]

export default class App extends Component {
    constructor(props) {
        super(props);
        const loadedState = this.loadStateFromStorage();
        this.state = {
            activeContentTab: 1,
            date: getUTCISODate(new Date()),
            watchedRoutes: [],
            arrivalStation: null,
            departureStation: null,
            deviceId: null,
            isAuthorized: false,
            isCheckingAuthorization: true,
            ...loadedState,
        };
    }

    componentDidMount() {
        window.addEventListener('beforeunload', this.handleWindowUnload);
        this.stateSaveInterval = setInterval(this.saveCurrentState, 20000);
        if (this.state.deviceId === null) {
            this.fetchAndSaveDeviceId();
        } else {
            this.checkDeviceIdIsAuthorized();
        }
    }

    componentWillUnmount() {
        window.removeEventListener('beforeunload', this.handleWindowUnload);
        clearInterval(this.stateSaveInterval);
    }

    fetchAndSaveDeviceId = async() => {
        try {
            const deviceIdResponse = await fetch('/api/device-id');
            const deviceIdJson = await deviceIdResponse.json();
            this.setState({ deviceId: deviceIdJson.data });
        } catch (e) {
            console.error(e);
            setTimeout(this.fetchAndSaveDeviceId, 5000);
        }
    }

    checkDeviceIdIsAuthorized() {
        const { deviceId } = this.state;
        request('/api/is-authorized', { deviceId })
            .send()
            .then((res) => res.json())
            .then((res) => {
                this.setState({ isCheckingAuthorization: false, isAuthorized: res.data.authorized });
            })
            .catch(() => {
                // Request failed
            })
    }

    handleDateChange = (date) => {
        this.setState({ date });
    }

    handleContentTabSelected = (selectedKey) => {
        this.setState({ activeContentTab: selectedKey });
    }

    handleMasterLoginAuthorize = () => {
        this.setState({ isAuthorized: true });
    }

    handleUserLoginSubmit = (securityImageIndex, knockCode) => {
        console.log(securityImageIndex, knockCode);
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

    loadStateFromStorage() {
        const currentTimestamp = new Date().getTime();
        const loadedState = StateStorage.load();
        let state = {};

        if (loadedState) {
            PERSISTENT_STATE_ITEMS.forEach((key) => {
                if (loadedState.hasOwnProperty(key)) {
                    state[key] = loadedState[key];
                }
            });
        }

        if (state.watchedRoutes instanceof Array) {
            state.watchedRoutes = state.watchedRoutes.filter(({ departureTime }) => (
                new Date(departureTime).getTime() > currentTimestamp
            ));
        }

        return state;
    }

    render() {
        const { deviceId, isAuthorized, isCheckingAuthorization } = this.state;

        if (deviceId === null || isCheckingAuthorization) {
            return this.renderPageHeader('Načítání...');
        }

        if (!isAuthorized) {
            return this.renderUserLogin(); // this.renderMasterLogin();
        }

        return (
            <Fragment>
                {this.renderPageHeader('RegioJet hlídač')}
                {this.renderContentTabs()}
            </Fragment>
        );
    }

    renderPageHeader(title) {
        return <PageHeader>{title}</PageHeader>
    }

    renderMasterLogin() {
        return <MasterLogin deviceId={this.state.deviceId} onAuthorize={this.handleMasterLoginAuthorize} />;
    }

    renderUserLogin() {
        return <UserLogin onLoginSubmit={this.handleUserLoginSubmit} />;
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
        const { arrivalStation, date, departureStation, deviceId, watchedRoutes } = this.state;
        return (
            <Tab eventKey={1} title="Vyhledávání">
                <Search
                    arrivalStation={arrivalStation}
                    date={date}
                    departureStation={departureStation}
                    deviceId={deviceId}
                    watchedRoutes={watchedRoutes}
                    onDateChange={this.handleDateChange}
                    onStationChange={this.handleStationChange}
                    onStationsSwap={this.handleStationsSwap}
                    onToggleWatchdog={this.handleToggleWatchdog}
                />
            </Tab>
        );
    }

    renderWatchdogTab() {
        const { deviceId, watchedRoutes } = this.state;
        return (
            <Tab eventKey={2} title="Sledované spoje">
                <Watchdog
                    deviceId={deviceId}
                    routes={watchedRoutes}
                    onUnwatch={this.handleToggleWatchdog}
                />
            </Tab>
        );
    }

    saveCurrentState = () => {
        let state = {};
        PERSISTENT_STATE_ITEMS.forEach((item) => {
            state[item] = this.state[item];
        });
        StateStorage.save(state);
    }
}
