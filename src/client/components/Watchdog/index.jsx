import React, { Component } from 'react';
import { Glyphicon } from 'react-bootstrap';

import { Col, Row, Table } from '../Table';

export default class Watchdog extends Component {
    render() {
        const { routes } = this.props;

        if (routes.length === 0) {
            return <h3>Žádný hlídaný spoj</h3>;
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
        const { id, departureTime, freeSeatsCount, transfersCount, travelTime } = route;
        const date = new Date(departureTime);

        return (
            <Row key={id}>
                <Col>{`${date.toLocaleDateString()} ${date.toLocaleTimeString()}`}</Col>
                <Col>{freeSeatsCount}</Col>
                <Col>{travelTime}</Col>
                <Col>
                    {transfersCount}
                    <span className="tools">
                        <a href="#" onClick={()=>false}>
                            <Glyphicon glyph='cross'/>
                        </a>
                    </span> 
                </Col>
            </Row>
        );
    }

    renderRoutes() {
        return this.props.routes.map((route) => (
            <div key={route.id}>{new Date(route.departureTime).toLocaleTimeString()}</div>
        ));
    }
}
