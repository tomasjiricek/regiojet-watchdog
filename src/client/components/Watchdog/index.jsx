import React, { Component, Fragment } from 'react';
import { Glyphicon } from 'react-bootstrap';

import { Col, Row, Table } from '../Table';
import { getShortCzechDateAndTime } from '../../../common/utils/date';
import RouteDetails from './RouteDetails';

import './watchdog.css';

export default class Watchdog extends Component {
    constructor(props) {
        super(props);
        this.state = {
            displayedRoute: null,
        };
    }

    handleUnwatch = (route, event) => {
        event.stopPropagation();
        this.props.onUnwatch(route);
    }

    isRouteDisplayed(route) {
        const { displayedRoute } = this.state;

        if (route === null || displayedRoute === null) {
            return false;
        }

        const { arrivalStationId, departureStationId, routeId } = route;

        return (

            routeId === displayedRoute.routeId &&
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
                    <Col heading>Směr jízdy</Col>
                    <Col heading>Odjezd</Col>
                    <Col heading>Volných míst</Col>
                </Row>
            </thead>
        );
    }

    renderTableRow(route) {
        const { arrivalStationId, departureStationId, routeId } = route;

        return (
            <Fragment key={`${routeId}-${arrivalStationId}-${departureStationId}`}>
                {this.isRouteDisplayed(route)
                    ? this.renderRouteDetailRow(route)
                    : this.renderBasicRouteInfo(route)
                }
            </Fragment>
        );
    }

    renderBasicRouteInfo(route) {
        const {
            arrivalStationName,
            departureStationName,
            departureTime,
            freeSeatsCount,
        } = route;

        return (
            <Row
                className="route"
                onClick={this.toggleRouteDetailVisibility.bind(this, route)}
            >
                <Col>
                    {departureStationName}
                    <Glyphicon glyph="arrow-right" style={{ margin: '0 5px' }}/>
                    {arrivalStationName}
                </Col>
                <Col>{getShortCzechDateAndTime(new Date(departureTime))}</Col>
                <Col>
                    {freeSeatsCount}
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
            <Row className="route-detail" onClick={this.toggleRouteDetailVisibility.bind(this, route)}>
                <Col colSpan={4}><RouteDetails route={route}/></Col>
            </Row>
        )
    }
}
