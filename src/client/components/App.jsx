import React, { Component, Fragment } from 'react';
import { PageHeader, Tab, Tabs } from 'react-bootstrap';

import About from './About';
import Search from './Search';
import StateStorage from '../utils/StateStorage';
import Watchdog from './Watchdog';

import './app.css';

export default class App extends Component {
    constructor(props) {
        super(props);

        const state = StateStorage.load();
        
        if (state !== null) {
            this.state = state;
            return;
        }

        this.state = {
            activeContentTab: 1,
            watchedRoutes: [],
            arrivalStation: null,
            departureStation: null,
        };
    }

    componentDidMount() {
        window.addEventListener('beforeunload', this.handleWindowUnload);
        this.stateSaveInterval = setInterval(this.saveCurrentState, 10000);
    }

    componentWillUnmount() {
        window.removeEventListener('beforeunload', this.handleWindowUnload);
        clearInterval(this.stateSaveInterval);
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
        const { arrivalStation, departureStation, watchedRoutes } = this.state;
        return (
            <Tab eventKey={1} title="Vyhledávání">
                <Search
                    arrivalStation={arrivalStation}
                    departureStation={departureStation}
                    watchedRoutes={watchedRoutes}
                    onStationChange={this.handleStationChange}
                    onToggleWatchdog={this.handleToggleWatchdog}/>
            </Tab>
        );
    }

    renderWatchdogTab() {
        return (
            <Tab eventKey={2} title="Sledované spoje">
                <Watchdog routes={this.state.watchedRoutes} onUnwatch={null}/>
            </Tab>
        );
    }

    saveCurrentState = () => {
        StateStorage.save(this.state);
    }
}
