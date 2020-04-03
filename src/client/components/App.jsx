import React, { Component, Fragment } from 'react';
import { PageHeader, Tab, Tabs, Button } from 'react-bootstrap';

import About from './About';
import ConfirmationModal from './ConfirmationModal';
import MasterLogin from './Login/MasterLogin';
import Search from './Search';
import StateStorage from '../utils/StateStorage';
import UserLogin from './Login/UserLogin';
import Watchdog from './Watchdog';

import { getUTCISODate } from '../../common/utils/date';
import request from '../utils/request';

import './app.css';

const PERSISTENT_STATE_ITEMS = [
    'activeContentTab',
    'arrivalStation',
    'departureStation',
    'userData',
];

const INTERVAL_REFRESH_WATCHED_ROUTES = 20000;

function getWatchedRouteIndex(watchedRoutes, route) {
    const { arrivalStationId, departureStationId, routeId } = route;
    for (let i = 0; i < watchedRoutes.length; i++) {
        const item = watchedRoutes[i];
        if (!(item instanceof Object)) {
            continue;
        }

        if (
            routeId === item.routeId &&
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
            arrivalStation: null,
            date: getUTCISODate(new Date()),
            departureStation: null,
            isAuthorized: false,
            loading: false,
            notificationDialogDismissed: false,
            notificationsSubscriptionError: null,
            subscribed: false,
            userData: null,
            userVerified: false,
            watchedRoutes: null,
            ...loadedState,
        };
    }

    componentDidMount() {
        const { userData } = this.state;

        window.addEventListener('beforeunload', this.handleWindowUnload);

        this.intervalStateSave = setInterval(this.saveCurrentState, 20000);
        this.intervalWatchedRoutesRefresh = setInterval(
            this.loadWatchedRoutes.bind(this, true),
            INTERVAL_REFRESH_WATCHED_ROUTES
        );

        if (userData !== null && Object.keys(userData).length > 0) {
            this.verifyUser();
        }

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
        clearInterval(this.intervalStateSave);
        clearInterval(this.intervalWatchedRoutesRefresh);

        if (this.requestLoadWatchedRoutes) {
            this.requestLoadWatchedRoutes.abort();
            this.requestLoadWatchedRoutes = null;
        }
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

    handleUserAllowedNotifications = () => {
        if (Notification.permission === 'denied') {
            const message = 'Oznámení jsou blokována prohlížečem. Odblokujte je v nastavení stránky a zkuste to znovu.';
            this.setState({ notificationsSubscriptionError: { message } });
            return;
        }

        this.subscribeForNotifications();
    }

    handleUserCancelledNotifications = () => {
        this.setState({ notificationDialogDismissed: true });
    }

    handleUserLogIn = (userData) => {
        this.setState({ userData, userVerified: true });
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
        if ( watchedRoutes === null || watchedRoutes instanceof Error) {
            return;
        }

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

    loadWatchedRoutes(isRefresh = false) {
        if (this.state.userData === null) {
            return;
        }

        const { userData: { token: userToken = null } } = this.state;

        if (userToken === null) {
            return;
        }

        if (!isRefresh) {
            this.setState({ loading: true });
        }

        const body = JSON.stringify({ userToken });
        this.requestLoadWatchedRoutes = request('/api/watchdog/routes').usePost();
        this.requestLoadWatchedRoutes
            .send({ body })
            .then((res) => {
                if (res.status !== 200) {
                    return Promise.reject();
                }
                return res.json();
            })
            .then((res) => {
                if (!isRefresh) {
                    this.setState({ loading: false, watchedRoutes: res.data });
                    return;
                }
                this.setState({ watchedRoutes: res.data });
            })
            .catch(() => {
                if (!isRefresh) {
                    this.setState({ loading: false, watchedRoutes: new Error('Failed to load routes.') });
                }
            })
            .finally(() => {
                this.requestLoadWatchedRoutes = null;
            });
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
                        this.setState({ subscribed: false });
                    } else {
                        this.setState({ subscribed: true });
                        this.saveSubscription(subscription);
                    }
                });
            })
            .catch((err) => {
                console.info('Service Worker registration failed: ', err);
            });
        }
    }

    render() {
        const { isAuthorized, loading, notificationDialogDismissed, subscribed, userData } = this.state;

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
                {!subscribed && !notificationDialogDismissed && this.renderModalAllowNotifications()}
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

    renderErrorLoadingWatchedRoutes() {
        return (
            <h3>
                Chyba při načítání sledovaných spojů.
                <a href="" onClick={this.handleReloadRoutesClick}>Zkusit znovu</a>
            </h3>
        );
    }

    renderModalAllowNotifications() {
        const { notificationsSubscriptionError } = this.state;
        return (
            <ConfirmationModal
                buttonLabelNo="Později"
                buttonLabelYes="Povolit"
                error={notificationsSubscriptionError !== null
                    ? <span><strong>Nepodařilo se povolit oznámení.</strong><br/>{notificationsSubscriptionError.message}</span>
                    : null
                }
                text={
                    <Fragment>
                        <strong>Hlavním cílem aplikace je posílání oznámení.</strong>
                        <br/>
                        <span>
                            Oznamovat se bude uvolnění míst, pokud sledovaný spoj byl plně obsazený,
                            a úplné obsazení, pokud byla nějaká místa volná.
                        </span>
                    </Fragment>
                }
                title="Povolit oznámení"
                onCancel={this.handleUserCancelledNotifications}
                onSubmit={this.handleUserAllowedNotifications}
            />
        );
    }

    renderSearchTab() {
        const { arrivalStation, date, departureStation, userData, watchedRoutes } = this.state;
        return (
            <Tab eventKey={1} title="Vyhledávání">
                {watchedRoutes !== null && !(watchedRoutes instanceof Error)
                    ? <Search
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
                    : this.renderErrorLoadingWatchedRoutes()
                }
            </Tab>
        );
    }

    renderWatchdogTab() {
        const { userData: { deviceId }, watchedRoutes } = this.state;
        return (
            <Tab eventKey={2} title="Sledované spoje">
                {watchedRoutes !== null && !(watchedRoutes instanceof Error)
                    ? <Watchdog deviceId={deviceId} routes={watchedRoutes} onUnwatch={this.handleToggleWatchdog}/>
                    : this.renderErrorLoadingWatchedRoutes()
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
        const { userData } = this.state;

        if (userData === null) {
            return;
        }

        const { token: userToken = null } = userData;

        this.pushSubscription = subscription;
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
                    .then((subscription) => {
                        this.setState({ subscribed: true, notificationsBlocked: false });
                        this.saveSubscription(subscription);
                    })
                    .catch((e) => {
                        if (Notification.permission === 'denied') {
                            this.setState({ notificationsBlocked: true });
                        } else {
                            console.error('Unable to subscribe to push.', e);
                            this.setState({ notificationsSubscriptionError: e });
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
        const { userData: { token: userToken } } = this.state;
        const body = JSON.stringify({ userToken, route });

        request('/api/watchdog/watch')
            .usePost()
            .send({ body })
            .catch((_) => {
                // Failed to watch the route
            });
    }
}
