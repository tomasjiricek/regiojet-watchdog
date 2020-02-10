import React, { Component } from 'react';
import { Col, Glyphicon, Grid, Row, Table } from 'react-bootstrap';

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
            <TableGrid hover>
                {this.renderTableHead()}
                {this.renderTableBody()}
            </TableGrid>
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
            <TableRow className={className} key={id}>
                <TableCol>{new Date(departureTime).toLocaleTimeString()}</TableCol>
                <TableCol>{freeSeatsCount}</TableCol>
                <TableCol>{travelTime}</TableCol>
                <TableCol>
                    {transfersCount}
                    <span className="tools">
                        <a href="#" onClick={this.handleToggleWatchdog.bind(this, route)}>
                            <Glyphicon glyph={isWatched ? 'eye-close' : 'eye-open'}/>
                        </a>
                    </span>
                </TableCol>
            </TableRow>
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
                <TableRow>
                    <TableCol colSpan={4}>
                        <strong>{departureStation.fullname}</strong>
                        <Glyphicon glyph="arrow-right" style={{ margin: '0 15px' }}/>
                        <strong>{arrivalStation.fullname}</strong>
                    </TableCol>
                </TableRow>
                <TableRow>
                    <TableCol heading>Odjezd</TableCol>
                    <TableCol heading>Volných míst</TableCol>
                    <TableCol heading>Doba cesty</TableCol>
                    <TableCol heading>Přestupů</TableCol>
                </TableRow>
            </thead>
        );
    }
}

const TableCol = ({ children, heading, ...props }) => (
    <Col componentClass={heading ? 'th' : 'td'} {...props}>{children}</Col>
);

const TableGrid = ({ children, ...props }) => (
    <Grid fluid>
        <Table {...props}>{children}</Table>
    </Grid>
);

const TableRow = ({ children, ...props}) => (
    <Row componentClass="tr" {...props}>{children}</Row>
);

export default Results;
