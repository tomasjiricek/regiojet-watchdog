import React, { Component, Fragment } from 'react';
import { PageHeader, Tab, Tabs } from 'react-bootstrap';

import About from './About';
import MasterLogin from './Login/MasterLogin';
import Search from './Search';
import StateStorage from '../utils/StateStorage';
import UserLogin from './Login/UserLogin';
import Watchdog from './Watchdog';

import { getUTCISODate } from '../utils/date';
import request from '../utils/request';

import './app.css';

const PERSISTENT_STATE_ITEMS = [
    'activeContentTab',
    'arrivalStation',
    'departureStation',
    'watchedRoutes',
    'userData',
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
            isAuthorized: false,
            userVerified: false,
            loading: false,
            userData: null,
            ...loadedState,
        };
    }

    componentDidMount() {
        const { userData } = this.state;

        window.addEventListener('beforeunload', this.handleWindowUnload);

        this.stateSaveInterval = setInterval(this.saveCurrentState, 20000);
        if (userData !== null && Object.keys(userData).length > 0) {
            this.verifyUser();
        }

        Notification.requestPermission(function(status) {
            console.log('Notification permission status:', status);
        });

        this.registerServiceWorker();
        this.subscribeForNotifications();
    }

    componentDidUpdate(_, prevState) {
        if (this.state.userVerified && this.state.userVerified !== prevState.userVerified) {
            this.checkDeviceIdIsAuthorized();
        }
    }

    componentWillUnmount() {
        window.removeEventListener('beforeunload', this.handleWindowUnload);
        clearInterval(this.stateSaveInterval);
    }

    verifyUser() {
        const { userData: { token: userToken = null } } = this.state;
        if (userToken === null) {
            this.setState({ userData: null });
            return;
        }

        this.setState({ loading: true });
        const req = request('/api/user-verify');
        req.usePost();
        const body = JSON.stringify({ userToken });
        req.send({ body })
            .then((res) => {
                if (res.status !== 200) {
                    return Promise.reject();
                }
                return res.json();
            })
            .then((res) => {
                const { data: userData } = res;
                this.setState({ loading: false, userData, userVerified: userData });
            })
            .catch(() => this.setState({ loading: false, userData: null }));
    }

    checkDeviceIdIsAuthorized() {
        const { deviceId = null } = this.state.userData;

        if (!deviceId) {
            this.setState({ userData: null });
            return;
        }

        this.setState({ loading: true });
        request('/api/is-authorized', { deviceId })
            .send()
            .then((res) => {
                if (res.status !== 200) {
                    return Promise.reject();
                }
                return res.json();
            })
            .then((res) => this.setState({ loading: false, isAuthorized: res.data.authorized }))
            .catch(() => this.setState({ loading: false }));
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

    handleUserLogIn = (userData) => {
        this.setState({ userData });
        this.checkDeviceIdIsAuthorized();
    }

    handleUserRegister = (userData) => {
        this.handleUserLogIn(userData);
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

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('static/sw.js', { scope: '/' }).then(function(reg) {
                console.log('Service Worker Registered!', reg);

                reg.pushManager.getSubscription().then(function(sub) {
                    if (sub === null) {
                        // Update UI to ask user to register for Push
                        console.log('Not subscribed to push service!');
                    } else {
                        // We have a subscription, update the database
                        console.log('Subscription object: ', sub);
                    }
                });
            })
            .catch(function(err) {
                console.log('Service Worker registration failed: ', err);
            });
        }
    }

    render() {
        const { isAuthorized, loading, userData } = this.state;

        if (loading) {
            return this.renderPageHeader('Načítání...');
        }

        if (userData === null || Object.keys(userData).length === 0) {
            return this.renderUserLogin();
        }

        if (!isAuthorized) {
            return this.renderMasterLogin();
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
        const { userData } = this.state;
        if (userData === null) {
            return null;
        }

        return <MasterLogin deviceId={userData.deviceId} onAuthorize={this.handleMasterLoginAuthorize} />;
    }

    renderUserLogin() {
        return <UserLogin onLogIn={this.handleUserLogIn} onRegister={this.handleUserRegister}/>;
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
        const { arrivalStation, date, departureStation, userData, watchedRoutes } = this.state;
        return (
            <Tab eventKey={1} title="Vyhledávání">
                <Search
                    arrivalStation={arrivalStation}
                    date={date}
                    departureStation={departureStation}
                    deviceId={userData.deviceId}
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
        const { userData, watchedRoutes } = this.state;
        return (
            <Tab eventKey={2} title="Sledované spoje">
                <Watchdog
                    deviceId={userData.deviceId}
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

    subscribeForNotifications() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready
                .then((reg) => {
                    reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: "WEBPACK_VAR_WEB_PUSH_PUBLIC_KEY" })
                        .then((sub) => {
                            console.log('Endpoint URL: ', sub.endpoint);
                        })
                        .catch((e) => {
                            if (Notification.permission === 'denied') {
                                console.warn('Permission for notifications was denied');
                            } else {
                                console.error('Unable to subscribe to push', e);
                            }
                        });
                });
            }
      }
}
