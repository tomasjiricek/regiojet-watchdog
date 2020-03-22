import React, { Component, Fragment } from 'react';
import { Glyphicon } from 'react-bootstrap';

import { Col, Row, Table } from '../Table';
import RouteDetails from './RouteDetails';

import './watchdog.css';

export default class Watchdog extends Component {
    constructor(props) {
        super(props);
        this.state = {
            displayedRoute: null,
        };
    }

    handleUnwatch = (route) => {
        this.props.onUnwatch(route);
    }

    isRouteDisplayed(route) {
        const { displayedRoute } = this.state;

        if (route === null || displayedRoute === null) {
            return false;
        }

        const { arrivalStationId, departureStationId, id: routeId } = route;

        return (

            routeId === displayedRoute.id &&
            arrivalStationId === displayedRoute.arrivalStationId &&
            departureStationId === displayedRoute.departureStationId
        );
    }

    toggleRouteDetailVisibility = (route) => {
        this.setState({ displayedRoute: this.isRouteDisplayed(route) ? null : route });
    }

    render() {
        const { routes } = this.props;

        if (routes.length === 0) {
            return <h3 style={{margin: '20px'}}>Žádný sledovaný spoj</h3>;
        }

        return (
            <Table striped hover>
                {this.renderTableHead()}
                {this.renderTableBody()}
            </Table>
        );
    }

    renderTableBody() {
        const rows = this.props.routes.map(this.renderTableRow.bind(this));
        return <tbody>{rows}</tbody>;
    }

    renderTableHead() {
        return (
            <thead>
                <Row>
                    <Col heading>Odjezd</Col>
                    <Col heading>Volných míst</Col>
                    <Col heading>Doba cesty</Col>
                    <Col heading>Přestupů</Col>
                </Row>
            </thead>
        );
    }

    renderTableRow(route) {
        const { arrivalStationId, departureStationId, id } = route;
        const { displayedRouteDetailId } = this.state;

        return (
            <Fragment key={`${id}-${arrivalStationId}-${departureStationId}`}>
                {this.isRouteDisplayed(route)
                    ? this.renderRouteDetailRow(route)
                    : this.renderBasicRouteInfo(route)
                }
            </Fragment>
        );
    }

    renderBasicRouteInfo(route) {
        const {
            departureTime,
            freeSeatsCount,
            transfersCount,
            travelTime
        } = route;
        const date = new Date(departureTime);

        return (
            <Row
                className="route"
                onClick={this.toggleRouteDetailVisibility.bind(this, route)}
            >
                <Col>{`${date.toLocaleDateString()} ${date.toLocaleTimeString()}`}</Col>
                <Col>{freeSeatsCount}</Col>
                <Col>{travelTime}</Col>
                <Col>
                    {transfersCount}
                    <span className="tools">
                        <a href="#" onClick={this.handleUnwatch.bind(this, route)}>
                            <Glyphicon glyph='eye-close'/>
                        </a>
                    </span>
                </Col>
            </Row>
        );
    }

    renderRouteDetailRow(route) {
        return (
            <Row className="route-detail" onClick={this.toggleRouteDetailVisibility.bind(this, route.id)}>
                <Col colSpan={4}><RouteDetails route={route}/></Col>
            </Row>
        )
    }

    renderRoutes() {
        return this.props.routes.map((route) => (
            <div key={route.id}>{new Date(route.departureTime).toLocaleTimeString()}</div>
        ));
    }
}
