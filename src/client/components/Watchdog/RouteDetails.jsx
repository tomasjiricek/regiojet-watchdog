import React, { Component } from 'react';

import { Panel } from 'react-bootstrap';

export default class RouteDetails extends Component {
    render() {
        const { travelTime, freeSeatsCount } = this.props.route;
        return (
            <Panel><Panel.Body>{travelTime} | {freeSeatsCount} volných míst</Panel.Body></Panel>
        );
    }
}