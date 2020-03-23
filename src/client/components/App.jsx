import React, { Component, Fragment } from 'react';
import { PageHeader, Tab, Tabs, Button } from 'react-bootstrap';

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
    'userData',
];

function getWatchedRouteIndex(watchedRoutes, route) {
    const { arrivalStationId, departureStationId, id: routeId } = route;
    for (let i = 0; i < watchedRoutes.length; i++) {
        const item = watchedRoutes[i];
        if (!(item instanceof Object)) {
            continue;
        }

        if (
            routeId === item.id &&
            arrivalStationId === item.arrivalStationId &&
            departureStationId === item.departureStationId
        ) {
            return i;
        }
    }
    return null;
}

export default class App extends Component {
    constructor(props) {
        super(props);
        const loadedState = this.loadStateFromStorage();

        this.pushSubscription = null;
        this.state = {
            activeContentTab: 1,
            date: getUTCISODate(new Date()),
            watchedRoutes: null,
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

        Notification.requestPermission((status) => {
            // Handle the status if necessary
        });

        this.registerServiceWorker();
    }

    componentDidUpdate(_, prevState) {
        const { isAuthorized, loading, userData, userVerified, watchedRoutes } = this.state;
        if (userVerified && userVerified !== prevState.userVerified) {
            this.checkDeviceIdIsAuthorized();
        }
        if (!loading && userData !== null && userVerified && isAuthorized && watchedRoutes === null) {
            this.loadWatchedRoutes();
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
        const req = request('/api/user/verify');
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
            .then((res) => {
                this.subscribeForNotifications();
                return Promise.resolve(res);
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

    handleReloadRoutesClick = (event) => {
        event.preventDefault();
        this.loadWatchedRoutes();
    }

    handleUserLogIn = (userData) => {
        this.setState({ userData, userVerified: true });
        this.checkDeviceIdIsAuthorized();
    }

    handleUserLogOut = () => {
        this.setState({ userData: null, userVerified: false, isAuthorized: false, watchedRoutes: null });
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
        const existingRouteIndex = getWatchedRouteIndex(watchedRoutes, route);

        if (existingRouteIndex !== null) {
            watchedRoutes.splice(existingRouteIndex, 1);
            this.unwatchRoute(route);
        } else {
            watchedRoutes.push(route);
            this.watchRoute(route);
        }

        this.setState({ watchedRoutes });
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

    loadWatchedRoutes() {
        const { token: userToken = null } = this.state.userData;

        if (userToken === null) {
            return;
        }

        this.setState({ loading: true });
        const body = JSON.stringify( { userToken });
        request('/api/watchdog/routes')
            .usePost()
            .send({ body })
            .then((res) => {
                if (res.status !== 200) {
                    return Promise.reject();
                }
                return res.json();
            })
            .then((res) => this.setState({ loading: false, watchedRoutes: res.data }))
            .catch(() => this.setState({ loading: false }));
    }

    renderLogOutButton() {
        return (
            <Button className="logout-button" onClick={this.handleUserLogOut}>Odhlásit</Button>
        );
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('static/sw.js', { scope: '/' }).then((reg) => {
                reg.pushManager.getSubscription().then((subscription) => {
                    if (subscription === null) {
                        // Update UI to ask user to register for Push
                    } else {
                        this.pushSubscription = subscription;
                    }
                });
            })
            .catch((err) => {
                console.info('Service Worker registration failed: ', err);
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
        const { userVerified } = this.state;

        return (
            <PageHeader>
                {title}
                {userVerified && this.renderLogOutButton()}
            </PageHeader>
        );
    }

    renderMasterLogin() {
        const { userData } = this.state;
        if (userData === null) {
            return null;
        }

        return <MasterLogin deviceId={userData.deviceId} onAuthorize={this.handleMasterLoginAuthorize}/>;
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
        const { userData: { deviceId }, watchedRoutes } = this.state;
        return (
            <Tab eventKey={2} title="Sledované spoje">
                {watchedRoutes !== null
                    ? <Watchdog deviceId={deviceId} routes={watchedRoutes} onUnwatch={this.handleToggleWatchdog}/>
                    : (
                        <h3>
                            Chyba při načítání sledovaných spojů.
                            <a href="" onClick={this.handleReloadRoutesClick}>Zkusit znovu</a>
                        </h3>
                    )
                }
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

    saveSubscription = (subscription) => {
        this.pushSubscription = subscription;
        const { userData: { token: userToken = null } } = this.state;
        const body = JSON.stringify({ userToken, subscription });

        request('/api/user/push-subscribe')
            .usePost()
            .send({ body })
            .then(() => {
                // BE subscribed
            })
            .catch((error) => {
                // BE subscription error
            });
    }

    subscribeForNotifications() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
                reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: WEBPACK_VAR_WEB_PUSH_PUBLIC_KEY })
                    .then((sub) => this.saveSubscription(sub))
                    .catch((e) => {
                        if (Notification.permission === 'denied') {
                            // Permission denied
                        } else {
                            console.error('Unable to subscribe to push.', e);
                        }
                    });
            });
        }
    }

    unwatchRoute(route) {
        const { userData: { token: userToken } } = this.state;
        const body = JSON.stringify({ userToken, route });

        request('/api/watchdog/unwatch')
            .usePost()
            .send({ body })
            .catch((_) => {
                // Failed to unwatch the route
            });
    }

    watchRoute(route) {
        const { arrivalStation, departureStation, userData: { token: userToken } } = this.state;
        const body = JSON.stringify({ userToken, route: { ...route, arrivalStation, departureStation } });

        request('/api/watchdog/watch')
            .usePost()
            .send({ body })
            .catch((_) => {
                // Failed to watch the route
            });
    }
}
