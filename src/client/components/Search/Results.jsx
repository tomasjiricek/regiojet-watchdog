import React, { Component } from 'react';
import { Glyphicon } from 'react-bootstrap';

import { Col, Row, Table } from '../Table';

import './results.css';

class Results extends Component {
    constructor(props) {
        super(props);
        this.state = {
            submitted: false
        };
    }

    handleToggleWatchdog = (route, event) => {
        event.preventDefault();
        event.stopPropagation();
        this.props.onToggleWatchdog(route);
    }

    isRouteWatched(routeId) {
        for (const route of this.props.watchedRoutes) {
            if (route.id === routeId) {
                return true;
            }
        }
        return false;
    }

    render() {
        const {
            loading,
            departureStation,
            arrivalStation,
            routes,
        } = this.props;

        if (loading) {
            return <h3>Vyhledávání spojů...</h3>;
        }

        if (!departureStation || !arrivalStation || routes === null) {
            return null;
        }

        return (
            <Table hover>
                {this.renderTableHead()}
                {this.renderTableBody()}
            </Table>
        );
    }

    renderResultRow(route) {
        const { id, departureTime, travelTime, freeSeatsCount, transfersCount } = route;
        const isWatched = this.isRouteWatched(id);
        let className = 'route';
        if (isWatched) {
            className += ' watched';
        }
        return (
            <Row className={className} key={id}>
                <Col>{new Date(departureTime).toLocaleTimeString()}</Col>
                <Col>{freeSeatsCount}</Col>
                <Col>{travelTime}</Col>
                <Col>
                    {transfersCount}
                    <span className="tools">
                        <a href="#" onClick={this.handleToggleWatchdog.bind(this, route)}>
                            <Glyphicon glyph={isWatched ? 'eye-close' : 'eye-open'}/>
                        </a>
                    </span>
                </Col>
            </Row>
        );
    }

    renderTableBody() {
        const rows = this.props.routes.map(this.renderResultRow.bind(this));
        return <tbody>{rows}</tbody>;
    }

    renderTableHead() {
        const { departureStation, arrivalStation } = this.props;

        return (
            <thead>
                <Row>
                    <Col colSpan={4}>
                        <strong>{departureStation.fullname}</strong>
                        <Glyphicon glyph="arrow-right" style={{ margin: '0 15px' }}/>
                        <strong>{arrivalStation.fullname}</strong>
                    </Col>
                </Row>
                <Row>
                    <Col heading>Odjezd</Col>
                    <Col heading>Volných míst</Col>
                    <Col heading>Doba cesty</Col>
                    <Col heading>Přestupů</Col>
                </Row>
            </thead>
        );
    }
}

export default Results;